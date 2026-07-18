// hooks/queries/useWorkouts.ts
// Read paths for workout sessions. Pulls userId from the auth store so
// callers don't have to thread it through. Caches via queryKeys.workouts.

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { WorkoutSession, WorkoutSessionWithDetails, ID } from '../../shared/types';

/**
 * Recent workout sessions for the home dashboard. Returns the header
 * only — call useWorkoutDetail(id) to expand a single session.
 */
export function useRecentWorkouts(limit = 10) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.workouts.recent(limit),
    queryFn: async () => {
      if (!userId) return [] as WorkoutSession[];
      const res = await WorkoutService.getRecentSessions(userId, limit);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/**
 * Full workout detail (header + exercises + sets). Used by the detail
 * screen and the in-session logging screen.
 */
export function useWorkoutDetail(
  id: ID | null | undefined,
  options?: Omit<
    UseQueryOptions<WorkoutSessionWithDetails | null>,
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
