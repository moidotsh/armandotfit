// services/setupPresetCompatibility.ts
//
// Phase 6 field-level compatibility rule between a user-owned setup
// preset and an active exercise. The single pure helper here is the
// canonical contract — the picker uses it to filter the visible list
// (UX) and the store's applyPresetToDraftExercise action uses it as
// the load-bearing gate (correctness). UI bypass cannot land an
// incompatible apply because the gate is independent of the picker.
//
// Rule (per Phase 6 amended contract):
//
//   compatible iff
//     (1) preset.capabilitySlug ∈ exerciseCapabilities
//     (2) preset.gripText == null
//         OR exerciseGripOptions.includes(preset.gripText)
//     (3) preset.attachmentSlug == null
//         OR exerciseAttachmentOptions.includes(preset.attachmentSlug)
//
// Notes-only presets (gripText == null && attachmentSlug == null) are
// compatible with any capability-compatible exercise — see Phase 6
// contract amendment decision (Option A). Free-text equipment_notes
// never affects compatibility.
//
// exerciseCapabilities is computed upstream via
// capabilitiesForExercise(exerciseEquipmentSlugs) (inverse resolver
// in constants/equipmentCapabilities.ts). exerciseGripOptions and
// exerciseAttachmentOptions are the distinct non-null grip_slug /
// attachment_slug values from the exercise's exercise_grip_options
// rows (Phase 5 catalog declarations). Legacy user-saved values on a
// historical workout_session_exercises row are NOT declarations and
// do not widen compatibility.

import type { SetupPreset } from '../shared/types';

/**
 * Pure helper: is this preset compatible with the active exercise?
 *
 * Inputs:
 *   - preset                  — the user-owned preset under test.
 *   - exerciseCapabilities    — the exercise's resolved capability
 *                               slugs (from capabilitiesForExercise).
 *   - exerciseGripOptions     — distinct non-null grip_slug values
 *                               declared for the exercise in
//                               exercise_grip_options.
 *   - exerciseAttachmentOptions — distinct non-null attachment_slug
 *                                 values declared for the exercise.
 *
 * Returns true iff all three rule branches pass. Total — empty inputs
 * are allowed and produce a `false` result for any non-null structured
 * preset value (a preset can't be compatible with an exercise that
 * declares no matching options).
 */
export function isPresetCompatibleWithExercise(
  preset: Pick<SetupPreset, 'capabilitySlug' | 'gripText' | 'attachmentSlug'>,
  exerciseCapabilities: ReadonlyArray<string>,
  exerciseGripOptions: ReadonlyArray<string>,
  exerciseAttachmentOptions: ReadonlyArray<string>,
): boolean {
  // (1) Capability gate.
  if (!exerciseCapabilities.includes(preset.capabilitySlug)) return false;

  // (2) Field-level grip gate (null = no preference, passes).
  if (
    preset.gripText !== null &&
    !exerciseGripOptions.includes(preset.gripText)
  ) {
    return false;
  }

  // (3) Field-level attachment gate (null = no preference, passes).
  if (
    preset.attachmentSlug !== null &&
    !exerciseAttachmentOptions.includes(preset.attachmentSlug)
  ) {
    return false;
  }

  return true;
}
