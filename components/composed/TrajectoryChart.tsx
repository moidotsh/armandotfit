// components/composed/TrajectoryChart.tsx
//
// THE TRAJECTORY — an exercise's progress over time (gauge-thesis
// §8, the spec sheet's chart; the owner's FitNotes-inspired ask).
// A printed line graph: top-set weight per session, date-proportional
// x, autoscaled y with mono tick labels, the polyline in ink, and
// RECORD points (the max so far) carrying the signal hue — the record
// mark's own read. Points carry tag signatures; the CALLER filters
// (include/exclude variants) and passes the surviving set.
//
// Pure SVG (react-native-svg, an existing dependency) — static,
// reduced-motion-safe by construction, jsdom-inert (the caller guards
// on data existing).

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../../context';
import { toDisplayWeight, roundDisplayWeight, type WeightUnit } from '../../utils';
import type { TrajectoryPoint } from '../../services';

export interface TrajectoryChartProps {
  /** Chronological points (already filtered to the included variants). */
  points: TrajectoryPoint[];
  unit: WeightUnit;
  testID?: string;
}

const W = 312;
const H = 140;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 18;
const PAD_B = 20;

export function TrajectoryChart({ points, unit, testID }: TrajectoryChartProps) {
  const { colors } = useAppTheme();

  const geom = useMemo(() => {
    if (points.length === 0) return null;
    const weights = points.map((p) => toDisplayWeight(p.weight, unit));
    const rawMax = Math.max(...weights);
    const rawMin = Math.min(...weights);
    // Pad the scale so a flat line doesn't sit on an edge.
    const span = Math.max(rawMax - rawMin, rawMax * 0.08, 1);
    const min = rawMin - span * 0.15;
    const max = rawMax + span * 0.15;
    const t0 = points[0].at;
    const t1 = points[points.length - 1].at;
    const tSpan = Math.max(t1 - t0, 1);
    const x = (at: number) => PAD_L + ((at - t0) / tSpan) * (W - PAD_L - PAD_R);
    const y = (w: number) => PAD_T + (1 - (w - min) / (max - min)) * (H - PAD_T - PAD_B);
    // A point is a RECORD when it equals the running max so far.
    let runningMax = -Infinity;
    const coords = points.map((p) => {
      const w = toDisplayWeight(p.weight, unit);
      const record = w > runningMax;
      if (record) runningMax = w;
      return {
        x: points.length === 1 ? W / 2 : x(p.at),
        y: y(w),
        record,
      };
    });
    return { coords, min, max };
  }, [points, unit]);

  if (!geom) return null;

  const tick = (v: number) => String(roundDisplayWeight(v));
  const dateWord = (at: number) =>
    new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="Progress over time: top set weight per session"
    >
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} testID={testID ? `${testID}-svg` : undefined}>
        {/* The printed scale — gridlines at the top, middle, floor. */}
        {[0, 0.5, 1].map((f) => {
          const gy = PAD_T + f * (H - PAD_T - PAD_B);
          return (
            <Line
              key={f}
              x1={PAD_L}
              y1={gy}
              x2={W - PAD_R}
              y2={gy}
              stroke={colors.text}
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          );
        })}
        {/* The scale's words — mono, corners, clear of the line. */}
        <SvgText x={PAD_L} y={PAD_T - 6} fill={colors.textMuted} fontSize={10} fontFamily="Martian Mono">
          {`${tick(geom.max)} ${unit}`}
        </SvgText>
        <SvgText x={W - PAD_R} y={PAD_T - 6} textAnchor="end" fill={colors.textMuted} fontSize={10} fontFamily="Martian Mono">
          {`${tick(geom.min)}`}
        </SvgText>
        <SvgText x={PAD_L} y={H - 6} fill={colors.textMuted} fontSize={10} fontFamily="Martian Mono">
          {dateWord(points[0].at)}
        </SvgText>
        <SvgText x={W - PAD_R} y={H - 6} textAnchor="end" fill={colors.textMuted} fontSize={10} fontFamily="Martian Mono">
          {dateWord(points[points.length - 1].at)}
        </SvgText>
        {/* The trajectory — one ink polyline. */}
        <Polyline
          points={geom.coords.map((c) => `${c.x},${c.y}`).join(' ')}
          fill="none"
          stroke={colors.text}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          testID={testID ? `${testID}-line` : undefined}
        />
        {/* Points: ink dots; record points carry the signal hue. */}
        {geom.coords.map((c, i) => (
          <Circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={c.record ? 3.5 : 2.5}
            fill={c.record ? colors.brand : colors.text}
            testID={testID ? `${testID}-point-${i}` : undefined}
          />
        ))}
      </Svg>
    </View>
  );
}

export default TrajectoryChart;
