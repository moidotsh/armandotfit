// components/composed/DashboardSkeleton.tsx
// Loading skeleton for the home dashboard's "Today" stat surface.
// Mirrors the layout of the streak / best / weekly rows in app/index.tsx
// (3 rows, each with a left-aligned label + right-aligned value) so the
// skeleton reads as "the stats are loading" rather than a generic
// shimmer block. Pairs with useDashboardSummary's isLoading gate.
//
// Armandotfit-only — not ported to vellum (vellum's app/index.tsx is
// the placeholder home and doesn't render this shape).

import React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { MobileSurface, SkeletonBlock } from '../MobilePremium';

export function DashboardSkeleton() {
  return (
    <MobileSurface padding={20}>
      <StatRowSkeleton labelWidth="40%" valueWidth={70} />
      <StatRowSkeleton labelWidth="35%" valueWidth={50} />
      <StatRowSkeleton labelWidth="30%" valueWidth={60} />
    </MobileSurface>
  );
}

function StatRowSkeleton({
  labelWidth,
  valueWidth,
}: {
  labelWidth: DimensionValue;
  valueWidth: number;
}) {
  return (
    <View style={styles.row}>
      <SkeletonBlock width={labelWidth} height={13} />
      <SkeletonBlock width={valueWidth} height={15} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
});

export default DashboardSkeleton;
