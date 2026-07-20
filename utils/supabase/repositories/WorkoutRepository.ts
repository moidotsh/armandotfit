// utils/supabase/repositories/WorkoutRepository.ts
// Repository over the workout-logging relational chain:
//   workout_sessions → workout_session_exercises → exercise_sets
//
// The create path (logWorkout) does a sequential multi-insert: session row
// first, then session_exercises with the session id, then sets with each
// session_exercise id. The chain is wrapped in a try/catch that deletes
// the session row on any downstream failure (cascade clears children) so
// the DB never lands a half-state. A server-side RPC would be one round-
// trip + atomic, but the multi-insert path is fine for v1 write volume
// and avoids a follow-up migration just for this.

import { supabase } from '../client';
import { BaseRepository } from './BaseRepository';
import {
  type FindOptions,
  type IRepository,
  type RepositoryResult,
  RepositoryErrorCode,
  err,
  ok,
} from './types';
import type {
  Exercise,
  ExerciseSet,
  ExerciseSetInputDTO,
  ExerciseType,
  DifficultyLevel,
  ID,
  LogWorkoutDTO,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseInputDTO,
  WorkoutSessionExerciseWithSets,
  WorkoutSessionUpdateDTO,
  WorkoutSessionWithDetails,
  WorkoutTemplateSnapshot,
  WorkoutVariantSnapshot,
  WorkoutExerciseSource,
} from '../../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Row shapes
// ──────────────────────────────────────────────────────────────────────

interface WorkoutSessionRow {
  id: string;
  user_id: string;
  date: string;
  split_type: WorkoutSession['splitType'];
  day: number;
  duration: number;
  notes: string | null;
  // Phase 4 provenance — nullable, backward-compatible
  session_window: WorkoutSession['sessionWindow'];
  started_at: string | null;
  completed_at: string | null;
  plan_id: string | null;
  plan_template_snapshot: WorkoutTemplateSnapshot | null;
  plan_variant_snapshot: WorkoutVariantSnapshot | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutSessionExerciseRow {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  order_in_workout: number;
  user_grip: string | null;
  user_equipment_notes: string | null;
  target_rep_range: string | null;
  rest_timer_seconds: number;
  notes: string | null;
  // Phase 4 provenance — nullable, backward-compatible
  plan_slot_id: string | null;
  template_slot_id: string | null;
  per_side: boolean | null;
  slot_notes: string | null;
  source: WorkoutExerciseSource | null;
  created_at: string;
}

interface ExerciseSetRow {
  id: string;
  workout_session_exercise_id: string;
  set_number: number;
  target_reps: number | null;
  actual_reps: number | null;
  weight: number | null;
  rep_range: string | null;
  completed: boolean;
  completed_at: string | null;
  rest_duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────────────────────────────

export class WorkoutRepository
  extends BaseRepository<
    WorkoutSession,
    LogWorkoutDTO,
    WorkoutSessionUpdateDTO
  >
  implements
    IRepository<WorkoutSession, LogWorkoutDTO, WorkoutSessionUpdateDTO>
{
  private static SESSIONS = 'workout_sessions';
  private static SESSION_EXERCISES = 'workout_session_exercises';
  private static SETS = 'exercise_sets';

  /** List recent sessions for the home / history screens (header only). */
  async findAll(
    options?: FindOptions & { userId?: ID },
  ): Promise<RepositoryResult<WorkoutSession[]>> {
    try {
      let query = supabase.from(WorkoutRepository.SESSIONS).select('*');
      if (options?.userId) query = query.eq('user_id', options.userId);
      query = query.order('date', { ascending: false });
      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit ?? 50) - 1,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return ok((data as WorkoutSessionRow[]).map(toSession));
    } catch (e) {
      return this.handleError('findAll', e);
    }
  }

  /** Find a session header by id. */
  async findById(id: string): Promise<RepositoryResult<WorkoutSession | null>> {
    try {
      const { data, error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toSession(data as WorkoutSessionRow) : null);
    } catch (e) {
      return this.handleError('findById', e);
    }
  }

