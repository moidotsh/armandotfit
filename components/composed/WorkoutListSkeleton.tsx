// components/composed/WorkoutListSkeleton.tsx
// Loading skeleton for the home dashboard's "Recent workouts" list.
// Mirrors the settled list's RULED ROW — name left, figure right, no
// plate: the skeleton wears the same geometry the rows wear when the
// facts arrive (the incumbent's bordered MobileSurface rows spoke a
// foreign grammar the list never wears).
//
// Armandotfit-only — not ported to arqavellum (no WorkoutSessionItem
// counterpart in the domain-agnostic shell).

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBlock } from '../MobilePremium';
import { theme } from '../../constants';

export interface WorkoutListSkeletonProps {
  rows?: number;
  testID?: string;
}

export function WorkoutListSkeleton({ rows = 3, testID }: WorkoutListSkeletonProps) {
  return (
    <View style={styles.list} testID={testID}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row} testID="workout-list-skeleton-row">
          <SkeletonBlock width="45%" height={16} />
          <SkeletonBlock width={70} height={16} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.medium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
});

export default WorkoutListSkeleton;
