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
import { bodyweightAsOf } from '../../utils/bodyweight';
import { getWeightHistory } from '../../utils/supabase/repositories';
import { SYSTEM_EXERCISES } from '../../shared/exercises';

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
  const bodyweightQuery = useQuery({
    queryKey: queryKeys.bodyWeight.history(),
    queryFn: async () => {
      const r = await getWeightHistory(90);
      if (!r.success) throw r.error;
      return r.data;
    },
  });
  const map = useMemo(() => {
    const t0 = performance.now();
    const derived = deriveTopSets(historyQuery.data ?? []);
    // BODYWEIGHT EFFECTIVE LOADS — a top set of 0 on a bodyweight
    // exercise resolves to factor × the bodyweight at that session
    // (the as-of lookup; the number you carried THEN).
    if (bodyweightQuery.data && bodyweightQuery.data.length > 0) {
      for (const [key, fact] of derived) {
        const entry = SYSTEM_EXERCISES.find(
          (e) => e.name.toLowerCase() === key,
        );
        const factor = entry?.bodyweightLoadFactor;
        if (factor == null || factor <= 0) continue;
        const bw = bodyweightAsOf(bodyweightQuery.data, fact.startedAt);
        if (bw != null && bw > 0) {
          // ADDITIVE — bodyweight component + any loaded weight.
          derived.set(key, { ...fact, weight: factor * bw + fact.weight });
        }
      }
    }
    const ms = performance.now() - t0;
    if (ms > TOP_SETS_BUDGET_MS) {
      logger.warn('queries', `deriveTopSets over budget: ${Math.round(ms)}ms > ${TOP_SETS_BUDGET_MS}ms (${historyQuery.data?.length ?? 0} sessions)`);
    } else {
      logger.debug('queries', `deriveTopSets ${Math.round(ms)}ms (${historyQuery.data?.length ?? 0} sessions)`);
    }
    return derived;
  }, [historyQuery.data, bodyweightQuery.data]);
  return { map, isLoading: historyQuery.isLoading };
}
