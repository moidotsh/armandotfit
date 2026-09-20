// hooks/mutations/useLogWorkout.ts
// Log-session mutation with optimistic update (D2). Previews the new
// session at the head of the SHARED HISTORY — the key every details
// consumer (home's recent list, top sets, PBs) actually reads — rolls
// back on error, and invalidates on success so the server-authoritative
// history takes over. Touches setQueryData + invalidateQueries (D3).

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../stores';
import type {
  LogSessionDTO,
  SessionWithDetails,
} from '../../shared/types';

interface LogSessionContext {
  previousHistory?: SessionWithDetails[];
}

export function useLogWorkout() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const historyKey = queryKeys.workouts.history();

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
      await queryClient.cancelQueries({ queryKey: historyKey });
      const previousHistory = queryClient.getQueryData<SessionWithDetails[]>(historyKey);

      if (previousHistory) {
        const optimistic: SessionWithDetails = {
          id: `pending-${Date.now()}`,
          userId: userId ?? 'pending',
          startedAt: dto.startedAt,
          note: dto.note ?? null,
          splitDay: dto.splitDay ?? null,
          exercises: [],
          // The optimistic entry carries the sittings raw (ids pending) —
          // the invalidated read replaces it with server truth.
          cardio: (dto.cardio ?? []).map((c, i) => ({
            id: `pending-cardio-${i}`,
            sessionId: `pending-${Date.now()}`,
            station: c.station,
            durationSec: c.durationSec,
            level: c.level ?? null,
            speedKmh: c.speedKmh ?? null,
            distanceM: c.distanceM ?? null,
            kcal: c.kcal ?? null,
            note: c.note ?? null,
          })),
        };
        queryClient.setQueryData<SessionWithDetails[]>(historyKey, [
          optimistic,
          ...previousHistory,
        ]);
      }
      return { previousHistory };
    },
    onError: (err, _dto, context) => {
      logger.warn('mutations', 'useLogWorkout failed, rolling back cache:', err.message);
      if (context?.previousHistory) {
        queryClient.setQueryData(historyKey, context.previousHistory);
      }
    },
    onSettled: () => {
      // Server-authoritative refresh of the shared history + activity
      // log + per-session detail + last-tags (the workouts root
      // prefix-matches every sessions key; activity/grid/streak
      // derivations recompute from the refetched entries).
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    },
  });
}
