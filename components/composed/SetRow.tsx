// components/composed/SetRow.tsx
// Reusable set row for both the live-draft workout view and the read-only
// session detail. The shape (set number · reps @ weight · completion
// indicator) is identical across both contexts; only the source type
// differs (DraftSet vs ExerciseSet). Accepts already-normalized props so
// neither context has to map into a shared type.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';

export interface SetRowProps {
  setNumber: number;
  actualReps: number | null | undefined;
  weight: number | null | undefined;
  completed: boolean;
}

export function SetRow({ setNumber, actualReps, weight, completed }: SetRowProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.setNumber, { color: colors.textSecondary }]}>
        {setNumber}
      </Text>
      <Text style={[styles.setText, { color: colors.text }]}>
        {actualReps ?? '–'} reps @ {weight ?? '–'}
      </Text>
      <Text
        style={[
          styles.setStatus,
          { color: completed ? colors.brand : colors.textSecondary },
        ]}
      >
        {completed ? '✓' : '○'}
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
  setNumber: { fontSize: 12, fontWeight: '600', minWidth: 18 },
  setText: { fontSize: 13, flex: 1 },
  setStatus: { fontSize: 14, fontWeight: '600' },
});
