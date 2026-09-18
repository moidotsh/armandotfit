// components/composed/SplitExerciseRow.tsx
// Read-only row for the split-selection preview: coarse exercise name,
// programmed Rx (tabular figures, right-aligned), suggested tags, and a
// single quiet attribute line (primary muscles · equipment) from the
// local catalog. Rx comes from the PROGRAM slot (splits.ts), not the
// exercise's catalog defaults.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import {
  SYSTEM_EXERCISES_BY_SLUG,
  formatExerciseAttributes,
  type ResolvedSlot,
} from '../../shared/exercises';

export interface SplitExerciseRowProps {
  slot: ResolvedSlot;
  /** Position in the day's plan (1-indexed). Shown as a leading index. */
  index?: number;
}

function rxLabel(slot: ResolvedSlot): string {
  const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
  return `${sets} × ${slot.reps[0]}–${slot.reps[1]}`;
}

export function SplitExerciseRow({ slot, index }: SplitExerciseRowProps) {
  const { colors } = useAppTheme();
  const exercise = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
  const title = exercise?.name ?? slot.exercise;
  const attrs = exercise ? formatExerciseAttributes(exercise) : null;

  // One quiet attribute line: primary muscles, then equipment. Labels
  // would double the line count; the midline keeps the two groups apart.
  const attrParts = [
    attrs?.primaryMuscleLabel ?? null,
    attrs?.equipmentLabel ?? null,
  ].filter(Boolean) as string[];

  return (
    <MobileSurface padding={12}>
      <View style={styles.headerRow}>
        {typeof index === 'number' ? (
          <Text style={[styles.index, { color: colors.brand }]}>
            {index}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.setsHint, { color: colors.textSecondary }]}>
          {rxLabel(slot)}
        </Text>
      </View>
      {slot.suggestedTags.length > 0 ? (
        <Text style={[styles.attributeLine, { color: colors.textSecondary }]}>
          {slot.suggestedTags.join(' · ')}
        </Text>
      ) : null}
      {attrParts.length > 0 ? (
        <Text style={[styles.attributeLine, { color: colors.textColors.tertiary }]}>
          {attrParts.join(' · ')}
        </Text>
      ) : null}
    </MobileSurface>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  index: {
    ...theme.typography.mobileLedger,
    minWidth: 18,
  },
  title: { ...theme.typography.mobileItemTitle, flex: 1 },
  setsHint: { ...theme.typography.mobileLedger },
  attributeLine: { ...theme.typography.mobileMeta, marginTop: 4 },
});
