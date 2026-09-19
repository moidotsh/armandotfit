// hooks/queries/useTopSets.ts
// The "what did I load last time" derivation: per exercise NAME, the
// TOP set of the most recent session that has it — the highest weight
// loaded (ties resolve to the later set), with the reps done at that
// weight and the session's context. Computed at read from recent
// sessions (identity joins by name — invariant 5); nothing stored.
//
// One derivation, four consumers: the armed prefill (the Floor), the
// board-row previews (home, the funnel), and the entry's number to
// beat. Before this hook existed, each site hand-rolled its own and
// they could silently disagree.

import { useMemo } from 'react';
import { useRecentSessionDetails } from './useWorkouts';

export interface TopSetFact {
  /** Best loaded weight in that session (ties → the later set). */
  weight: number;
  /** Reps performed at that weight. */
  reps: number;
  /** Sets logged for the exercise in that session. */
  sets: number;
  /** The session's start time (ISO) — format at the call site. */
  startedAt: string;
}

/**
 * Top-set facts keyed by lowercase exercise name. First (most recent)
 * session wins per name — matching what the lifter walked in on, not
 * a lifetime max (that's `usePersonalBests`).
 */
/**
 * The derivation, pure: top-set facts from recent sessions (most
 * recent session wins per name; within it, the highest weight with
 * ties resolving to the later set). Exported for testing.
 */
export function deriveTopSets(
  sessions: Array<{
    startedAt: string;
    exercises: Array<{
      exerciseName: string;
      sets: Array<{ weight: number | null; reps: number | null }>;
    }>;
  }>,
): Map<string, TopSetFact> {
  const out = new Map<string, TopSetFact>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const key = ex.exerciseName.toLowerCase();
      if (out.has(key) || ex.sets.length === 0) continue;
      let top: { weight: number; reps: number } | null = null;
      for (const set of ex.sets) {
        const w = set.weight ?? 0;
        if (!top || w >= top.weight) top = { weight: w, reps: set.reps ?? 0 };
      }
      if (top) {
        out.set(key, {
          weight: top.weight,
          reps: top.reps,
          sets: ex.sets.length,
          startedAt: session.startedAt,
        });
      }
    }
  }
  return out;
}

export function useTopSetsByName(limit = 10) {
  const recentQuery = useRecentSessionDetails(limit);
  const map = useMemo(() => deriveTopSets(recentQuery.data ?? []), [recentQuery.data]);
  return { map, isLoading: recentQuery.isLoading };
}
