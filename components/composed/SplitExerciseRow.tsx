// components/composed/SplitExerciseRow.tsx
// Read-only row for the split-selection preview: coarse exercise name,
// programmed Rx, suggested tags, and equipment/muscle display hints from
// the local catalog. Rx comes from the PROGRAM slot (splits.ts), not the
// exercise's catalog defaults.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
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
      {attrs?.equipmentLabel ? (
        <Text style={[styles.attributeLine, { color: colors.textSecondary }]}>
          Equipment: {attrs.equipmentLabel}
        </Text>
      ) : null}
      {attrs?.primaryMuscleLabel ? (
        <Text style={[styles.attributeLine, { color: colors.textSecondary }]}>
          Primary: {attrs.primaryMuscleLabel}
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
  index: { fontSize: 13, fontWeight: '700', minWidth: 18 },
  title: { fontSize: 14, fontWeight: '600', flex: 1 },
  setsHint: { fontSize: 12, fontWeight: '500' },
  attributeLine: { fontSize: 12, lineHeight: 16, marginTop: 4 },
});
