// components/composed/FlipTile.tsx
//
// THE FLIP TILE — THE GAUGE's status word (docs/architecture/
// gauge-thesis.md §6, F1). Session-board statuses (NOW / NEXT /
// DONE·n) speak on a mechanical tile: when the word changes, the
// tile half-flips (rotateX, 110ms) and the word swaps at the
// midpoint — a departure board, not a fade. Post-interactive only
// (state changes are user-driven); instant under reduced motion;
// static in jsdom (the word swaps synchronously).
//
// Tones: 'ink' (the NOW plate — inverted), 'quiet' (outline), and
// 'signal' (reserved for the record/live register — used sparingly).

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme, FLIP_DURATION_MS } from '../../constants';
import { useReducedMotion } from '../premium/shared';

export type FlipTileTone = 'ink' | 'quiet' | 'signal';

export interface FlipTileProps {
  /** The word the tile shows — authored CAPS (furniture). */
  word: string;
  tone?: FlipTileTone;
  testID?: string;
  accessibilityLabel?: string;
}

export function FlipTile({
  word,
  tone = 'quiet',
  testID,
  accessibilityLabel,
}: FlipTileProps) {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(word);
  const spin = useRef(new Animated.Value(0)).current;

  // THE FLIP — plays only when the word changes (post-interactive by
  // construction: statuses change because the user logged/moved).
  // The word swaps at the midpoint; reduced motion swaps instantly.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      setShown(word);
      return;
    }
    if (word === shown) return;
    if (reduced) {
      setShown(word);
      return;
    }
    spin.setValue(0);
    const timer = setTimeout(() => setShown(word), Math.round(FLIP_DURATION_MS / 2));
    Animated.timing(spin, {
      toValue: 1,
      duration: FLIP_DURATION_MS,
      useNativeDriver: true,
    }).start();
    return () => clearTimeout(timer);
  }, [word, shown, reduced, spin]);

  // rotateX 0→90→0 through the flip: the tile turns away, the word
  // swaps at the far edge, it turns back. transform-only.
  const angle = spin.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-88deg', '0deg'],
  });

  const ink = tone === 'signal' ? colors.brand : colors.text;
  const plate =
    tone === 'ink'
      ? { backgroundColor: ink, borderColor: ink }
      : tone === 'signal'
        ? { backgroundColor: 'transparent', borderColor: ink }
        : { backgroundColor: 'transparent', borderColor: colors.text };

  return (
    <Animated.View
      style={[styles.tile, plate, { transform: [{ perspective: 200 }, { rotateX: angle }] }]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Text style={[styles.word, { color: tone === 'ink' ? colors.textOnBrand : ink }]}>
        {shown}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22,
  },
  word: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
});

export default FlipTile;