  /**
   * Find a session with its exercises + sets expanded. This is the shape
   * the detail screen consumes. Uses three sequential queries because
   * Supabase's nested-array filter has rough edges for two-level nesting.
   */
  async findByIdWithDetails(
    id: string,
  ): Promise<RepositoryResult<WorkoutSessionWithDetails | null>> {
    try {
      const sessionRes = await this.findById(id);
      if (!sessionRes.success) return sessionRes;
      if (!sessionRes.data) return ok(null);

      const { data: exRows, error: exError } = await supabase
        .from(WorkoutRepository.SESSION_EXERCISES)
        .select(
          '*, exercise:exercises(id, name, description, exercise_type, difficulty_level, instructions, tips, is_system_exercise, created_by_user_id, slug, created_at, updated_at)',
        )
        .eq('workout_session_id', id)
        .order('order_in_workout', { ascending: true });
      if (exError) throw exError;

      const exercises = exRows as unknown as Array<
        WorkoutSessionExerciseRow & {
          exercise: Parameters<typeof toExerciseFromJoin>[0];
        }
      >;

      const ids = exercises.map((e) => e.id);
      if (ids.length === 0) {
        return ok({
          ...sessionRes.data,
          exercises: [],
        });
      }

      const { data: setRows, error: setError } = await supabase
        .from(WorkoutRepository.SETS)
        .select('*')
        .in('workout_session_exercise_id', ids)
        .order('set_number', { ascending: true });
      if (setError) throw setError;

      const setsByExercise = new Map<string, ExerciseSet[]>();
      for (const row of setRows as ExerciseSetRow[]) {
        const list = setsByExercise.get(row.workout_session_exercise_id) ?? [];
        list.push(toSet(row));
        setsByExercise.set(row.workout_session_exercise_id, list);
      }

      const result: WorkoutSessionWithDetails = {
        ...sessionRes.data,
        exercises: exercises.map((e) => ({
          ...toSessionExercise(e),
          exercise: toExerciseFromJoin(e.exercise),
          sets: setsByExercise.get(e.id) ?? [],
        })),
      };
      return ok(result);
    } catch (e) {
      return this.handleError('findByIdWithDetails', e);
    }
  }

  /**
   * Log a complete workout in one call. Sequential insert: session →
   * session_exercises → sets. On any downstream failure the session row
   * is deleted (cascade clears partial children) so we never persist a
   * half-state.
   */
  async create(data: LogWorkoutDTO): Promise<RepositoryResult<WorkoutSessionWithDetails>> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return err('Not authenticated', RepositoryErrorCode.UNAUTHORIZED);
      }
      const userId = userData.user.id;

      // 1. Insert session header.
      const completedAt = data.completedAt ?? new Date().toISOString();
      const { data: sessionRow, error: sessionErr } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .insert({
          user_id: userId,
          date: data.date,
          split_type: data.splitType,
          day: data.day,
          duration: data.duration,
          notes: data.notes ?? null,
          // Phase 4 provenance — all nullable; omitted keys default to NULL.
          session_window: data.sessionWindow ?? null,
          started_at: data.startedAt ?? null,
          completed_at: completedAt,
          plan_id: data.planId ?? null,
          plan_template_snapshot: data.planTemplateSnapshot ?? null,
          plan_variant_snapshot: data.planVariantSnapshot ?? null,
        })
        .select('*')
        .single();
      if (sessionErr) throw sessionErr;
      const session = toSession(sessionRow as WorkoutSessionRow);

