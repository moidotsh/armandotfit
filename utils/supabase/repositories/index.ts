// utils/supabase/repositories/index.ts
// Barrel for the repository pattern. Arqavellum's infrastructure (types,
// BaseRepository) + armandotfit's concrete repositories. The audit gate
// (S9) treats this folder as the single legitimate home for direct
// `supabase.*` calls.

export {
  type IRepository,
  type RepositoryResult,
  type FindOptions,
  RepositoryError,
  RepositoryErrorCode,
  ok,
  err,
  validateWithSchema,
  classifySupabaseError,
  handleRepositoryError,
} from './types';

export { BaseRepository } from './BaseRepository';

// armandotfit concrete repositories
export { UserProfileRepository, userProfileRepository } from './UserProfileRepository';
export { ExerciseRepository, exerciseRepository } from './ExerciseRepository';
export { WorkoutRepository, workoutRepository } from './WorkoutRepository';
export { StreakRepository, streakRepository } from './StreakRepository';
export { ProgressionRepository, progressionRepository } from './ProgressionRepository';
export { ProgramRepository, programRepository } from './ProgramRepository';
export { UserPlanRepository, userPlanRepository } from './UserPlanRepository';
