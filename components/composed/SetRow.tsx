// components/composed/SetRow.tsx
// Read-only set row for the session receipt (docs/architecture/
// gauge-thesis.md §8, THE RECEIPT). A logged_sets row IS a completed
// set — no completion indicator. Ledger shape: the position figure
// in Martian, the LOAD DRAWN as a row-scale pin rail (the digit
// lives in the rail's a11y label), the reps figure — the same row
// the Floor's ledger reads, so the receipt audits in the exercise's
// own hand, on the session's one ceiling.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme, railMaxFor } from '../../constants';
import type { WeightUnit } from '../../utils/weight';
import { PinRail } from './PinRail';

export interface SetRowProps {
  position: number;
  reps: number;
  weight: number;
  /** The session's rail ceiling — defaults to railMaxFor(weight). */
  railMax?: number;
  /** The values' unit words for the a11y read ('kg' | 'lb'). */
  unit?: WeightUnit;
}

export function SetRow({ position, reps, weight, railMax, unit = 'kg' }: SetRowProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.setPosition, { color: colors.textMuted }]}>
        {position}
      </Text>
      <View style={styles.railHold}>
        <PinRail kg={weight} scale="row" railMax={railMax ?? railMaxFor(weight)} unit={unit} />
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
  railHold: {
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
