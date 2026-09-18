// components/composed/ExerciseListItem.tsx
// Reusable ledger row for an exercise in browse/picker contexts —
// hairline-separated rows on steel, not cards (rows scan faster).
// Renders from the local catalog entry (SystemExerciseData — the sole
// display source), keyed by slug. The metadata play: the meta line
// carries the PRIMARY MUSCLE + modality (the body region it trains and
// the zone of the gym it lives in), not the difficulty.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import {
  EXERCISE_TYPE_DISPLAY,
  MUSCLE_DISPLAY_NAMES,
  type MuscleSlug,
  type SystemExerciseData,
} from '../../shared/exercises';

export interface ExerciseListItemProps {
  exercise: SystemExerciseData;
  onPress: (slug: string) => void;
  isLast?: boolean;
}

export function ExerciseListItem({ exercise, onPress, isLast = false }: ExerciseListItemProps) {
  const { colors } = useAppTheme();
  const typeLabel = EXERCISE_TYPE_DISPLAY[exercise.exerciseType] ?? exercise.exerciseType;
  return (
    <Pressable
      onPress={() => onPress(exercise.slug)}
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.mobilePremium.hairlineBorder },
        isLast ? { borderBottomWidth: 0 } : null,
        pressed ? { opacity: 0.6 } : null,
      ]}
    >
      <View style={styles.main}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        {exercise.primaryMuscles.length > 0 ? (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {MUSCLE_DISPLAY_NAMES[exercise.primaryMuscles[0] as MuscleSlug] ?? ''}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.type, { color: colors.textMuted }]} numberOfLines={1}>
        {typeLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  main: {
    flex: 1,
    gap: 1,
  },
  name: { ...theme.typography.mobileItemTitle },
  meta: { ...theme.typography.mobileMeta },
  type: {
    ...theme.typography.mobileEyebrow,
  },
});

export default ExerciseListItem;
