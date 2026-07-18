// hooks/mutations/useUpdateSession.ts
// Update + delete session mutations + in-session set/exercise mutations.
// All touch invalidateQueries to satisfy D3. The set-level mutations
// target the detail query directly via setQueryData for snappy UX.

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { WorkoutService } from '../../services';
import { queryKeys } from '../../lib/react-query';
import type {
  ExerciseSet,
  ExerciseSetInputDTO,
  ID,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseInputDTO,
  WorkoutSessionUpdateDTO,
  WorkoutSessionWithDetails,
} from '../../shared/types';

/**
 * useUpdateSession — update session header (notes, duration). Invalidates
 * the recent list and the detail query.
 */
export function useUpdateSession(
  options?: Omit<
    UseMutationOptions<WorkoutSession, Error, { id: ID; dto: WorkoutSessionUpdateDTO }>,
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

/**
 * Add an exercise entry to a session. Updates the detail cache so the UI
 * shows the new entry immediately; invalidation backfills on settle.
 */
export function useAddExerciseToSession(sessionId: ID) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.workouts.detail(sessionId);

  return useMutation<
    WorkoutSessionExercise,
    Error,
    WorkoutSessionExerciseInputDTO
  >({
    mutationFn: async (input) => {
      const res = await WorkoutService.addExerciseToSession(sessionId, input);
      if (!res.success) throw res.error;
      return res.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}

/**
 * useAddSetTo — caller passes both sessionId (for cache scoping) and
 * sessionExerciseId (for the write target). Updates the detail cache.
 */
export function useAddSetTo(sessionId: ID, sessionExerciseId: ID) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.workouts.detail(sessionId);

  return useMutation<ExerciseSet, Error, ExerciseSetInputDTO>({
    mutationFn: async (input) => {
      const res = await WorkoutService.addSet(sessionExerciseId, input);
      if (!res.success) throw res.error;
      return res.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}

/**
 * Update a set (mark complete, edit reps/weight). Optimistic on the
 * detail cache — the UI updates as soon as the user toggles.
 */
export function useUpdateSet(sessionId: ID) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.workouts.detail(sessionId);

  return useMutation<
    ExerciseSet,
    Error,
    { setId: ID; patch: Partial<ExerciseSetInputDTO> & { completed?: boolean } },
    { prev: WorkoutSessionWithDetails | null | undefined }
  >({
    mutationFn: async ({ setId, patch }) => {
      const res = await WorkoutService.updateSet(setId, patch);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ setId, patch }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const prev = queryClient.getQueryData<WorkoutSessionWithDetails | null>(detailKey);
      if (prev) {
        const next: WorkoutSessionWithDetails = {
          ...prev,
          exercises: prev.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === setId
                ? {
                    ...s,
                    ...patch,
                    completedAt:
                      patch.completed === true
                        ? new Date().toISOString()
                        : patch.completed === false
                        ? null
                        : s.completedAt,
                  }
                : s,
            ),
          })),
        };
        queryClient.setQueryData<WorkoutSessionWithDetails | null>(detailKey, next);
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(detailKey, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}

/** Delete a set. Invalidates the detail query. */
export function useDeleteSet(sessionId: ID) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.workouts.detail(sessionId);

  return useMutation<void, Error, ID>({
    mutationFn: async (setId) => {
      const res = await WorkoutService.deleteSet(setId);
      if (!res.success) throw res.error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}
