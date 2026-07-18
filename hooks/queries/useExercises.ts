// hooks/queries/useExercises.ts
// Read paths for the exercise library. Includes the filter-aware list,
// the detail-with-relations read, and reference-data (muscles /
// equipment) hooks for the browse/filter UI.

import { useQuery } from '@tanstack/react-query';
import { exerciseRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
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
