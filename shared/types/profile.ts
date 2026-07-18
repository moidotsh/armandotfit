// shared/types/profile.ts
// Domain types for the profiles table (auth.users extension). One row per
// user, created by the handle_new_user trigger on signup. Owned by
// UserProfileRepository.

import type { ID, Timestamps } from './api';

/**
 * Split preference. Mirrors the profiles.preferred_split CHECK constraint.
 * - oneADay: one workout per day (Full Body / Push-Pull-Legs / etc.)
 * - twoADay: AM + PM sessions (advanced split).
 */
export type PreferredSplit = 'oneADay' | 'twoADay';

/**
 * Weekly workout goal (1–7 sessions per week). Mirrors profiles.weekly_goal
 * CHECK constraint.
 */
export type WeeklyGoal = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Profile row, repository-normalized shape. Field names are camelCase;
 * UserProfileRepository maps to/from the snake_case DB columns.
 *
 * restDays is an array of JS getDay integers (Sun=0..Sat=6) the user has
 * marked as rest. Defaults to [] — the settings screen is where the user
 * picks these. UI-only; the cycle counter doesn't read it.
 */
export interface Profile extends Timestamps {
  id: ID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  preferredSplit: PreferredSplit;
  weeklyGoal: WeeklyGoal;
  restDays: number[];
}

/**
 * Payload for the initial profile update after signup. The profile row is
 * auto-created by the handle_new_user trigger with defaults; this shape is
 * what the user edits on first-run onboarding.
 */
export interface ProfileUpdateDTO {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  preferredSplit?: PreferredSplit;
  weeklyGoal?: WeeklyGoal;
  restDays?: number[];
}
