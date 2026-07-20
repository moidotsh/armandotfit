// utils/supabase/repositories/ExerciseRepository.ts
// Repository over the exercises table + the exercise_* junction tables +
// the user_favorite_exercises / user_available_equipment inventory tables.
// System exercises ship with the app (public read); custom exercises are
// user-owned (RLS enforces owner-only CRUD).

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
import {
  validateSelections,
  resolveCapabilitiesToEquipmentSlugs,
  type SelectedCapability,
} from '../../../constants/equipmentCapabilities';
import type {
  Exercise,
  ExerciseCreateDTO,
  ExerciseEquipment,
  ExerciseFilter,
  ExerciseMuscle,
  ExerciseType,
  ExerciseUpdateDTO,
  ExerciseVariation,
  ExerciseWithRelations,
  DifficultyLevel,
  EquipmentType,
  FavoriteCreateDTO,
  AvailableEquipmentCreateDTO,
  EquipmentCapabilitySelectionDTO,
  Muscle,
  MuscleCategory,
  UserAvailableEquipment,
  UserEquipmentCapability,
  UserFavoriteExercise,
  ID,
} from '../../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Row shapes (snake_case DB → camelCase TS mapping lives below)
// ──────────────────────────────────────────────────────────────────────

interface ExerciseRow {
  id: string;
  name: string;
  description: string | null;
  exercise_type: ExerciseType;
  difficulty_level: DifficultyLevel | null;
  instructions: string | null;
  tips: string | null;
  is_system_exercise: boolean;
  created_by_user_id: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

interface ExerciseMuscleRow {
  id: string;
  exercise_id: string;
  muscle_id: string;
  is_primary: boolean;
  created_at: string;
}

interface ExerciseEquipmentRow {
  id: string;
  exercise_id: string;
  equipment_type_id: string;
  is_required: boolean;
  created_at: string;
}

interface ExerciseVariationRow {
  id: string;
  base_exercise_id: string;
  variation_exercise_id: string;
  variation_type: string | null;
  difficulty_progression: number | null;
  notes: string | null;
  created_at: string;
}

interface MuscleCategoryRow {
  id: string;
  name: string;
  display_name: string;
  slug: string | null;
  created_at: string;
}

interface MuscleRow {
  id: string;
  name: string;
  display_name: string;
  muscle_category_id: string | null;
  slug: string | null;
  created_at: string;
}

interface EquipmentTypeRow {
  id: string;
  name: string;
  display_name: string;
  category: string | null;
  slug: string | null;
  created_at: string;
}

interface UserFavoriteRow {
  id: string;
  user_id: string;
  exercise_id: string;
  created_at: string;
}

interface UserAvailableEquipmentRow {
  id: string;
  user_id: string;
  equipment_type_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

interface UserEquipmentCapabilityRow {
  id: string;
  user_id: string;
  capability_slug: string;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────────────────────────────

/**
 * ExerciseRepository — owns the exercises table + the exercise_* junctions
 * + the user inventory tables. The reference-data reads (muscles,
 * equipment_types) live here too because they're tightly coupled to the
 * exercise browse UX. All reads return repository-normalized types.
 */
export class ExerciseRepository
  extends BaseRepository<Exercise, ExerciseCreateDTO, ExerciseUpdateDTO>
  implements IRepository<Exercise, ExerciseCreateDTO, ExerciseUpdateDTO>
{
  private static EXERCISES = 'exercises';
  private static MUSCLES = 'muscles';
  private static MUSCLE_CATEGORIES = 'muscle_categories';
  private static EQUIPMENT = 'equipment_types';
  private static EXERCISE_MUSCLES = 'exercise_muscles';
  private static EXERCISE_EQUIPMENT = 'exercise_equipment';
  private static EXERCISE_VARIATIONS = 'exercise_variations';
  private static USER_FAVORITES = 'user_favorite_exercises';
  private static USER_EQUIPMENT = 'user_available_equipment';
  private static USER_CAPABILITIES = 'user_equipment_capabilities';

  /** List exercises with optional filters. Always returns camelCased rows. */
  async findAll(options?: FindOptions & ExerciseFilter): Promise<RepositoryResult<Exercise[]>> {
    try {
      let query = supabase.from(ExerciseRepository.EXERCISES).select('*');
      if (options?.exerciseType) query = query.eq('exercise_type', options.exerciseType);
      if (options?.difficultyLevel) query = query.eq('difficulty_level', options.difficultyLevel);
      if (options?.isSystemOnly === true) query = query.eq('is_system_exercise', true);
      if (options?.isCustomOnly === true) query = query.eq('is_system_exercise', false);
      if (options?.search) query = query.ilike('name', `%${options.search}%`);
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc',
        });
      } else {
        query = query.order('name', { ascending: true });
      }
      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset) query = query.range(
        options.offset,
        options.offset + (options.limit ?? 50) - 1,
      );

