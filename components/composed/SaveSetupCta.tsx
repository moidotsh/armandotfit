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
//   • Fork-or-update detection: on tap, checks the user's active
//     presets for an exact capability + attachment + grip match. When
//     exactly one match exists, an inline two-row expansion offers
//     "Update <label>" or "Save as new" — no sheet, no navigation.
//     When zero or >1 match, the chip falls through to the original
//     one-tap create-new path. Notes are deliberately excluded from
//     the match key (free-form, would cause false negatives).
//   • On create-new success (no-match path AND Save-as-new path),
//     the success toast carries a "Rename" action that navigates to
//     Settings → Setup Presets. The Update success toast does NOT
//     carry the action — the label is already known-good.
//   • On success, calls onSaved(preset) so the parent can flip its
//     applied-preset acknowledgement state.
//
// What this component does NOT do:
//   • It does not own draft setup state — the parent passes the
//     current values in via `setupSnapshot`.
//   • It does not choose the capability — the parent passes the
//     already-resolved capability in via `resolvedCapability`.
//   • It does not write any preset id to the draft or to history.
//   • It does not offer inline rename — Settings is the rename surface
//     (the toast's Rename action navigates there; deep-link to edit
//     mode is deferred).

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterChip } from '../MobilePremium';
import { useAppTheme, useToast } from '../../context';
import { useActiveSetupPresets, useCreateSetupPreset, useUpdateSetupPreset } from '../../hooks';
import { navigateToSetupPresets } from '../../navigation';
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
   * Dispatched after a successful create or update. Parent uses it to
   * flip its applied-preset acknowledgement state so the preset shows
   * as Applied in the sibling picker.
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

/**
 * findExactMatch — scans active presets for the unique preset whose
 * capability + attachment + grip all equal the snapshot. Notes are
 * deliberately excluded (free-form, would cause false negatives).
 *
 * Returns undefined when zero or more than one preset matches. The
 * >1 case is degenerate (two presets indistinguishable on the match
 * key) — we fall through to create-new rather than guess which to
 * update. The user can resolve the ambiguity by retiring one of the
 * duplicates in Settings.
 */
