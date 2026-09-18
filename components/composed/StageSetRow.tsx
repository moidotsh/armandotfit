// components/composed/StageSetRow.tsx
//
// A logged set on the stage: position in mono, the figure pair
// "100 × 10" in mono counter digits (the count, legible at arm's
// length through glare), and a 44px remove target. A row IS a
// completed set; there are no pending rows on the stage (the count
// board is the next set). Mode-following: the stage rides chalk or
// iron per the user's preference — the register difference is scale,
// not a second palette.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from '@tamagui/lucide-icons-2';
import { FadeIn } from '../premium/shared';
import { useAppTheme } from '../../context';
import { theme, DURATION } from '../../constants';

export interface StageSetRowProps {
  position: number;
  weight: number;
  reps: number;
  onRemove?: () => void;
  testID?: string;
}

export function StageSetRow({
  position,
  weight,
  reps,
  onRemove,
  testID,
}: StageSetRowProps) {
  const { colors } = useAppTheme();
  return (
    // The stamp: a logged row enters on a snap fade-rise — AFTER the
    // state change (post-interactive), never gating the next tap, and
    // collapsed under reduced motion.
    <FadeIn duration={DURATION.fast} y={6}>
    <View
      testID={testID}
      accessibilityLabel={`Set ${position}: ${weight} kilograms, ${reps} reps`}
      style={styles.row}
    >
      <Text style={[styles.position, { color: colors.textMuted }]}>
        {String(position).padStart(2, '0')}
      </Text>
      <Text style={[styles.figures, { color: colors.text }]}>
        {weight}
        <Text style={[styles.multiplier, { color: colors.textMuted }]}> × </Text>
        {reps}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove set ${position}`}
          hitSlop={0}
          style={({ pressed }) => [styles.remove, pressed ? { opacity: 0.6 } : null]}
          testID={`${testID ?? 'stage-set-row'}-remove`}
        >
          <X size={16} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.remove} />
      )}
    </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: 14,
  },
  position: {
    ...theme.typography.mobileLedger,
  },
  figures: {
    ...theme.typography.mobileFigure,
    flex: 1,
  },
  multiplier: {
    ...theme.typography.mobileFigure,
    fontSize: 20,
    fontWeight: '700',
  },
  remove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StageSetRow;
