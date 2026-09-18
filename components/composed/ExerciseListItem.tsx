// components/composed/ExerciseListItem.tsx
// Reusable list row for an exercise in browse/picker contexts. Renders
// from the local catalog entry (SystemExerciseData — the sole display
// source), keyed by slug. The modality reads as words, not raw slugs.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import type { SystemExerciseData } from '../../shared/exercises';

/** exerciseType values are catalog slugs; the library shows words. */
const EXERCISE_TYPE_LABELS: Record<string, string> = {
  free_weight: 'Free weight',
  calisthenic: 'Bodyweight',
  machine: 'Machine',
  cable: 'Cable',
};

export interface ExerciseListItemProps {
  exercise: SystemExerciseData;
  onPress: (slug: string) => void;
}

export function ExerciseListItem({ exercise, onPress }: ExerciseListItemProps) {
  const { colors } = useAppTheme();
  const meta = [
    EXERCISE_TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType,
    exercise.difficultyLevel,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={() => onPress(exercise.slug)}
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
    >
      <MobileSurface padding={12}>
        <Text style={[styles.name, { color: colors.text }]}>
          {exercise.name}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {meta}
          </Text>
        ) : null}
      </MobileSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
});
