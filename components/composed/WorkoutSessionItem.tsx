// components/composed/WorkoutSessionItem.tsx
// Reusable list row for a training session (home dashboard's recent list
// and analytics history). A receipt line: date + day-of-split on the
// title row, the session's shape (lifts · sets · tonnage) muted beneath.
// All derived from the session at read time — nothing stored.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import { formatVolume, sumVolume } from '../../services';
import type { LoggedExerciseWithSets, TrainingSession } from '../../shared/types';

export interface WorkoutSessionItemProps {
  session: Pick<TrainingSession, 'id' | 'startedAt' | 'splitDay'> & {
    /** Expanded exercises — when provided, the row shows its shape. */
    exercises?: LoggedExerciseWithSets[];
  };
  onPress: (id: string) => void;
}

export function WorkoutSessionItem({ session, onPress }: WorkoutSessionItemProps) {
  const { colors } = useAppTheme();

  // AM and PM are separate session rows; the start hour restores which
  // window this row was. 12:00 boundary — a noon session reads as PM.
  const hour = new Date(session.startedAt).getHours();
  const windowLabel = hour < 12 ? 'AM' : 'PM';

  const lifts = session.exercises?.length ?? 0;
  const setCount =
    session.exercises?.reduce((sum, e) => sum + e.sets.length, 0) ?? 0;
  const tonnage = sumVolume(session.exercises?.flatMap((e) => e.sets) ?? []);
  const shape =
    lifts > 0
      ? [`${lifts} lift${lifts === 1 ? '' : 's'}`, `${setCount} sets`, `${formatVolume(tonnage)} kg`].join(' · ')
      : null;

  return (
    <Pressable
      onPress={() => onPress(session.id)}
      accessibilityRole="button"
      accessibilityLabel={`Session ${new Date(session.startedAt).toLocaleDateString()}, ${shape ?? 'details'}`}
    >
      <MobileSurface padding={14}>
        <View style={styles.row}>
          <Text style={[styles.date, { color: colors.text }]}>
            {new Date(session.startedAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.window, { color: colors.textColors.tertiary }]}>
              {windowLabel}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {session.splitDay != null ? `Day ${session.splitDay}` : 'Ad-hoc'}
            </Text>
          </View>
        </View>
        {shape ? (
          <Text style={[styles.shape, { color: colors.textSecondary }]}>{shape}</Text>
        ) : null}
      </MobileSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: { ...theme.typography.mobileItemTitle },
  window: {
    ...theme.typography.mobileEyebrow,
  },
  meta: { ...theme.typography.mobileMeta },
  shape: {
    ...theme.typography.mobileMeta,
    marginTop: 4,
  },
});