      // 2. Insert session_exercises + sets per exercise. Failure on any
      // exercise triggers session delete (cascade).
      try {
        const builtExercises: WorkoutSessionExerciseWithSets[] = [];
        for (const input of data.exercises) {
          const { data: exRow, error: exErr } = await supabase
            .from(WorkoutRepository.SESSION_EXERCISES)
            .insert({
              workout_session_id: session.id,
              exercise_id: input.exerciseId,
              order_in_workout: input.orderInWorkout,
              user_grip: input.userGrip ?? null,
              user_equipment_notes: input.userEquipmentNotes ?? null,
              target_rep_range: input.targetRepRange ?? null,
              rest_timer_seconds: input.restTimerSeconds ?? 60,
              notes: input.notes ?? null,
              // Phase 4 provenance — nullable; source defaults to 'static'
              // for the legacy path so historical rows become
              // distinguishable from pre-Phase-4 history on first save.
              plan_slot_id: input.planSlotId ?? null,
              template_slot_id: input.templateSlotId ?? null,
              per_side: input.perSide ?? null,
              slot_notes: input.slotNotes ?? null,
              source: input.source ?? null,
            })
            .select('*')
            .single();
          if (exErr) throw exErr;
          const exerciseEntry = toSessionExercise(exRow as WorkoutSessionExerciseRow);

          const sets: ExerciseSet[] = [];
          if (input.sets.length > 0) {
            const setRows = input.sets.map((s) => toSetInsert(exerciseEntry.id, s));
            const { data: insertedSets, error: setErr } = await supabase
              .from(WorkoutRepository.SETS)
              .insert(setRows)
              .select('*');
            if (setErr) throw setErr;
            for (const row of insertedSets as ExerciseSetRow[]) {
              sets.push(toSet(row));
            }
          }

          // Pull the parent exercise header so the UI has the full nested
          // shape without a refetch.
          const { data: parentEx, error: parentErr } = await supabase
            .from(WorkoutRepository.SESSION_EXERCISES)
            .select(
              'exercise:exercises(id, name, description, exercise_type, difficulty_level, instructions, tips, is_system_exercise, created_by_user_id, slug, created_at, updated_at)',
            )
            .eq('id', exerciseEntry.id)
            .maybeSingle();
          if (parentErr) throw parentErr;
          builtExercises.push({
            ...exerciseEntry,
            exercise: toExerciseFromJoin(
              (parentEx as unknown as { exercise: Parameters<typeof toExerciseFromJoin>[0] }).exercise,
            ),
            sets,
          });
        }

        return ok({ ...session, exercises: builtExercises });
      } catch (downstream) {
        // Best-effort cleanup: delete the session, cascade clears the rest.
        await supabase.from(WorkoutRepository.SESSIONS).delete().eq('id', session.id);
        throw downstream;
      }
    } catch (e) {
      return this.handleError('create', e);
    }
  }

  /** Update session header fields (notes, duration). */
  async update(
    id: string,
    data: WorkoutSessionUpdateDTO,
  ): Promise<RepositoryResult<WorkoutSession>> {
    try {
      const snake: Record<string, unknown> = {};
      if (data.duration !== undefined) snake.duration = data.duration;
      if (data.notes !== undefined) snake.notes = data.notes;
      snake.updated_at = new Date().toISOString();

      const { data: row, error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .update(snake)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return ok(toSession(row as WorkoutSessionRow));
    } catch (e) {
      return this.handleError('update', e);
    }
  }

  /**
   * Delete a session. FK ON DELETE CASCADE clears session_exercises, and
   * the cascade on session_exercises clears exercise_sets in turn.
   */
  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('delete', e);
    }
  }

  async deleteMany(ids: string[]): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .delete()
        .in('id', ids);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('deleteMany', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Per-exercise CRUD for in-session logging (live updates during a set)
  // ────────────────────────────────────────────────────────────────────

  async addExerciseToSession(
    sessionId: ID,
    input: WorkoutSessionExerciseInputDTO,
  ): Promise<RepositoryResult<WorkoutSessionExercise>> {
    try {
      const { data, error } = await supabase
        .from(WorkoutRepository.SESSION_EXERCISES)
        .insert({
          workout_session_id: sessionId,
          exercise_id: input.exerciseId,
          order_in_workout: input.orderInWorkout,
          user_grip: input.userGrip ?? null,
          user_equipment_notes: input.userEquipmentNotes ?? null,
          target_rep_range: input.targetRepRange ?? null,
          rest_timer_seconds: input.restTimerSeconds ?? 60,
          notes: input.notes ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return ok(toSessionExercise(data as WorkoutSessionExerciseRow));
    } catch (e) {
      return this.handleError('addExerciseToSession', e);
    }
  }

  async addSet(
    sessionExerciseId: ID,
    input: ExerciseSetInputDTO,
  ): Promise<RepositoryResult<ExerciseSet>> {
    try {
      const { data, error } = await supabase
        .from(WorkoutRepository.SETS)
        .insert(toSetInsert(sessionExerciseId, input))
        .select('*')
        .single();
      if (error) throw error;
      return ok(toSet(data as ExerciseSetRow));
    } catch (e) {
      return this.handleError('addSet', e);
    }
  }

  async updateSet(
    setId: ID,
    patch: Partial<ExerciseSetInputDTO> & { completed?: boolean; completedAt?: string | null },
  ): Promise<RepositoryResult<ExerciseSet>> {
    try {
      const snake: Record<string, unknown> = {};
      if (patch.setNumber !== undefined) snake.set_number = patch.setNumber;
      if (patch.targetReps !== undefined) snake.target_reps = patch.targetReps;
      if (patch.actualReps !== undefined) snake.actual_reps = patch.actualReps;
      if (patch.weight !== undefined) snake.weight = patch.weight;
      if (patch.repRange !== undefined) snake.rep_range = patch.repRange;
      if (patch.completed !== undefined) {
        snake.completed = patch.completed;
        snake.completed_at = patch.completed
          ? (patch.completedAt ?? new Date().toISOString())
          : null;
      }
      if (patch.restDurationSeconds !== undefined) {
        snake.rest_duration_seconds = patch.restDurationSeconds;
      }
      if (patch.notes !== undefined) snake.notes = patch.notes;

      const { data, error } = await supabase
        .from(WorkoutRepository.SETS)
        .update(snake)
        .eq('id', setId)
        .select('*')
        .single();
      if (error) throw error;
      return ok(toSet(data as ExerciseSetRow));
    } catch (e) {
      return this.handleError('updateSet', e);
    }
  }

  async deleteSet(setId: ID): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(WorkoutRepository.SETS)
        .delete()
        .eq('id', setId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('deleteSet', e);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────

function toSession(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    splitType: row.split_type,
    day: row.day,
    duration: row.duration,
    notes: row.notes,
    // Phase 4 provenance — nullable; pre-Phase-4 rows read as null.
    sessionWindow: row.session_window,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    planId: row.plan_id,
    planTemplateSnapshot: row.plan_template_snapshot,
    planVariantSnapshot: row.plan_variant_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSessionExercise(row: WorkoutSessionExerciseRow): WorkoutSessionExercise {
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    exerciseId: row.exercise_id,
    orderInWorkout: row.order_in_workout,
    userGrip: row.user_grip,
    userEquipmentNotes: row.user_equipment_notes,
    targetRepRange: row.target_rep_range,
    restTimerSeconds: row.rest_timer_seconds,
    notes: row.notes,
    // Phase 4 provenance — nullable; pre-Phase-4 rows + ad-hoc adds read as null.
    planSlotId: row.plan_slot_id,
    templateSlotId: row.template_slot_id,
    perSide: row.per_side,
    slotNotes: row.slot_notes,
    source: row.source,
    createdAt: row.created_at,
  };
}

function toSet(row: ExerciseSetRow): ExerciseSet {
  return {
    id: row.id,
    workoutSessionExerciseId: row.workout_session_exercise_id,
    setNumber: row.set_number,
    targetReps: row.target_reps,
    actualReps: row.actual_reps,
    weight: row.weight === null ? null : Number(row.weight),
    repRange: row.rep_range,
    completed: row.completed,
    completedAt: row.completed_at,
    restDurationSeconds: row.rest_duration_seconds,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toSetInsert(
  sessionExerciseId: ID,
  input: ExerciseSetInputDTO,
): Record<string, unknown> {
  return {
    workout_session_exercise_id: sessionExerciseId,
    set_number: input.setNumber,
    target_reps: input.targetReps ?? null,
    actual_reps: input.actualReps ?? null,
    weight: input.weight ?? null,
    rep_range: input.repRange ?? null,
    rest_duration_seconds: input.restDurationSeconds ?? null,
    notes: input.notes ?? null,
  };
}

function toExerciseFromJoin(row: {
  id: string;
  name: string;
  description: string | null;
  exercise_type: string;
  difficulty_level: string | null;
  instructions: string | null;
  tips: string | null;
  is_system_exercise: boolean;
  created_by_user_id: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}): Exercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    exerciseType: row.exercise_type as ExerciseType,
    difficultyLevel: row.difficulty_level as DifficultyLevel | null,
    instructions: row.instructions,
    tips: row.tips,
    isSystemExercise: row.is_system_exercise,
    createdByUserId: row.created_by_user_id,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Singleton — the daily-driver access path.
export const workoutRepository = new WorkoutRepository();
