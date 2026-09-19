// components/composed/RollingCounter.tsx
//
// THE ROLLING COUNTER — THE GAUGE's odometer (docs/architecture/
// gauge-thesis.md §6, F2). The logger's armed figures (weight, reps)
// speak as mechanical digit columns: when the USER changes a value,
// each changed digit column rolls to its new position (translateY,
// 140ms). Time-driven figures never animate (the elapsed clock ticks
// as static text) — the roll is a response to input, not to time.
// Reduced motion and jsdom render the final digits synchronously.
//
// Non-digit characters (., :, ×, —) render as static separators
// between rolling columns.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { theme, ROLL_DURATION_MS } from '../../constants';
import { useReducedMotion } from '../premium/shared';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export interface RollingCounterProps {
  /** The value as text — digits roll, other characters separate. */
  value: string;
  testID?: string;
  accessibilityLabel?: string;
}

function DigitColumn({
  digit,
  lineH,
  reduced,
  testID,
}: {
  digit: string;
  lineH: number;
  reduced: boolean;
  testID?: string;
}) {
  const to = DIGITS.indexOf(digit);
  const y = useRef(new Animated.Value(to < 0 ? 0 : to)).current;
  useEffect(() => {
    if (reduced) {
      y.setValue(to < 0 ? 0 : to);
      return;
    }
    Animated.timing(y, {
      toValue: to < 0 ? 0 : to,
      duration: ROLL_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [to, reduced, y]);

  return (
    <View style={{ height: lineH, overflow: 'hidden', width: undefined }} testID={testID}>
      <Animated.View style={reduced ? undefined : { transform: [{ translateY: y.interpolate({ inputRange: [0, 9], outputRange: [0, -9 * lineH] }) }] }}>
        {DIGITS.map((d) => (
          <Text key={d} style={[styles.digit, { height: lineH, lineHeight: lineH }]}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export function RollingCounter({
  value,
  testID,
  accessibilityLabel,
}: RollingCounterProps) {
  const reduced = useReducedMotion();
  const lineH = theme.typography.mobileCounter.lineHeight;

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? value}
      testID={testID}
    >
      {value.split('').map((ch, i) =>
        DIGITS.includes(ch) ? (
          <DigitColumn
            key={`${i}-${ch}`}
            digit={ch}
            lineH={lineH}
            reduced={reduced}
            testID={testID ? `${testID}-digit-${i}` : undefined}
          />
        ) : (
          <Text key={`${i}-${ch}`} style={[styles.digit, { height: lineH, lineHeight: lineH }]}>
            {ch}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  digit: {
    ...theme.typography.mobileCounter,
    textAlign: 'center',
  },
});

export default RollingCounter;
