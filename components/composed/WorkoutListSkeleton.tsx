// components/composed/WorkoutListSkeleton.tsx
// Loading skeleton for the home dashboard's "Recent workouts" list.
// Mirrors WorkoutSessionItem's shape: per-row MobileSurface with a
// left-aligned date block + right-aligned meta block. Defaults to 3
// rows (the count used on the home dashboard); pass `rows` to override.
//
// Armandotfit-only — not ported to arqavellum (no WorkoutSessionItem
// counterpart in the domain-agnostic shell).

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MobileSurface, SkeletonBlock } from '../MobilePremium';
import { theme } from '../../constants';

export interface WorkoutListSkeletonProps {
  rows?: number;
  testID?: string;
}

export function WorkoutListSkeleton({ rows = 3, testID }: WorkoutListSkeletonProps) {
  return (
    <View style={styles.list} testID={testID}>
      {Array.from({ length: rows }).map((_, i) => (
        <MobileSurface key={i} padding={14}>
          <View style={styles.row}>
            <SkeletonBlock width="45%" height={14} />
            <SkeletonBlock width={70} height={12} />
          </View>
        </MobileSurface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.small,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default WorkoutListSkeleton;
