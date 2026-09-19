// services/analyticsService.ts
// Analytics-screen derivations: daily activity + weekly buckets
// computed from raw session history at read time. Stateless — no
// writes, and no aggregates are ever stored. Pure functions over the
// rows the shared activity log already fetched.

import type { DayActivity, TrainingSession } from '../shared/types';

function localDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class AnalyticsService {
  /** Per-day session counts for the last `daysBack` days. */
  static dailyActivity(
    sessions: ReadonlyArray<Pick<TrainingSession, 'startedAt'>>,
    daysBack = 30,
  ): DayActivity[] {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const sinceStr = localDate(since.toISOString());
    const byDay = new Map<string, number>();
    for (const s of sessions) {
      const d = localDate(s.startedAt);
      if (d < sinceStr) continue;
      byDay.set(d, (byDay.get(d) ?? 0) + 1);
    }
    return Array.from(byDay.entries())
      .map(([date, sessions]) => ({ date, sessions }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /** Bucket daily activity into weekly totals (Monday-start weeks). */
  static bucketWeekly(rows: DayActivity[]): Array<{
    weekStart: string;
    sessions: number;
  }> {
    const buckets = new Map<string, number>();
    for (const row of rows) {
      const d = new Date(row.date + 'T12:00:00');
      const day = (d.getDay() + 6) % 7; // Mon = 0
      d.setDate(d.getDate() - day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + row.sessions);
    }
    return Array.from(buckets.entries())
      .map(([weekStart, sessions]) => ({ weekStart, sessions }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }
}

export default AnalyticsService;
