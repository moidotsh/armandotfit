// components/composed/SetRow.tsx
// Read-only set row for the session detail view. A logged_sets row IS a
// completed set — no completion indicator. Shape: position · reps × weight.

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
      <Text style={[styles.setPosition, { color: colors.textSecondary }]}>
        {position}
      </Text>
      <Text style={[styles.setText, { color: colors.text }]}>
        {reps} reps @ {weight}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  setPosition: { fontSize: 12, fontWeight: '600', minWidth: 18 },
  setText: { fontSize: 13, flex: 1 },
});
