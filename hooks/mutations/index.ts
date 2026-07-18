// hooks/mutations/index.ts
// Barrel for React Query mutation hooks. All mutations touch a cache
// primitive (invalidate / setQueryData) to satisfy D3.

export { useLogWorkout } from './useLogWorkout';
export {
  useUpdateSession,
  useDeleteSession,
  useAddExerciseToSession,
  useAddSetTo,
  useUpdateSet,
  useDeleteSet,
} from './useUpdateSession';
