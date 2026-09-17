// shared/types/profile.ts
// Domain types for the users table (one row per authenticated lifter,
// created by the handle_new_user trigger). Owned by UserProfileRepository.

import type { ID } from './api';

/**
 * Split preference — client-side picker state, NOT persisted. The user
 * chooses one-a-day vs AM/PM each time they start a session.
 */
export type PreferredSplit = 'oneADay' | 'twoADay';

/** User row. restDays drives the rest-day deactivation in the picker. */
export interface Profile {
  id: ID;
  displayName: string;
  /** JS getDay integers (Sun=0..Sat=6) marked as rest. */
  restDays: number[];
  createdAt: string;
}

/** Payload for editing user preferences. */
export interface ProfileUpdateDTO {
  displayName?: string;
  restDays?: number[];
}
