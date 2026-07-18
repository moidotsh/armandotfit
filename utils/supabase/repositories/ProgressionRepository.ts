// utils/supabase/repositories/ProgressionRepository.ts
// Repository over the user_analytics daily-aggregate table. Owns the
// progression / analytics read paths that aggregate workouts, duration,
// streaks, and weekly-goal progress for the home dashboard + analytics
// screens. The streaks themselves come from StreakRepository (RPC); this
// repository composes them with the analytics row into ProgressionSummary.

import { supabase } from '../client';
import {
  type RepositoryResult,
  RepositoryErrorCode,
  err,
  ok,
} from './types';
import type {
  ID,
  ProgressionSummary,
  UserAnalytics,
  WeeklyGoalProgress,
} from '../../../shared/types';

interface UserAnalyticsRow {
  id: string;
  user_id: string;
  date: string;
  total_workouts: number;
  total_duration: number;
  current_streak: number;
  best_streak: number;
  weekly_goal_progress: WeeklyGoalProgress;
  created_at: string;
  updated_at: string;
}

/**
 * ProgressionRepository — read path over user_analytics. The table is
 * written by the update_user_analytics trigger on workout_sessions
 * INSERT, so this repository has no write surface.
 */
export class ProgressionRepository {
  private static TABLE = 'user_analytics';

  /**
   * List analytics rows for a user, newest first. Used by the analytics
   * chart (e.g. last 30 days of workouts).
   */
  async findByUser(
    userId: ID,
    options?: { limit?: number; daysBack?: number },
  ): Promise<RepositoryResult<UserAnalytics[]>> {
    try {
      let query = supabase
        .from(ProgressionRepository.TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (options?.daysBack) {
        const since = new Date();
        since.setDate(since.getDate() - options.daysBack);
        query = query.gte('date', since.toISOString().slice(0, 10));
      }
      if (options?.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) throw error;
      return ok((data as UserAnalyticsRow[]).map(toAnalytics));
    } catch (e) {
      return err(
        e instanceof Error ? `findByUser failed: ${e.message}` : 'findByUser failed',
        RepositoryErrorCode.UNKNOWN,
        e instanceof Error ? e : undefined,
      );
    }
  }

  /**
   * Latest analytics row for a user. The trigger maintains one row per
   * user-day; the most recent reflects the user's current totals. May
   * return null if the user has never worked out.
   */
  async findLatest(userId: ID): Promise<RepositoryResult<UserAnalytics | null>> {
    try {
      const { data, error } = await supabase
        .from(ProgressionRepository.TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toAnalytics(data as UserAnalyticsRow) : null);
    } catch (e) {
      return err(
        e instanceof Error ? `findLatest failed: ${e.message}` : 'findLatest failed',
        RepositoryErrorCode.UNKNOWN,
        e instanceof Error ? e : undefined,
      );
    }
  }

  /**
   * Composite summary for the home dashboard. Combines the latest
   * analytics row (totals, weekly goal, last workout date) with the
   * streak RPC result. Returns zeros across the board if the user has
   * no analytics rows yet (fresh account).
   *
   * Caller passes the streak values rather than this repository calling
   * StreakRepository — keeps repositories single-purpose and avoids
   * repository-to-repository dependencies.
   */
  buildSummary(
    latest: UserAnalytics | null,
    streak: { current: number; best: number },
  ): ProgressionSummary {
    return {
      streak,
      totalWorkouts: latest?.totalWorkouts ?? 0,
      totalDurationMinutes: latest?.totalDuration ?? 0,
      weeklyGoal: latest?.weeklyGoalProgress ?? { completed: 0, target: 4 },
      lastWorkoutDate: latest?.date ?? null,
    };
  }
}

function toAnalytics(row: UserAnalyticsRow): UserAnalytics {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    totalWorkouts: row.total_workouts,
    totalDuration: row.total_duration,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    weeklyGoalProgress: row.weekly_goal_progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Singleton — the daily-driver access path.
export const progressionRepository = new ProgressionRepository();
