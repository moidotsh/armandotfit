// constants/workoutSplits.ts
// Workout split metadata. Decoupled from theme (was previously inlined in
// archive-v1/constants/theme.ts:16-27) for separation of concerns: this is
// fitness-domain data, not visual theming. Consumed by split-selection.tsx
// and by the suggested-exercises picker that pre-populates a draft session
// from the user's chosen split + day.
//
// The actual day→exercise assignments live in shared/exercises/splits.ts
// (typed against the exercise key union) so this file stays metadata-only.

import type { PreferredSplit } from '../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Split metadata
// ──────────────────────────────────────────────────────────────────────

export interface WorkoutSplitInfo {
  /** Matches the workout_sessions.split_type CHECK constraint. */
  id: PreferredSplit;
  /** Short label for selectors and footers. */
  label: string;
  /** One-line description shown in the split picker. */
  description: string;
}

/**
 * The two split archetypes armandotfit ships with. One session per day
 * (oneADay) vs two sessions per day (twoADay — AM + PM). Mirrors the v1
 * WORKOUT_SPLITS constant but typed against PreferredSplit.
 */
export const WORKOUT_SPLITS: Record<PreferredSplit, WorkoutSplitInfo> = {
  oneADay: {
    id: 'oneADay',
    label: '1-a-day',
    description: 'Full Body / Push-Pull-Legs / etc. — one session today.',
  },
  twoADay: {
    id: 'twoADay',
    label: 'AM / PM',
    description: 'Two sessions today (morning + evening).',
  },
};

/** Ordered list — useful for selectors that want a stable display order. */
export const WORKOUT_SPLIT_LIST: WorkoutSplitInfo[] = [
  WORKOUT_SPLITS.oneADay,
  WORKOUT_SPLITS.twoADay,
];

// ──────────────────────────────────────────────────────────────────────
// Day-of-week labels
// ──────────────────────────────────────────────────────────────────────

export interface DayOfWeekInfo {
  /** 1..7 — matches workout_sessions.day CHECK constraint (Mon=1..Sun=7). */
  id: string;
  label: string;
}

/**
 * The seven day-of-week slots. id is a string (not number) so it threads
 * through MobileSelectionList's selectedId prop without coercion. The
 * underlying numeric value (parseInt(id)) is what gets persisted.
 */
export const DAY_OF_WEEK_LIST: DayOfWeekInfo[] = [
  { id: '1', label: 'Monday' },
  { id: '2', label: 'Tuesday' },
  { id: '3', label: 'Wednesday' },
  { id: '4', label: 'Thursday' },
  { id: '5', label: 'Friday' },
  { id: '6', label: 'Saturday' },
  { id: '7', label: 'Sunday' },
];

/**
 * Parses a day-of-week id back to its 1..7 integer. Throws on bad input —
 * signals a programmer error (selectedId out of range), not user input,
 * so AppError is overkill here.
 */
export function parseDayId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1 || n > 7) {
    // s10-exempt: programmer-error guard, not a boundary throw
    throw new Error(`Invalid day id: ${id}`);
  }
  return n;
}
