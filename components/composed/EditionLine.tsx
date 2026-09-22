// components/composed/EditionLine.tsx
//
// THE QUIET PAGE's recent-edition row: one session, one whisper line
// — date · day-of-split · window · tonnage — all agate, all muted,
// separated from its neighbors by air (no rules). The full facts ride
// the accessibility label; the eye gets the one line. All derived at
// read time; nothing stored.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme,
  PRESS_DIP
} from '../../constants';
import { sumVolume } from '../../services';
import { bodyweightAsOf } from '../../utils/bodyweight';
import { useBodyweightHistory } from '../../hooks/queries';
import { SYSTEM_EXERCISES } from '../../shared/exercises';
import { useWeightUnit } from '../../hooks';
import { formatVolumeWeight, weightUnitLabel, joinFacts } from '../../utils';
import type { LoggedExerciseWithSets, TrainingSession } from '../../shared/types';

export interface EditionLineProps {
  session: Pick<TrainingSession, 'id' | 'startedAt' | 'splitDay'> & {
    /** Expanded exercises — the tonnage is computed from them. */
    exercises?: LoggedExerciseWithSets[];
  };
  onPress: (id: string) => void;
  /**
   * The archive's head: the LATEST edition keeps the secondary ink
   * (older ones whisper). Same one line, same whisper rank — the
   * sight amendment retired the row-scale lead.
   */
  lead?: boolean;
}

export function EditionLine({ session, onPress, lead = false }: EditionLineProps) {
  const { colors } = useAppTheme();
  const unit = useWeightUnit();

  // AM and PM are separate session rows; the start hour restores which
  // window this row was. 12:00 boundary — a noon session reads as PM.
  const hour = new Date(session.startedAt).getHours();
  const windowLabel = hour < 12 ? 'AM' : 'PM';
  const date = new Date(session.startedAt).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
  });
  const bodyweightQuery = useBodyweightHistory();
  const tonnage = (session.exercises ?? []).reduce((n, e) => {
    const entry = SYSTEM_EXERCISES.find(
      (sys) => sys.name === e.exerciseName,
    );
    const factor = entry?.bodyweightLoadFactor;
    const effectiveBw =
      factor != null && bodyweightQuery.data && bodyweightQuery.data.length > 0
        ? (() => {
            const bw = bodyweightAsOf(bodyweightQuery.data, session.startedAt);
            return bw != null ? factor * bw : undefined;
          })()
        : undefined;
    return n + sumVolume(e.sets ?? [], effectiveBw);
  }, 0);

  // THE ARCHIVE ROW SPLITS (the atelier pass): the identity parts
  // read left, the tonnage claims its own right-aligned post — the
  // figure is the fact that matters, and a one-string line truncates
  // the tonnage first (the figure-never-truncates law, reached here).
  const label = joinFacts([
    date,
    session.splitDay != null ? `D${session.splitDay}` : null,
    windowLabel,
  ]);
  const figure = tonnage > 0 ? formatVolumeWeight(tonnage, unit) : null;
  const aria = [
    new Date(session.startedAt).toLocaleDateString(),
    session.splitDay != null ? `day ${session.splitDay}` : 'ad-hoc',
    `${windowLabel} edition`,
    tonnage > 0 ? `${formatVolumeWeight(tonnage, unit)} ${unit === 'lb' ? 'pounds' : 'kilograms'}` : null,
  ].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={() => onPress(session.id)}
      accessibilityRole="button"
      accessibilityLabel={`Session ${aria}`}
      testID={`recent-${session.id}`}
      style={({ pressed }) => [styles.row, pressed ? { opacity: PRESS_DIP } : null]}
    >
      <View style={styles.rowLine}>
        <Text
          style={[styles.line, { color: lead ? colors.textSecondary : colors.textMuted }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {figure != null ? (
          <Text
            style={[styles.line, styles.figure, { color: lead ? colors.textSecondary : colors.textMuted }]}
          >
            {figure}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    justifyContent: 'center',
  },
  // THE ARCHIVE WHISPERS (the sight amendment): every edition line —
  // the lead included — reads at the whisper rank; the lead keeps
  // the secondary ink. The front page's loud ranks belong to the
  // plan and the verb.
  line: {
    ...theme.typography.mobileLedger,
  },
  rowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  // The figure never truncates (the sight amendment): the label yields
  // the tug-of-war, the tonnage claims its full intrinsic width.
  figure: {
    flexGrow: 0,
    flexShrink: 0,
  },
});

export default EditionLine;
