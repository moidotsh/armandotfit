// components/composed/SetupPresetPicker.tsx
//
// Phase 6 preset picker — surfaces the user's saved equipment setups
// inline in the active-workout exercise card. The picker is a discoverable
// shortcut, not a required step: setups are optional and never alter the
// exercise, prescription, eligibility, or plan.
//
// What this component does:
//   • Filters the preset list via isPresetCompatibleWithExercise (the
//     same pure helper the store's applyPresetToDraftExercise uses).
//   • Renders a section label + concise helper text so the user knows
//     what setups are and that only compatible ones appear.
//   • Renders one chip per compatible preset, labeled with the preset's
//     label. Tapping a chip dispatches onApply(preset) — the parent
//     threads this into workoutStore.applyPresetToDraftExercise, which
//     re-checks compatibility as the load-bearing gate.
//   • When a preset has just been applied (appliedPresetId set), renders
//     a visible acknowledgement row with a Clear affordance. Clear
//     dispatches onClear — the parent patches the draft setup fields
//     back to null. No preset id is written to the draft or to history.
//   • When there are zero compatible presets, renders a compact empty
//     state that directs the user to enter setup values above (and tap
//     "Save as setup" — handled by the sibling SaveSetupCta component
//     in the same exercise card). An optional onManage link is included
//     only when the parent wires it, so the workout flow stays uncluttered.
//
// What this component does NOT do:
//   • It does not own preset state — the parent (screen) does.
//   • It does not load presets — the parent passes them in via the
//     `presets` prop. The fetch lives in useActiveSetupPresets.
//   • It does not persist anything. Persistence is the save button's
//     job, threaded through workoutStore.toLogWorkoutDTO.
//   • It does not write a preset id anywhere — the appliedPresetId is
//     purely client-side acknowledgement state owned by the parent.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FilterChip, FilterChipGroup } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { isPresetCompatibleWithExercise } from '../../services';
import type { SetupPreset } from '../../shared/types';

export interface SetupPresetPickerProps {
  /** Candidate presets (active-only list from useActiveSetupPresets). */
  presets: ReadonlyArray<SetupPreset>;
  /** Resolved capability slugs for the active exercise
   *  (capabilitiesForExercise(exerciseEquipmentSlugs)). */
  exerciseCapabilities: ReadonlyArray<string>;
  /** Distinct non-null grip_slug values declared by the exercise catalog. */
  exerciseGripOptions: ReadonlyArray<string>;
  /** Distinct non-null attachment_slug values declared by the exercise catalog. */
  exerciseAttachmentOptions: ReadonlyArray<string>;
  /** Apply dispatcher. The parent threads this into
   *  workoutStore.applyPresetToDraftExercise. */
  onApply: (preset: SetupPreset) => void;
  /**
   * Optional: id of the preset currently applied to this exercise, for
   * the visible "Applied: <label>" acknowledgement. Parent-owned
   * (screen state), never persisted to the draft or to history.
   */
  appliedPresetId?: string | null;
  /**
   * Optional: dispatched when the user taps Clear on the applied
   * acknowledgement. Parent typically patches the three setup fields
   * (grip / attachment / notes) back to null on the draft exercise.
   */
  onClear?: () => void;
  /**
   * Optional: dispatched when the user taps "Manage setups" in the
   * empty state. Parent typically routes to /setup-presets. Omit to
   * keep the workout flow uncluttered when no management surface is
   * desired inline.
   */
  onManage?: () => void;
}

export function SetupPresetPicker({
  presets,
  exerciseCapabilities,
  exerciseGripOptions,
  exerciseAttachmentOptions,
  onApply,
  appliedPresetId = null,
  onClear,
  onManage,
}: SetupPresetPickerProps) {
  const { colors } = useAppTheme();

  const compatible = presets.filter((p) =>
    isPresetCompatibleWithExercise(
      p,
      exerciseCapabilities,
      exerciseGripOptions,
      exerciseAttachmentOptions,
    ),
  );
  const applied = appliedPresetId
    ? compatible.find((p) => p.id === appliedPresetId) ??
      presets.find((p) => p.id === appliedPresetId) ??
      null
    : null;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel="Saved equipment setups"
    >
      <View style={styles.headerRow}>
        <Text
          style={[styles.label, { color: colors.textColors.tertiary }]}
        >
          Saved equipment setups
        </Text>
      </View>
      <Text style={[styles.helper, { color: colors.textColors.tertiary }]}>
        Apply your saved grip, attachment, and notes. Only compatible
        setups appear.
      </Text>

      {applied ? (
        <View
          style={[
            styles.appliedRow,
            {
              backgroundColor: `${colors.brand}14`,
              borderColor: `${colors.brand}40`,
            },
          ]}
        >
          <Text
            style={[styles.appliedLabel, { color: colors.text }]}
            numberOfLines={1}
          >
            Applied · {applied.label}
          </Text>
          {onClear ? (
            <Pressable
              onPress={onClear}
              accessibilityRole="button"
              accessibilityLabel={`Clear applied setup ${applied.label}`}
              hitSlop={6}
            >
              <Text style={[styles.clearCta, { color: colors.brand }]}>
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {compatible.length > 0 ? (
        <FilterChipGroup>
          {compatible.map((preset) => (
            <FilterChip
              key={preset.id}
              label={preset.label}
              selected={applied?.id === preset.id}
              onPress={() => onApply(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Use saved setup ${preset.label}`}
            />
          ))}
        </FilterChipGroup>
      ) : (
        <View
          style={[
            styles.emptyBox,
            {
              backgroundColor: `${colors.textSecondary}0E`,
              borderColor: colors.mobilePremium.hairlineBorder,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No saved setup fits this exercise yet. Enter your setup above
            and tap “Save as setup” to reuse it next time.
          </Text>
          {onManage ? (
            <Pressable
              onPress={onManage}
              accessibilityRole="link"
              accessibilityLabel="Manage saved setups"
              hitSlop={6}
              style={styles.emptyManageLink}
            >
              <Text style={[styles.manageLink, { color: colors.brand }]}>
                Manage setups
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  helper: {
    fontSize: 11,
    lineHeight: 14,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  appliedLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  clearCta: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  emptyText: {
    fontSize: 11,
    lineHeight: 14,
  },
  emptyManageLink: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  manageLink: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SetupPresetPicker;
