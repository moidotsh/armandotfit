// components/composed/SaveSetupCta.tsx
//
// Phase 6 in-workout preset-creation affordance. Renders inside the
// SetupPresetPicker chip row as a single FilterChip — one tap saves
// the current setup with an auto-generated label. No sheet, no label
// input, no second tap. Rename lives in Settings → Setup Presets.
//
// Visibility gate (load-bearing):
//   Renders ONLY when BOTH are true:
//     1. The draft exercise has at least one non-null setup value
//        (grip / attachment / notes) — there has to be something to save.
//     2. The exercise resolves to EXACTLY ONE equipment capability —
//        the in-workout flow infers the capability from context and
//        never asks the user to pick an abstract one. When the count
//        is zero or >1, this CTA stays hidden and the user falls back
//        to the Settings management flow (documented + tested).
//
// What this component does:
//   • Renders a FilterChip whose border is tinted with the brand color
//     so it reads as an action, not a selectable preset chip (selected
//     preset chips use brand-fill). The primitive is unchanged — the
//     tint is a call-site style override.
//   • On tap, calls useCreateSetupPreset.mutate with the resolved
//     capability + an auto-label built from the exercise name + the
//     draft's current grip / attachment / notes values. The mutation
//     optimistically patches both preset-list caches, so the new
//     preset appears as a chip in the same row on success.
//   • On success, calls onSaved(preset) so the parent can flip its
//     applied-preset acknowledgement state.
//
// What this component does NOT do:
//   • It does not own draft setup state — the parent passes the
//     current values in via `setupSnapshot`.
//   • It does not choose the capability — the parent passes the
//     already-resolved capability in via `resolvedCapability`.
//   • It does not write any preset id to the draft or to history.
//   • It does not offer inline rename — Settings is the rename surface.

import React from 'react';
import { StyleSheet } from 'react-native';
import { FilterChip } from '../MobilePremium';
import { useAppTheme, useToast } from '../../context';
import { useCreateSetupPreset } from '../../hooks';
import { logger } from '../../utils/logger';
import { EQUIPMENT_CAPABILITIES } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

export interface SaveSetupCtaProps {
  /**
   * The single capability resolved for this exercise, or null when
   * zero or more than one capability is in play. When null, the CTA
   * stays hidden and the user falls back to the Settings flow.
   */
  resolvedCapability: string | null;
  /** Display name of the active exercise — anchors the auto-label. */
  exerciseName: string;
  /** Current draft setup values for the active exercise. */
  setupSnapshot: {
    gripText: string | null;
    attachmentSlug: string | null;
    equipmentNotes: string | null;
  };
  /**
   * Dispatched after a successful create. Parent uses it to flip its
   * applied-preset acknowledgement state so the new preset shows as
   * Applied in the sibling picker.
   */
  onSaved: (preset: SetupPreset) => void;
  /** Optional test hook. */
  testID?: string;
}

const LABEL_MAX = 60;
const SEPARATOR = ' · ';

/**
 * buildAutoLabel — produces `<exercise> · <attachment> · <grip> · <notes>`
 * skipping any null segment, then trims to LABEL_MAX by dropping trailing
 * segments (notes first, then grip, then attachment). Exercise name is
 * always kept whole; only when it alone exceeds the budget is it
 * hard-truncated with an ellipsoid.
 */
function buildAutoLabel(
  exerciseName: string,
  setup: SaveSetupCtaProps['setupSnapshot'],
): string {
  // Order: exercise → attachment → grip → first-3-words-of-notes.
  // Attachment is the concrete equipment signal (rope vs EZ-Bar vs
  // straight-bar); grip is a modifier of the attachment; notes are
  // most trimmable.
  const notesHint = setup.equipmentNotes
    ? setup.equipmentNotes.split(/\s+/).slice(0, 3).join(' ')
    : null;
  const segments = [
    exerciseName,
    setup.attachmentSlug,
    setup.gripText,
    notesHint,
  ].filter((s): s is string => typeof s === 'string' && s.length > 0);

  if (segments.length === 0) return '';

  const full = segments.join(SEPARATOR);
  if (full.length <= LABEL_MAX) return full;

  // Drop trailing segments until it fits. Stop at segments[0] — the
  // exercise name is always preserved.
  for (let n = segments.length - 1; n > 1; n--) {
    const candidate = segments.slice(0, n).join(SEPARATOR);
    if (candidate.length <= LABEL_MAX) return candidate;
  }

  // Exercise name alone exceeds the budget — hard-truncate.
  const head = segments[0];
  return head.length > LABEL_MAX ? head.slice(0, LABEL_MAX - 1) + '…' : head;
}

export function SaveSetupCta({
  resolvedCapability,
  exerciseName,
  setupSnapshot,
  onSaved,
  testID,
}: SaveSetupCtaProps) {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const createMut = useCreateSetupPreset();

  const hasSetupValue =
    setupSnapshot.gripText !== null ||
    setupSnapshot.attachmentSlug !== null ||
    setupSnapshot.equipmentNotes !== null;
  const capabilityInfo = resolvedCapability
    ? EQUIPMENT_CAPABILITIES[resolvedCapability as keyof typeof EQUIPMENT_CAPABILITIES]
    : undefined;
  const visible =
    hasSetupValue && resolvedCapability !== null && capabilityInfo !== undefined;

  if (!visible) return null;

  const handlePress = () => {
    if (!resolvedCapability) return;
    const label = buildAutoLabel(exerciseName, setupSnapshot);
    if (!label) return;
    createMut.mutate(
      {
        dto: {
          label,
          capabilitySlug: resolvedCapability,
          gripText: setupSnapshot.gripText,
          attachmentSlug: setupSnapshot.attachmentSlug,
          equipmentNotes: setupSnapshot.equipmentNotes,
        },
      },
      {
        onSuccess: (preset) => {
          showToast('success', 'Setup saved');
          onSaved(preset);
        },
        onError: (err) => {
          logger.warn('mutations', 'save-as-setup failed:', err.message);
          showToast('error', 'Could not save setup');
        },
      },
    );
  };

  return (
    <FilterChip
      label="+ Save setup"
      selected={false}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Save setup"
      testID={testID}
      // Brand-tinted border reads as an action; the chip never enters
      // the brand-fill selected state, so it stays visually distinct
      // from selectable preset chips in the same row.
      style={[styles.chip, { borderColor: colors.brand }]}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    // Style override is border tint only; the FilterChip primitive
    // owns the rest of the chip visual (radius, padding, label).
  },
});

export default SaveSetupCta;
