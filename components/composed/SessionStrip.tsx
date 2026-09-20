// components/composed/SessionStrip.tsx
//
// THE TICKER (interval-thesis §8): while a session runs, a slim
// line pins under every Desk header — LIVE in RED INK (the live
// pulse reads as red, not as motion — THE STILL SYSTEM) · the
// running elapsed figure in Martian · the current station ·
// RETURN →. One tap goes back to the Floor, from anywhere. The
// session never hides and never falls out of the thumb arc; this is
// what replaces the tab bar's center action when the bar itself is
// gone.
//
// The strip reads the workout store directly — no prop threading from
// every screen. It follows the mode like every other line (the wire
// register stays reserved for interrupts: the chit and the curtain).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { useNowTick } from '../../hooks';
import { useWorkoutStore } from '../../stores';
import { replaceWithWorkoutDetail } from '../../navigation';
import { theme,
  PRESS_DIP,
  PRESS_DIP_PLATE
} from '../../constants';
import { formatElapsed } from '../../services';

export function SessionStrip() {
  const { colors } = useAppTheme();
  const startedAt = useWorkoutStore((s) => s.sessionStartedAt);
  const draft = useWorkoutStore((s) => s.draft);
  // The living count ticks once per second (useNowTick owns the
  // paired interval). The figure SWAPS — it never animates (the
  // still law).
  const now = useNowTick();

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
          borderTopColor: colors.mobilePremium.hairlineBorder,
          borderBottomColor: colors.mobilePremium.hairlineBorder,
          opacity: pressed ? PRESS_DIP_PLATE : 1,
        },
      ]}
    >
      <View style={styles.left}>
        {/* LIVE reads as RED INK — the live pulse. No dot, no breath:
            red is the pulse (thesis §4.5). */}
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
    gap: 10,
  },
  live: {
    ...theme.typography.mobileEyebrow,
  },
  count: {
    ...theme.typography.mobileLedger,
    fontWeight: '700',
  },
  station: {
    ...theme.typography.mobileLedger,
    flex: 1,
    textAlign: 'center',
  },
  return: {
    ...theme.typography.mobileEyebrow,
  },
});

export default SessionStrip;
