// utils/supabase/repositories/WorkoutRepository.ts
// Repository over the five-table logging chain:
//   sessions → logged_exercises → logged_sets
//
// The create path resolves each exercise NAME to an exercises row
// (find-or-create — pool exercises get their row on first log), then does
// a sequential multi-insert: session row, logged_exercises, logged_sets.
// The chain is wrapped so any downstream failure deletes the session row
// (cascade clears children) — the DB never lands a half-state.

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
  ID,
  LoggedExercise,
  LoggedExerciseWithSets,
  LoggedSet,
  LogSessionDTO,
  SessionUpdateDTO,
  SessionWithDetails,
  TrainingSession,
} from '../../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Row shapes
// ──────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string;
  user_id: string;
  started_at: string;
  note: string | null;
  split_day: number | null;
}

interface LoggedExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
  tags: string[] | null;
  note: string | null;
  /** Embedded join from the nested select (exercises.name). */
  exercise?: { name: string } | null;
}

interface LoggedSetRow {
  id: string;
  logged_exercise_id: string;
  position: number;
  reps: number;
  weight: number | string;
  note: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────────────────────────────

export class WorkoutRepository
  extends BaseRepository<TrainingSession, LogSessionDTO, SessionUpdateDTO>
  implements IRepository<TrainingSession, LogSessionDTO, SessionUpdateDTO>
{
  private static SESSIONS = 'sessions';
  private static LOGGED_EXERCISES = 'logged_exercises';
  private static LOGGED_SETS = 'logged_sets';

  /** List recent sessions (headers) for the home / history screens. */
  async findAll(
    options?: FindOptions & { userId?: ID },
  ): Promise<RepositoryResult<TrainingSession[]>> {
    try {
      let query = supabase.from(WorkoutRepository.SESSIONS).select('*');
      if (options?.userId) query = query.eq('user_id', options.userId);
      query = query.order('started_at', { ascending: false });
      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit ?? 50) - 1,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return ok((data as SessionRow[]).map(toSession));
    } catch (e) {
      return this.handleError('findAll', e);
    }
  }

  /** Find a session header by id. */
  async findById(id: string): Promise<RepositoryResult<TrainingSession | null>> {
    try {
      const { data, error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toSession(data as SessionRow) : null);
    } catch (e) {
      return this.handleError('findById', e);
    }
  }

