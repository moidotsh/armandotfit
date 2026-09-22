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
export {
  findByPartnerCode,
  connectPartner,
  disconnectPartner,
  getPartner,
  getMyPartnerCode,
  getPartnerRecentSessions,
} from './PartnerRepository';
export type {
  TrainingPartner,
  PartnerSessionSummary,
} from './PartnerRepository';
export { BaseRepository } from './BaseRepository';
export * from './types';
