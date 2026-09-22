// components/composed/RegisterLine.tsx
//
// THE REGISTER LINE — the app's one repeating composition (docs/
// architecture/interval-thesis.md §2, §5): name left · air · figure
// right-aligned in mono, one shared baseline. THE AIR IS THE
// LEADER — the incumbent's dotted leader run carried no information
// (it was aria-hidden from birth) and cost a text node per row; it
// is deleted. One line = one entry = one fact.
//
// Hierarchy is ink and weight, never extra chrome: `bold` sets the
// current row (the Floor's board), `figureTone: 'record'` sets a red
// figure (a PR, the best set), `muted` quiets the line.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme,
  PRESS_DIP
} from '../../constants';

export interface RegisterLineProps {
  /** The entry's name — content, sentence case (Space Grotesk 18). */
  label: string;
  /** A muted-text prefix inside the label (the tag acronym). */
  labelMuted?: string;
  /**
   * A quantity leading the name (a date, an ordinal) — renders as its
   * own mono node so the date stops riding the word face; the name
   * itself stays Space Grotesk (thesis §3.3: words in the word face).
   */
  monoPrefix?: string | null;
  /** The label is itself a quantity (an ordinal, a date) — set mono. */
  monoLabel?: boolean;
  /** The right-aligned mono figure (18). Null = no figure. */
  figure?: string | null;
  /** The figure's read: ink (default), muted, or record (RED INK). */
  figureTone?: 'ink' | 'muted' | 'record';
  /** The label's read — 'record' sets the name in RED INK (a label
   * that IS the record figure: the spec sheet's number to beat). */
  labelTone?: 'ink' | 'record';
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
  labelMuted,
  monoPrefix = null,
  monoLabel = false,
  figure = null,
  figureTone = 'ink',
  labelTone = 'ink',
  bold = false,
  muted = false,
  onPress,
  accessibilityLabel,
  testID,
  figureTestID,
}: RegisterLineProps) {
  const { colors } = useAppTheme();
  const mutedLabelColor = colors.textMuted;
  // The ink ladder on a register: full ink for content (the default —
  // a register's entries ARE the content), muted for quiet/past rows.
  // Three inks on a screen, never more (thesis §5).
  const labelColor =
    labelTone === 'record'
      ? colors.brandText
      : muted
        ? colors.textMuted
        : colors.text;
  const figColor =
    figureTone === 'record'
      ? colors.brandText
      : muted || figureTone === 'muted'
        ? colors.textMuted
        : colors.text;

  const body = (
    <View style={styles.row}>
      {monoPrefix != null ? (
        <Text style={[styles.labelMonoPrefix, { color: labelColor }]} numberOfLines={1}>
          {monoPrefix}
        </Text>
      ) : null}
      <Text
        style={[
          monoLabel ? styles.labelMono : styles.label,
          { color: labelColor },
          bold ? styles.labelBold : null,
        ]}
        numberOfLines={1}
      >
        {labelMuted ? (
          <Text style={{ color: mutedLabelColor }}>{labelMuted} </Text>
        ) : null}
        {label}
      </Text>
      {figure != null ? (
        <Text
          testID={figureTestID}
          style={[styles.figure, { color: figColor }, bold ? styles.labelBold : null]}
          numberOfLines={1}
        >
          {figure}
        </Text>
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
      style={({ pressed }) => [styles.tappableRow, pressed ? { opacity: PRESS_DIP } : null]}
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
  // THE AIR IS THE LEADER: name left, figure right, and the column's
  // own air between them — no dots, no rules, no drawing.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
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
  // The quantity PREFIX (a date leading a name) — figure rank, mono
  // face, never shrunk out of its print.
  labelMonoPrefix: {
    ...theme.typography.mobileFigure,
    fontWeight: '500',
    flexShrink: 0,
  },
  labelBold: {
    fontWeight: '700',
  },
  figure: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    // THE FIGURE NEVER TRUNCATES (the sight amendment): a figure that
    // reads `…` is a broken figure — the name (flexShrink 1) loses
    // the tug-of-war; the figure claims its full intrinsic width.
    flexGrow: 0,
    flexShrink: 0,
  },
});

export default RegisterLine;
