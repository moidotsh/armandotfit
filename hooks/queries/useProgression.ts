// hooks/queries/useProgression.ts
// Dashboard + analytics read paths. Composes ProgressionService (summary
// + streaks, computed at read) + AnalyticsService (daily activity).
// userId threaded via the auth store.

import { useQuery } from '@tanstack/react-query';
import { ProgressionService, AnalyticsService, WorkoutService, computePersonalBests } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type {
  ProgressionSummary,
  StreakInfo,
  DayActivity,
  SessionWithDetails,
} from '../../shared/types';

const EMPTY_SUMMARY: ProgressionSummary = {
  streak: { current: 0, best: 0 },
  totalSessions: 0,
  thisWeekSessions: 0,
  lastSessionDate: null,
};

/** Home-dashboard summary (streaks + totals). */
export function useDashboardSummary() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<ProgressionSummary>({
    queryKey: queryKeys.analytics.summary(),
    queryFn: async () => {
      if (!userId) return EMPTY_SUMMARY;
      const res = await ProgressionService.getDashboardSummary(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/** Standalone streak read for header badges. */
export function useStreaks() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<StreakInfo>({
    queryKey: queryKeys.streaks.current(),
    queryFn: async () => {
      if (!userId) return { current: 0, best: 0 };
      const res = await ProgressionService.getStreaks(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/** Daily activity for the analytics consistency grid. */
export function useAnalyticsHistory(daysBack = 30) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<DayActivity[]>({
    queryKey: queryKeys.analytics.history(daysBack),
    queryFn: async () => {
      if (!userId) return [] as DayActivity[];
      const res = await AnalyticsService.getDailyActivity(userId, daysBack);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/** Personal bests across history — computed at read from full details. */
export function usePersonalBests() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<import('../../services').PersonalBest[]>({
    queryKey: queryKeys.workouts.personalBests(),
    queryFn: async () => {
      if (!userId) return [];
      const res = await WorkoutService.getRecentWithDetails(userId, 100);
      if (!res.success) throw res.error;
      return computePersonalBests(res.data);
    },
    enabled: !!userId,
  });
}
