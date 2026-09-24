// components/composed/TheCharts.tsx
// THE CHARTS ROUND (owner-sanctioned): line graphs for exercise
// progression and a donut for muscle share. The thesis's "nothing
// drawn" governs quantities on Desk surfaces (figures print, bars are
// typed glyphs); THE CHARTS are the one drawn surface — the owner
// asked for graphs and pies, and the ink law still holds: theme ink
// for the line, the meter ramp (data encoding) for the wedges, zero
// shadows, square cut everywhere else, no font literals.

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

// ── THE TREND GRAPH — one polyline, ink on the ground ─────────────────

export interface TrendPoint {
  /** Epoch ms (x). */
  at: number;
  /** The value (y) in display units. */
  value: number;
}

export interface TrendGraphProps {
  points: readonly TrendPoint[];
  /** Viewport height of the drawn graph (px). */
  height?: number;
  accessibilityLabel: string;
  testID?: string;
}

export function TrendGraph({ points, height = 88, accessibilityLabel, testID }: TrendGraphProps) {
  const { colors } = useAppTheme();
  const W = 320;
  const H = height;

  const geom = useMemo(() => {
    if (points.length < 2) return null;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pad = 6;
    const x = (i: number) => (i / (points.length - 1)) * (W - 2 * pad) + pad;
    const y = (v: number) => H - pad - ((v - min) / span) * (H - 2 * pad);
    const coords = points.map((p, i) => ({ x: x(i), y: y(p.value) }));
    return {
      line: coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' '),
      first: coords[0],
      last: coords[coords.length - 1],
    };
  }, [points, H]);

  if (!geom) return null;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.graphHold}
    >
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* The ground's hairline — the floor the values walk on. */}
        <Polyline
          points={`${6},${H - 6} ${W - 6},${H - 6}`}
          stroke={colors.mobilePremium.hairlineBorder}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <Polyline
          points={geom.line}
          fill="none"
          stroke={colors.text}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        <Circle cx={geom.first.x} cy={geom.first.y} r={2.4} fill={colors.textMuted} />
        <Circle cx={geom.last.x} cy={geom.last.y} r={3} fill={colors.text} />
      </Svg>
    </View>
  );
}

// ── THE SHARE PIE — a donut of wedges, the meter ramp as data ink ────

export interface PieSlice {
  label: string;
  /** The share (any consistent unit; rendered as %). */
  value: number;
}

export interface SharePieProps {
  slices: readonly PieSlice[];
  /** Outer diameter (px). */
  size?: number;
  testID?: string;
}

const RAMP = [
  'step1',
  'step2',
  'step3',
  'step4',
  'step5',
  'step6',
] as const;

export function SharePie({ slices, size = 128, testID }: SharePieProps) {
  const { colors } = useAppTheme();
  const meter = colors.meter as Record<(typeof RAMP)[number], string>;

  const paths = useMemo(() => {
    const total = slices.reduce((n, s) => n + s.value, 0);
    if (total <= 0) return [];
    const c = size / 2;
    const rOuter = size / 2 - 2;
    const rInner = size / 2 - 2 - Math.round(size * 0.26);
    let angle = -Math.PI / 2;
    return slices.map((s) => {
      const sweep = (s.value / total) * Math.PI * 2;
      const a0 = angle;
      const a1 = angle + sweep;
      angle = a1;
      const large = sweep > Math.PI ? 1 : 0;
      const p = (r: number, a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
      // Annulus sector: outer arc → inner edge → inner arc back.
      const d = [
        `M ${p(rOuter, a0)}`,
        `A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, a1)}`,
        `L ${p(rInner, a1)}`,
        `A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, a0)}`,
        'Z',
      ].join(' ');
      return { d, slice: s };
    });
  }, [slices, size]);

  const total = slices.reduce((n, s) => n + s.value, 0);
  if (total <= 0 || paths.length === 0) return null;
  return (
    <View style={styles.pieHold} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths.map(({ d }, i) => (
          <Path key={i} d={d} fill={meter[RAMP[i % RAMP.length]]} />
        ))}
      </Svg>
      {/* THE LEGEND — the wedge list: color chip (square cut), caps
          label, the % figure right-aligned mono. */}
      <View style={styles.legend}>
        {slices.map((s, i) => (
          <View key={s.label} style={styles.legendRow}>
            <View
              style={[styles.chip, { backgroundColor: meter[RAMP[i % RAMP.length]] }]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {s.label.toUpperCase()}
            </Text>
            <Text style={[styles.legendPct, { color: colors.text }]}>
              {`${Math.round((s.value / total) * 100)}%`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  graphHold: {
    width: '100%',
  },
  pieHold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 18,
  },
  chip: {
    width: 8,
    height: 8,
    flexShrink: 0,
  },
  legendLabel: {
    ...theme.typography.mobileEyebrow,
    flexShrink: 1,
  },
  legendPct: {
    ...theme.typography.mobileFigure,
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    flexShrink: 0,
  },
});
