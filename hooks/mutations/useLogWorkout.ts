// hooks/mutations/useLogWorkout.ts
// Log-session mutation with optimistic update (D2). Previews the new
// session in the recent-sessions cache while the write is in flight,
// rolls back on error, and invalidates on success so the server-
// authoritative list takes over. Touches setQueryData +
// invalidateQueries to satisfy D3.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../stores';
import type {
  LogSessionDTO,
  SessionWithDetails,
  TrainingSession,
} from '../../shared/types';

interface LogSessionContext {
  previousRecent?: TrainingSession[];
}

export function useLogWorkout() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const recentKey = queryKeys.workouts.recent(10);

  return useMutation<
    SessionWithDetails,
    Error,
    LogSessionDTO,
    LogSessionContext
  >({
    mutationFn: async (dto: LogSessionDTO) => {
      const res = await WorkoutService.logSession(dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (dto): Promise<LogSessionContext> => {
      await queryClient.cancelQueries({ queryKey: recentKey });
      const previousRecent = queryClient.getQueryData<TrainingSession[]>(recentKey);

      if (previousRecent) {
        const optimistic: TrainingSession = {
          id: `pending-${Date.now()}`,
          userId: userId ?? 'pending',
          startedAt: dto.startedAt,
          note: dto.note ?? null,
          splitDay: dto.splitDay ?? null,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<TrainingSession[]>(recentKey, [
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
      // Server-authoritative refresh of the recent list + every
      // computed-at-read surface (summary, streaks, analytics).
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.streaks.current() });
    },
  });
}
