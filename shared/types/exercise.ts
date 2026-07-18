// shared/types/exercise.ts
// Domain types for the exercise library: reference tables (muscle_categories,
// muscles, equipment_types), the exercises table (system + custom), junction
// tables (exercise_muscles, exercise_equipment, exercise_variations), and
// user-owned inventory tables (user_favorite_exercises,
// user_available_equipment). Owned by ExerciseRepository.

import type { ID, Timestamps } from './api';

// ──────────────────────────────────────────────────────────────────────
// Enumerations (mirror CHECK constraints)
// ──────────────────────────────────────────────────────────────────────

/** Mirrors exercises.exercise_type CHECK constraint. */
export type ExerciseType = 'calisthenic' | 'free_weight' | 'cable' | 'machine';

/** Mirrors exercises.difficulty_level CHECK constraint (NULL allowed). */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/** Mirrors equipment_types.category CHECK constraint (NULL allowed). */
export type EquipmentCategory =
  | 'free_weight'
  | 'machine'
  | 'cable'
  | 'accessory'
  | 'calisthenic';

// ──────────────────────────────────────────────────────────────────────
// Reference tables (read-only for authenticated users)
// ──────────────────────────────────────────────────────────────────────

export interface MuscleCategory {
  id: ID;
  name: string;
  displayName: string;
  /** Stable slug matching the seed migration. Null on user-created rows. */
  slug: string | null;
  createdAt: string;
}

export interface Muscle {
  id: ID;
  name: string;
  displayName: string;
  muscleCategoryId: ID | null;
  /** Stable slug matching the seed migration. Null on user-created rows. */
  slug: string | null;
  createdAt: string;
}

export interface EquipmentType {
  id: ID;
  name: string;
  displayName: string;
  category: EquipmentCategory | null;
  /** Stable slug matching the seed migration. Null on user-created rows. */
  slug: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// Exercise (system library + user custom)
// ──────────────────────────────────────────────────────────────────────

/**
 * Exercise row. System exercises ship with the app and are public-read;
 * custom exercises are user-owned and private to their creator. The
 * system_exercises_have_no_creator CHECK constraint enforces that
 * is_system_exercise and created_by_user_id are mutually exclusive.
 */
export interface Exercise extends Timestamps {
  id: ID;
  name: string;
  description: string | null;
  exerciseType: ExerciseType;
  difficultyLevel: DifficultyLevel | null;
  instructions: string | null;
  tips: string | null;
  isSystemExercise: boolean;
  createdByUserId: ID | null;
  /**
   * Stable slug matching the seed migration (and the ExerciseKey union in
   * shared/exercises/splits.ts). Null on user-created custom exercises.
   */
  slug: string | null;
}

/**
 * Junction row: exercise ↔ muscle with a primary/secondary flag.
 * Mirrors exercise_muscles.is_primary.
 */
export interface ExerciseMuscle {
  id: ID;
  exerciseId: ID;
  muscleId: ID;
  isPrimary: boolean;
  createdAt: string;
}

/** Junction row: exercise ↔ equipment_type with required/optional flag. */
export interface ExerciseEquipment {
  id: ID;
  exerciseId: ID;
  equipmentTypeId: ID;
  isRequired: boolean;
  createdAt: string;
}

/**
 * Junction row: base exercise ↔ variation exercise. The variation_not_self
 * CHECK constraint prevents an exercise from being its own variation.
 * difficulty_progression is an optional integer ordering (higher = harder).
 */
export interface ExerciseVariation {
  id: ID;
  baseExerciseId: ID;
  variationExerciseId: ID;
  variationType: string | null;
  difficultyProgression: number | null;
  notes: string | null;
  createdAt: string;
}

/**
 * Composite view: an exercise with its muscles, equipment, and variations
 * pre-joined. This is the shape UI code consumes (list view, detail view).
 * ExerciseRepository.findByIdWithRelations returns this shape.
 */
export interface ExerciseWithRelations extends Exercise {
  muscles: Array<{
    muscle: Muscle;
    isPrimary: boolean;
  }>;
  equipment: Array<{
    equipmentType: EquipmentType;
    isRequired: boolean;
  }>;
  variations: Array<{
    variation: Exercise;
    variationType: string | null;
    difficultyProgression: number | null;
  }>;
}

// ──────────────────────────────────────────────────────────────────────
// User-owned inventory
// ──────────────────────────────────────────────────────────────────────

/** User bookmark on an exercise. Mirrors user_favorite_exercises. */
export interface UserFavoriteExercise {
  id: ID;
  userId: ID;
  exerciseId: ID;
  createdAt: string;
}

/**
 * User inventory row: which equipment_types the user owns (drives exercise
 * filtering). Mirrors user_available_equipment.
 */
export interface UserAvailableEquipment {
  id: ID;
  userId: ID;
  equipmentTypeId: ID;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// DTOs (create / update)
// ──────────────────────────────────────────────────────────────────────

/**
 * Filter shape for the exercise browse / list UX. Repository findAll()
 * accepts this inline; hooks thread it through to the queryKey so cache
 * invalidates correctly when the filter changes.
 */
export interface ExerciseFilter {
  exerciseType?: ExerciseType;
  difficultyLevel?: DifficultyLevel;
  muscleId?: ID;
  equipmentTypeId?: ID;
  isSystemOnly?: boolean;
  isCustomOnly?: boolean;
  search?: string;
}

/**
 * Payload for creating a custom exercise. The repository forces
 * isSystemExercise=false and createdByUserId=<current user> regardless of
 * the DTO (the system-vs-custom CHECK constraint would reject anything else
 * under authenticated auth, but enforcing it client-side first keeps the
 * error friendly).
 */
export interface ExerciseCreateDTO {
  name: string;
  description?: string | null;
  exerciseType: ExerciseType;
  difficultyLevel?: DifficultyLevel | null;
  instructions?: string | null;
  tips?: string | null;
  muscleIds?: ID[];
  equipmentTypeIds?: ID[];
}

export interface ExerciseUpdateDTO {
  name?: string;
  description?: string | null;
  exerciseType?: ExerciseType;
  difficultyLevel?: DifficultyLevel | null;
  instructions?: string | null;
  tips?: string | null;
}

/** Payload for toggling a favorite. */
export interface FavoriteCreateDTO {
  exerciseId: ID;
}

/** Payload for registering owned equipment. */
export interface AvailableEquipmentCreateDTO {
  equipmentTypeId: ID;
  quantity?: number;
  notes?: string | null;
}
