// components/composed/SetPips.tsx
//
// THE SET PIPS — THE GAUGE's set figure (docs/architecture/
// gauge-thesis.md §8, THE FLOOR). Sets count off in pip groups of
// five — the counter's own notation. Done pips stamp solid ink; the
// LIVE pip (the next to log) breathes signal (the living pulse —
// static under reduced motion); pips still owed within the program's
// ask sit at 18% ink. Pip count == set count.
//
// The program draws its Rx minimum and appends pips as extra sets
// land — the caller passes `total = max(programAsk, done + (live ? 1
// : 0))` when it wants the unstarted ghosts.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context';
import { PIP_SCALE, type PipScale } from '../../constants';
import { useReducedMotion } from '../premium/shared';

export interface SetPipsProps {
  /** Pips stamped solid (sets done). */
  done: number;
  /** Total pips to draw — the program's ask (≥ done), extended as
   * extra sets land. Ghosts beyond `done` render at 18% ink. */
  total: number;
  /** The next pip to log — breathes signal (the live pulse). */
  live?: boolean;
  scale?: PipScale;
  testID?: string;
  accessibilityLabel?: string;
}

export function SetPips({
  done,
  total,
  live = false,
  scale = 'counter',
  testID,
  accessibilityLabel,
}: SetPipsProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const { width, height, gap, groupGap, radius } = PIP_SCALE[scale];

  // The breath — the live pip's 2s pulse. An ambient state
  // indicator, not a response to input; it stops dead under reduced
  // motion (pure opacity loop, blocks nothing).
  const breath = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced || !live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 0.55, duration: 1000, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, live, breath]);

  // The live pip is the (done+1)-th when it is within `total`.
  const livePip = live ? done : -1;
  const totalPips = Math.max(total, live ? done + 1 : done);
  const groups: Array<{ count: number; from: number }> = [];
  for (let from = 0; from < totalPips; from += 5) {
    groups.push({ count: Math.min(5, totalPips - from), from });
  }

  return (
    <View
      style={[styles.row, { height, columnGap: groupGap }]}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ?? `${done} of ${total} sets done${live ? ', next set armed' : ''}`
      }
      testID={testID}
    >
      {groups.map((g, gi) => (
        <View key={gi} style={[styles.group, { columnGap: gap }]}>
          {Array.from({ length: g.count }, (_, i) => {
            const index = g.from + i;
            const isLive = index === livePip;
            return (
              <Animated.View
                key={i}
                style={{
                  width,
                  height,
                  borderRadius: radius,
                  backgroundColor: isLive ? colors.brand : colors.text,
                  opacity: isLive && breath ? breath : isLive ? 1 : index < done ? 1 : 0.18,
                }}
                testID={testID ? `${testID}-pip-${index}` : undefined}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});

export default SetPips;
