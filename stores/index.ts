// stores/index.ts
// Barrel for Zustand stores. Arqavellum's cross-cutting stores (auth, UI,
// network) + armandotfit's domain stores (workout, exercise).

export { useAuthStore, type AuthStatus } from './authStore';
export { useUIStore } from './uiStore';
export {
  useNetworkStore,
  useIsOnline,
  getNetworkStatus,
  initializeNetworkListeners,
} from './networkStore';
export { zustandStorage } from './storage';

// armandotfit domain stores
export {
  useWorkoutStore,
  type DraftSession,
  type DraftExercise,
  type DraftSet,
} from './workoutStore';
export { useExerciseStore } from './exerciseStore';

// Remembered split defaults (persisted) — the launcher/picker open with these.
export { useSplitPreferenceStore } from './splitPreferenceStore';

// Standing per-slot program substitutions (persisted).
export {
  useProgramOverrideStore,
  type ProgramOverride,
} from './programOverrideStore';

// THE REST INSTRUMENT (gauge-thesis §7) — the rest countdown's
// ephemeral deadline + the persisted interval preference.
export { useRestStore, REST_MAX_SEC } from './restStore';
export { useDeloadStore } from './deloadStore';
