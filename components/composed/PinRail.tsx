// components/composed/PinRail.tsx
//
// THE PIN RAIL — THE GAUGE's load figure (docs/architecture/
// gauge-thesis.md §4.3). A printed tick scale with the engaged range
// 0→load filled and THE PIN — a steel bar crossing the rail at the
// load. Vertical, so the pin travels a proportional fraction of the
// column at ANY magnitude (monotone by construction — probe it). A
// bodyweight set (≤0) parks the pin at 0 with the empty sleeve.
//
// THE RAIL CARRIES NO WORDS: the digits beside it are the number (the
// logger's 56px counter, the ledger's row figures) — the rail is pure
// magnitude, a VU meter, not a second readout. Micro-labels on the
// column proved illegible under glare and collided at the extremes;
// the accessibility label carries the exact values instead.
//
// Motion: THE PIN DROP (F3) — the pin slides to its new position and
// the engaged fill re-steps when the weight changes. Post-interactive
// only; instant under reduced motion; static in jsdom.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context';
import { RAIL_SCALE, railMaxFor, pinRatio, PIN_DROP_DURATION_MS, type RailScale } from '../../constants';
import { useReducedMotion } from '../premium/shared';
import type { WeightUnit } from '../../utils/weight';

export interface PinRailProps {
  /** The load in kg. null/0 parks the pin at 0 (the empty sleeve). */
  kg: number | null;
  scale?: RailScale;
  /** The rail's ceiling — defaults to railMaxFor(kg). Pass a shared
   * day max so multiple rails read on one scale. */
  railMax?: number;
  /** The values' unit words for the a11y read ('kg' | 'lb'). */
  unit?: WeightUnit;
  testID?: string;
  accessibilityLabel?: string;
}

/** Loads render without trailing zeros: 62.5, 60, 0 → BW. */
export function formatLoad(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) return 'BW';
  return Number.isInteger(kg) ? String(kg) : String(Math.round(kg * 100) / 100);
}

export function PinRail({
  kg,
  scale = 'row',
  railMax,
  unit = 'kg',
  testID,
  accessibilityLabel,
}: PinRailProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const geom = RAIL_SCALE[scale];
  const max = railMax ?? railMaxFor(kg);
  const ratio = pinRatio(kg, max);
  const height = geom.height;
  const railW = geom.width + geom.majorTickWidth + 2;
  const counter = scale === 'counter';

  // THE PIN DROP — one animated value drives both the pin's travel
  // and the fill's growth (both derive from the same ratio;
  // transform-only). Reduced motion and jsdom render the final state.
  const progress = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(ratio);
      return;
    }
    Animated.timing(progress, {
      toValue: ratio,
      duration: PIN_DROP_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [ratio, reduced, progress]);

  const pinBottom = (height - geom.pinHeight) * ratio;

  // The printed ticks — minors and majors (majors at the halves).
  const ticks: React.ReactNode[] = [];
  const tickCount = counter ? 16 : 8;
  for (let i = 0; i <= tickCount; i++) {
    const at = i / tickCount;
    const major = i % Math.round(tickCount / 2) === 0;
    ticks.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          bottom: Math.round(at * (height - 1)),
          right: 0,
          width: major ? geom.majorTickWidth : geom.tickWidth,
          height: 1,
          backgroundColor: colors.text,
          opacity: major ? 0.5 : 0.22,
        }}
      />,
    );
  }

  return (
    <View
      style={{ height, flexDirection: 'row', alignItems: 'flex-end' }}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ??
        (kg && kg > 0
          ? `load ${formatLoad(kg)} ${unit === 'lb' ? 'pounds' : 'kilograms'} on a ${max} ${unit} rail`
          : 'bodyweight, no load')
      }
      testID={testID}
    >
      {/* The rail itself: ticks + engaged fill + the pin. No words —
          the digits beside the rail are the number. */}
      <View style={{ height, width: railW }}>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'flex-end' }]}>{ticks}</View>
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            right: geom.majorTickWidth + 3,
            width: geom.fillWidth,
            height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
            backgroundColor: colors.text,
            opacity: 0.28,
          }}
          testID={testID ? `${testID}-fill` : undefined}
        />
        <Animated.View
          style={{
            position: 'absolute',
            bottom: reduced ? pinBottom : 0,
            right: 0,
            width: railW,
            height: geom.pinHeight,
            transform: reduced ? [] : [{ translateY: -pinBottom }],
          }}
          testID={testID ? `${testID}-pin` : undefined}
        >
          <View
            style={{
              width: railW,
              height: geom.pinHeight,
              backgroundColor: kg && kg > 0 ? colors.text : colors.textMuted,
              borderRadius: 1,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default PinRail;
