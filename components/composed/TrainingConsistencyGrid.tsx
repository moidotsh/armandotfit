// components/composed/TrainingConsistencyGrid.tsx
//
// Fitness-specific adapter for the generic ActivityGrid. Maps the daily
// user_analytics aggregate (UserAnalytics) onto the domain-neutral
// ActivityGridDatum shape and forwards to the shared <ActivityGrid>.
//
// Mapping policy: one cell per calendar day in [startDate, endDate];
// cell value = UserAnalytics.totalWorkouts for that day. Days without a
// row render as zero-activity cells (handled by the underlying grid).
// Level derivation uses the default value/maxValue thresholds, so a day
// with the user's max workout count lands at level 4, a single workout
// against a max-of-4 lands at level 2, etc. No domain-specific level
// override — the default ramp reads naturally for training consistency.
//
// This file is consumer-owned (armandotfit-specific). The generic grid it
// delegates to lives in components/MobilePremium/ActivityGrid.tsx and is
// mirrored from arqavellum.

import React, { useMemo } from 'react';
import { ActivityGrid, type ActivityGridDatum } from '../MobilePremium';
import type { UserAnalytics } from '../../shared/types';

export interface TrainingConsistencyGridProps {
  /** Daily-aggregate history from useAnalyticsHistory. Unsorted is fine. */
  data: readonly UserAnalytics[];
  /** Required — start of the inclusive range, 'YYYY-MM-DD'. */
  startDate: string;
  /** Required — end of the inclusive range, 'YYYY-MM-DD'. */
  endDate: string;
  /** Optional tap handler for date cells. When omitted, cells are non-interactive. */
  onDayPress?: (datum: ActivityGridDatum) => void;
  /** Group label announced once by screen readers. Defaults to 'Training consistency'. */
  accessibilityLabel?: string;
  testID?: string;
}

export function TrainingConsistencyGrid({
  data,
  startDate,
  endDate,
  onDayPress,
  accessibilityLabel,
  testID,
}: TrainingConsistencyGridProps) {
  const gridData = useMemo<ActivityGridDatum[]>(
    () => data.map((d) => ({ date: d.date, value: d.totalWorkouts })),
    [data],
  );

  return (
    <ActivityGrid
      data={gridData}
      startDate={startDate}
      endDate={endDate}
      onCellPress={onDayPress}
      accessibilityLabel={accessibilityLabel ?? 'Training consistency'}
      testID={testID}
    />
  );
}
