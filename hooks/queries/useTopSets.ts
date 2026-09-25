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
import { useQuery } from '@tanstack/react-query';
import { useSessionHistory } from './useWorkouts';
import { logger } from '../../utils/logger';
import { queryKeys } from '../../lib/react-query';
import { getWeightHistory } from '../../utils/supabase/repositories';
import { SYSTEM_EXERCISES } from '../../shared/exercises';

export interface TopSetFact {
  /** The RAW best loaded weight in that session (ties → the later set,
   *  kg, 0 for pure bodyweight) — the ARMING source. Never the
   *  effective load: arming 0.35 × bodyweight as a working weight got
   *  a bodyweight leg raise logged as '72 lb' and printed 'a+72'
   *  (double-counting the athlete). */
  weight: number;
  /** The EFFECTIVE load (factor × bodyweight at that session + the raw
   *  weight) when the lift carries a bodyweight component — for volume
   *  and e1RM reads only, never for arming. */
  effectiveWeight?: number;
  /** Reps performed at that weight. */
  reps: number;
  /** Sets logged for the exercise in that session. */
  sets: number;
  /** The session's start time (ISO) — format at the call site. */
  startedAt: string;
}

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

/**
 * Top-set facts keyed by lowercase exercise name. First (most recent)
 * session wins per name — matching what the lifter walked in on, not
 * a lifetime max (that's `usePersonalBests`). Derives over the FULL
 * shared history: a lift last done 30 sessions ago still prefills.
 */
/** The computed-at-read budget (ms) — derivation stays measured, not
 * cached: a breach logs a warning and earns an indexing conversation,
 * never a precomputed table (invariant 5). */
const TOP_SETS_BUDGET_MS = 150;

export function useTopSetsByName() {
  const historyQuery = useSessionHistory();
  // THE BODYWEIGHT — the weigh-in history powers effective loads for
  // bodyweight stations (weight=0 → factor × as-of bodyweight).
  const map = useMemo(() => {
    const t0 = performance.now();
    const derived = deriveTopSets(historyQuery.data ?? []);
    // RAW ONLY. This map arms the logger and prints the register's
    // digits — both raw-weight contexts. The EFFECTIVE load
    // (factor × bodyweight + added weight) is `effectiveSetWeight`
    // in utils/bodyweight, computed at read by the volume/e1RM paths
    // that need it. Deriving it into `weight` here armed a pure
    // bodyweight leg raise with ~72 lb (0.35 × bodyweight), which then
    // logged as a real weight and printed 'a+72' — double-counting the
    // athlete (the owner's report).
    const ms = performance.now() - t0;
    if (ms > TOP_SETS_BUDGET_MS) {
      logger.warn('queries', `deriveTopSets over budget: ${Math.round(ms)}ms > ${TOP_SETS_BUDGET_MS}ms (${historyQuery.data?.length ?? 0} sessions)`);
    } else {
      logger.debug('queries', `deriveTopSets ${Math.round(ms)}ms (${historyQuery.data?.length ?? 0} sessions)`);
    }
    return derived;
  }, [historyQuery.data]);
  return { map, isLoading: historyQuery.isLoading };
}
