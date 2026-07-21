// hooks/queries/useExerciseSetupOptions.ts
//
// Phase 5 catalog grip-options hook. Loads exercise_grip_options rows for
// the given exercise ids in a single batched query. Returns a Map keyed
// by exerciseId so the UI can do an O(1) lookup per active-session row
// without re-grouping the flat repository payload.
//
// Catalog grip options are seeded by migration 20260721000002 and are
// immutable per release — staleTime: Infinity mirrors useSuggestedExercises.

import { useQuery } from '@tanstack/react-query';
import { exerciseRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import type { ExerciseGripOption, ID } from '../../shared/types';

/**
 * Batched catalog grip options for a set of exercises.
 *
 * Empty input returns an empty Map without firing the query (the
 * repository short-circuits to `ok([])` and the queryFn returns early).
 * The query key is keyed by the sorted + joined id list so two callers
 * with the same set of ids (in any order) hit the same cache entry.
 */
export function useExerciseSetupOptions(exerciseIds: ID[]) {
  return useQuery({
    queryKey: queryKeys.exerciseSetupOptions.list(exerciseIds),
    queryFn: async () => {
      if (exerciseIds.length === 0) return new Map<ID, ExerciseGripOption[]>();
      const res = await exerciseRepository.listGripOptionsForExercises(exerciseIds);
      if (!res.success) throw res.error;
      const out = new Map<ID, ExerciseGripOption[]>();
      for (const opt of res.data) {
        const list = out.get(opt.exerciseId);
        if (list) {
          list.push(opt);
        } else {
          out.set(opt.exerciseId, [opt]);
        }
      }
      return out;
    },
    staleTime: Infinity, // catalog is immutable per release
  });
}
