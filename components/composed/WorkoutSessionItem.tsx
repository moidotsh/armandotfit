// components/composed/WorkoutSessionItem.tsx
// Reusable list row for a workout session. Used by the home dashboard's
// "Recent workouts" list and by the analytics history view (when it
// surfaces per-session entries). Wraps the date + duration + day-slot
// pattern that both routes were duplicating inline.
//
// Lives in the composed tier (one tier above primitives) because it
// composes MobileSurface + Pressable + Text into a domain-specific row.
// The MobilePremium kit intentionally doesn't ship a list-row primitive
// because the row shape is too domain-specific to generalize.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import type { WorkoutSession } from '../../shared/types';

export interface WorkoutSessionItemProps {
  session: Pick<WorkoutSession, 'id' | 'date' | 'duration' | 'day'>;
  onPress: (id: string) => void;
}

export function WorkoutSessionItem({ session, onPress }: WorkoutSessionItemProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => onPress(session.id)}
      accessibilityRole="button"
    >
      <MobileSurface padding={14}>
        <View style={styles.row}>
          <Text style={[styles.date, { color: colors.text }]}>
            {new Date(session.date).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {session.duration}m · day {session.day}
          </Text>
        </View>
      </MobileSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 12 },
});