  /**
   * Recent sessions with full nesting (exercises + sets). The read path
   * for progression + analytics, which are computed client-side from
   * raw history — never stored.
   */
  async findRecentWithDetails(
    userId: ID,
    limit = 50,
  ): Promise<RepositoryResult<SessionWithDetails[]>> {
    try {
      const { data: rows, error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .select('*, logged_exercises(*, exercise:exercises(name), logged_sets(*))')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ok((rows as unknown as Array<SessionRow & {
        logged_exercises: Array<LoggedExerciseRow & { logged_sets: LoggedSetRow[] }>;
      }>).map(toSessionWithDetails));
    } catch (e) {
      return this.handleError('findRecentWithDetails', e);
    }
  }

  /** Find a session with its exercises + sets expanded (detail screen). */
  async findByIdWithDetails(
    id: string,
  ): Promise<RepositoryResult<SessionWithDetails | null>> {
    try {
      const { data, error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .select('*, logged_exercises(*, exercise:exercises(name), logged_sets(*))')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return ok(null);
      return ok(
        toSessionWithDetails(
          data as unknown as SessionRow & {
            logged_exercises: Array<LoggedExerciseRow & { logged_sets: LoggedSetRow[] }>;
          },
        ),
      );
    } catch (e) {
      return this.handleError('findByIdWithDetails', e);
    }
  }

  /**
   * Log a complete session in one call. Sequential insert: session →
   * logged_exercises → logged_sets. On any downstream failure the session
   * row is deleted (cascade clears partial children).
   */
  async create(data: LogSessionDTO): Promise<RepositoryResult<SessionWithDetails>> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return err('Not authenticated', RepositoryErrorCode.UNAUTHORIZED);
      }
      const userId = userData.user.id;

      // 1. Insert session header.
      const { data: sessionRow, error: sessionErr } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .insert({
          user_id: userId,
          started_at: data.startedAt,
          note: data.note ?? null,
          split_day: data.splitDay ?? null,
        })
        .select('*')
        .single();
      if (sessionErr) throw sessionErr;
      const session = toSession(sessionRow as SessionRow);

      try {
        // 2. Per exercise: resolve identity by name (find-or-create),
        //    insert the logged_exercises row, then its sets.
        const builtExercises: LoggedExerciseWithSets[] = [];
        for (const input of data.exercises) {
          const exerciseIdRes = await this.resolveExerciseId(input.exerciseName, userId);
          if (!exerciseIdRes.success) throw exerciseIdRes.error;

          const { data: exRow, error: exErr } = await supabase
            .from(WorkoutRepository.LOGGED_EXERCISES)
            .insert({
              session_id: session.id,
              exercise_id: exerciseIdRes.data,
              position: input.position,
              tags: input.tags ?? [],
              note: input.note ?? null,
            })
            .select('*')
            .single();
          if (exErr) throw exErr;
          const exerciseEntry = toLoggedExercise(exRow as LoggedExerciseRow);

          const sets: LoggedSet[] = [];
          if (input.sets.length > 0) {
            const setRows = input.sets.map((s, i) => ({
              logged_exercise_id: exerciseEntry.id,
              position: i + 1,
              reps: s.reps,
              weight: s.weight,
              note: s.note ?? null,
            }));
            const { data: insertedSets, error: setErr } = await supabase
              .from(WorkoutRepository.LOGGED_SETS)
              .insert(setRows)
              .select('*');
            if (setErr) throw setErr;
            for (const row of insertedSets as LoggedSetRow[]) {
              sets.push(toSet(row));
            }
          }

          const nameRes = await this.getExerciseName(exerciseEntry.exerciseId);
          builtExercises.push({
            ...exerciseEntry,
            exerciseName: nameRes ?? input.exerciseName,
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

  /** Update a session header (note) post-completion. */
  async update(
    id: string,
    data: SessionUpdateDTO,
  ): Promise<RepositoryResult<TrainingSession>> {
    try {
      const snake: Record<string, unknown> = {};
      if (data.note !== undefined) snake.note = data.note;

      const { data: row, error } = await supabase
        .from(WorkoutRepository.SESSIONS)
        .update(snake)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return ok(toSession(row as SessionRow));
    } catch (e) {
      return this.handleError('update', e);
    }
  }

  /** Delete a session. Cascade clears logged_exercises + logged_sets. */
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
  // Identity resolution
  // ────────────────────────────────────────────────────────────────────

  /**
   * Resolve an exercise NAME to an exercises row id, creating a user-
   * owned row on first log. System seed rows (user_id NULL) and the
   * user's own rows both match. The name goes through .eq() (a typed
   * filter — spaces and quotes are safe); only the user_id disjunction
   * rides the .or() string. Race-safe via retry-on-conflict.
   */
  private async resolveExerciseId(
    name: string,
    userId: ID,
  ): Promise<RepositoryResult<ID>> {
    try {
      const find = () =>
        supabase
          .from('exercises')
          .select('id')
          .eq('name', name)
          .or(`user_id.is.null,user_id.eq.${userId}`)
          .limit(1);
      const { data: existing, error: findErr } = await find();
      if (findErr) throw findErr;
      if (existing && existing.length > 0) {
        return ok(existing[0].id as ID);
      }
      const { data: created, error: insertErr } = await supabase
        .from('exercises')
        .insert({ user_id: userId, name })
        .select('id')
        .single();
      if (insertErr) {
        // Unique violation → a concurrent create won the race; re-read.
        const { data: reread, error: rereadErr } = await find();
        if (rereadErr || !reread || reread.length === 0) throw insertErr;
        return ok(reread[0].id as ID);
      }
      return ok(created.id as ID);
    } catch (e) {
      return this.handleError('resolveExerciseId', e);
    }
  }

  /**
   * The user's most-recent tags per exercise NAME — the "what did I use
   * last time" prefill. Scans the caller's recent logged_exercises
   * (RLS-scoped through the session ownership chain) and keeps the
   * newest row per name. Recency is the PARENT session's started_at
   * (logged_exercises carries no timestamp of its own — ordering by
   * the embed keeps one bounded round-trip). Personal scale.
   */
  async findLastTagsByExerciseNames(
    names: string[],
  ): Promise<RepositoryResult<Map<string, string[]>>> {
    const result = new Map<string, string[]>();
    if (names.length === 0) return ok(result);
    try {
      const { data, error } = await supabase
        .from(WorkoutRepository.LOGGED_EXERCISES)
        .select('tags, exercise:exercises(name), sessions(started_at)')
        .order('started_at', { referencedTable: 'sessions', ascending: false })
        .limit(300);
      if (error) throw error;
      const wanted = new Set(names.map((n) => n.toLowerCase()));
      for (const row of data as unknown as Array<{
        tags: string[] | null;
        exercise: { name: string } | null;
      }>) {
        const name = row.exercise?.name;
        if (!name) continue;
        const key = name.toLowerCase();
        if (!wanted.has(key) || result.has(key)) continue;
        result.set(key, row.tags ?? []);
      }
      return ok(result);
    } catch (e) {
      return this.handleError('findLastTagsByExerciseNames', e);
    }
  }

  /** Fetch an exercise's display name by id (null when unreadable). */
  private async getExerciseName(exerciseId: ID): Promise<string | null> {
    const { data } = await supabase
      .from('exercises')
      .select('name')
      .eq('id', exerciseId)
      .maybeSingle();
    return data?.name ?? null;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────


function toSession(row: SessionRow): TrainingSession {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: row.started_at,
    note: row.note,
    splitDay: row.split_day,
  };
}

function toLoggedExercise(row: LoggedExerciseRow): LoggedExercise {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    position: row.position,
    tags: row.tags ?? [],
    note: row.note,
  };
}

function toSet(row: LoggedSetRow): LoggedSet {
  return {
    id: row.id,
    loggedExerciseId: row.logged_exercise_id,
    position: row.position,
    reps: row.reps,
    weight: Number(row.weight),
    note: row.note,
  };
}

function toSessionWithDetails(row: SessionRow & {
  logged_exercises: Array<LoggedExerciseRow & { logged_sets: LoggedSetRow[] }>;
}): SessionWithDetails {
  return {
    ...toSession(row),
    exercises: (row.logged_exercises ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((e) => ({
        ...toLoggedExercise(e),
        exerciseName: e.exercise?.name ?? '',
        sets: (e.logged_sets ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map(toSet),
      })),
  };
}

// Singleton — the daily-driver access path.
export const workoutRepository = new WorkoutRepository();
