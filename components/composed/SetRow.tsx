// components/composed/SetRow.tsx
// Read-only set row for the session receipt (docs/architecture/
// board-thesis.md §7). A logged_sets row IS a completed set — no
// completion indicator. Ledger shape: the position figure in Spline,
// the LOAD DRAWN as a row-scale plate stack (the digit lives in the
// a11y label), the reps figure — the same row the Floor's ledger
// reads, so the receipt audits in the exercise's own hand.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';
import { PlateStack } from './PlateStack';

export interface SetRowProps {
  position: number;
  reps: number;
  weight: number;
}

export function SetRow({ position, reps, weight }: SetRowProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.setPosition, { color: colors.textMuted }]}>
        {position}
      </Text>
      <View style={styles.stackHold}>
        <PlateStack kg={weight} scale="row" />
      </View>
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
  stackHold: {
    flex: 1,
    flexDirection: 'row',
  },
  reps: {
    ...theme.typography.mobileFigure,
    minWidth: 28,
    textAlign: 'right',
  },
});

export default SetRow;
