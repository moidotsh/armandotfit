// utils/supabase/repositories/SetupPresetRepository.ts
// Repository over the Phase 6 user-owned equipment-setup preset layer
// (user_equipment_setup_presets, migration 20260726000000).
//
// Six public operations:
//
//   1. listActiveForUser(userId) — picker query. Hits the partial index
//      idx_user_equipment_setup_presets_user_active (WHERE is_retired=
//      FALSE). Ordered by created_at DESC so the newest presets land
//      first in the picker.
//   2. listAllForUser(userId) — management query. Includes retired
//      presets so the user can review / un-retire them. Ordered by
//      is_retired ASC then created_at DESC so active presets land first.
//   3. create(userId, CreateSetupPresetDTO) — fresh preset. Runs
//      validateSetupPresetInput at the boundary.
//   4. update(presetId, UpdateSetupPresetDTO) — edit existing. Re-runs
//      the validator on the merged shape (so a label edit doesn't bypass
//      the 1..60 char rule).
//   5. retire(presetId) — flips is_retired=TRUE + retired_at=NOW(). The
//      row stays for the management UI; the picker's partial index
//      stops returning it.
//   6. unretire(presetId) — flips is_retired=FALSE + retired_at=NULL.
//   7. delete(presetId) — hard delete. Safe because history has no FK
//      to this table (Phase 6 invariant: history is denormalized through
//      Phase 5 columns). Surfaced as a destructive secondary action in
//      the management UI.
//
// No FK from workout_session_exercises to this table by design — a
// retired or deleted preset must never make historical workout setup
// data unreadable. Selecting a preset at session time COPIES its values
// into the existing Phase 5 columns (user_grip, attachment_slug,
// user_equipment_notes) on workout_session_exercises via the store's
// setDraftExerciseSetup action.

import { supabase } from '../client';
import {
  type RepositoryResult,
  RepositoryErrorCode,
  err,
  ok,
  handleRepositoryError,
} from './types';
import { EQUIPMENT_CAPABILITY_SLUGS } from '../../../constants/equipmentCapabilities';
import type {
  ID,
  SetupPreset,
  CreateSetupPresetDTO,
  UpdateSetupPresetDTO,
} from '../../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Row shape (snake_case from DB)
// ──────────────────────────────────────────────────────────────────────

interface SetupPresetRow {
  id: string;
  user_id: string;
  label: string;
  capability_slug: string;
  grip_text: string | null;
  attachment_slug: string | null;
  equipment_notes: string | null;
  is_retired: boolean;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────

const TABLE = 'user_equipment_setup_presets';

/** Min + max label length after trimming. Mirrors the comment on the column. */
const LABEL_MIN = 1;
const LABEL_MAX = 60;

// ──────────────────────────────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────────────────────────────

export class SetupPresetRepository {
  // ──────────────────────────────────────────────────────────────────
  // Reads
  // ──────────────────────────────────────────────────────────────────

  /**
   * List active (non-retired) presets for the user. Hot path for the
   * session-time picker. Hits the partial index
   * idx_user_equipment_setup_presets_user_active.
   */
  async listActiveForUser(userId: ID): Promise<RepositoryResult<SetupPreset[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('is_retired', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ok((data as SetupPresetRow[]).map(toSetupPreset));
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.listActiveForUser', e);
    }
  }

