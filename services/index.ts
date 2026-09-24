// services/index.ts
// Barrel for domain services. Services orchestrate repositories +
// computed-at-read logic; UI code goes through hooks, hooks go through
// services (S9).

export { WorkoutService } from './workoutService';
export {
  ProgressionService,
  computeStreaks,
  computePersonalBests,
  derivePriorTopSets,
  type PersonalBest,
} from './progressionService';
export { AnalyticsService } from './analyticsService';
export {
  deriveTrajectory,
  deriveMuscleShare,
  deriveExerciseVolumeByWeek,
  derivePrTimeline,
  deriveWeeklyGroupVolume,
  estOneRm,
  MUSCLE_GROUPS,
  type Trajectory,
  type TrajectoryPoint,
  type TrajectoryGroup,
  type MuscleShareRow,
  type ExerciseWeekVolume,
  type PrEvent,
  type GroupWeekVolume,
  type MuscleGroup,
  derivePlanMuscleShare,
  type PlanMuscleShareRow,
} from './chartData';
export { slotKey, resolveSlots } from './programService';
export {
  REP_LADDER,
  deriveProgression,
  rangeLabel,
  progressionKey,
  sameProgression,
  rungOf,
  RATING_GLYPH,
  type EffortRating,
  type ProgressionRx,
  type RatedInstance,
  type Rung,
} from './progressionEngine';
export {
  generateSplit,
  generateProgram,
  nameForSlug,
  authoredProgramSlots,
  authoredBaselineFor,
  muscleShareDeltas,
  type GeneratedSplit,
  type GeneratedSplitDay,
  type GenerateSplitOptions,
  type GenerateProgramOptions,
  type MuscleDeltaRow,
  type MuscleShareDelta,
} from './splitGenerator';
export {
  e1rm,
  isSetFilled,
  setVolume,
  sumVolume,
  formatVolume,
  formatElapsed,
} from './sessionMath';
export { rankAlternatives, type RankedAlternative } from './substitutionService';
export {
  sessionSaveQueue,
  type PendingSessionSave,
  type FlushResult,
} from './sessionSaveQueue';
