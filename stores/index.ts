// stores/index.ts
// Barrel for cross-cutting Zustand stores. Domain stores (e.g.
// workoutStore) are added by consumers and re-exported here.

export { useAuthStore, type AuthStatus } from './authStore';
export { useUIStore } from './uiStore';
export {
  useNetworkStore,
  useIsOnline,
  getNetworkStatus,
  initializeNetworkListeners,
} from './networkStore';
export { useTourStore, useTourVisibility } from './tourStore';
export { zustandStorage } from './storage';
