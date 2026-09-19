// components/composed/SessionStrip.tsx
//
// THE TICKER (board-thesis §7): while a session runs, a slim plate
// pins under every Desk header — LIVE pulse (the living breath, in
// record-orange) · the running elapsed figure in Spline · the current
// station · RETURN →. One tap goes back to the Floor, from anywhere.
// The session never hides and never falls out of the thumb arc; this
// is what replaces the tab bar's center action when the bar itself
// is gone.
//
// The strip reads the workout store directly — no prop threading from
// every screen. It follows the mode like every board surface (the
// wire register stays reserved for interrupts: the chit and the
// curtain).

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { useNowTick } from '../../hooks';
import { useWorkoutStore } from '../../stores';
import { replaceWithWorkoutDetail } from '../../navigation';
import { theme } from '../../constants';
import { formatElapsed } from '../../services';
import { useReducedMotion } from '../premium/shared';

export function SessionStrip() {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const startedAt = useWorkoutStore((s) => s.sessionStartedAt);
  const draft = useWorkoutStore((s) => s.draft);
  // The living count ticks once per second (useNowTick owns the
  // paired interval).
  const now = useNowTick();

  // The living pulse: the LIVE dot breathes in record-orange (one of
  // the brand hue's three appearances). Reduced motion holds full
  // opacity.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      pulse.setValue(1);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [pulse, reduced]);

  const elapsed = startedAt ? formatElapsed(startedAt, now) : '00:00';
  // The current station — the first exercise without a full house of
  // logged sets, else the last.
  const station =
    draft && draft.exercises.length > 0
      ? (draft.exercises.find((e) => e.sets.length === 0) ?? draft.exercises[draft.exercises.length - 1])
          .exerciseName
      : null;

  return (
    <Pressable
      onPress={() => replaceWithWorkoutDetail()}
      accessibilityRole="button"
      accessibilityLabel={`Session in progress, ${elapsed} elapsed${station ? `, at ${station}` : ''}. Return to session`}
      testID="session-strip"
      style={({ pressed }) => [
        styles.strip,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.mobilePremium.hairlineBorder,
          borderBottomColor: colors.mobilePremium.hairlineBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.left}>
        <Animated.View
          style={[styles.dot, { backgroundColor: colors.brand, opacity: pulse }]}
        />
        <Text style={[styles.live, { color: colors.brandText }]}>LIVE</Text>
        <Text style={[styles.count, { color: colors.text }]}>{elapsed}</Text>
      </View>
      {station ? (
        <Text style={[styles.station, { color: colors.textMuted }]} numberOfLines={1}>
          {station}
        </Text>
      ) : null}
      <Text style={[styles.return, { color: colors.text }]}>RETURN →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  live: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  count: {
    ...theme.typography.mobileLedger,
    fontWeight: '700',
    letterSpacing: 1,
  },
  station: {
    ...theme.typography.mobileLedger,
    flex: 1,
    textAlign: 'center',
  },
  return: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    letterSpacing: 1.2,
  },
});

export default SessionStrip;
