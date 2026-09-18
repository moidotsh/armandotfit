// components/composed/WorkoutSessionItem.tsx
// Reusable ledger row for a training session (home's recent page and
// analytics history). THE COUNT read (count-thesis §7): the
// day-of-split mark leads — mono, the count in short form — the date
// is the row's voice, the window rides beside it, and the session's
// shape murmurs beneath in mono. No card — rows separate by hairline
// rules. All derived from the session at read time; nothing stored.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  /** Suppress the bottom hairline (the last row of a ledger closes clean). */
  isLast?: boolean;
}

export function WorkoutSessionItem({ session, onPress, isLast = false }: WorkoutSessionItemProps) {
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
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.mobilePremium.hairlineBorder },
        isLast ? { borderBottomWidth: 0 } : null,
        pressed ? { opacity: 0.6 } : null,
      ]}
    >
      <View style={styles.headRow}>
        <Text
          style={[styles.dayMark, { color: colors.brandText }]}
          numberOfLines={1}
          accessibilityLabel={session.splitDay != null ? `Day ${session.splitDay}` : 'Ad-hoc'}
        >
          {session.splitDay != null ? `D${session.splitDay}` : 'ADH'}
        </Text>
        <Text style={[styles.date, { color: colors.text }]} numberOfLines={1}>
          {new Date(session.startedAt).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={[styles.window, { color: colors.textMuted }]} numberOfLines={1}>
          {windowLabel}
        </Text>
      </View>
      {shape ? (
        <Text style={[styles.shape, { color: colors.textMuted }]} numberOfLines={1}>
          {shape}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  dayMark: {
    ...theme.typography.mobileEyebrow,
    minWidth: 30,
  },
  date: { ...theme.typography.mobileItemTitle, flex: 1 },
  window: {
    ...theme.typography.mobileLedger,
  },
  shape: {
    ...theme.typography.mobileMeta,
    marginTop: 3,
    marginLeft: 40,
  },
});

export default WorkoutSessionItem;
