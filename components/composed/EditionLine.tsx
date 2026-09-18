// components/composed/EditionLine.tsx
//
// THE QUIET PAGE's recent-edition row: one session, one whisper line
// — date · day-of-split · window · tonnage — all agate, all muted,
// separated from its neighbors by air (no rules). The full facts ride
// the accessibility label; the eye gets the one line. All derived at
// read time; nothing stored.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import { formatVolume, sumVolume } from '../../services';
import type { LoggedExerciseWithSets, TrainingSession } from '../../shared/types';

export interface EditionLineProps {
  session: Pick<TrainingSession, 'id' | 'startedAt' | 'splitDay'> & {
    /** Expanded exercises — the tonnage is computed from them. */
    exercises?: LoggedExerciseWithSets[];
  };
  onPress: (id: string) => void;
}

export function EditionLine({ session, onPress }: EditionLineProps) {
  const { colors } = useAppTheme();

  // AM and PM are separate session rows; the start hour restores which
  // window this row was. 12:00 boundary — a noon session reads as PM.
  const hour = new Date(session.startedAt).getHours();
  const windowLabel = hour < 12 ? 'AM' : 'PM';
  const date = new Date(session.startedAt).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
  });
  const tonnage = sumVolume(session.exercises?.flatMap((e) => e.sets) ?? []);

  const parts = [
    date,
    session.splitDay != null ? `D${session.splitDay}` : null,
    windowLabel,
    tonnage > 0 ? `${formatVolume(tonnage)} kg` : null,
  ].filter(Boolean);

  const line = parts.join(' · ');
  const aria = [
    new Date(session.startedAt).toLocaleDateString(),
    session.splitDay != null ? `day ${session.splitDay}` : 'ad-hoc',
    `${windowLabel} edition`,
    tonnage > 0 ? `${formatVolume(tonnage)} kilograms` : null,
  ].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={() => onPress(session.id)}
      accessibilityRole="button"
      accessibilityLabel={`Session ${aria}`}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.6 } : null]}
    >
      <Text style={[styles.line, { color: colors.textMuted }]} numberOfLines={1}>
        {line}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    justifyContent: 'center',
  },
  line: {
    ...theme.typography.mobileLedger,
  },
});

export default EditionLine;
