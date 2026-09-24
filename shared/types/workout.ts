// shared/types/workout.ts
// Domain types for the logging chain:
//   sessions → logged_exercises → logged_sets
//            → logged_cardio (duration-first work — pass C1)
// Owned by WorkoutRepository. SessionWithDetails is the composite view
// the UI consumes (detail screen, history list, progression reads).
//
// Design rules:
//   - Raw facts only. No derived values (duration, PRs, streaks are
//     computed at read time), no target/planning columns, no completion
//     flags — a logged_sets row IS a completed set, a logged_cardio row
//     IS a machine sitting.
//   - Realization context (grip, attachment, machine, stance, execution
//     style) is captured as free-form tags on logged_exercises.

import type { ID } from './api';
import type { CardioStationKey } from '../exercises/cardio';

/** Training session header. AM and PM are two separate rows. */
export interface TrainingSession {
  id: ID;
  userId: ID;
  startedAt: string;
  note: string | null;
  /** Day-of-split (1..4) this session realized; null for ad-hoc sessions. */
  splitDay: number | null;
}

/**
 * Exercise entry within a session. `tags` is the ONLY context mechanism —
 * normalized free-form strings (e.g. 'rope', 'captains-chair',
 * 'eccentric', 'column-3'), autocomplete-sourced from the user's own
 * history + the program's suggested tags.
 */
export interface LoggedExercise {
  id: ID;
  sessionId: ID;
  exerciseId: ID;
  position: number; // 1-indexed
  tags: string[];
  note: string | null;
  /** THE PROGRESSION RATING — the station's verdict on its weight
   *  (light / right / heavy; the notebook's + ✓ −). Drives the
   *  progression engine's ladder replay; null = unrated (pre-engine
   *  history, or the lifter skipped the prompt). */
  rating: EffortRating | null;
}

/** The station's verdict on its weight — the progression rating
 * (the notebook's + ✓ −). Vocabulary lives here with the rest of the
 * raw-fact shapes; the engine consumes it. */
export type EffortRating = 'light' | 'right' | 'heavy';

/** A completed set. Reps + weight + optional note; nothing else. */
export interface LoggedSet {
  id: ID;
  loggedExerciseId: ID;
  position: number; // 1-indexed
  reps: number;
  weight: number;
  note: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Composite views (UI-facing)
// ──────────────────────────────────────────────────────────────────────

/** Logged exercise with the parent exercise name + its sets expanded. */
export interface LoggedExerciseWithSets extends LoggedExercise {
  exerciseName: string;
  sets: LoggedSet[];
}

/** Full session for the detail screen: header + nested exercises + cardio. */
export interface SessionWithDetails extends TrainingSession {
  exercises: LoggedExerciseWithSets[];
  cardio: LoggedCardio[];
}

/**
 * A cardio machine sitting — one row per sitting (treadmill run, bike
 * block, stair climb, loop walk). Duration is the one required
 * quantity; the rest are what the machine told you. Stations/fields
 * vocabulary lives in shared/exercises/cardio.ts, never the schema.
 */
export interface LoggedCardio {
  id: ID;
  sessionId: ID;
  station: CardioStationKey;
  durationSec: number;
  /** The machine's intensity dial (incline % / resistance / level). */
  level: number | null;
  speedKmh: number | null;
  distanceM: number | null;
  kcal: number | null;
  note: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// DTOs
// ──────────────────────────────────────────────────────────────────────

/** Payload for a single set in a logSession call. */
export interface LoggedSetInputDTO {
  reps: number;
  weight: number;
  note?: string | null;
}

/**
 * Payload for a single exercise entry. The exercise is referenced by
 * NAME — the repository resolves it to an exercises row, creating one on
 * first log (identity is coarse; name is the join key).
 */
export interface LoggedExerciseInputDTO {
  exerciseName: string;
  position: number;
  tags?: string[];
  note?: string | null;
  /** The progression rating (light / right / heavy); omit when unrated. */
  rating?: EffortRating | null;
  sets: LoggedSetInputDTO[];
}

/** One cardio sitting's payload (station key + machine values). */
export interface CardioInputDTO {
  station: CardioStationKey;
  durationSec: number;
  level?: number | null;
  speedKmh?: number | null;
  distanceM?: number | null;
  kcal?: number | null;
  note?: string | null;
}

/** Composite payload for logging a complete session. */
export interface LogSessionDTO {
  startedAt: string;
  splitDay?: number | null;
  note?: string | null;
  exercises: LoggedExerciseInputDTO[];
  /** Cardio sittings in this session (order preserved). */
  cardio?: CardioInputDTO[];
}

/** Payload for updating a session header post-completion. */
export interface SessionUpdateDTO {
  note?: string | null;
}
