// hooks/mutations/useUpdateSession.ts
// Update + delete session mutations. All touch invalidateQueries (D3).

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import type { ID, SessionUpdateDTO, TrainingSession } from '../../shared/types';

/** Update a session header (note). */
export function useUpdateSession(
  options?: Omit<
    UseMutationOptions<TrainingSession, Error, { id: ID; dto: SessionUpdateDTO }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }) => {
      const res = await WorkoutService.updateSession(id, dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workouts.detail(vars.id),
      });
    },
    ...options,
  });
}

/** Delete a session. Invalidates recent + detail. */
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: ID) => {
      const res = await WorkoutService.deleteSession(id);
      if (!res.success) throw res.error;
    },
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.detail(id) });
    },
  });
}
