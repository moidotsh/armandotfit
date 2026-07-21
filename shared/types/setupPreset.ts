// shared/types/setupPreset.ts
// Domain types for the user-owned equipment-setup preset layer (Phase 6).
// Mirrors the single table landed in
// supabase/migrations/20260726000000_user_equipment_setup_presets.sql:
//
//   user_equipment_setup_presets → SetupPreset
//
// A preset is a named, capability-scoped bundle of the same passive setup
// values Phase 5 captures per session-exercise (grip, attachment, equipment
// notes). Selecting a preset at session time copies its values into the
// draft exercise; nothing about the preset is referenced from history
// (workout_session_exercises has no preset_id FK — history stays immutable
// even if the preset is later retired or deleted).
//
// Owned by SetupPresetRepository (persistence) + the React Query hooks in
// hooks/queries/useSetupPresets.ts + hooks/mutations/useSetupPresetMutations.ts.
// The compatibility resolver (constants/equipmentCapabilities.ts →
// capabilitiesForExercise) is the picker's gating helper.

import type { ID, Timestamps } from './api';

// ──────────────────────────────────────────────────────────────────────
// Persisted row shape
// ──────────────────────────────────────────────────────────────────────

/**
 * Mirrors user_equipment_setup_presets. Setup-value columns (gripText,
 * attachmentSlug, equipmentNotes) are nullable TEXT — null in any column
 * means "no preference in this dimension, leave the exercise's existing
 * value alone when applied". capabilitySlug scopes the preset for picker
 * compatibility filtering.
 */
export interface SetupPreset extends Timestamps {
  id: ID;
  userId: ID;
  label: string;
  /**
   * Free-form slug matching EquipmentCapabilitySlug on the TS side.
   * Typed as string here to avoid a shared/types → constants import;
   * the repository narrows at the boundary. Mirrors the
   * UserEquipmentCapability.capabilitySlug pattern.
   */
  capabilitySlug: string;
  gripText: string | null;
  attachmentSlug: string | null;
  equipmentNotes: string | null;
  isRetired: boolean;
  retiredAt: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// DTOs (create / update)
// ──────────────────────────────────────────────────────────────────────

/**
 * Payload for creating a preset. The repository runs
 * `validateSetupPresetInput` at the boundary: label is trimmed to 1..60
 * chars, capabilitySlug must be a known EquipmentCapabilitySlug, and
 * setup-value columns are nullable TEXT (null = no preference).
 */
export interface CreateSetupPresetDTO {
  label: string;
  capabilitySlug: string;
  gripText?: string | null;
  attachmentSlug?: string | null;
  equipmentNotes?: string | null;
}

/**
 * Payload for editing an existing preset. Every field is optional —
 * the repository merges only the provided keys. capabilitySlug can be
 * changed (scope change); the picker re-evaluates compatibility on the
 * next fetch.
 */
export interface UpdateSetupPresetDTO {
  label?: string;
  capabilitySlug?: string;
  gripText?: string | null;
  attachmentSlug?: string | null;
  equipmentNotes?: string | null;
}
