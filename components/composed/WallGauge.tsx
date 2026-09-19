// components/composed/WallGauge.tsx
//
// THE WALL GAUGE — the wide-format pin rail (docs/architecture/
// gauge-thesis.md §8, THE RECORDS). The gauge wall's rows are wide,
// so the rail lies DOWN: a printed ruler track with ticks, the
// engaged range 0→load filled, THE PIN crossing at the load, and the
// LOAD FIGURE riding right beside the pin — the machine-decal
// honesty (rail = magnitude, digit = value) in the orientation a
// wide row can spend. Every gauge on the wall shares one ceiling, so
// the pins compare — the wall IS the ranking.
//
// The vertical PinRail stays the logger/row figure (where width is
// scarce); THIS is the wall's instrument. Same laws: proportional,
// monotone within a fixed ceiling, bodyweight parks at 0.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme, pinRatio } from '../../constants';
import { formatLoad } from './PinRail';
import type { WeightUnit } from '../../utils/weight';

export interface WallGaugeProps {
  /** The best load in kg (0/null parks the pin at 0). */
  kg: number;
  /** The wall's shared ceiling — every row passes the same value. */
  railMax: number;
  /** The figure's unit suffix + a11y words ('kg' | 'lb'). */
  unit?: WeightUnit;
  testID?: string;
}

const TRACK_H = 2;
const TICK_MINOR = 7;
const TICK_MAJOR = 12;
const PIN_W = 3;
const PIN_H = 18;

export function WallGauge({ kg, railMax, unit = 'kg', testID }: WallGaugeProps) {
  const { colors } = useAppTheme();
  const ratio = pinRatio(kg, railMax);
  const hasLoad = kg > 0;

  // The ticks — minors at eighths, majors at the quarters.
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= 8; i++) {
    const at = i / 8;
    const major = i % 2 === 0;
    ticks.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: `${at * 100}%`,
          bottom: TRACK_H,
          width: 1,
          height: major ? TICK_MAJOR : TICK_MINOR,
          backgroundColor: colors.text,
          opacity: major ? 0.4 : 0.2,
        }}
      />,
    );
  }

  // The figure rides beside the pin — flipping to the LEFT when the
  // pin travels past 70% so it never clips the column.
  const flip = ratio > 0.7;

  return (
    <View
      style={styles.hold}
      accessibilityRole="image"
      accessibilityLabel={
        hasLoad
          ? `best load ${formatLoad(kg)} ${unit === 'lb' ? 'pounds' : 'kilograms'} on a ${railMax} ${unit} scale`
          : 'no load recorded'
      }
      testID={testID}
    >
      {/* The ruler track + ticks + engaged fill + the pin. */}
      <View style={styles.trackHold}>
        <View style={[styles.track, { backgroundColor: colors.text }]} />
        {ticks}
        <View
          style={[
            styles.fill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: colors.text,
            },
          ]}
          testID={testID ? `${testID}-fill` : undefined}
        />
        <View
          style={[
            styles.pin,
            {
              left: `${ratio * 100}%`,
              backgroundColor: hasLoad ? colors.text : colors.textMuted,
            },
          ]}
          testID={testID ? `${testID}-pin` : undefined}
        />
      </View>
      {/* THE LOAD FIGURE — riding beside the pin. */}
      <View style={[styles.figureHold, flip ? { right: `${(1 - ratio) * 100}%` } : { left: `${ratio * 100}%` }]}>
        <Text style={[styles.figure, { color: colors.text }]}>
          {hasLoad ? formatLoad(kg) : 'BW'}
        </Text>
        <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hold: {
    height: 40,
    justifyContent: 'flex-end',
  },
  trackHold: {
    position: 'relative',
    height: TICK_MAJOR + TRACK_H,
    justifyContent: 'flex-end',
  },
  track: {
    height: TRACK_H,
    opacity: 0.22,
  },
  fill: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: TRACK_H + 4,
    opacity: 0.3,
  },
  pin: {
    position: 'absolute',
    bottom: 0,
    width: PIN_W,
    height: PIN_H,
    borderRadius: 1,
    marginLeft: -1,
  },
  // The figure block hangs from its anchor edge; the text rides just
  // above the track, clear of the ticks.
  figureHold: {
    position: 'absolute',
    bottom: TRACK_H + 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  figure: {
    ...theme.typography.mobileFigure,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    ...theme.typography.mobileLedger,
    fontSize: 11,
  },
});

export default WallGauge;
