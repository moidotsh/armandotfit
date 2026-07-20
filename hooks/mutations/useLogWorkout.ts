// hooks/mutations/useLogWorkout.ts
// Log-workout mutation with optimistic updates (D2). Previews the new
// session in the recent-workouts cache while the write is in flight,
// rolls back on error, and invalidates on success so the server-
// authoritative list takes over. Touches setQueryData + invalidateQueries
// to satisfy D3.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import type {
  LogWorkoutDTO,
  WorkoutSession,
  WorkoutSessionWithDetails,
} from '../../shared/types';

interface LogWorkoutContext {
  previousRecent?: WorkoutSession[];
}

/**
 * useLogWorkout — logs a complete workout. Optimistically prepends a
 * best-effort header to the recent-workouts cache so the UI updates
 * immediately; the full nested detail lands via invalidation on success.
 *
 * The optimistic shape is header-only because we don't yet know the
 * server-generated ids for session_exercises / sets. The recent-list
 * cache is header-shaped too, so the preview is faithful for that list.
 */
export function useLogWorkout() {
  const queryClient = useQueryClient();
  const recentKey = queryKeys.workouts.recent(10);

  return useMutation<
    WorkoutSessionWithDetails,
    Error,
    LogWorkoutDTO,
    LogWorkoutContext
  >({
    mutationFn: async (dto: LogWorkoutDTO) => {
      const res = await WorkoutService.logWorkout(dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (dto): Promise<LogWorkoutContext> => {
      // Snapshot the current recent-workouts cache for rollback.
      await queryClient.cancelQueries({ queryKey: recentKey });
      const previousRecent = queryClient.getQueryData<WorkoutSession[]>(recentKey);

      if (previousRecent) {
        const optimistic: WorkoutSession = {
          id: `pending-${Date.now()}`,
          userId: 'pending',
          date: dto.date,
          splitType: dto.splitType,
          day: dto.day,
          duration: dto.duration,
          notes: dto.notes ?? null,
          // Phase 4 — provenance threaded through so the optimistic row
          // matches the persisted shape. Null on static-fallback saves.
          sessionWindow: dto.sessionWindow ?? null,
          startedAt: dto.startedAt ?? null,
          completedAt: dto.completedAt ?? null,
          planId: dto.planId ?? null,
          planTemplateSnapshot: dto.planTemplateSnapshot ?? null,
          planVariantSnapshot: dto.planVariantSnapshot ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<WorkoutSession[]>(recentKey, [
          optimistic,
          ...previousRecent,
        ]);
      }
      return { previousRecent };
    },
    onError: (err, _dto, context) => {
      logger.warn('mutations', 'useLogWorkout failed, rolling back cache:', err.message);
      if (context?.previousRecent) {
        queryClient.setQueryData(recentKey, context.previousRecent);
      }
    },
    onSettled: () => {
      // Server-authoritative refresh of the recent list + summary/streaks.
      // The analytics trigger updates user_analytics asynchronously;
      // invalidating after the write settles gives the trigger time.
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.streaks.current() });
    },
  });
}
