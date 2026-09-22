// services/workoutService.ts
// Session-logging orchestration. Wraps WorkoutRepository; hooks never
// touch the repository directly (S9). Progression + analytics are
// computed from these reads at query time — nothing is aggregated or
// stored server-side.

import {
  workoutRepository,
  type RepositoryResult,
} from '../utils/supabase/repositories';
import type {
  ID,
  LogSessionDTO,
  SessionUpdateDTO,
  SessionWithDetails,
  TrainingSession,
} from '../shared/types';

export class WorkoutService {
  /** Log a complete session in one call. */
  static async logSession(
    dto: LogSessionDTO,
  ): Promise<RepositoryResult<SessionWithDetails>> {
    return workoutRepository.create(dto);
  }

  /** Update a session header (note) post-completion. */
  static async updateSession(
    id: ID,
    dto: SessionUpdateDTO,
  ): Promise<RepositoryResult<TrainingSession>> {
    return workoutRepository.update(id, dto);
  }

  /** Delete a session. Cascade clears logged_exercises + logged_sets. */
  static async deleteSession(id: ID): Promise<RepositoryResult<void>> {
    return workoutRepository.delete(id);
  }

  // ── SET-LEVEL EDITING (the receipt's edit affordances) ────────────

  /** Update a logged set's weight/reps/note (typo corrections). */
  static async updateSet(
    setId: ID,
    patch: { weight?: number | null; reps?: number; note?: string | null },
  ): Promise<RepositoryResult<void>> {
    return workoutRepository.updateSet(setId, patch);
  }

  /** Delete a logged set (accidental double-log, retried set). */
  static async deleteSet(setId: ID): Promise<RepositoryResult<void>> {
    return workoutRepository.deleteSet(setId);
  }

  /** Add a set to an existing logged exercise (the missed set). */
  static async addSet(
    loggedExerciseId: ID,
    data: { weight: number | null; reps: number },
  ): Promise<RepositoryResult<void>> {
    return workoutRepository.addSet(loggedExerciseId, data);
  }

  /** Delete a logged exercise (cascade clears its sets). */
  static async deleteLoggedExercise(
    loggedExerciseId: ID,
  ): Promise<RepositoryResult<void>> {
    return workoutRepository.deleteLoggedExercise(loggedExerciseId);
  }

  /** Recent sessions for the home dashboard (headers only). */
  static async getRecentSessions(
    userId: ID,
    limit = 10,
  ): Promise<RepositoryResult<TrainingSession[]>> {
    return workoutRepository.findAll({ userId, limit });
  }

  /** Full session detail for the read-only screen. */
  static async getSessionDetail(
    id: ID,
  ): Promise<RepositoryResult<SessionWithDetails | null>> {
    return workoutRepository.findByIdWithDetails(id);
  }

  /**
   * The user's most-recent tags per exercise name — the "what did I use
   * last time" session-start prefill.
   */
  static async getLastTagsByExerciseNames(
    names: string[],
  ): Promise<RepositoryResult<Map<string, string[]>>> {
    return workoutRepository.findLastTagsByExerciseNames(names);
  }

  /**
   * Recent sessions with full nesting — the read path for
   * progression + analytics, which compute everything client-side.
   */
  static async getRecentWithDetails(
    userId: ID,
    limit = 50,
  ): Promise<RepositoryResult<SessionWithDetails[]>> {
    return workoutRepository.findRecentWithDetails(userId, limit);
  }
}

export default WorkoutService;
