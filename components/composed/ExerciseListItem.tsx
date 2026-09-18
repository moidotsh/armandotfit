// components/composed/ExerciseListItem.tsx
// Reusable ledger row for an exercise in browse/picker contexts —
// hairline-separated rows on paper, not cards (the logbook read: rows
// scan faster). Renders from the local catalog entry
// (SystemExerciseData — the sole display source), keyed by slug. The
// modality reads as words, not raw slugs.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import { EXERCISE_TYPE_DISPLAY, type SystemExerciseData } from '../../shared/exercises';

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
        {exercise.difficultyLevel ? (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {exercise.difficultyLevel}
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
