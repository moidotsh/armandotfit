// hooks/queries/index.ts
// Barrel for React Query read hooks. UI code imports from here (or via
// the top-level hooks barrel). The S9 audit treats hooks/ as off-limits
// for direct supabase calls — these hooks route through services +
// repositories only.

export {
  useRecentWorkouts,
  useWorkoutDetail,
} from './useWorkouts';
export {
  useExercises,
  useExerciseDetail,
  useFavoriteExercises,
  useMuscleCategories,
  useMuscles,
  useEquipmentTypes,
  useSuggestedExercises,
} from './useExercises';
export { useExerciseSetupOptions } from './useExerciseSetupOptions';
export {
  useDashboardSummary,
  useStreaks,
  useAnalyticsHistory,
} from './useProgression';
export { useProfile } from './useProfile';
export { useEquipmentCapabilities } from './useEquipmentCapabilities';
export {
  useUserPlans,
  useUserPlan,
  useActivePlanForVariant,
  useGeneratedPlanPreview,
  useReplacementCandidates,
} from './useUserPlans';
export { useVariantTree } from './useProgramVariant';
export {
  usePlanLaunchHydration,
  type PlanLaunchDraftSlice,
} from './usePlanLaunchHydration';
