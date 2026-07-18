// services/workoutService.ts
// Multi-step workout operations. Owns the orchestration shape for
// start-session → log-sets → complete + the live-update paths during a
// session. Wraps WorkoutRepository; the analytics trigger fires inside
// the DB so no service-level write is needed to update aggregates.

import {
  workoutRepository,
  type RepositoryResult,
} from '../utils/supabase/repositories';
import type {
  ExerciseSet,
  ExerciseSetInputDTO,
  ID,
  LogWorkoutDTO,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseInputDTO,
  WorkoutSessionUpdateDTO,
  WorkoutSessionWithDetails,
} from '../shared/types';

/**
 * WorkoutService — stateless orchestration over WorkoutRepository. The
 * methods here are the daily-driver write paths (mutations) + the read
 * paths the workout UI consumes. React Query hooks call into this; hooks
 * never touch the repository directly (S9).
 */
export class WorkoutService {
  /** Log a complete workout in one transaction-like call. */
  static async logWorkout(
    dto: LogWorkoutDTO,
  ): Promise<RepositoryResult<WorkoutSessionWithDetails>> {
    return workoutRepository.create(dto);
  }

  /** Update a session header (notes, duration) post-completion. */
  static async updateSession(
    id: ID,
    dto: WorkoutSessionUpdateDTO,
  ): Promise<RepositoryResult<WorkoutSession>> {
    return workoutRepository.update(id, dto);
  }

  /**
   * Delete a session. Cascade clears session_exercises and exercise_sets.
   * Note: does NOT decrement user_analytics (the trigger only fires on
   * INSERT); a follow-up migration could add the symmetric trigger if
   * accurate historical aggregates matter post-delete.
   */
  static async deleteSession(id: ID): Promise<RepositoryResult<void>> {
    return workoutRepository.delete(id);
  }

  // ────────────────────────────────────────────────────────────────────
  // Live in-session updates (called per set/exercise during logging)
  // ────────────────────────────────────────────────────────────────────

  static async addExerciseToSession(
    sessionId: ID,
    input: WorkoutSessionExerciseInputDTO,
  ): Promise<RepositoryResult<WorkoutSessionExercise>> {
    return workoutRepository.addExerciseToSession(sessionId, input);
  }

  static async addSet(
    sessionExerciseId: ID,
    input: ExerciseSetInputDTO,
  ): Promise<RepositoryResult<ExerciseSet>> {
    return workoutRepository.addSet(sessionExerciseId, input);
  }

  static async updateSet(
    setId: ID,
    patch: Partial<ExerciseSetInputDTO> & { completed?: boolean; completedAt?: string | null },
  ): Promise<RepositoryResult<ExerciseSet>> {
    return workoutRepository.updateSet(setId, patch);
  }

  static async deleteSet(setId: ID): Promise<RepositoryResult<void>> {
    return workoutRepository.deleteSet(setId);
  }

  // ────────────────────────────────────────────────────────────────────
  // Reads
  // ────────────────────────────────────────────────────────────────────

  /** Recent sessions for the home dashboard (header only). */
  static async getRecentSessions(
    userId: ID,
    limit = 10,
  ): Promise<RepositoryResult<WorkoutSession[]>> {
    return workoutRepository.findAll({ userId, limit });
  }

  /** Full session detail (header + exercises + sets) for the detail screen. */
  static async getSessionDetail(
    id: ID,
  ): Promise<RepositoryResult<WorkoutSessionWithDetails | null>> {
    return workoutRepository.findByIdWithDetails(id);
  }
}

export default WorkoutService;
