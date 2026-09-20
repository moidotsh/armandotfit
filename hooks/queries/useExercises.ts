// hooks/queries/useExercises.ts
// Browse + detail reads over the LOCAL exercise catalog
// (shared/exercises/data.ts — the sole display source). No DB round-
// trips: the exercises table stores only coarse identities, and every
// display attribute lives client-side. Filter + resolve synchronously.

import { SYSTEM_EXERCISES, SYSTEM_EXERCISES_BY_SLUG, MUSCLE_DISPLAY_NAMES } from '../../shared/exercises';
import type { SystemExerciseData } from '../../shared/exercises';
import type { CatalogFilter } from '../../stores/exerciseStore';

interface LocalQueryResult {
  data: SystemExerciseData[] | undefined;
  isLoading: false;
}

/** The entry's muscle vocabulary, lowercased: slug values + display
 * words ('calves', 'upper back') — the muscle-group search's corpus. */
function muscleCorpus(e: SystemExerciseData): string[] {
  return [...e.primaryMuscles, ...e.secondaryMuscles].flatMap((m) => [
    m.toLowerCase(),
    (MUSCLE_DISPLAY_NAMES[m] ?? '').toLowerCase(),
  ]);
}

/** Filtered catalog list. Local + synchronous; shape matches useQuery. */
export function useExercises(filter?: CatalogFilter): LocalQueryResult {
  let data = SYSTEM_EXERCISES;
  if (filter?.search) {
    const q = filter.search.trim().toLowerCase();
    data = data.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        // MUSCLE-GROUP SEARCH: 'calves' finds the calf lifts, 'chest'
        // the presses — plural display names absorb singular queries
        // ('calf' ⊂ 'calves', 'quad' ⊂ 'quads').
        (q.length >= 2 && muscleCorpus(e).some((m) => m.includes(q))),
    );
  }
  if (filter?.category) {
    data = data.filter((e) => e.category === filter.category);
  }
  if (filter?.exerciseType) {
    data = data.filter((e) => e.exerciseType === filter.exerciseType);
  }
  if (filter?.modality) {
    data = data.filter((e) => e.modality === filter.modality);
  }
  return { data, isLoading: false };
}

/** Catalog entry by slug (null when unknown). */
export function useExerciseDetail(slug: string | null | undefined): {
  data: SystemExerciseData | null;
  isLoading: false;
} {
  return {
    data: slug ? SYSTEM_EXERCISES_BY_SLUG[slug] ?? null : null,
    isLoading: false,
  };
}
