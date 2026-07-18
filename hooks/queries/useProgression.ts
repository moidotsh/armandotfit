// hooks/queries/useProgression.ts
// Dashboard + analytics read paths. Composes ProgressionService (summary)
// + AnalyticsService (history) + the streaks RPC. All userId-threaded
// via the auth store.

import { useQuery } from '@tanstack/react-query';
import { ProgressionService, AnalyticsService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { ProgressionSummary, StreakInfo, UserAnalytics } from '../../shared/types';

/** Home-dashboard summary (totals + streaks + weekly goal). */
export function useDashboardSummary() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<ProgressionSummary>({
    queryKey: queryKeys.analytics.summary(),
    queryFn: async () => {
      if (!userId) {
        return {
          streak: { current: 0, best: 0 },
          totalWorkouts: 0,
          totalDurationMinutes: 0,
          weeklyGoal: { completed: 0, target: 4 },
          lastWorkoutDate: null,
        } satisfies ProgressionSummary;
      }
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

/** Analytics history (last N days) for the analytics chart. */
export function useAnalyticsHistory(daysBack = 30) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<UserAnalytics[]>({
    queryKey: queryKeys.analytics.history(daysBack),
    queryFn: async () => {
      if (!userId) return [] as UserAnalytics[];
      const res = await AnalyticsService.getRecent(userId, daysBack);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}
