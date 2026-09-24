// services/progressionService.ts
// Dashboard summary + streaks — computed from raw session history at
// read time. Nothing aggregated is ever stored (the design forbids it).
// Pure derivations over rows the shared activity log already fetched.

import type { ProgressionSummary, StreakInfo, TrainingSession } from '../shared/types';
import { e1rm } from './sessionMath';

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

/** One exercise's personal-best line — computed at read, never stored. */
export interface PersonalBest {
  exerciseName: string;
  /** Best set by e1RM. */
  bestWeight: number;
  bestReps: number;
  bestE1rm: number;
  /** ISO of the session holding the best. */
  bestAt: string;
}

/**
 * Personal bests from history: for every exercise with logged sets, the
 * best set ranked by Epley e1RM. Tag-blind by design (the governance's
 * visible-filtering rule) — filters are a future read-time concern.
 */
export function computePersonalBests(
  sessions: ReadonlyArray<{
    startedAt: string;
    exercises: ReadonlyArray<{
      exerciseName: string;
      sets: ReadonlyArray<{ reps: number; weight: number }>;
    }>;
  }>,
): PersonalBest[] {
  const best = new Map<string, PersonalBest>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (!ex.exerciseName) continue;
      for (const set of ex.sets) {
        const estimate = e1rm(set.weight, set.reps);
        const current = best.get(ex.exerciseName);
        if (!current || estimate > current.bestE1rm) {
          best.set(ex.exerciseName, {
            exerciseName: ex.exerciseName,
            bestWeight: set.weight,
            bestReps: set.reps,
            bestE1rm: estimate,
            bestAt: session.startedAt,
          });
        }
      }
    }
  }
  return [...best.values()].sort((a, b) => b.bestE1rm - a.bestE1rm);
}

export class ProgressionService {
  /**
   * Home-dashboard summary over the shared activity log. Zeros across
   * the board for fresh accounts.
   */
  static summarizeActivity(
    sessions: ReadonlyArray<Pick<TrainingSession, 'startedAt'>>,
  ): ProgressionSummary {
    const startedAts = sessions.map((s) => s.startedAt);
    const ws = weekStart();
    const thisWeek = sessions.filter((s) => localDate(s.startedAt) >= ws).length;
    return {
      streak: computeStreaks(startedAts),
      totalSessions: sessions.length,
      thisWeekSessions: thisWeek,
      lastSessionDate: sessions[0]?.startedAt ?? null,
    };
  }
}

/**
 * THE PRIOR RECORD (the upending pass): the all-time top LOADED weight
 * per exercise name, from sessions that started strictly BEFORE
 * `startedBeforeIso`. The record mark's baseline on the Floor and the
 * receipt — the session being viewed can never inflate its own bar.
 * Bodyweight sets (weight 0/null) contribute nothing: the mark rides
 * loaded iron only, the same rule everywhere.
 */
export function derivePriorTopSets(
  sessions: ReadonlyArray<{
    startedAt: string;
    exercises: ReadonlyArray<{
      exerciseName: string;
      sets: ReadonlyArray<{ weight: number | null }>;
    }>;
  }>,
  startedBeforeIso: string,
): Map<string, number> {
  const cutoff = new Date(startedBeforeIso).getTime();
  const map = new Map<string, number>();
  for (const session of sessions) {
    if (new Date(session.startedAt).getTime() >= cutoff) continue;
    for (const ex of session.exercises) {
      if (!ex.exerciseName) continue;
      for (const set of ex.sets) {
        const w = set.weight ?? 0;
        if (w > 0) map.set(ex.exerciseName, Math.max(map.get(ex.exerciseName) ?? 0, w));
      }
    }
  }
  return map;
}

export default ProgressionService;
