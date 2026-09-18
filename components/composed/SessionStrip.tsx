// components/composed/SessionStrip.tsx
//
// THE TICKER (broadsheet-thesis §6): while a session runs, a wire
// plate pins under every Desk header — LIVE dot (the living pulse) ·
// the running elapsed count in agate · RETURN →. One tap goes back to
// the Floor, from anywhere. The session never hides and never falls
// out of the thumb arc; this is what replaces the tab bar's center
// action when the bar itself is gone.
//
// The strip reads the workout store directly — no prop threading from
// every screen. It renders the wire register (colors.focus.*): the
// heaviest ink in the system, identical in both modes.

import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { useWorkoutStore } from '../../stores';
import { replaceWithWorkoutDetail } from '../../navigation';
import { theme } from '../../constants';
import { formatElapsed } from '../../services';
import { useReducedMotion } from '../premium/shared';

export function SessionStrip() {
  const { colors } = useAppTheme();
  const reduced = useReducedMotion();
  const startedAt = useWorkoutStore((s) => s.sessionStartedAt);
  const [now, setNow] = useState(() => Date.now());

  // The living count ticks once per second — paired clear (R4a).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // The living pulse: the LIVE dot breathes (the only loop in the
  // system). Reduced motion holds full opacity.
  const pulse = React.useRef(new Animated.Value(1)).current;
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

  return (
    <Pressable
      onPress={() => replaceWithWorkoutDetail()}
      accessibilityRole="button"
      accessibilityLabel={`Session in progress, ${elapsed} elapsed. Return to session`}
      testID="session-strip"
      style={({ pressed }) => [
        styles.strip,
        { backgroundColor: colors.focus.background, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.left}>
        <Animated.View
          style={[styles.dot, { backgroundColor: colors.focus.signal, opacity: pulse }]}
        />
        <Text style={[styles.live, { color: colors.focus.signal }]}>LIVE</Text>
      </View>
      <Text style={[styles.count, { color: colors.focus.text }]}>{elapsed}</Text>
      <Text style={[styles.return, { color: colors.focus.text }]}>RETURN →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 72,
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
  return: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    letterSpacing: 1.2,
    minWidth: 72,
    textAlign: 'right',
  },
});

export default SessionStrip;