function findExactMatch(
  presets: ReadonlyArray<SetupPreset> | undefined,
  capability: string,
  setup: SaveSetupCtaProps['setupSnapshot'],
): SetupPreset | undefined {
  if (!presets) return undefined;
  const matches = presets.filter(
    (p) =>
      p.capabilitySlug === capability &&
      p.attachmentSlug === setup.attachmentSlug &&
      p.gripText === setup.gripText,
  );
  return matches.length === 1 ? matches[0] : undefined;
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
  const updateMut = useUpdateSetupPreset();
  const activePresetsQuery = useActiveSetupPresets();
  const [forkOrUpdateVisible, setForkOrUpdateVisible] = useState(false);

  const hasSetupValue =
    setupSnapshot.gripText !== null ||
    setupSnapshot.attachmentSlug !== null ||
    setupSnapshot.equipmentNotes !== null;
  const capabilityInfo = resolvedCapability
    ? EQUIPMENT_CAPABILITIES[resolvedCapability as keyof typeof EQUIPMENT_CAPABILITIES]
    : undefined;
  const visible =
    hasSetupValue && resolvedCapability !== null && capabilityInfo !== undefined;

  // Match detection runs against the active presets list. The query
  // is the same React Query key the parent SetupPresetPicker uses,
  // so this subscription is deduped — no extra network round-trip.
  const existingMatch =
    visible && resolvedCapability
      ? findExactMatch(activePresetsQuery.data as SetupPreset[] | undefined, resolvedCapability, setupSnapshot)
      : undefined;

  if (!visible) return null;

  const dismissExpansion = () => setForkOrUpdateVisible(false);

  const dispatchCreate = () => {
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
          // Dismiss the expansion (no-op when called from the
          // no-match path, where it's already hidden). On the
          // Save-as-new path, this prevents the chip from re-anchoring
          // the now-stale expansion onto the freshly-created preset.
          dismissExpansion();
          showToast('success', 'Setup saved', {
            action: {
              label: 'Rename',
              onPress: () => navigateToSetupPresets(),
            },
          });
          onSaved(preset);
        },
        onError: (err) => {
          logger.warn('mutations', 'save-as-setup failed:', err.message);
          showToast('error', 'Could not save setup');
        },
      },
    );
  };

  const dispatchUpdate = () => {
    if (!existingMatch) return;
    updateMut.mutate(
      {
        presetId: existingMatch.id,
        dto: {
          gripText: setupSnapshot.gripText,
          attachmentSlug: setupSnapshot.attachmentSlug,
          equipmentNotes: setupSnapshot.equipmentNotes,
        },
      },
      {
        onSuccess: (preset) => {
          showToast('success', 'Setup updated');
          dismissExpansion();
          onSaved(preset);
        },
        onError: (err) => {
          logger.warn('mutations', 'update-setup failed:', err.message);
          showToast('error', 'Could not update setup');
        },
      },
    );
  };

  const handlePress = () => {
    // Toggle: tapping the chip when the expansion is already open
    // dismisses it. Matches user expectation for an inline disclosure.
    if (forkOrUpdateVisible) {
      dismissExpansion();
      return;
    }
    if (existingMatch) {
      setForkOrUpdateVisible(true);
      return;
    }
    dispatchCreate();
  };

  return (
    <View style={styles.wrapper}>
      <FilterChip
        label="+ Save setup"
        selected={forkOrUpdateVisible}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Save setup"
        testID={testID}
        // Brand-tinted border reads as an action; the chip never enters
        // the brand-fill selected state, so it stays visually distinct
        // from selectable preset chips in the same row. `selected` is
        // used here only to track the disclosure's open state for the
        // primitive's pressed visuals — the brand-tint border override
        // below keeps it visually distinct from real selected preset
        // chips regardless of the selected flag.
        style={[styles.chip, { borderColor: colors.brand }]}
      />

      {forkOrUpdateVisible && existingMatch ? (
        <View
          style={[
            styles.expansion,
            {
              backgroundColor: colors.card,
              borderColor: colors.mobilePremium.hairlineBorder,
            },
          ]}
        >
          <Pressable
            onPress={dispatchUpdate}
            style={({ pressed }) => [
              styles.expansionRow,
              pressed && { backgroundColor: `${colors.brand}14` },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Update ${existingMatch.label}`}
            hitSlop={4}
          >
            <Text
              style={[styles.expansionText, { color: colors.text }]}
              numberOfLines={1}
            >
              {`Update ${existingMatch.label}`}
            </Text>
          </Pressable>
          <View style={[styles.expansionDivider, { backgroundColor: colors.mobilePremium.hairlineBorder }]} />
          <Pressable
            onPress={dispatchCreate}
            style={({ pressed }) => [
              styles.expansionRow,
              pressed && { backgroundColor: `${colors.brand}14` },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save as new setup"
            hitSlop={4}
          >
            <Text style={[styles.expansionText, { color: colors.text }]} numberOfLines={1}>
              Save as new
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Wrapper lets the expansion hang below the chip without
    // disturbing the FilterChipGroup's row layout for sibling
    // preset chips. The chip stays a single flex item in the row;
    // the expansion is a sibling View inside the wrapper that
    // grows downward.
  },
  chip: {
    // Style override is border tint only; the FilterChip primitive
    // owns the rest of the chip visual (radius, padding, label).
  },
  expansion: {
    // The expansion sits below the chip, full-width of the wrapper,
    // so the Update / Save-as-new rows stack cleanly. Width grows
    // with the longest row ("Update <label>") up to the card width.
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  expansionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  expansionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  expansionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
  },
});

export default SaveSetupCta;
