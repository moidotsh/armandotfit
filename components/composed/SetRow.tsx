// components/composed/SetRow.tsx
// Read-only set row for the session receipt. A logged_sets row IS a
// completed set — no completion indicator. Ledger shape: mono position,
// weight × reps at ledger scale, tabular figures so the column reads
// like the logbook it is.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

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
      <Text style={[styles.times, { color: colors.textMuted }]}>×</Text>
      <Text style={[styles.reps, { color: colors.text }]}>{reps}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  setPosition: {
    ...theme.typography.mobileLedger,
    minWidth: 20,
  },
  weight: {
    ...theme.typography.mobileLedger,
    minWidth: 56,
    textAlign: 'right',
  },
  times: {
    ...theme.typography.mobileLedger,
    color: undefined,
  },
  reps: {
    ...theme.typography.mobileLedger,
  },
});

export default SetRow;
