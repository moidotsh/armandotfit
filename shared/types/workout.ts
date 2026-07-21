// shared/types/workout.ts
// Domain types for the workout-logging relational chain:
//   workout_sessions → workout_session_exercises → exercise_sets
// Owned by WorkoutRepository. WorkoutSessionWithDetails is the composite
// view that UI code consumes (detail screen, history list).

import type { ID } from './api';
import type { PreferredSplit } from './profile';
import type { Exercise } from './exercise';
// Reuse the SessionWindow type ('am' | 'pm' | 'single') defined by the
// program-template hierarchy — the same value space appears on
// program_sessions.session_window + workout_sessions.session_window.
import type { SessionWindow } from './program';

// Re-export so callers importing from the workout barrel see it.
export type { SessionWindow };

/**
 * Frozen identity snapshot for the program_templates row at launch time.
 * Stored as JSONB on workout_sessions.plan_template_snapshot. Carries the
 * immutable identity context so a later template edit or deletion can't
 * strip provenance from a historical workout.
 */
export interface WorkoutTemplateSnapshot {
  slug: string;
  name: string;
  version: number;
}

/**
 * Frozen identity snapshot for the program_schedule_variants row at
 * launch time. Stored as JSONB on workout_sessions.plan_variant_snapshot.
 */
export interface WorkoutVariantSnapshot {
  slug: string;
  name: string;
  sessionWindowPattern: 'single' | 'am-pm';
  cycleLengthDays: number;
  version: number;
}

/**
 * Provenance source discriminator. Mirrors the DB CHECK on
 * workout_session_exercises.source.
 *   plan   — hydrated from a saved user_program_plan.
 *   static — hydrated from the legacy suggested-split path.
 * NULL is allowed on the row type for pre-Phase-4 history + ad-hoc adds.
 */
export type WorkoutExerciseSource = 'plan' | 'static';

/**
 * Workout session header. One row per completed workout. duration is in
 * minutes (CHECK > 0). day is 1–7 (per CHECK constraint) — the day-of-week
 * slot this session occupied in the user's split.
 *
 * Phase 4 added nullable provenance fields: sessionWindow, startedAt,
 * completedAt, planId, planTemplateSnapshot, planVariantSnapshot. All
 * nullable so historical rows read without backfill. planId has NO DB
 * foreign key — deleting a plan must not invalidate history; the JSONB
 * snapshots carry immutable identity if the plan/template/variant rows
 * are later removed.
 */
export interface WorkoutSession {
  id: ID;
  userId: ID;
  date: string; // ISO timestamp
  splitType: PreferredSplit;
  day: number; // 1..7
  duration: number; // minutes
  notes: string | null;
  // Phase 4 provenance (nullable, backward-compatible)
  sessionWindow: SessionWindow | null;
  startedAt: string | null;
  completedAt: string | null;
  planId: ID | null;
  planTemplateSnapshot: WorkoutTemplateSnapshot | null;
  planVariantSnapshot: WorkoutVariantSnapshot | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Exercise entry within a workout session. order_in_workout is 1-indexed
 * and reflects the user's chosen sequence. Per-exercise overrides (grip,
 * equipment notes, target rep range, rest timer) capture intent at
 * planning time; exercise_sets captures execution.
 *
 * Phase 4 added nullable provenance: planSlotId + templateSlotId (no FK
 * — history must survive plan/slot deletion), perSide + slotNotes
 * (frozen from the plan slot prescription snapshot), source ('plan' |
 * 'static' | null). All nullable; historical rows read as null.
 *
 * Phase 5 added attachmentSlug (no FK, no CHECK — TS union canonical):
 * the cable attachment / station detail the user picked for this
 * exercise in this session. Frozen at save time. Passive metadata.
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
  // Phase 4 provenance (nullable, backward-compatible)
  planSlotId: ID | null;
  templateSlotId: ID | null;
  perSide: boolean | null;
  slotNotes: string | null;
  source: WorkoutExerciseSource | null;
  // Phase 5 equipment-setup snapshot (nullable, passive metadata)
  attachmentSlug: string | null;
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
  // Phase 4 provenance (all optional — omitted for static-fallback)
  planSlotId?: ID | null;
  templateSlotId?: ID | null;
  perSide?: boolean | null;
  slotNotes?: string | null;
  source?: WorkoutExerciseSource | null;
  // Phase 5 equipment-setup snapshot (optional — omitted when unset)
  attachmentSlug?: string | null;
  sets: ExerciseSetInputDTO[];
}

/**
 * Composite payload for WorkoutService.logWorkout — session header +
 * exercises + sets, all persisted in one transaction (RPC or multi-insert).
 * userId is pulled from the authenticated session in the service layer, not
 * the DTO, so callers cannot spoof ownership.
 *
 * Phase 4 added nullable session-level provenance (sessionWindow,
 * startedAt, completedAt, planId, planTemplateSnapshot,
 * planVariantSnapshot). All optional — static-fallback saves omit them.
 */
export interface LogWorkoutDTO {
  date: string; // ISO timestamp
  splitType: PreferredSplit;
  day: number; // 1..7
  duration: number; // minutes
  notes?: string | null;
  // Phase 4 session provenance (optional — omitted for static fallback)
  sessionWindow?: SessionWindow | null;
  startedAt?: string | null;
  completedAt?: string | null;
  planId?: ID | null;
  planTemplateSnapshot?: WorkoutTemplateSnapshot | null;
  planVariantSnapshot?: WorkoutVariantSnapshot | null;
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
