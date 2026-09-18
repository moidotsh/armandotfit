// components/composed/PlateStack.tsx
//
// THE PLATE STACK — THE BOARD's load figure (docs/architecture/
// board-thesis.md §4.2). A load draws as the plates that make it:
// red 25 · blue 20 · yellow 15 · green 10 · white 5 · steel 1.25,
// greedy-decomposed on the total-load basis, each slab's width
// monotone in its kilograms. Reading a stack is preattentive — you
// do not read "100", you see two reds and a green.
//
//   counter scale (h40) — the armed logger: bar sleeve stubs flank
//     the slabs so the focal instrument reads as A BARBELL.
//   row scale (h14) — ledger rows, the home board.
//   whisper scale (h8) — compact previews.
//
// The rim law: every slab carries a 1px rim in `meter.rim` — ink on
// the white board (carries the edge for the light slabs that fail
// raw 3:1), the deep ground on the chalkboard (reads as a crisp
// edge, never a border). A bodyweight set (≤0) draws the empty
// sleeve. The drawing rounds to the nearest 1.25 kg; the digit never
// lies — call sites render the exact digit beside the stack at row
// and whisper scale.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context';
import {
  decomposeLoad,
  PLATE_DENOMINATIONS,
  PLATE_SCALE,
  type PlateScale,
} from '../../constants';

export interface PlateStackProps {
  /** The load in kilograms. null / ≤0 draws the empty sleeve. */
  kg: number | null;
  /** Drawn size — counter (the logger), row (ledgers), whisper. */
  scale?: PlateScale;
  testID?: string;
  /** Override the auto label ("100 kg" / "bodyweight"). */
  accessibilityLabel?: string;
}

export function PlateStack({
  kg,
  scale = 'row',
  testID,
  accessibilityLabel,
}: PlateStackProps) {
  const { colors } = useAppTheme();
  const { height, gap } = PLATE_SCALE[scale];
  const segments = decomposeLoad(kg ?? 0);
  const isEmpty = segments.length === 0;
  const stubWidth = scale === 'counter' ? 10 : 0;

  const autoLabel =
    kg == null || kg <= 0
      ? 'bodyweight'
      : `${Math.round(kg * 100) / 100} kilograms`;

  return (
    <View
      style={styles.row}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? autoLabel}
      testID={testID}
    >
      {stubWidth > 0 ? (
        <View
          style={[
            styles.stub,
            { width: stubWidth, height: 2, backgroundColor: colors.textMuted },
          ]}
        />
      ) : null}
      {isEmpty ? (
        // The empty sleeve: two end-caps, no slabs — bodyweight.
        <>
          <View
            style={[styles.cap, { height: Math.round(height * 0.66), borderColor: colors.textMuted }]}
            testID={testID ? `${testID}-empty` : undefined}
          />
          <View style={{ width: gap * 3 }} />
          <View
            style={[styles.cap, { height: Math.round(height * 0.66), borderColor: colors.textMuted }]}
          />
        </>
      ) : (
        segments.map((seg, i) => {
          const denom = PLATE_DENOMINATIONS.find((d) => d.kg === seg.kg);
          const width = denom ? denom.thickness[scale] : 2;
          return (
            <View
              key={`${seg.kg}-${i}`}
              style={{
                width,
                height,
                marginLeft: i === 0 ? 0 : gap,
                backgroundColor: colors.meter[seg.step],
                borderRadius: 1,
                borderWidth: 1,
                borderColor: colors.meter.rim,
              }}
              testID={testID ? `${testID}-slab-${i}` : undefined}
            />
          );
        })
      )}
      {stubWidth > 0 ? (
        <View
          style={[
            styles.stub,
            { width: stubWidth, height: 2, marginLeft: gap, backgroundColor: colors.textMuted },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stub: {
    borderRadius: 1,
  },
  cap: {
    width: 3,
    borderWidth: 1.5,
    borderRadius: 1,
  },
});

export default PlateStack;
