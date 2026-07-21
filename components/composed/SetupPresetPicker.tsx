// components/composed/SetupPresetPicker.tsx
//
// Phase 6 preset picker — a compact row of FilterChips that lets the
// user apply one of their saved equipment-setup presets to the active
// exercise. Renders only when at least one preset is field-level
// compatible with the exercise.
//
// What this component does:
//   • Filters the preset list via isPresetCompatibleWithExercise (the
//     same pure helper the store's applyPresetToDraftExercise uses).
//   • Renders one FilterChip per compatible preset, labeled with the
//     preset's label.
//   • Calls onApply(preset) on tap — the parent threads this into
//     workoutStore.applyPresetToDraftExercise, which re-checks
//     compatibility as the load-bearing gate.
//
// What this component does NOT do:
//   • It does not own preset state — the parent (screen) does.
//   • It does not load presets — the parent passes them in via the
//     `presets` prop. The fetch lives in useActiveSetupPresets.
//   • It does not persist anything. Persistence is the save button's
//     job, threaded through workoutStore.toLogWorkoutDTO.
//   • It does not show selection state — chips are buttons (apply
//     action), not toggles.

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
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
}

export function SetupPresetPicker({
  presets,
  exerciseCapabilities,
  exerciseGripOptions,
  exerciseAttachmentOptions,
  onApply,
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

  if (compatible.length === 0) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={[styles.label, { color: colors.textColors.tertiary }]}>
        Presets
      </Text>
      <FilterChipGroup>
        {compatible.map((preset) => (
          <FilterChip
            key={preset.id}
            label={preset.label}
            selected={false}
            onPress={() => onApply(preset)}
            accessibilityRole="button"
            accessibilityLabel={`Apply preset ${preset.label}`}
          />
        ))}
      </FilterChipGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default SetupPresetPicker;
