// components/composed/ExerciseListItem.tsx
// Reusable list row for an exercise in browse / picker contexts. Used by
// exercise-database.tsx and by the suggested-exercises picker (when the
// user adds from a split suggestion). Wraps the name + type/difficulty
// meta pattern.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import type { Exercise } from '../../shared/types';

export interface ExerciseListItemProps {
  exercise: Pick<Exercise, 'id' | 'name' | 'exerciseType' | 'difficultyLevel'>;
  onPress: (id: string) => void;
}

export function ExerciseListItem({ exercise, onPress }: ExerciseListItemProps) {
  const { colors } = useAppTheme();
  const meta = [exercise.exerciseType, exercise.difficultyLevel]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={() => onPress(exercise.id)}
      accessibilityRole="button"
    >
      <MobileSurface padding={14}>
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
