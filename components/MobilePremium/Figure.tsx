// components/MobilePremium/Figure.tsx
//
// The figure language of THE COUNT: one labeled value, no chrome (see
// docs/architecture/count-thesis.md §2.2). Where StatCard puts a
// number in a card, Figure puts a number on the field — the
// instrument read for stat strips, receipt headers, and hero figures.
// Numbers are the app's architecture, so the figure scale outranks the
// word scale at every step:
//
//   hero    76/800 display — the one hero statement per screen
//   display 44/800 display — secondary statement (receipt tonnage)
//   md      26/700 mono    — working figures (stat rows, strips)
//   sm      14/500 mono    — in-row ledger facts
//
// The value rides the theme's figure tokens, so tabular figures and the
// declared display/mono faces arrive by construction — a call site
// cannot forget them. The optional `unit` renders small and mono after
// the value (the unit whispers). The optional label rides the eyebrow
// token in caps.
//
// Domain-neutral: the consumer supplies value + label and formats the
// value. No trend computation, no data fetching, no domain semantics.

import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../../constants';
import { useAppTheme } from '../../context';

export type FigureSize = 'hero' | 'display' | 'md' | 'sm';
export type FigureTone = 'ink' | 'brand' | 'plate' | 'focus';
export type FigureAlign = 'left' | 'center' | 'right';

export interface FigureProps {
  /** The number. String or number — the consumer formats. */
  value: string | number;
  /** Small mono unit rendered after the value ("kg", "d") — it whispers. */
  unit?: string;
  /** Small uppercase label under the value. */
  label?: string;
  /** Figure scale. Default 'md'. */
  size?: FigureSize;
  /**
   * 'ink' (default) reads text color; 'brand' the brand slot; 'plate' is
   * paper-type for ink plates; 'focus' reads the focus register's text
   * color (the Floor — the live-session stage).
   */
  tone?: FigureTone;
  /** Default 'left'. */
  align?: FigureAlign;
  /** Override the composed a11y label ("<value> <unit> <label>"). */
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

function valueStyleFor(size: FigureSize) {
  switch (size) {
    case 'hero':
      return theme.typography.mobileHero;
    case 'display':
      return theme.typography.mobileDisplay;
    case 'sm':
      return theme.typography.mobileLedger;
    case 'md':
    default:
      return theme.typography.mobileFigure;
  }
}

// The whispering unit: mono, muted, sized off the value's size and
// nudged to sit on the value's baseline (flex-end + optical padding —
// RN has no reliable baseline alignment across platforms).
function unitStyleFor(size: FigureSize) {
  switch (size) {
    case 'hero':
      return { fontSize: 24, paddingBottom: 12 } as const;
    case 'display':
      return { fontSize: 17, paddingBottom: 8 } as const;
    case 'sm':
      return { fontSize: 10, paddingBottom: 1 } as const;
    case 'md':
    default:
      return { fontSize: 13, paddingBottom: 4 } as const;
  }
}

export function Figure({
  value,
  unit,
  label,
  size = 'md',
  tone = 'ink',
  align = 'left',
  accessibilityLabel,
  testID,
  style,
}: FigureProps) {
  const { colors } = useAppTheme();
  const alignment =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const valueColor =
    tone === 'brand'
      ? colors.brand
      : tone === 'plate'
        ? colors.background
        : tone === 'focus'
          ? colors.focus.text
          : colors.text;

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={
        accessibilityLabel ??
        [value, unit, label].filter(Boolean).join(' ')
      }
      style={[styles.root, { alignItems: alignment }, style]}
    >
      <View style={styles.valueRow}>
        <Text style={[valueStyleFor(size), { color: valueColor }]}>{value}</Text>
        {unit ? (
          <Text
            style={[
              styles.unit,
              unitStyleFor(size),
              {
                color:
                  tone === 'plate'
                    ? colors.brandOnInk
                    : tone === 'focus'
                      ? colors.focus.muted
                      : colors.textMuted,
              },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: tone === 'focus' ? colors.focus.muted : colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 'auto',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  unit: {
    fontWeight: '600',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0,
    marginLeft: 4,
  },
  label: {
    ...theme.typography.mobileEyebrow,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});

export default Figure;
