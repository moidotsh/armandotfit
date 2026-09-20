// hooks/queries/useProgression.ts
// Dashboard + analytics read paths — DERIVATIONS over the two shared
// queries (history + activity log), never their own fetches: the
// summary, the day buckets, and the personal bests recompute in
// useMemo when the shared cache changes, so a range switch costs no
// round-trip and no refetch flash.

import { useMemo } from 'react';
import {
  ProgressionService,
  AnalyticsService,
  computePersonalBests,
  type PersonalBest,
} from '../../services';
import { useActivityLog, useSessionHistory } from './useWorkouts';
import type { DayActivity, ProgressionSummary } from '../../shared/types';

const EMPTY_SUMMARY: ProgressionSummary = {
  streak: { current: 0, best: 0 },
  totalSessions: 0,
  thisWeekSessions: 0,
  lastSessionDate: null,
};

/** Home-dashboard summary (streaks + totals) over the activity log. */
export function useDashboardSummary() {
  const activity = useActivityLog();
  const data = useMemo(
    () => (activity.data ? ProgressionService.summarizeActivity(activity.data) : EMPTY_SUMMARY),
    [activity.data],
  );
  return {
    data,
    isLoading: activity.isLoading,
    isSuccess: activity.isSuccess,
    isError: activity.isError,
    error: activity.error,
    refetch: activity.refetch,
  };
}

/**
 * Daily activity for the analytics consistency grid. The range is a
 * derivation parameter, not a cache key — switching 7/30/90 reads the
 * same activity log and re-buckets in place.
 */
export function useAnalyticsHistory(daysBack = 30) {
  const activity = useActivityLog();
  const data = useMemo<DayActivity[]>(
    () => (activity.data ? AnalyticsService.dailyActivity(activity.data, daysBack) : []),
    [activity.data, daysBack],
  );
  return {
    data,
    isLoading: activity.isLoading,
    isSuccess: activity.isSuccess,
    isError: activity.isError,
    error: activity.error,
    refetch: activity.refetch,
  };
}

/** Personal bests across history — computed at read from the shared history. */
export function usePersonalBests() {
  const history = useSessionHistory();
  const data = useMemo<PersonalBest[]>(
    () => (history.data ? computePersonalBests(history.data) : []),
    [history.data],
  );
  return {
    data,
    isLoading: history.isLoading,
    isError: history.isError,
    error: history.error,
    refetch: history.refetch,
  };
}
