// components/composed/StageSetRow.tsx
//
// A logged set on the Floor's ledger (docs/architecture/
// board-thesis.md §7): the position figure in Spline, the LOAD
// DRAWN as a row-scale plate stack (the digit lives in the a11y
// label — the ledger audits by shape at arm's length), the reps as
// the Spline figure, and a 44px remove target. A row IS a completed
// set; there are no pending rows on the Floor (the logger arms the
// next one).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from '@tamagui/lucide-icons-2';
import { FadeIn } from '../premium/shared';
import { useAppTheme } from '../../context';
import { theme, DURATION } from '../../constants';
import { PlateStack } from './PlateStack';

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
        <View style={styles.stackHold}>
          <PlateStack kg={weight} scale="row" testID={`${testID ?? 'stage-set-row'}-stack`} />
        </View>
        <Text style={[styles.reps, { color: colors.text }]}>{reps}</Text>
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
    minHeight: 44,
    gap: 12,
  },
  position: {
    ...theme.typography.mobileLedger,
    minWidth: 20,
  },
  stackHold: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  reps: {
    ...theme.typography.mobileFigure,
    minWidth: 28,
    textAlign: 'right',
  },
  remove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StageSetRow;
