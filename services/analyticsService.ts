// services/analyticsService.ts
// Analytics-screen read path: historical aggregations for charts. Thin
// wrapper over ProgressionRepository.findByUser with date-bucketing
// helpers. Stateless — no writes (analytics are trigger-maintained).

import {
  progressionRepository,
  type RepositoryResult,
} from '../utils/supabase/repositories';
import type { ID, UserAnalytics } from '../shared/types';

/**
 * AnalyticsService — chart-data read orchestrator. Used by the analytics
 * screen to plot workouts-per-day, duration-per-week, etc. The repository
 * returns daily rows; the service shapes them for the chart library.
 */
export class AnalyticsService {
  /** Last 30 days of analytics rows (default). Used by the weekly chart. */
  static async getRecent(
    userId: ID,
    daysBack = 30,
  ): Promise<RepositoryResult<UserAnalytics[]>> {
    return progressionRepository.findByUser(userId, { daysBack });
  }

  /**
   * Bucket daily rows into weekly totals. The repository returns raw
   * daily rows; the chart library wants one point per week. Aggregation
   * is service-level because the bucketing rule is UI-shaped.
   */
  static bucketWeekly(rows: UserAnalytics[]): Array<{
    weekStart: string;
    totalWorkouts: number;
    totalDuration: number;
  }> {
    const buckets = new Map<string, { totalWorkouts: number; totalDuration: number }>();
    for (const row of rows) {
      const weekStart = getWeekStart(row.date);
      const bucket = buckets.get(weekStart) ?? { totalWorkouts: 0, totalDuration: 0 };
      bucket.totalWorkouts += row.totalWorkouts;
      bucket.totalDuration += row.totalDuration;
      buckets.set(weekStart, bucket);
    }
    return Array.from(buckets.entries())
      .map(([weekStart, totals]) => ({ weekStart, ...totals }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }
}

/** ISO date of the Monday starting the week containing `isoDate`. */
function getWeekStart(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getUTCDay(); // 0 = Sun, 1 = Mon, ...
  const diff = (day + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

export default AnalyticsService;
