// components/composed/StageSetRow.tsx
//
// A logged set on the Floor's ledger (docs/architecture/
// gauge-thesis.md §8, THE FLOOR): the position figure in Martian,
// the LOAD DRAWN as a row-scale pin rail (the digit lives in the
// rail's a11y label — the ledger audits by pin position at arm's
// length), the reps as the Martian figure, and a 44px remove target.
// A row IS a completed set; there are no pending rows on the Floor
// (the logger arms the next one).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from '@tamagui/lucide-icons-2';
import { FadeIn } from '../premium/shared';
import { useAppTheme } from '../../context';
import { theme, DURATION, railMaxFor } from '../../constants';
import { PinRail } from './PinRail';

export interface StageSetRowProps {
  position: number;
  weight: number;
  reps: number;
  /** The rail's ceiling — defaults to railMaxFor(weight). Pass the
   * day's max so every row's pin reads against one scale. */
  railMax?: number;
  onRemove?: () => void;
  testID?: string;
}

export function StageSetRow({
  position,
  weight,
  reps,
  railMax,
  onRemove,
  testID,
}: StageSetRowProps) {
  const { colors } = useAppTheme();
  return (
    // The settle: a logged row enters on a snap fade-rise — AFTER the
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
        <View style={styles.railHold}>
          <PinRail
            kg={weight}
            scale="row"
            railMax={railMax ?? railMaxFor(weight)}
            testID={`${testID ?? 'stage-set-row'}-rail`}
          />
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
  railHold: {
    flex: 1,
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
