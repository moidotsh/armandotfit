// hooks/queries/useExercises.ts
// Read paths for the exercise library. Includes the filter-aware list,
// the detail-with-relations read, and reference-data (muscles /
// equipment) hooks for the browse/filter UI.

import { useQuery } from '@tanstack/react-query';
import { exerciseRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { getExercisesForDay } from '../../shared/exercises';
import type { PreferredSplit } from '../../shared/types';
import type {
  Exercise,
  ExerciseFilter,
  ExerciseWithRelations,
  MuscleCategory,
  Muscle,
  EquipmentType,
  UserFavoriteExercise,
} from '../../shared/types';
import { useAuthStore } from '../../stores';

/** Filtered exercise list. Filter object identity drives the cache key. */
export function useExercises(filter?: ExerciseFilter) {
  return useQuery({
    queryKey: queryKeys.exercises.list(filter),
    queryFn: async () => {
      const res = await exerciseRepository.findAll(filter);
      if (!res.success) throw res.error;
      return res.data as Exercise[];
    },
  });
}

/** Exercise detail with muscles / equipment / variations joined. */
export function useExerciseDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(id ?? 'unknown'),
    queryFn: async () => {
      if (!id) return null;
      const res = await exerciseRepository.findByIdWithRelations(id);
      if (!res.success) throw res.error;
      return res.data as ExerciseWithRelations | null;
    },
    enabled: !!id,
  });
}

/** Favorite exercises for the current user. */
export function useFavoriteExercises() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.exercises.favorites(),
    queryFn: async () => {
      if (!userId) return [] as UserFavoriteExercise[];
      const res = await exerciseRepository.listFavorites(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/** All muscle categories (reference data, used by exercise filters). */
export function useMuscleCategories() {
  return useQuery<MuscleCategory[]>({
    queryKey: queryKeys.reference.muscleCategories(),
    queryFn: async () => {
      const res = await exerciseRepository.findAllMuscleCategories();
      if (!res.success) throw res.error;
      return res.data;
    },
    staleTime: Infinity, // reference data — never revalidates in-session
  });
}

/** All muscles (reference data, used by exercise filters). */
export function useMuscles() {
  return useQuery<Muscle[]>({
    queryKey: queryKeys.reference.muscles(),
    queryFn: async () => {
      const res = await exerciseRepository.findAllMuscles();
      if (!res.success) throw res.error;
      return res.data;
    },
    staleTime: Infinity,
  });
}

/** All equipment types (reference data, used by exercise filters). */
export function useEquipmentTypes() {
  return useQuery<EquipmentType[]>({
    queryKey: queryKeys.reference.equipmentTypes(),
    queryFn: async () => {
      const res = await exerciseRepository.findAllEquipmentTypes();
      if (!res.success) throw res.error;
      return res.data;
    },
    staleTime: Infinity,
  });
}

/**
 * Suggested exercises for a given split + day. Pulls the slug list from
 * shared/exercises/splits.ts and hydrates each against the DB via the
 * slug lookup. Returns an empty array when the day is a rest day (5–7)
 * or the split is unknown. Slugs that don't resolve to a DB row (seed
 * migration hasn't run, or the slug was retired) are silently dropped —
 * the user can still add exercises manually.
 *
 * The hook does one round-trip per slug in parallel; for the v2 seed
 * this is ≤7 lookups per day. A list-by-slugs repository method is a
 * future optimization if this becomes hot.
 *
 * Pass `enabled: false` to skip the fetch entirely (e.g. when no draft
 * exists yet — avoids a wasted round-trip on a default-keyed cache miss).
 */
export function useSuggestedExercises(
  split: PreferredSplit,
  day: number,
  session: 'am' | 'pm' = 'am',
  enabled: boolean = true,
) {
  const slugs = getExercisesForDay(split, day, session);
  return useQuery({
    queryKey: queryKeys.exercises.list({ suggestedFor: `${split}-${day}-${session}` }),
    queryFn: async () => {
      const results = await Promise.all(
        slugs.map(async (slug) => {
          const res = await exerciseRepository.findBySlug(slug);
          return res.success ? res.data : null;
        }),
      );
      return results.filter((e): e is Exercise => e !== null);
    },
    enabled,
    staleTime: Infinity, // system exercises are immutable per release
  });
}
