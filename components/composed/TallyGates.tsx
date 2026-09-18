// components/composed/TallyGates.tsx
//
// THE TALLY — THE BOARD's set figure (docs/architecture/
// board-thesis.md §4.3). Sets cross off like a whiteboard: verticals
// in groups of five, the fifth crossing the prior four. Done gates
// stamp solid ink; the LIVE gate breathes record-orange (the living
// pulse — static under reduced motion); gates still owed within the
// program's ask sit at 18% ink. Tally count == set count.
//
// The program draws its Rx minimum and appends gates as extra sets
// land — the caller passes `total = max(programAsk, done + (live ? 1 :
// 0))` when it wants the unstarted ghosts.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../context';
import { TALLY_SCALE, type TallyScale } from '../../constants';
import { useReducedMotion } from '../premium/shared';

export interface TallyGatesProps {
  /** Gates stamped solid (sets done). */
  done: number;
  /** Total gates to draw — the program's ask (≥ done), extended as
   * extra sets land. Ghosts beyond `done` render at 18% ink. */
  total: number;
  /** The next gate to log — breathes record-orange (the live pulse). */
  live?: boolean;
  scale?: TallyScale;
  testID?: string;
  accessibilityLabel?: string;
}

function GateGroup({
  count,
  filled,
  liveIndexInGroup,
  barWidth,
  height,
  gap,
  inkColor,
  liveColor,
  breath,
  groupId,
  testID,
}: {
  count: number;
  filled: number;
  liveIndexInGroup: number | null;
  barWidth: number;
  height: number;
  gap: number;
  inkColor: string;
  liveColor: string;
  breath: Animated.Value | null;
  groupId: number;
  testID?: string;
}) {
  const groupWidth = 4 * barWidth + 3 * gap;
  const diagonal = Math.ceil(Math.sqrt(groupWidth * groupWidth + height * height)) + 2;
  const angle = -Math.atan2(height, groupWidth) * (180 / Math.PI);
  const marks = [];
  // Up to 4 verticals per group.
  const verticals = Math.min(count, 4);
  for (let i = 0; i < verticals; i++) {
    const isLive = liveIndexInGroup === i;
    marks.push(
      <Animated.View
        key={`v-${i}`}
        style={[
          {
            width: barWidth,
            height,
            marginLeft: i === 0 ? 0 : gap,
            backgroundColor: isLive ? liveColor : inkColor,
            opacity: isLive && breath ? breath : i < filled && !isLive ? 1 : isLive ? 1 : 0.18,
            borderRadius: 1,
          },
        ]}
        testID={testID ? `${testID}-gate-${groupId * 5 + i}` : undefined}
      />,
    );
  }
  // The fifth mark is the crossing gate.
  if (count === 5) {
    const isLive = liveIndexInGroup === 4;
    marks.push(
      <Animated.View
        key="gate"
        style={[
          styles.crosserAnchor,
          {
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      >
        <Animated.View
          style={{
            width: diagonal,
            height: barWidth,
            backgroundColor: isLive ? liveColor : inkColor,
            opacity: isLive && breath ? breath : isLive ? 1 : filled >= 5 ? 1 : 0.18,
            borderRadius: 1,
          }}
          testID={testID ? `${testID}-gate-${groupId * 5 + 4}` : undefined}
        />
      </Animated.View>,
    );
  }
  return <View style={styles.group}>{marks}</View>;
}

export function TallyGates({
  done,
  total,
  live = false,
  scale = 'counter',
  testID,
  accessibilityLabel,
}: TallyGatesProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const { height, barWidth, gap } = TALLY_SCALE[scale];

  // The breath — the live gate's 2s pulse. Post-interactive-only is
  // not applicable (it is an ambient state indicator, not a response
  // to input); it stops dead under reduced motion and never blocks
  // anything (pure opacity loop).
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

  // The live gate is the (done+1)-th mark when it is within `total`.
  const liveMark = live ? done : -1;
  const groups: Array<{ count: number; from: number }> = [];
  const totalMarks = Math.max(total, live ? done + 1 : done);
  for (let from = 0; from < totalMarks; from += 5) {
    groups.push({ count: Math.min(5, totalMarks - from), from });
  }

  return (
    <View
      style={[styles.row, { height, gap: gap * 2 }]}
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ?? `${done} of ${total} sets done${live ? ', next set armed' : ''}`
      }
      testID={testID}
    >
      {groups.map((g, gi) => (
        <GateGroup
          key={gi}
          groupId={gi}
          count={g.count}
          filled={Math.max(0, Math.min(5, done - g.from))}
          liveIndexInGroup={
            liveMark >= g.from && liveMark < g.from + 5 ? liveMark - g.from : null
          }
          barWidth={barWidth}
          height={height}
          gap={gap}
          inkColor={colors.text}
          liveColor={colors.brand}
          breath={reduced || !live ? null : breath}
          testID={testID}
        />
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
    position: 'relative',
  },
  crosserAnchor: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TallyGates;
