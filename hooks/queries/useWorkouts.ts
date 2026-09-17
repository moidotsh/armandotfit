// hooks/queries/useWorkouts.ts
// Read paths for training sessions. Pulls userId from the auth store so
// callers don't have to thread it through. Caches via queryKeys.workouts.

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { TrainingSession, SessionWithDetails, ID } from '../../shared/types';

/** Recent sessions for the home dashboard (headers only). */
export function useRecentWorkouts(limit = 10) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.workouts.recent(limit),
    queryFn: async () => {
      if (!userId) return [] as TrainingSession[];
      const res = await WorkoutService.getRecentSessions(userId, limit);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/**
 * Recent sessions with exercises + sets expanded — the read path for
 * surfaces that show per-session volume/lift counts (home's recent list).
 * Same service as the headers-only read; just the nested variant.
 */
export function useRecentSessionDetails(limit = 10) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: [...queryKeys.workouts.recent(limit), 'details'],
    queryFn: async () => {
      if (!userId) return [] as SessionWithDetails[];
      const res = await WorkoutService.getRecentWithDetails(userId, limit);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/** Full session detail (header + exercises + sets). */
export function useWorkoutDetail(
  id: ID | null | undefined,
  options?: Omit<
    UseQueryOptions<SessionWithDetails | null>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const enabled = !!id;
  return useQuery({
    queryKey: queryKeys.workouts.detail(id ?? 'unknown'),
    queryFn: async () => {
      if (!id) return null;
      const res = await WorkoutService.getSessionDetail(id);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled,
    ...options,
  });
}
