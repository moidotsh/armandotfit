// utils/supabase/repositories/index.ts
// Barrel for Supabase repositories. UI code reaches these only through
// services + hooks (S9).

export {
  workoutRepository,
  WorkoutRepository,
} from './WorkoutRepository';
export {
  userProfileRepository,
  UserProfileRepository,
} from './UserProfileRepository';
export { BaseRepository } from './BaseRepository';
export * from './types';
