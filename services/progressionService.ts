// services/progressionService.ts
// Dashboard summary + streaks — computed from raw session history at
// read time. Nothing aggregated is ever stored (the design forbids it).

import { WorkoutService } from './workoutService';
import type { RepositoryResult } from '../utils/supabase/repositories';
import { ok } from '../utils/supabase/repositories';
import type {
  ID,
  ProgressionSummary,
  StreakInfo,
} from '../shared/types';

/** Local calendar date ('YYYY-MM-DD') of an ISO timestamp. */
function localDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Consecutive-day streaks over a set of session dates (sorted input not
 * required). A day counts when ≥1 session started on it (local time).
 */
export function computeStreaks(startedAts: string[]): StreakInfo {
  const days = new Set(startedAts.map(localDate));
  if (days.size === 0) return { current: 0, best: 0 };

  const sorted = Array.from(days).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00');
    const cur = new Date(sorted[i] + 'T12:00:00');
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  // Current streak counts back from today (or yesterday — a streak
  // survives until the day fully passes without a session).
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let current = 0;
  const cursor = new Date(today);
  if (!days.has(dateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateStr(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, best: Math.max(best, current) };
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday of the current week (local), 'YYYY-MM-DD'. */
function weekStart(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - day);
  return dateStr(d);
}

export class ProgressionService {
  /** Home-dashboard summary. Zeros across the board for fresh accounts. */
  static async getDashboardSummary(
    userId: ID,
  ): Promise<RepositoryResult<ProgressionSummary>> {
    const res = await WorkoutService.getRecentSessions(userId, 200);
    if (!res.success) return res;
    const sessions = res.data;
    const startedAts = sessions.map((s) => s.startedAt);
    const ws = weekStart();
    const thisWeek = sessions.filter((s) => localDate(s.startedAt) >= ws).length;
    return ok({
      streak: computeStreaks(startedAts),
      totalSessions: sessions.length,
      thisWeekSessions: thisWeek,
      lastSessionDate: sessions[0]?.startedAt ?? null,
    });
  }

  /** Standalone streak read (header badges). */
  static async getStreaks(userId: ID): Promise<RepositoryResult<StreakInfo>> {
    const res = await WorkoutService.getRecentSessions(userId, 200);
    if (!res.success) return res;
    return ok(computeStreaks(res.data.map((s) => s.startedAt)));
  }
}

export default ProgressionService;
