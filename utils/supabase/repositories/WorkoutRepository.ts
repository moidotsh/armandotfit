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
  LoggedCardio,
  LoggedExercise,
  LoggedExerciseWithSets,
  LoggedSet,
  LogSessionDTO,
  SessionUpdateDTO,
  SessionWithDetails,
  TrainingSession,
} from '../../../shared/types';
import type { CardioStationKey } from '../../../shared/exercises/cardio';

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

interface LoggedCardioRow {
  id: string;
  session_id: string;
  station: string;
  duration_sec: number;
  level: number | string | null;
  speed_kmh: number | string | null;
  distance_m: number | null;
  kcal: number | null;
  note: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Schema-skew guard (the cardio rollout window)
// ──────────────────────────────────────────────────────────────────────

const DETAIL_SELECT_WITH_CARDIO =
  '*, logged_exercises(*, exercise:exercises(name), logged_sets(*)), logged_cardio(*)';
const DETAIL_SELECT_PLAIN =
  '*, logged_exercises(*, exercise:exercises(name), logged_sets(*))';

/** PostgREST 400s an embedded select over a relation the schema cache
 *  doesn't know — the deploy window where the client ships the cardio
 *  read before the migration is applied on the project. Detect that one
 *  skew (never a real query error) so the read can degrade instead of
 *  failing the whole sessions query. */
function isMissingCardioTable(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e ?? '');
  return msg.includes('logged_cardio');
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
  private static LOGGED_CARDIO = 'logged_cardio';

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
      type DetailRows = Array<SessionRow & {
        logged_exercises: Array<LoggedExerciseRow & { logged_sets: LoggedSetRow[] }>;
        logged_cardio?: LoggedCardioRow[] | null;
      }>;
      const run = (select: string) =>
        supabase
          .from(WorkoutRepository.SESSIONS)
          .select(select)
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(limit);
      let { data: rows, error } = await run(DETAIL_SELECT_WITH_CARDIO);
      if (error && isMissingCardioTable(error)) {
        // Schema-skew window (the cardio migration is not applied on
        // this project yet): retry without the arm — cardio reads
        // empty until the table exists; the session history must not
        // fail over a relation it can live without.
        ({ data: rows, error } = await run(DETAIL_SELECT_PLAIN));
      }
      if (error) throw error;
      return ok((rows as unknown as DetailRows).map(toSessionWithDetails));
    } catch (e) {
      return this.handleError('findRecentWithDetails', e);
    }
  }

  /** Find a session with its exercises + sets expanded (detail screen). */
  async findByIdWithDetails(
    id: string,
  ): Promise<RepositoryResult<SessionWithDetails | null>> {
    try {
      const run = (select: string) =>
        supabase
          .from(WorkoutRepository.SESSIONS)
          .select(select)
          .eq('id', id)
          .maybeSingle();
      let { data, error } = await run(DETAIL_SELECT_WITH_CARDIO);
      if (error && isMissingCardioTable(error)) {
        // The skew window (see findRecentWithDetails) — degrade, never
        // strand the receipt.
        ({ data, error } = await run(DETAIL_SELECT_PLAIN));
      }
      if (error) throw error;
      if (!data) return ok(null);
      return ok(
        toSessionWithDetails(
          data as unknown as SessionRow & {
            logged_exercises: Array<LoggedExerciseRow & { logged_sets: LoggedSetRow[] }>;
            logged_cardio?: LoggedCardioRow[] | null;
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

        // 3. Cardio sittings (duration-first work — pass C1): one row
        //    each, order preserved. Values are what the machine told
        //    you; nulls ride through as nulls.
        const builtCardio: LoggedCardio[] = [];
        for (const c of data.cardio ?? []) {
          const { data: cardioRow, error: cardioErr } = await supabase
            .from(WorkoutRepository.LOGGED_CARDIO)
            // The skew window reads clearly at the write too: the
            // session is rolled back (the catch below) and the owner
            // is told which migration to apply, not "Unknown error".
            .insert({
              session_id: session.id,
              station: c.station,
              duration_sec: c.durationSec,
              level: c.level ?? null,
              speed_kmh: c.speedKmh ?? null,
              distance_m: c.distanceM ?? null,
              kcal: c.kcal ?? null,
              note: c.note ?? null,
            })
            .select('*')
            .single();
          if (cardioErr) {
            if (isMissingCardioTable(cardioErr)) {
              cardioErr.message =
                'Cardio is not live on this project yet — apply migration 20270326000000_logged_cardio.sql, then log the sitting again.';
            }
            throw cardioErr;
          }
          builtCardio.push(toCardio(cardioRow as LoggedCardioRow));
        }

        return ok({ ...session, exercises: builtExercises, cardio: builtCardio });
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
  // ── SET-LEVEL EDITING (the receipt's edit affordances) ────────────

  /** Update a logged set's weight/reps/note (typo corrections). */
  async updateSet(
    setId: string,
    patch: { weight?: number | null; reps?: number; note?: string | null },
  ): Promise<RepositoryResult<void>> {
    try {
      const snake: Record<string, unknown> = {};
      if (patch.weight !== undefined) snake.weight = patch.weight;
      if (patch.reps !== undefined) snake.reps = patch.reps;
      if (patch.note !== undefined) snake.note = patch.note;
      const { error } = await supabase
        .from(WorkoutRepository.LOGGED_SETS)
        .update(snake)
        .eq('id', setId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('updateSet', e);
    }
  }

  /** Delete a logged set (accidental double-log, retried set). */
  async deleteSet(setId: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(WorkoutRepository.LOGGED_SETS)
        .delete()
        .eq('id', setId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('deleteSet', e);
    }
  }

  /** Add a set to an existing logged exercise (the missed set). */
  async addSet(
    loggedExerciseId: string,
    data: { weight: number | null; reps: number; note?: string },
  ): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(WorkoutRepository.LOGGED_SETS)
        .insert({
          logged_exercise_id: loggedExerciseId,
          weight: data.weight,
          reps: data.reps,
          note: data.note ?? null,
        });
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('addSet', e);
    }
  }

  /** Delete a logged exercise (cascade clears its sets). */
  async deleteLoggedExercise(
    loggedExerciseId: string,
  ): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(WorkoutRepository.LOGGED_EXERCISES)
        .delete()
        .eq('id', loggedExerciseId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('deleteLoggedExercise', e);
    }
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

function toCardio(row: LoggedCardioRow): LoggedCardio {
  return {
    id: row.id,
    sessionId: row.session_id,
    station: row.station as CardioStationKey,
    durationSec: row.duration_sec,
    level: row.level == null ? null : Number(row.level),
    speedKmh: row.speed_kmh == null ? null : Number(row.speed_kmh),
    distanceM: row.distance_m,
    kcal: row.kcal,
    note: row.note,
  };
}

function toSessionWithDetails(row: SessionRow & {
  logged_exercises: Array<LoggedExerciseRow & { logged_sets: LoggedSetRow[] }>;
  logged_cardio?: LoggedCardioRow[] | null;
}): SessionWithDetails {
  return {
    ...toSession(row),
    cardio: (row.logged_cardio ?? []).map(toCardio),
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