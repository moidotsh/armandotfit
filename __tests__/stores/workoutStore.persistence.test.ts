// __tests__/stores/workoutStore.persistence.test.ts
// The draft must survive a reload / OS kill / dead zone mid-gym (the
// constitutional SE2 claim). Pins: (1) draft actions reach storage
// under the session-draft key, (2) ONLY the session fields persist
// (never loading/error state), (3) a restored blob rehydrates into a
// live session the Floor can resume, (4) resetSession clears storage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkoutStore } from '../../stores/workoutStore';

const KEY = 'armandotfit:session-draft';

const readStored = (): Record<string, unknown> => {
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
};

const startAndLog = () => {
  useWorkoutStore.getState().startSession({
    splitType: 'oneADay',
    day: 1,
    sessionMode: 'am',
  });
  const draft = useWorkoutStore.getState().draft;
  if (!draft) throw new Error('draft missing after startSession');
  const exId = useWorkoutStore
    .getState()
    .addExerciseToDraft({ exerciseName: 'Incline Barbell Press' });
  useWorkoutStore.getState().addSetToDraft(exId, { reps: 8, weight: 60 });
  return exId;
};

describe('workoutStore draft persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWorkoutStore.getState().resetSession();
  });

  afterEach(() => {
    useWorkoutStore.getState().resetSession();
  });

  it('persists the live session under the session-draft key', async () => {
    startAndLog();
    await Promise.resolve(); // persist writes ride a microtask
    const stored = readStored();
    const state = stored.state as Record<string, unknown> | undefined;
    expect(state).toBeDefined();
    expect(state?.isSessionActive).toBe(true);
    const draft = state?.draft as { exercises: unknown[] } | null;
    expect(draft).not.toBeNull();
    expect(draft?.exercises).toHaveLength(1);
    expect(draft?.exercises[0]).toMatchObject({
      exerciseName: 'Incline Barbell Press',
      sets: [expect.objectContaining({ reps: 8, weight: 60 })],
    });
  });

  it('persists ONLY the session fields — never loading/error state', async () => {
    startAndLog();
    useWorkoutStore.getState().setSaving(true);
    useWorkoutStore.getState().setSessionError('boom');
    await Promise.resolve();
    const state = readStored().state as Record<string, unknown>;
    expect(Object.keys(state).sort()).toEqual(
      ['draft', 'isSessionActive', 'selectedExerciseLocalId', 'sessionStartedAt'].sort(),
    );
  });

  it('a fresh boot rehydrates the stored live session (new store instance)', async () => {
    startAndLog();
    // A real reload builds a NEW store instance from the same storage —
    // same-instance setState would just overwrite the blob. Simulate
    // the boot: reset the module registry, import the store fresh
    // (persist auto-rehydrates on creation), await the microtask.
    vi.resetModules();
    const { useWorkoutStore: freshStore } = await import(
      '../../stores/workoutStore'
    );
    await Promise.resolve();
    const s = freshStore.getState();
    expect(s.isSessionActive).toBe(true);
    expect(s.draft?.exercises[0]?.exerciseName).toBe('Incline Barbell Press');
    expect(s.draft?.exercises[0]?.sets[0]).toMatchObject({ reps: 8, weight: 60 });
  });

  it('resetSession clears the persisted session', async () => {
    startAndLog();
    useWorkoutStore.getState().resetSession();
    await Promise.resolve();
    const state = readStored().state as Record<string, unknown>;
    expect(state.draft).toBeNull();
    expect(state.isSessionActive).toBe(false);
  });
});