  /**
   * List all presets for the user (active + retired). Management-UI
   * path. Active presets sort first, then by created_at DESC within
   * each group.
   */
  async listAllForUser(userId: ID): Promise<RepositoryResult<SetupPreset[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('is_retired', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ok((data as SetupPresetRow[]).map(toSetupPreset));
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.listAllForUser', e);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Writes
  // ──────────────────────────────────────────────────────────────────

  /**
   * Create a fresh preset. Runs validateSetupPresetInput at the boundary
   * so UI bypass can't land an invalid label or unknown capability slug.
   */
  async create(
    userId: ID,
    dto: CreateSetupPresetDTO,
  ): Promise<RepositoryResult<SetupPreset>> {
    const validation = validateSetupPresetInput(dto);
    if (!validation.success) return validation;
    try {
      const row = {
        user_id: userId,
        label: dto.label.trim(),
        capability_slug: dto.capabilitySlug,
        grip_text: dto.gripText ?? null,
        attachment_slug: dto.attachmentSlug ?? null,
        equipment_notes: dto.equipmentNotes ?? null,
        is_retired: false,
        retired_at: null,
      };
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select('*')
        .single();
      if (error) throw error;
      if (!data) {
        return err('Inserted preset row not returned', RepositoryErrorCode.UNKNOWN);
      }
      return ok(toSetupPreset(data as SetupPresetRow));
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.create', e);
    }
  }

  /**
   * Edit an existing preset. Merges only the provided keys (PATCH
   * semantics); re-runs the validator on the merged shape so a label
   * edit can't bypass the length rule. updated_at is bumped by the
   * trg_user_equipment_setup_presets_updated_at trigger.
   */
  async update(
    presetId: ID,
    dto: UpdateSetupPresetDTO,
  ): Promise<RepositoryResult<SetupPreset>> {
    // Fetch current row to merge against (RLS scopes to caller).
    try {
      const { data: existing, error: readError } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', presetId)
        .maybeSingle();
      if (readError) throw readError;
      if (!existing) {
        return err('Preset not found', RepositoryErrorCode.NOT_FOUND);
      }
      const merged: CreateSetupPresetDTO = {
        label: dto.label ?? (existing as SetupPresetRow).label,
        capabilitySlug:
          dto.capabilitySlug ?? (existing as SetupPresetRow).capability_slug,
        gripText:
          dto.gripText !== undefined ? dto.gripText : (existing as SetupPresetRow).grip_text,
        attachmentSlug:
          dto.attachmentSlug !== undefined
            ? dto.attachmentSlug
            : (existing as SetupPresetRow).attachment_slug,
        equipmentNotes:
          dto.equipmentNotes !== undefined
            ? dto.equipmentNotes
            : (existing as SetupPresetRow).equipment_notes,
      };
      const validation = validateSetupPresetInput(merged);
      if (!validation.success) return validation;

      const patch: Record<string, unknown> = {};
      if (dto.label !== undefined) patch.label = merged.label.trim();
      if (dto.capabilitySlug !== undefined) patch.capability_slug = merged.capabilitySlug;
      if (dto.gripText !== undefined) patch.grip_text = merged.gripText;
      if (dto.attachmentSlug !== undefined) patch.attachment_slug = merged.attachmentSlug;
      if (dto.equipmentNotes !== undefined) patch.equipment_notes = merged.equipmentNotes;
      if (Object.keys(patch).length === 0) {
        // No-op update — return the existing row.
        return ok(toSetupPreset(existing as SetupPresetRow));
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq('id', presetId)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return err('Preset not found after update', RepositoryErrorCode.NOT_FOUND);
      }
      return ok(toSetupPreset(data as SetupPresetRow));
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.update', e);
    }
  }

  /**
   * Soft-retire a preset. is_retired=TRUE + retired_at=NOW(). The row
   * stays in the table for the management UI; the picker's partial
   * index stops returning it.
   */
  async retire(presetId: ID): Promise<RepositoryResult<SetupPreset>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ is_retired: true, retired_at: new Date().toISOString() })
        .eq('id', presetId)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return err('Preset not found', RepositoryErrorCode.NOT_FOUND);
      }
      return ok(toSetupPreset(data as SetupPresetRow));
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.retire', e);
    }
  }

  /**
   * Un-retire a preset. is_retired=FALSE + retired_at=NULL.
   */
  async unretire(presetId: ID): Promise<RepositoryResult<SetupPreset>> {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ is_retired: false, retired_at: null })
        .eq('id', presetId)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return err('Preset not found', RepositoryErrorCode.NOT_FOUND);
      }
      return ok(toSetupPreset(data as SetupPresetRow));
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.unretire', e);
    }
  }

  /**
   * Hard-delete a preset. Safe because history has no FK to this table.
   * Surfaced as a destructive secondary action in the management UI.
   */
  async delete(presetId: ID): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', presetId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return handleRepositoryError('SetupPresetRepository.delete', e);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Mapper
// ──────────────────────────────────────────────────────────────────────

function toSetupPreset(row: SetupPresetRow): SetupPreset {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    capabilitySlug: row.capability_slug,
    gripText: row.grip_text,
    attachmentSlug: row.attachment_slug,
    equipmentNotes: row.equipment_notes,
    isRetired: row.is_retired,
    retiredAt: row.retired_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Boundary validator (pure function, exported for tests)
// ──────────────────────────────────────────────────────────────────────

/**
 * Validate a setup preset payload at the repository boundary. Rules:
 *
 *   1. label is trimmed and ends up 1..60 chars.
 *   2. capabilitySlug is a known EquipmentCapabilitySlug (TS union is
 *      canonical; DB stores TEXT).
 *   3. gripText / attachmentSlug / equipmentNotes are nullable TEXT;
 *      non-null values are trimmed but unconstrained (free-text).
 *
 * Returns `ok(true)` when the payload is valid; otherwise `err(...)`
 * with VALIDATION_ERROR and a message. The repository runs this at the
 * top of create() and after the merge in update() so UI bypass cannot
 * land invalid data.
 *
 * Extracted as a top-level export so tests can drive it directly
 * without mocking supabase. Mirrors the validatePlanForAdoption pattern.
 */
export function validateSetupPresetInput(
  dto: CreateSetupPresetDTO,
): RepositoryResult<true> {
  const trimmed = dto.label.trim();
  if (trimmed.length < LABEL_MIN || trimmed.length > LABEL_MAX) {
    return err(
      `Label must be ${LABEL_MIN}..${LABEL_MAX} characters (after trim).`,
      RepositoryErrorCode.VALIDATION_ERROR,
    );
  }
  const known = EQUIPMENT_CAPABILITY_SLUGS.includes(
    dto.capabilitySlug as (typeof EQUIPMENT_CAPABILITY_SLUGS)[number],
  );
  if (!known) {
    return err(
      `Unknown capability slug: ${dto.capabilitySlug}`,
      RepositoryErrorCode.VALIDATION_ERROR,
    );
  }
  return ok(true);
}

// Singleton — the daily-driver access path.
export const setupPresetRepository = new SetupPresetRepository();
