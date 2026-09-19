// shared/types/workout.ts
// Domain types for the five-table logging chain:
//   sessions → logged_exercises → logged_sets
// Owned by WorkoutRepository. SessionWithDetails is the composite view
// the UI consumes (detail screen, history list, progression reads).
//
// Design rules:
//   - Raw facts only. No derived values (duration, PRs, streaks are
//     computed at read time), no target/planning columns, no completion
//     flags — a logged_sets row IS a completed set.
//   - Realization context (grip, attachment, machine, stance, execution
//     style) is captured as free-form tags on logged_exercises.

import type { ID } from './api';

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
}

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

/** Full session for the detail screen: header + nested exercises. */
export interface SessionWithDetails extends TrainingSession {
  exercises: LoggedExerciseWithSets[];
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
  sets: LoggedSetInputDTO[];
}

/** Composite payload for logging a complete session. */
export interface LogSessionDTO {
  startedAt: string;
  splitDay?: number | null;
  note?: string | null;
  exercises: LoggedExerciseInputDTO[];
}

/** Payload for updating a session header post-completion. */
export interface SessionUpdateDTO {
  note?: string | null;
}
