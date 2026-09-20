// components/composed/BoardHead.tsx
//
// The page head (docs/architecture/interval-thesis.md §3, §5):
// the one statement per screen (+ optional furniture whisper above,
// + optional fact line waiting outside the halo). One component so
// the hierarchy law is structural, not disciplined — a screen can't
// hand-roll a second statement or a mis-scaled fact line if it
// composes this instead.
//
//   variant 'words'  (default) — the statement in Space Grotesk 36/700
//   variant 'figure' — a FIGURE-statement in Martian at counter scale
//                      (the receipt's tonnage, the streak, the count)
//
// The whisper carries the red-ink read when it announces the living
// position (the window, the record); it stays quiet ink otherwise.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { INTERVAL, theme } from '../../constants';

export interface BoardHeadProps {
  /** THE STATEMENT — the screen's one loud thing (sentence case). */
  statement: string;
  /** Optional testID for the statement node (probe/walker surface). */
  statementTestID?: string;
  /** One fact line beneath — waits outside the statement's halo. */
  fact?: string | null;
  /** Furniture caps above the statement (≤3 words). */
  whisper?: string | null;
  /** The whisper's read — red ink for the living position. */
  whisperTone?: 'record' | 'quiet';
  /** Statement face: words (Space Grotesk) or figure (Martian counter). */
  variant?: 'words' | 'figure';
  /** Statement ink — the red-ink read for record figures. */
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
          // The record read wears brandText — the text companion — so
          // every record mark in the app speaks one red token (RegisterLine,
          // the clock, the grid's today); `brand` stays the fill slot.
          { color: tone === 'record' ? colors.brandText : colors.text },
        ]}
        numberOfLines={2}
      >
        {statement}
      </Text>
      {fact ? (
        // Wraps, never ellipsizes (the sight amendment): the fact is
        // content, and a fact line that truncates lies about the day.
        <Text style={[styles.fact, { color: colors.textMuted }]}>
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
    ...INTERVAL.statement,
  },
  figureStatement: {
    ...theme.typography.mobileCounter,
  },
  fact: {
    ...INTERVAL.fact,
  },
});

export default BoardHead;
