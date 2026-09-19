// components/composed/BoardHead.tsx
//
// THE BOARD's page head (docs/architecture/board-thesis.md §3.2, §5):
// the one statement per screen (+ optional furniture whisper above,
// + optional fact line waiting outside the halo). One component so
// the hierarchy law is structural, not disciplined — a screen can't
// hand-roll a second statement or a mis-scaled fact line if it
// composes this instead.
//
//   variant 'words'  (default) — the statement in Archivo Cond 36/800
//   variant 'figure' — a FIGURE-statement in Spline at counter scale
//                      (the receipt's tonnage, the streak, the count)
//
// The whisper carries the record-orange read when it announces the
// living position (the window, the record); it stays quiet ink
// otherwise.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { GAUGE, theme } from '../../constants';

export interface BoardHeadProps {
  /** THE STATEMENT — the screen's one loud thing (sentence case). */
  statement: string;
  /** Optional testID for the statement node (probe/walker surface). */
  statementTestID?: string;
  /** One fact line beneath — waits outside the statement's halo. */
  fact?: string | null;
  /** Furniture caps above the statement (≤3 words). */
  whisper?: string | null;
  /** The whisper's read — record-orange for the living position. */
  whisperTone?: 'record' | 'quiet';
  /** Statement face: words (Archivo Cond) or figure (Spline counter). */
  variant?: 'words' | 'figure';
  /** Statement ink — the record-orange read for record figures. */
  tone?: 'ink' | 'record';
}

export function BoardHead({
  statement,
  statementTestID,
  fact = null,
  whisper = null,
  whisperTone = 'quiet',
  variant = 'words',
  tone = 'ink',
}: BoardHeadProps) {
  const { colors } = useAppTheme();
  return (
    <View>
      {whisper ? (
        <Text
          style={[
            styles.whisper,
            { color: whisperTone === 'record' ? colors.brandText : colors.textMuted },
          ]}
        >
          {whisper}
        </Text>
      ) : null}
      <Text
        testID={statementTestID}
        style={[
          variant === 'figure' ? styles.figureStatement : styles.statement,
          { color: tone === 'record' ? colors.brand : colors.text },
        ]}
        numberOfLines={2}
      >
        {statement}
      </Text>
      {fact ? (
        <Text style={[styles.fact, { color: colors.textMuted }]} numberOfLines={1}>
          {fact}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  whisper: {
    ...theme.typography.mobileEyebrow,
    marginBottom: 6,
  },
  statement: {
    ...GAUGE.statement,
  },
  figureStatement: {
    ...theme.typography.mobileCounter,
  },
  fact: {
    ...GAUGE.fact,
  },
});

export default BoardHead;
