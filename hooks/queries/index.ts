// hooks/queries/index.ts
// Barrel for React Query read hooks. UI code imports from here (or via
// the top-level hooks barrel). The S9 audit treats hooks/ as off-limits
// for direct supabase calls — these hooks route through services +
// repositories only.

export {
  useRecentWorkouts,
  useRecentSessionDetails,
  useSessionHistory,
  useActivityLog,
  useWorkoutDetail,
  HISTORY_LIMIT,
  ACTIVITY_LIMIT,
} from './useWorkouts';
export { useExercises, useExerciseDetail } from './useExercises';
export {
  useDashboardSummary,
  useAnalyticsHistory,
  usePersonalBests,
} from './useProgression';
export { useProfile } from './useProfile';
export { useLastUsedTags } from './useLastUsedTags';
export { useTopSetsByName, type TopSetFact } from './useTopSets';
export { useBodyweightHistory } from './useBodyweightHistory';
