// components/MobilePremium/Figure.tsx
//
// The figure language: one labeled value, no chrome. Where StatCard puts
// a number in a card, Figure puts a number on the paper — the receipt
// treatment for stat strips, receipt headers, and hero figures.
//
// The value rides the theme's figure tokens (mobileDisplay / mobileFigure
// / mobileLedger), so tabular figures and the declared display/mono
// faces arrive by construction — a call site cannot forget them. The
// optional label rides the eyebrow token in caps.
//
// Domain-neutral: the consumer supplies value + label and formats the
// value. No trend computation, no data fetching, no domain semantics.

import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '../../constants';
import { useAppTheme } from '../../context';

export type FigureSize = 'display' | 'md' | 'sm';
export type FigureTone = 'ink' | 'brand';
export type FigureAlign = 'left' | 'center' | 'right';

export interface FigureProps {
  /** The number. String or number — the consumer formats. */
  value: string | number;
  /** Small uppercase label under the value. */
  label?: string;
  /** Figure scale. Default 'md'. */
  size?: FigureSize;
  /** 'ink' (default) reads text color; 'brand' reads the brand slot. */
  tone?: FigureTone;
  /** Default 'left'. */
  align?: FigureAlign;
  /** Override the composed a11y label ("<value> <label>"). */
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

function valueStyleFor(size: FigureSize) {
  switch (size) {
    case 'display':
      return theme.typography.mobileDisplay;
    case 'sm':
      return theme.typography.mobileLedger;
    case 'md':
    default:
      return theme.typography.mobileFigure;
  }
}

export function Figure({
  value,
  label,
  size = 'md',
  tone = 'ink',
  align = 'left',
  accessibilityLabel,
  testID,
  style,
}: FigureProps) {
  const { colors } = useAppTheme();
  const alignment = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? (label ? `${value} ${label}` : String(value))}
      style={[styles.root, { alignItems: alignment }, style]}
    >
      <Text style={[valueStyleFor(size), { color: tone === 'brand' ? colors.brand : colors.text }]}>
        {value}
      </Text>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
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
  label: {
    ...theme.typography.mobileEyebrow,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});

export default Figure;
