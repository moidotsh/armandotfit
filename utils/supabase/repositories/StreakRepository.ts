// utils/supabase/repositories/StreakRepository.ts
// Thin repository over the calculate_user_streaks(UUID) RPC. Streaks are
// computed on demand by the function (gaps-and-islands in plpgsql) rather
// than maintained incrementally — see the baseline schema for the
// rationale. This repository doesn't extend BaseRepository because the
// shape is a single RPC, not a table CRUD.

import { supabase } from '../client';
import { type RepositoryResult, RepositoryErrorCode, err, ok } from './types';
import type { StreakInfo, ID } from '../../../shared/types';

/**
 * StreakRepository — read-only accessor for the streak RPC. There's no
 * write surface (streaks are derived from workout_sessions, not stored).
 */
export class StreakRepository {
  /**
   * Get current + best streak for a user. Wraps the
   * calculate_user_streaks(UUID) function. Returns zeros if the user has
   * no workouts.
   */
  async getStreaks(userId: ID): Promise<RepositoryResult<StreakInfo>> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_user_streaks', { target_user_id: userId });
      if (error) throw error;
      // RPC returns [{ current_streak: number, best_streak: number }] or [].
      const row = (data as Array<{ current_streak: number; best_streak: number }>)[0];
      if (!row) {
        return ok({ current: 0, best: 0 });
      }
      return ok({ current: row.current_streak, best: row.best_streak });
    } catch (e) {
      return err(
        e instanceof Error ? `getStreaks failed: ${e.message}` : 'getStreaks failed',
        RepositoryErrorCode.UNKNOWN,
        e instanceof Error ? e : undefined,
      );
    }
  }
}

// Singleton — the daily-driver access path.
export const streakRepository = new StreakRepository();
