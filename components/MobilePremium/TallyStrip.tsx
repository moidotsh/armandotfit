// components/MobilePremium/TallyStrip.tsx
//
// THE COUNT's signature glyph (docs/architecture/count-thesis.md §2.5):
// a sequence rendered as tally strokes — the oldest counting mark there
// is. Struck marks are solid content color (done), the NEXT mark is the
// brand color (the one orange stroke on the screen — it is about to be
// struck), ghost marks are hairline outlines (slots ahead). Marks group
// in fives: four vertical strokes, the fifth a diagonal ACROSS them —
// the diagonal IS the fifth count, so a group only crosses once its
// fifth mark is actually struck (a half-filled group shows bare
// verticals, never a premature slash).
//
//   lg  7 × 44 strokes — the count board (live session)
//   sm  4 × 22 strokes — receipt groups, settings measures, index rows
//
// The strip is DECORATION by contract: it renders no text, holds no
// interaction, and hides itself from accessibility — the ledger rows
// and counters beside it carry the same information as text (proving
// this is a design primitive, not a data viz that must be read).
//
// `animateLastStrike` strikes the most recent mark in (scaleY from its
// baseline, 120ms) on mount — the count CHANGING is the one motion this
// system allows itself. Collapses to static under reduced motion.
//
// Domain-neutral: the consumer supplies counts, not meaning.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context';
import { useReducedMotion } from '../premium/shared';

export type TallySize = 'lg' | 'sm';

export interface TallyStripProps {
  /** Completed marks — solid content color. */
  struck: number;
  /** Show the NEXT mark after the struck ones — the brand-colored stroke. */
  next?: boolean;
  /** Ghost slots after the struck/next marks (the target ceiling). Default 0. */
  ghost?: number;
  /** Stroke size. Default 'sm'. */
  size?: TallySize;
  /** Strike the most recent mark in on mount (120ms scaleY). Default false. */
  animateLastStrike?: boolean;
  testID?: string;
}

type MarkState = 'struck' | 'next' | 'ghost';

const GEOM = {
  lg: { strokeW: 7, strokeH: 44, gap: 7, groupGap: 20, diagonalW: 40, rotate: -58 },
  sm: { strokeW: 4, strokeH: 22, gap: 4, groupGap: 13, diagonalW: 21, rotate: -58 },
} as const;

interface Palette {
  struck: string;
  next: string;
  ghost: string;
}

function Mark({
  state,
  size,
  palette,
}: {
  state: MarkState;
  size: TallySize;
  palette: Palette;
}) {
  const g = GEOM[size];
  if (state === 'ghost') {
    return (
      <View
        style={{
          width: g.strokeW,
          height: g.strokeH,
          borderRadius: 1,
          borderWidth: 1,
          borderColor: palette.ghost,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: g.strokeW,
        height: g.strokeH,
        borderRadius: 1,
        backgroundColor: state === 'next' ? palette.next : palette.struck,
      }}
    />
  );
}

/** One group of up to five marks; a full group crosses with the diagonal. */
function Group({
  states,
  size,
  palette,
  strikeAnim,
  style,
}: {
  states: MarkState[];
  size: TallySize;
  palette: Palette;
  strikeAnim?: Animated.Value;
  style?: StyleProp<ViewStyle>;
}) {
  const g = GEOM[size];
  // A group only crosses when its fifth mark is STRUCK — and the
  // diagonal then renders AS the fifth stroke (four verticals + slash),
  // never as a sixth mark beside a full row.
  const isFull = states.length === 5 && states[4] === 'struck';
  const verticals = isFull ? states.slice(0, 4) : states;
  const lastIndex = verticals.length - 1;
  return (
    <View style={[styles.group, { gap: g.gap }, style]}>
      {verticals.map((state, i) => {
        const mark = <Mark state={state} size={size} palette={palette} />;
        if (strikeAnim && i === lastIndex && state === 'struck') {
          return (
            <Animated.View
              key={i}
              style={{ height: g.strokeH, transform: [{ scaleY: strikeAnim }] }}
            >
              {mark}
            </Animated.View>
          );
        }
        return <React.Fragment key={i}>{mark}</React.Fragment>;
      })}
      {isFull ? (
        <View
          style={[
            styles.diagonal,
            {
              width: g.diagonalW,
              height: g.strokeW,
              backgroundColor: palette.struck,
              transform: [{ rotate: `${g.rotate}deg` }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export function TallyStrip({
  struck,
  next = false,
  ghost = 0,
  size = 'sm',
  animateLastStrike = false,
  testID,
}: TallyStripProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const strike = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animateLastStrike || reduced) return;
    strike.setValue(0);
    const a = Animated.timing(strike, {
      toValue: 1,
      duration: 120,
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [struck, animateLastStrike, reduced, strike]);

  // Position states, 1-indexed → groups of five.
  const total = struck + (next ? 1 : 0) + ghost;
  const states: MarkState[] = [];
  for (let i = 1; i <= total; i += 1) {
    states.push(i <= struck ? 'struck' : i === struck + 1 && next ? 'next' : 'ghost');
  }
  const groups: MarkState[][] = [];
  for (let i = 0; i < states.length; i += 5) {
    groups.push(states.slice(i, i + 5));
  }
  const palette: Palette = {
    struck: colors.text,
    next: colors.brand,
    // Ghost slots are decorative by contract (the ledger carries the
    // count as text) — tertiary is the sanctioned seeable-but-quiet
    // ink for that. `border` vanishes on iron.
    ghost: colors.textColors.tertiary,
  };
  // The animated strike belongs to the group holding the LAST struck
  // mark (1-indexed position `struck`).
  const strikeGroupIndex = struck > 0 ? Math.floor((struck - 1) / 5) : -1;

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.row}
    >
      {groups.map((g, gi) => (
        <Group
          key={gi}
          states={g}
          size={size}
          palette={palette}
          strikeAnim={animateLastStrike && !reduced && gi === strikeGroupIndex ? strike : undefined}
          style={gi < groups.length - 1 ? { marginRight: GEOM[size].groupGap } : undefined}
        />
      ))}
      {groups.length === 0 ? <View style={{ height: GEOM[size].strokeH }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    marginRight: 20,
  },
  diagonal: {
    position: 'absolute',
    left: -4,
    top: '50%',
    marginTop: -2,
    borderRadius: 1,
  },
});

export default TallyStrip;
