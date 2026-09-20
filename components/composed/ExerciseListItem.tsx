// components/composed/ExerciseListItem.tsx
//
// THE QUIET PAGE's library row: the exercise name at row scale and
// ONE whisper beside it — the primary muscle · the modality — the two
// facts that make a scan decide. No hairline, no trailing type column:
// air separates rows. Renders from the local catalog entry
// (SystemExerciseData — the sole display source), keyed by slug.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme, ROW_GAP,
  PRESS_DIP
} from '../../constants';
import {
  MUSCLE_DISPLAY_NAMES,
  type MuscleSlug,
  type SystemExerciseData,
} from '../../shared/exercises';

const MODALITY_LABEL: Record<NonNullable<SystemExerciseData['modality']>, string> = {
  floor: 'BW',
  dumbbell: 'DB',
  barbell: 'BB',
  machine: 'Mach',
  cable: 'Cab',
};

export interface ExerciseListItemProps {
  exercise: SystemExerciseData;
  onPress: (slug: string) => void;
  isLast?: boolean;
}

export function ExerciseListItem({ exercise, onPress }: ExerciseListItemProps) {
  const { colors } = useAppTheme();
  const muscle =
    exercise.primaryMuscles.length > 0
      ? MUSCLE_DISPLAY_NAMES[exercise.primaryMuscles[0] as MuscleSlug] ?? null
      : null;
  const modality = exercise.modality ? MODALITY_LABEL[exercise.modality] : null;
  const whisper = [muscle, modality].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => onPress(exercise.slug)}
      accessibilityRole="button"
      accessibilityLabel={whisper ? `${exercise.name} — ${whisper}` : exercise.name}
      style={({ pressed }) => [styles.row, pressed ? { opacity: PRESS_DIP } : null]}
    >
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {exercise.name}
      </Text>
      {whisper ? (
        <Text style={[styles.whisper, { color: colors.textMuted }]} numberOfLines={1}>
          {whisper}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Air separates rows inside a section (the trailing half-gap is
    // absorbed by the section's own bottom padding).
    marginBottom: ROW_GAP / 2,
  },
  name: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  whisper: {
    ...theme.typography.mobileLedger,
  },
});

export default ExerciseListItem;
