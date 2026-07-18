// shared/types/workout.ts
// Domain types for the workout-logging relational chain:
//   workout_sessions → workout_session_exercises → exercise_sets
// Owned by WorkoutRepository. WorkoutSessionWithDetails is the composite
// view that UI code consumes (detail screen, history list).

import type { ID } from './api';
import type { PreferredSplit } from './profile';
import type { Exercise } from './exercise';

// ──────────────────────────────────────────────────────────────────────
// Row types (mirror DB columns, camelCased)
// ──────────────────────────────────────────────────────────────────────

/**
 * Workout session header. One row per completed workout. duration is in
 * minutes (CHECK > 0). day is 1–7 (per CHECK constraint) — the day-of-week
 * slot this session occupied in the user's split.
 */
export interface WorkoutSession {
  id: ID;
  userId: ID;
  date: string; // ISO timestamp
  splitType: PreferredSplit;
  day: number; // 1..7
  duration: number; // minutes
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Exercise entry within a workout session. order_in_workout is 1-indexed
 * and reflects the user's chosen sequence. Per-exercise overrides (grip,
 * equipment notes, target rep range, rest timer) capture intent at
 * planning time; exercise_sets captures execution.
 */
export interface WorkoutSessionExercise {
  id: ID;
  workoutSessionId: ID;
  exerciseId: ID;
  orderInWorkout: number;
  userGrip: string | null;
  userEquipmentNotes: string | null;
  targetRepRange: string | null;
  restTimerSeconds: number; // default 60
  notes: string | null;
  createdAt: string;
}

/**
 * Individual set within a session exercise. target_reps/actual_reps split
 * lets the UI show planned vs executed. weight is DECIMAL(7,2) in the DB
 * but number in TS (supabase-js parses DECIMAL to string by default; the
 * repository coerces to number). rep_range is the user's chosen target
 * band ('4-6' | '6-8' | '10-12' | '12-15' | '15-20') for display.
 */
export interface ExerciseSet {
  id: ID;
  workoutSessionExerciseId: ID;
  setNumber: number;
  targetReps: number | null;
  actualReps: number | null;
  weight: number | null; // kg or lb (unit is a user-profile concern)
  repRange: string | null;
  completed: boolean;
  completedAt: string | null;
  restDurationSeconds: number | null;
  notes: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// Composite views (UI-facing)
// ──────────────────────────────────────────────────────────────────────

/** Session exercise with its sets expanded + the parent exercise joined. */
export interface WorkoutSessionExerciseWithSets extends WorkoutSessionExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
}

/** Full workout session for the detail screen: header + nested exercises. */
export interface WorkoutSessionWithDetails extends WorkoutSession {
  exercises: WorkoutSessionExerciseWithSets[];
}

// ──────────────────────────────────────────────────────────────────────
// DTOs
// ──────────────────────────────────────────────────────────────────────

/** Payload for a single set in a logWorkout call. */
export interface ExerciseSetInputDTO {
  setNumber: number;
  targetReps?: number | null;
  actualReps?: number | null;
  weight?: number | null;
  repRange?: string | null;
  restDurationSeconds?: number | null;
  notes?: string | null;
}

/** Payload for a single exercise entry in a logWorkout call. */
export interface WorkoutSessionExerciseInputDTO {
  exerciseId: ID;
  orderInWorkout: number;
  userGrip?: string | null;
  userEquipmentNotes?: string | null;
  targetRepRange?: string | null;
  restTimerSeconds?: number;
  notes?: string | null;
  sets: ExerciseSetInputDTO[];
}

/**
 * Composite payload for WorkoutService.logWorkout — session header +
 * exercises + sets, all persisted in one transaction (RPC or multi-insert).
 * userId is pulled from the authenticated session in the service layer, not
 * the DTO, so callers cannot spoof ownership.
 */
export interface LogWorkoutDTO {
  date: string; // ISO timestamp
  splitType: PreferredSplit;
  day: number; // 1..7
  duration: number; // minutes
  notes?: string | null;
  exercises: WorkoutSessionExerciseInputDTO[];
}

/** Payload for updating session header fields post-completion. */
export interface WorkoutSessionUpdateDTO {
  duration?: number;
  notes?: string | null;
}

/**
 * Standard rep-range bands the UI exposes. Mirrors the v1 RepRange type.
 * Used in target_rep_range strings and exercise planning.
 */
export type RepRange = '4-6' | '6-8' | '10-12' | '12-15' | '15-20';
