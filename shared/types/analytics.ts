// shared/types/analytics.ts
// Computed-at-read shapes for the dashboard + analytics surfaces.
// Nothing here is stored — every value derives from raw sessions at
// query time (the blank-slate design forbids stored aggregates).

/** Consecutive-day training streaks, computed from session dates. */
export interface StreakInfo {
  current: number;
  best: number;
}

/** Home-dashboard summary — computed from the user's session list. */
export interface ProgressionSummary {
  streak: StreakInfo;
  totalSessions: number;
  thisWeekSessions: number;
  lastSessionDate: string | null;
}

/**
 * One calendar day of training activity. `date` is 'YYYY-MM-DD' in the
 * user's local time (a session counts for the day it was trained).
 */
export interface DayActivity {
  date: string;
  sessions: number;
}
