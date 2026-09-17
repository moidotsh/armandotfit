// components/composed/WorkoutSessionItem.tsx
// Reusable list row for a training session (home dashboard's recent list
// and analytics history). Wraps the date + day-of-split pattern.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobileSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import type { TrainingSession } from '../../shared/types';

export interface WorkoutSessionItemProps {
  session: Pick<TrainingSession, 'id' | 'startedAt' | 'splitDay'>;
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
            {new Date(session.startedAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {session.splitDay != null ? `day ${session.splitDay}` : 'ad-hoc'}
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
