// components/composed/SetRow.tsx
// Read-only set row for the session detail view. A logged_sets row IS a
// completed set — no completion indicator. Receipt shape: position ·
// weight × reps, tabular figures so the column reads like a ledger.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';

export interface SetRowProps {
  position: number;
  reps: number;
  weight: number;
}

export function SetRow({ position, reps, weight }: SetRowProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.setPosition, { color: colors.textColors.tertiary }]}>
        {position}
      </Text>
      <Text style={[styles.weight, { color: colors.text }]}>{weight}</Text>
      <Text style={[styles.times, { color: colors.textColors.tertiary }]}>×</Text>
      <Text style={[styles.reps, { color: colors.text }]}>{reps}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 10,
  },
  setPosition: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 18,
    fontVariant: ['tabular-nums'],
  },
  weight: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 48,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  times: { fontSize: 12 },
  reps: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
