// components/composed/SplitExerciseRow.tsx
// Read-only row that surfaces a system exercise with the attributes the
// user wants visible at split-planning time: equipment needed, primary
// muscles, target sets × rep range. Used by the split-selection preview
// and by the active-session "add from split" picker. Source data is the
// local SystemExerciseData (canonical for display); the DB row's id is
// threaded through when the user actually adds it to a draft.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import {
  formatExerciseAttributes,
  formatRepRange,
  type SystemExerciseData,
} from '../../shared/exercises';

export interface SplitExerciseRowProps {
  exercise: SystemExerciseData;
  /** Position in the day's plan (1-indexed). Shown as a leading index. */
  index?: number;
}

export function SplitExerciseRow({ exercise, index }: SplitExerciseRowProps) {
  const { colors } = useAppTheme();
  const attrs = formatExerciseAttributes(exercise);
  const setsHint = `${exercise.defaultSets} × ${formatRepRange(exercise.defaultReps)}`;
  const title = exercise.variation
    ? `${exercise.name} · ${exercise.variation}`
    : exercise.name;

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
          {setsHint}
        </Text>
      </View>
      {attrs.equipmentLabel ? (
        <Text style={[styles.attributeLine, { color: colors.textSecondary }]}>
          Equipment: {attrs.equipmentLabel}
        </Text>
      ) : null}
      {attrs.primaryMuscleLabel ? (
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
