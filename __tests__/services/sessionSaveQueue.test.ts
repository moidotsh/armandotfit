// __tests__/services/sessionSaveQueue.test.ts
// D4's concrete queue: enqueue dedup, FIFO flush, stop-on-failure,
// persistence across reload, and the concurrency guard. WorkoutService
// is spied (not vi.mock'd — T2) because the queue's contract is with
// the service's RESULT shape, not its transport.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkoutService } from '../../services/workoutService';
import {
  sessionSaveQueue,
  type PendingSessionSave,
} from '../../services/sessionSaveQueue';
import type { LogSessionDTO, SessionWithDetails } from '../../shared/types';
import {
  ok,
  err,
  RepositoryErrorCode,
  type RepositoryResult,
} from '../../utils/supabase/repositories';

const dto = (startedAt: string): LogSessionDTO => ({
  startedAt,
  splitDay: 1,
  note: null,
  exercises: [
    { exerciseName: 'Squat', position: 1, tags: [], sets: [{ reps: 5, weight: 100 }] },
  ],
});

const okResult = (d: LogSessionDTO) =>
  ok({ id: d.startedAt, userId: 'u', startedAt: d.startedAt, note: null, splitDay: 1, exercises: [] }) as RepositoryResult<SessionWithDetails>;

describe('sessionSaveQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
    sessionSaveQueue.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionSaveQueue.reset();
  });

  it('enqueues FIFO and dedups by the stable session id', () => {
    expect(sessionSaveQueue.enqueue(dto('2027-01-01T10:00:00Z'))).toBe(true);
    expect(sessionSaveQueue.enqueue(dto('2027-01-01T11:00:00Z'))).toBe(true);
    expect(sessionSaveQueue.count()).toBe(2);
    // Same startedAt — already queued, no double save.
    expect(sessionSaveQueue.enqueue(dto('2027-01-01T10:00:00Z'))).toBe(false);
    expect(sessionSaveQueue.count()).toBe(2);
    const ids = sessionSaveQueue.getAll().map((i: PendingSessionSave) => i.id);
    expect(ids).toEqual(['2027-01-01T10:00:00Z', '2027-01-01T11:00:00Z']);
  });

  it('flush lands every queued session oldest-first and empties the queue', async () => {
    const spy = vi
      .spyOn(WorkoutService, 'logSession')
      .mockImplementation(async (d: LogSessionDTO) => okResult(d));
    sessionSaveQueue.enqueue(dto('2027-01-01T10:00:00Z'));
    sessionSaveQueue.enqueue(dto('2027-01-01T11:00:00Z'));

    const result = await sessionSaveQueue.flush();

    expect(result).toEqual({ synced: 2, remaining: 0, stoppedOnError: false });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].startedAt).toBe('2027-01-01T10:00:00Z');
    expect(sessionSaveQueue.count()).toBe(0);
  });

  it('stops at the first failure, keeping the failed item and the rest', async () => {
    const spy = vi
      .spyOn(WorkoutService, 'logSession')
      .mockImplementation(async (d: LogSessionDTO) =>
        d.startedAt === '2027-01-01T10:00:00Z'
          ? (err('network gone', RepositoryErrorCode.NETWORK_ERROR) as RepositoryResult<SessionWithDetails>)
          : okResult(d),
      );
    sessionSaveQueue.enqueue(dto('2027-01-01T10:00:00Z'));
    sessionSaveQueue.enqueue(dto('2027-01-01T11:00:00Z'));

    const result = await sessionSaveQueue.flush();

    expect(result).toEqual({ synced: 0, remaining: 2, stoppedOnError: true });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(sessionSaveQueue.count()).toBe(2);

    // Recovery: the next flush retries the failed head first.
    spy.mockRestore();
    const spy2 = vi
      .spyOn(WorkoutService, 'logSession')
      .mockImplementation(async (d: LogSessionDTO) => okResult(d));
    const second = await sessionSaveQueue.flush();
    expect(second).toEqual({ synced: 2, remaining: 0, stoppedOnError: false });
    expect(spy2.mock.calls[0][0].startedAt).toBe('2027-01-01T10:00:00Z');
  });

  it('persists the queue across a reload', async () => {
    sessionSaveQueue.enqueue(dto('2027-01-01T10:00:00Z'));
    await Promise.resolve();
    const raw = window.localStorage.getItem('armandotfit:session-save-queue');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as PendingSessionSave[];
    expect(parsed).toHaveLength(1);
    expect(parsed[0].dto.startedAt).toBe('2027-01-01T10:00:00Z');
  });

  it('guards against concurrent flushes', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.spyOn(WorkoutService, 'logSession').mockImplementation(
      async (d: LogSessionDTO) => {
        await gate;
        return okResult(d);
      },
    );
    sessionSaveQueue.enqueue(dto('2027-01-01T10:00:00Z'));

    const first = sessionSaveQueue.flush();
    const second = await sessionSaveQueue.flush();
    expect(second).toEqual({ synced: 0, remaining: 1, stoppedOnError: false });

    release();
    const firstResult = await first;
    expect(firstResult).toEqual({ synced: 1, remaining: 0, stoppedOnError: false });
  });
});
