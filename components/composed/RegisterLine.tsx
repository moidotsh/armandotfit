// components/composed/RegisterLine.tsx
//
// THE REGISTER LINE — the app's one repeating composition (docs/
// architecture/scoreboard-thesis.md §5): name left · leader dots ·
// figure right-aligned in mono. It replaces the panel row, the
// pin-rail row, and the pip row. One line = one entry = one fact.
//
// The leader is TYPE, not paint: a clipped run of mono middle dots
// fills whatever width sits between the name and the figure — no
// measurement, no drawing. A line without a figure carries no leader
// (nothing to lead to); the right edge stays empty.
//
// Hierarchy is ink and weight, never extra chrome: `bold` sets the
// current row (the Floor's board), `figureTone: 'record'` sets a red
// figure (a PR, the best set), `muted` quiets the line.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme, LEADER_CHAR } from '../../constants';

const LEADER_RUN = LEADER_CHAR.repeat(96);

export interface RegisterLineProps {
  /** The entry's name — content, sentence case (Space Grotesk 18). */
  label: string;
  /** The label is itself a quantity (an ordinal, a date) — set mono. */
  monoLabel?: boolean;
  /** The right-aligned mono figure (18). Null = no figure, no leader. */
  figure?: string | null;
  /** The figure's read: ink (default), muted, or record (RED INK). */
  figureTone?: 'ink' | 'muted' | 'record';
  /** The current row — full ink + 700 weight (the Floor's board). */
  bold?: boolean;
  /** Quiets the whole line (past entries). */
  muted?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  /** Optional testID for the figure node (probe surface). */
  figureTestID?: string;
}

export function RegisterLine({
  label,
  monoLabel = false,
  figure = null,
  figureTone = 'ink',
  bold = false,
  muted = false,
  onPress,
  accessibilityLabel,
  testID,
  figureTestID,
}: RegisterLineProps) {
  const { colors } = useAppTheme();
  // The ink ladder on a register: full ink for content (the default —
  // a register's entries ARE the content), muted for quiet/past rows.
  // Three inks on a screen, never more (thesis §5).
  const labelColor = muted ? colors.textMuted : colors.text;
  const figColor =
    figureTone === 'record'
      ? colors.brandText
      : muted || figureTone === 'muted'
        ? colors.textMuted
        : colors.text;

  const body = (
    <View style={styles.row}>
      <Text
        style={[
          monoLabel ? styles.labelMono : styles.label,
          { color: labelColor },
          bold ? styles.labelBold : null,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {figure != null ? (
        <>
          <Text aria-hidden style={[styles.leader, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="clip">
            {LEADER_RUN}
          </Text>
          <Text
            testID={figureTestID}
            style={[styles.figure, { color: figColor }, bold ? styles.labelBold : null]}
            numberOfLines={1}
          >
            {figure}
          </Text>
        </>
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessibilityLabel={accessibilityLabel} style={styles.staticRow}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [styles.tappableRow, pressed ? { opacity: 0.6 } : null]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  staticRow: {
    minHeight: 40,
    justifyContent: 'center',
  },
  tappableRow: {
    minHeight: 48,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...theme.typography.mobileItemTitle,
    flexShrink: 1,
  },
  // A label that is itself a quantity (an ordinal, a date) rides the
  // mono face — every quantity is mono (thesis §3.3).
  labelMono: {
    ...theme.typography.mobileFigure,
    fontWeight: '500',
    flexShrink: 1,
  },
  labelBold: {
    fontWeight: '700',
  },
  // THE LEADER — a clipped run of mono middle dots: pure type, muted,
  // whisper scale. It never carries information (aria-hidden).
  leader: {
    ...theme.typography.mobileLedger,
    flex: 1,
    letterSpacing: 2,
    opacity: 0.55,
  },
  figure: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
  },
});

export default RegisterLine;