      const { data, error } = await query;
      if (error) throw error;

      let exercises = (data as ExerciseRow[]).map(toExercise);

      // Muscle / equipment filters require post-fetch intersection since
      // Supabase's nested-filter API has rough edges for many-to-many.
      if (options?.muscleId) {
        const ids = await this.findExerciseIdsForMuscle(options.muscleId);
        const set = new Set(ids);
        exercises = exercises.filter((e) => set.has(e.id));
      }
      if (options?.equipmentTypeId) {
        const ids = await this.findExerciseIdsForEquipment(options.equipmentTypeId);
        const set = new Set(ids);
        exercises = exercises.filter((e) => set.has(e.id));
      }
      return ok(exercises);
    } catch (e) {
      return this.handleError('findAll', e);
    }
  }

  /** Find a single exercise by id (header fields only). */
  async findById(id: string): Promise<RepositoryResult<Exercise | null>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.EXERCISES)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toExercise(data as ExerciseRow) : null);
    } catch (e) {
      return this.handleError('findById', e);
    }
  }

  /**
   * Find a system exercise by its stable slug. Used by the suggested-
   * exercises hydration path (slug → full exercise row → repository cache).
   * Returns null for unknown slugs rather than erroring.
   */
  async findBySlug(slug: string): Promise<RepositoryResult<Exercise | null>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.EXERCISES)
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toExercise(data as ExerciseRow) : null);
    } catch (e) {
      return this.handleError('findBySlug', e);
    }
  }

  /**
   * Find an exercise with its muscles, equipment, and variations pre-
   * joined. This is the shape the detail screen consumes.
   */
  async findByIdWithRelations(
    id: string,
  ): Promise<RepositoryResult<ExerciseWithRelations | null>> {
    try {
      const exerciseRes = await this.findById(id);
      if (!exerciseRes.success) return exerciseRes;
      if (!exerciseRes.data) return ok(null);

      const [muscles, equipment, variations] = await Promise.all([
        this.fetchMusclesForExercise(id),
        this.fetchEquipmentForExercise(id),
        this.fetchVariationsForExercise(id),
      ]);
      if (!muscles.success) return muscles;
      if (!equipment.success) return equipment;
      if (!variations.success) return variations;

      return ok({
        ...exerciseRes.data,
        muscles: muscles.data,
        equipment: equipment.data,
        variations: variations.data,
      });
    } catch (e) {
      return this.handleError('findByIdWithRelations', e);
    }
  }

  /**
   * Create a custom exercise. The repository forces is_system_exercise=false
   * and created_by_user_id=<current user from session>. Muscle / equipment
   * junctions are inserted as a follow-up; if those fail the exercise row
   * is deleted to avoid a half-state (cascade handles junctions on retry).
   */
  async create(data: ExerciseCreateDTO): Promise<RepositoryResult<Exercise>> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return err('Not authenticated', RepositoryErrorCode.UNAUTHORIZED);
      }

      const insertRow = {
        name: data.name,
        description: data.description ?? null,
        exercise_type: data.exerciseType,
        difficulty_level: data.difficultyLevel ?? null,
        instructions: data.instructions ?? null,
        tips: data.tips ?? null,
        is_system_exercise: false,
        created_by_user_id: userData.user.id,
      };

      const { data: row, error } = await supabase
        .from(ExerciseRepository.EXERCISES)
        .insert(insertRow)
        .select('*')
        .single();
      if (error) throw error;

      const exercise = toExercise(row as ExerciseRow);

      // Best-effort junction inserts. Failure here is non-fatal — the
      // exercise exists, just without enrichment. Caller can PATCH later.
      if (data.muscleIds?.length) {
        await this.insertMuscleJunctions(exercise.id, data.muscleIds);
      }
      if (data.equipmentTypeIds?.length) {
        await this.insertEquipmentJunctions(exercise.id, data.equipmentTypeIds);
      }
      return ok(exercise);
    } catch (e) {
      return this.handleError('create', e);
    }
  }

  /** Update a custom exercise. System exercises are read-only (RLS enforced). */
  async update(
    id: string,
    data: ExerciseUpdateDTO,
  ): Promise<RepositoryResult<Exercise>> {
    try {
      const snake: Record<string, unknown> = {};
      if (data.name !== undefined) snake.name = data.name;
      if (data.description !== undefined) snake.description = data.description;
      if (data.exerciseType !== undefined) snake.exercise_type = data.exerciseType;
      if (data.difficultyLevel !== undefined) snake.difficulty_level = data.difficultyLevel;
      if (data.instructions !== undefined) snake.instructions = data.instructions;
      if (data.tips !== undefined) snake.tips = data.tips;
      snake.updated_at = new Date().toISOString();

      const { data: row, error } = await supabase
        .from(ExerciseRepository.EXERCISES)
        .update(snake)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return ok(toExercise(row as ExerciseRow));
    } catch (e) {
      return this.handleError('update', e);
    }
  }

  /**
   * Delete a custom exercise. System exercises cannot be deleted (RLS
   * blocks it). Cascade clears exercise_muscles / exercise_equipment /
   * exercise_variations; workout_session_exercises has ON DELETE RESTRICT
   * so historical workouts stay intact.
   */
  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(ExerciseRepository.EXERCISES)
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
        .from(ExerciseRepository.EXERCISES)
        .delete()
        .in('id', ids);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('deleteMany', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Reference data (read-only)
  // ────────────────────────────────────────────────────────────────────

  async findAllMuscleCategories(): Promise<RepositoryResult<MuscleCategory[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.MUSCLE_CATEGORIES)
        .select('*')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return ok((data as MuscleCategoryRow[]).map(toMuscleCategory));
    } catch (e) {
      return this.handleError('findAllMuscleCategories', e);
    }
  }

  async findAllMuscles(): Promise<RepositoryResult<Muscle[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.MUSCLES)
        .select('*')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return ok((data as MuscleRow[]).map(toMuscle));
    } catch (e) {
      return this.handleError('findAllMuscles', e);
    }
  }

  async findAllEquipmentTypes(): Promise<RepositoryResult<EquipmentType[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.EQUIPMENT)
        .select('*')
        .order('display_name', { ascending: true });
      if (error) throw error;
      return ok((data as EquipmentTypeRow[]).map(toEquipmentType));
    } catch (e) {
      return this.handleError('findAllEquipmentTypes', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // User inventory (favorites + owned equipment)
  // ────────────────────────────────────────────────────────────────────

  async listFavorites(userId: ID): Promise<RepositoryResult<UserFavoriteExercise[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.USER_FAVORITES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ok((data as UserFavoriteRow[]).map(toFavorite));
    } catch (e) {
      return this.handleError('listFavorites', e);
    }
  }

  async addFavorite(
    userId: ID,
    dto: FavoriteCreateDTO,
  ): Promise<RepositoryResult<UserFavoriteExercise>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.USER_FAVORITES)
        .insert({ user_id: userId, exercise_id: dto.exerciseId })
        .select('*')
        .single();
      if (error) throw error;
      return ok(toFavorite(data as UserFavoriteRow));
    } catch (e) {
      return this.handleError('addFavorite', e);
    }
  }

  async removeFavorite(userId: ID, exerciseId: ID): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(ExerciseRepository.USER_FAVORITES)
        .delete()
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('removeFavorite', e);
    }
  }

  async listAvailableEquipment(
    userId: ID,
  ): Promise<RepositoryResult<UserAvailableEquipment[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.USER_EQUIPMENT)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ok((data as UserAvailableEquipmentRow[]).map(toAvailableEquipment));
    } catch (e) {
      return this.handleError('listAvailableEquipment', e);
    }
  }

  async upsertAvailableEquipment(
    userId: ID,
    dto: AvailableEquipmentCreateDTO,
  ): Promise<RepositoryResult<UserAvailableEquipment>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.USER_EQUIPMENT)
        .upsert(
          {
            user_id: userId,
            equipment_type_id: dto.equipmentTypeId,
            quantity: dto.quantity ?? 1,
            notes: dto.notes ?? null,
          },
          { onConflict: 'user_id,equipment_type_id' },
        )
        .select('*')
        .single();
      if (error) throw error;
      return ok(toAvailableEquipment(data as UserAvailableEquipmentRow));
    } catch (e) {
      return this.handleError('upsertAvailableEquipment', e);
    }
  }

  async removeAvailableEquipment(
    userId: ID,
    equipmentTypeId: ID,
  ): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(ExerciseRepository.USER_EQUIPMENT)
        .delete()
        .eq('user_id', userId)
        .eq('equipment_type_id', equipmentTypeId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('removeAvailableEquipment', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Equipment capability inventory (Phase 2)
  //
  // The capability layer is advisory: it captures the user's
  // capability selections + structured details that the
  // user_available_equipment schema can't express. On save the
  // resolver maps selections to concrete equipment slugs, looks up
  // the matching equipment_type IDs, and ADDITIVELY upserts rows in
  // user_available_equipment (ON CONFLICT DO NOTHING). Existing
  // user-managed rows (with notes or non-default quantity) are never
  // deleted or overwritten — see CLAUDE.md invariant #13.
  // ────────────────────────────────────────────────────────────────────

  async listEquipmentCapabilities(
    userId: ID,
  ): Promise<RepositoryResult<UserEquipmentCapability[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.USER_CAPABILITIES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ok(
        (data as UserEquipmentCapabilityRow[]).map(toUserEquipmentCapability),
      );
    } catch (e) {
      return this.handleError('listEquipmentCapabilities', e);
    }
  }

  /**
   * Idempotently replace the user's capability inventory. Validates the
   * selection list (unknown slugs / duplicate slugs / detail-shape
   * violations abort the save), then in sequence:
   *
   *   1. DELETE existing capability rows for this user.
   *   2. INSERT the new capability rows.
   *   3. Resolve selections → EquipmentSlug set → equipment_type IDs.
   *   4. Upsert (ON CONFLICT DO NOTHING) a row in user_available_equipment
   *      for each resolved equipment_type with default quantity=1 and
   *      null notes. Existing user-managed rows are preserved.
   *
   * The three supabase calls are not wrapped in a DB transaction
   * (supabase-js doesn't expose one over the REST API), but the
   * sequence is safe: step 1 only deletes capability rows (advisory
   * layer); step 4 only inserts user_available_equipment rows that
   * don't exist yet. A mid-sequence failure surfaces as a
   * RepositoryError; the caller can retry the whole save.
   *
   * Returns the freshly-inserted capability rows on success.
   */
  async replaceAllEquipmentCapabilities(
    userId: ID,
    selections: EquipmentCapabilitySelectionDTO[],
  ): Promise<RepositoryResult<UserEquipmentCapability[]>> {
    try {
      // Validate up front so we never write a partial state.
      const validated = validateSelections(selections as SelectedCapability[]);
      if (!validated.ok) {
        return err(validated.error, RepositoryErrorCode.VALIDATION_ERROR);
      }

      // Step 1: delete existing capability rows.
      const { error: deleteError } = await supabase
        .from(ExerciseRepository.USER_CAPABILITIES)
        .delete()
        .eq('user_id', userId);
      if (deleteError) throw deleteError;

      // Step 2: insert the new capability rows (skip the network round
      // trip entirely when the selection list is empty — the delete
      // above already produced the desired empty state).
      let newRows: UserEquipmentCapability[] = [];
      if (validated.selections.length > 0) {
        const insertRows = validated.selections.map((sel) => ({
          user_id: userId,
          capability_slug: sel.slug,
          details: sel.details ?? {},
        }));
        const { data: inserted, error: insertError } = await supabase
          .from(ExerciseRepository.USER_CAPABILITIES)
          .insert(insertRows)
          .select('*');
        if (insertError) throw insertError;
        newRows = (inserted as UserEquipmentCapabilityRow[]).map(
          toUserEquipmentCapability,
        );
      }

      // Step 3 + 4: resolve selections → equipment slugs → IDs →
      // additive upsert into user_available_equipment. Failures here
      // are logged but non-fatal — the capability rows are the source
      // of truth, and the eligibility relation is rebuildable from
      // them. Phase 3 will tighten this coupling.
      const reconcileRes = await this.reconcileAvailableEquipmentFromCapabilities(
        userId,
        validated.selections,
      );
      if (!reconcileRes.success) {
        // Don't fail the whole save — capability rows landed. The
        // eligibility relation will rebuild on the next save.
      }

      return ok(newRows);
    } catch (e) {
      return this.handleError('replaceAllEquipmentCapabilities', e);
    }
  }

  /**
   * For each resolved equipment slug, look up its equipment_type ID and
   * upsert (ON CONFLICT DO NOTHING) a default row in
   * user_available_equipment. Existing rows (with user-managed
   * quantity or notes) are never modified.
   */
  private async reconcileAvailableEquipmentFromCapabilities(
    userId: ID,
    selections: SelectedCapability[],
  ): Promise<RepositoryResult<void>> {
    try {
      const slugs = resolveCapabilitiesToEquipmentSlugs(selections);
      if (slugs.length === 0) return ok(undefined);

      const idsRes = await this.findEquipmentTypeIdsBySlug(slugs);
      if (!idsRes.success) return idsRes;
      const equipmentTypeIds = idsRes.data;
      if (equipmentTypeIds.length === 0) return ok(undefined);

      const rows = equipmentTypeIds.map((equipment_type_id) => ({
        user_id: userId,
        equipment_type_id,
        quantity: 1,
        notes: null,
      }));
      const { error } = await supabase
        .from(ExerciseRepository.USER_EQUIPMENT)
        .upsert(rows, { onConflict: 'user_id,equipment_type_id', ignoreDuplicates: true });
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('reconcileAvailableEquipmentFromCapabilities', e);
    }
  }

  private async findEquipmentTypeIdsBySlug(
    slugs: string[],
  ): Promise<RepositoryResult<ID[]>> {
    try {
      const { data, error } = await supabase
        .from(ExerciseRepository.EQUIPMENT)
        .select('id')
        .in('slug', slugs);
      if (error) throw error;
      const rows = data as Array<{ id: string }>;
      return ok(rows.map((r) => r.id));
    } catch (e) {
      return this.handleError('findEquipmentTypeIdsBySlug', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Junction helpers (private)
  // ────────────────────────────────────────────────────────────────────

  private async findExerciseIdsForMuscle(muscleId: ID): Promise<ID[]> {
    const { data, error } = await supabase
      .from(ExerciseRepository.EXERCISE_MUSCLES)
      .select('exercise_id')
      .eq('muscle_id', muscleId);
    if (error) throw error;
    return (data as Pick<ExerciseMuscleRow, 'exercise_id'>[]).map((r) => r.exercise_id);
  }

  private async findExerciseIdsForEquipment(equipmentTypeId: ID): Promise<ID[]> {
    const { data, error } = await supabase
      .from(ExerciseRepository.EXERCISE_EQUIPMENT)
      .select('exercise_id')
      .eq('equipment_type_id', equipmentTypeId);
    if (error) throw error;
    return (data as Pick<ExerciseEquipmentRow, 'exercise_id'>[]).map((r) => r.exercise_id);
  }

  private async fetchMusclesForExercise(
    exerciseId: ID,
  ): Promise<RepositoryResult<ExerciseWithRelations['muscles']>> {
    const { data, error } = await supabase
      .from(ExerciseRepository.EXERCISE_MUSCLES)
      .select(
        'is_primary, muscle:muscles(id, name, display_name, muscle_category_id, created_at)',
      )
      .eq('exercise_id', exerciseId);
    if (error) {
      return this.handleError('fetchMusclesForExercise', error);
    }
    // Supabase-js infers nested-select types loosely; cast through unknown
    // since the wire shape is well-defined by the select list above.
    const rows = data as unknown as Array<{
      is_primary: boolean;
      muscle: MuscleRow;
    }>;
    return ok(
      rows.map((r) => ({
        muscle: toMuscle(r.muscle),
        isPrimary: r.is_primary,
      })),
    );
  }

  private async fetchEquipmentForExercise(
    exerciseId: ID,
  ): Promise<RepositoryResult<ExerciseWithRelations['equipment']>> {
    const { data, error } = await supabase
      .from(ExerciseRepository.EXERCISE_EQUIPMENT)
      .select(
        'is_required, equipment_type:equipment_types(id, name, display_name, category, created_at)',
      )
      .eq('exercise_id', exerciseId);
    if (error) {
      return this.handleError('fetchEquipmentForExercise', error);
    }
    const rows = data as unknown as Array<{
      is_required: boolean;
      equipment_type: EquipmentTypeRow;
    }>;
    return ok(
      rows.map((r) => ({
        equipmentType: toEquipmentType(r.equipment_type),
        isRequired: r.is_required,
      })),
    );
  }

  private async fetchVariationsForExercise(
    exerciseId: ID,
  ): Promise<RepositoryResult<ExerciseWithRelations['variations']>> {
    const { data, error } = await supabase
      .from(ExerciseRepository.EXERCISE_VARIATIONS)
      .select(
        'variation_type, difficulty_progression, variation:exercises!exercise_variations_variation_exercise_id_fkey(id, name, description, exercise_type, difficulty_level, instructions, tips, is_system_exercise, created_by_user_id, created_at, updated_at)',
      )
      .eq('base_exercise_id', exerciseId);
    if (error) {
      return this.handleError('fetchVariationsForExercise', error);
    }
    const rows = data as unknown as Array<{
      variation_type: string | null;
      difficulty_progression: number | null;
      variation: ExerciseRow;
    }>;
    return ok(
      rows.map((r) => ({
        variation: toExercise(r.variation),
        variationType: r.variation_type,
        difficultyProgression: r.difficulty_progression,
      })),
    );
  }

  private async insertMuscleJunctions(exerciseId: ID, muscleIds: ID[]): Promise<void> {
    const rows = muscleIds.map((muscle_id, index) => ({
      exercise_id: exerciseId,
      muscle_id,
      // First muscle in the user's list is treated as primary by default;
      // the UI can refine via a separate PATCH path.
      is_primary: index === 0,
    }));
    const { error } = await supabase
      .from(ExerciseRepository.EXERCISE_MUSCLES)
      .insert(rows);
    if (error) throw error;
  }

  private async insertEquipmentJunctions(
    exerciseId: ID,
    equipmentTypeIds: ID[],
  ): Promise<void> {
    const rows = equipmentTypeIds.map((equipment_type_id) => ({
      exercise_id: exerciseId,
      equipment_type_id,
      is_required: true,
    }));
    const { error } = await supabase
      .from(ExerciseRepository.EXERCISE_EQUIPMENT)
      .insert(rows);
    if (error) throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    exerciseType: row.exercise_type,
    difficultyLevel: row.difficulty_level,
    instructions: row.instructions,
    tips: row.tips,
    isSystemExercise: row.is_system_exercise,
    createdByUserId: row.created_by_user_id,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMuscle(row: MuscleRow): Muscle {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    muscleCategoryId: row.muscle_category_id,
    slug: row.slug,
    createdAt: row.created_at,
  };
}

function toMuscleCategory(row: MuscleCategoryRow): MuscleCategory {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    slug: row.slug,
    createdAt: row.created_at,
  };
}

function toEquipmentType(row: EquipmentTypeRow): EquipmentType {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    category: row.category as EquipmentType['category'],
    slug: row.slug,
    createdAt: row.created_at,
  };
}

function toFavorite(row: UserFavoriteRow): UserFavoriteExercise {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    createdAt: row.created_at,
  };
}

function toAvailableEquipment(row: UserAvailableEquipmentRow): UserAvailableEquipment {
  return {
    id: row.id,
    userId: row.user_id,
    equipmentTypeId: row.equipment_type_id,
    quantity: row.quantity,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toUserEquipmentCapability(row: UserEquipmentCapabilityRow): UserEquipmentCapability {
  return {
    id: row.id,
    userId: row.user_id,
    capabilitySlug: row.capability_slug,
    details: row.details ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Re-export junction types for callers who want raw shape (e.g. for tests).
export type {
  ExerciseMuscle,
  ExerciseEquipment,
  ExerciseVariation,
};

// Singleton — the daily-driver access path.
export const exerciseRepository = new ExerciseRepository();
