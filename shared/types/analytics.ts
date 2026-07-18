// shared/types/analytics.ts
// Domain types for the user_analytics daily-aggregate table + the
// calculate_user_streaks RPC return shape. Owned by AnalyticsRepository +
// StreakRepository.

import type { ID } from './api';

/**
 * Weekly-goal progress JSON. Stored as JSONB in
 * user_analytics.weekly_goal_progress. The trigger maintains a default of
 * {"completed": 0, "target": 4}; the service layer updates the count as
 * workouts land.
 */
export interface WeeklyGoalProgress {
  completed: number;
  target: number;
}

/**
 * user_analytics row, repository-normalized. One row per user-day, upserted
 * by the update_user_analytics trigger on workout_sessions INSERT.
 */
export interface UserAnalytics {
  id: ID;
  userId: ID;
  date: string; // YYYY-MM-DD
  totalWorkouts: number;
  totalDuration: number; // minutes
  currentStreak: number;
  bestStreak: number;
  weeklyGoalProgress: WeeklyGoalProgress;
  createdAt: string;
  updatedAt: string;
}

/**
 * Return shape of the calculate_user_streaks(UUID) RPC.
 * current: consecutive days back from today with at least one workout.
 * best: longest such run within the last 365 days (gaps-and-islands).
 */
export interface StreakInfo {
  current: number;
  best: number;
}

/**
 * Aggregated progress for the home dashboard. Aggregated by
 * AnalyticsRepository.getProgressionSummary — combines streaks, totals, and
 * weekly goal into one round-trip.
 */
export interface ProgressionSummary {
  streak: StreakInfo;
  totalWorkouts: number;
  totalDurationMinutes: number;
  weeklyGoal: WeeklyGoalProgress;
  lastWorkoutDate: string | null;
}
