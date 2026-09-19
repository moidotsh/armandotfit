// services/sessionSaveQueue.ts
// D4 made concrete for the one mutation that must survive network
// drops: the completed-session save. FINISH while offline enqueues
// the LogSessionDTO here and resets the draft (the stable per-session
// id makes double-enqueue a no-op; the only save paths are the
// online mutation and this queue, never both for the same session —
// the offline branch of Floor's handleSave never calls the mutation).
// Reconnect and boot flush in order; every success lands the session
// server-side and the caller invalidates the computed-at-read
// surfaces. Kept sessions stay queued across reloads (BaseQueueService
// persists to storage) — a mid-flight network death at FINISH retries
// on the next flush; a permanently-failing item (e.g. expired auth)
// stops the flush and waits for the condition to clear.

import { BaseQueueService } from './base';
import { WorkoutService } from './workoutService';
import { logger, type LogContext } from '../utils/logger';
import type { LogSessionDTO } from '../shared/types';

/** One completed session waiting for the network. */
export interface PendingSessionSave {
  /** Stable per session — the dto's startedAt. Dedup key. */
  id: string;
  dto: LogSessionDTO;
  queuedAt: string;
}

export interface FlushResult {
  /** Sessions landed server-side this flush. */
  synced: number;
  /** Sessions still queued after this flush. */
  remaining: number;
  /** True when the flush stopped on a failure (network/auth/etc). */
  stoppedOnError: boolean;
}

class SessionSaveQueueService extends BaseQueueService<PendingSessionSave> {
  protected storageKey = 'armandotfit:session-save-queue';
  protected logContext: LogContext = 'offlineQueue';

  private flushing = false;

  /**
   * Enqueue a completed session. Returns false (and changes nothing)
   * when the session is already queued — idempotent by design.
   */
  enqueue(dto: LogSessionDTO): boolean {
    const id = dto.startedAt;
    if (this.hasItem(id)) return false;
    this.addToQueue({
      id,
      dto,
      queuedAt: new Date().toISOString(),
    });
    logger.info(
      this.logContext,
      `Queued session save ${id} (${this.count()} pending)`,
    );
    return true;
  }

  /** Pending save count (reactive readers subscribe via onChange). */
  count(): number {
    return this.getAll().length;
  }

  /**
   * Try to land every queued session, oldest first. Stops at the
   * first failure, keeping the failed item and everything behind it
   * for the next trigger (reconnect, boot, or the next enqueue).
   */
  async flush(): Promise<FlushResult> {
    if (this.flushing) {
      return { synced: 0, remaining: this.count(), stoppedOnError: false };
    }
    this.flushing = true;
    try {
      await this.ready();
      let synced = 0;
      for (;;) {
        const next = this.getAll()[0];
        if (!next) return { synced, remaining: 0, stoppedOnError: false };
        const res = await WorkoutService.logSession(next.dto);
        if (!res.success) {
          logger.warn(
            this.logContext,
            `Flush stopped at ${next.id}: ${res.error.message}`,
          );
          return {
            synced,
            remaining: this.count(),
            stoppedOnError: true,
          };
        }
        this.removeFromQueue(next.id);
        synced += 1;
        logger.info(this.logContext, `Synced queued session ${next.id}`);
      }
    } finally {
      this.flushing = false;
    }
  }
}

export const sessionSaveQueue = new SessionSaveQueueService();
