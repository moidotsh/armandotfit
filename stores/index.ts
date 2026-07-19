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
