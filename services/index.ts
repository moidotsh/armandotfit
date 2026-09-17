// services/index.ts
// Barrel for domain services. Services orchestrate repositories +
// computed-at-read logic; UI code goes through hooks, hooks go through
// services (S9).

export { WorkoutService } from './workoutService';
export {
  ProgressionService,
  computeStreaks,
  computePersonalBests,
  type PersonalBest,
} from './progressionService';
export { AnalyticsService } from './analyticsService';
export { slotKey, resolveSlots } from './programService';
export {
  e1rm,
  isSetFilled,
  setVolume,
  sumVolume,
  formatVolume,
  formatElapsed,
} from './sessionMath';
