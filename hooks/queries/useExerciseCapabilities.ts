// hooks/queries/useExerciseCapabilities.ts
//
// Phase 6 resolved equipment-capabilities hook. For a set of exercise
// ids, looks up each exercise's slug via findByIds, then resolves
// slug → SYSTEM_EXERCISES_BY_SLUG → equipment → capabilitiesForExercise
// client-side. Returns a Map<exerciseId, EquipmentCapabilitySlug[]>
// the active-session screen passes per-exercise to SetupPresetPicker.
//
// Catalog-driven: exercises are seeded by migration and their slug →
// equipment mapping is fixed per release, so staleTime: Infinity mirrors
// useExerciseSetupOptions. Exercises with no slug (user-created custom
// exercises) or an unknown slug map to an empty capability list — the
// picker just renders nothing for them.

import { useQuery } from '@tanstack/react-query';
import { exerciseRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { capabilitiesForExercise } from '../../constants/equipmentCapabilities';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises/data';
import type { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { EquipmentSlug } from '../../shared/exercises/data';
import type { ID } from '../../shared/types';

/**
 * Normalize a SystemExerciseData.equipment entry (which may be a bare
 * EquipmentSlug or an `{ slug, isRequired }` object) to its slug.
 */
function equipmentToSlug(
  entry: EquipmentSlug | { slug: EquipmentSlug; isRequired: boolean },
): EquipmentSlug {
  return typeof entry === 'string' ? entry : entry.slug;
}

/**
 * Batched equipment-capability resolution for a set of exercises.
 *
 * Empty input returns an empty Map without firing the query (the
 * repository short-circuits to `ok([])` and the queryFn returns early).
 * The query key is keyed by the sorted + joined id list so two callers
 * with the same set of ids (in any order) hit the same cache entry.
 */
export function useExerciseCapabilities(exerciseIds: ID[]) {
  return useQuery({
    queryKey: queryKeys.exerciseCapabilities.list(exerciseIds),
    queryFn: async () => {
      const out = new Map<ID, EquipmentCapabilitySlug[]>();
      if (exerciseIds.length === 0) return out;
      const res = await exerciseRepository.findByIds(exerciseIds);
      if (!res.success) throw res.error;
      for (const ex of res.data) {
        // User-created custom exercises have slug=null; map to empty
        // (picker renders nothing for them).
        if (!ex.slug) {
          out.set(ex.id, []);
          continue;
        }
        const system = SYSTEM_EXERCISES_BY_SLUG[ex.slug];
        if (!system) {
          out.set(ex.id, []);
          continue;
        }
        const slugs = system.equipment.map(equipmentToSlug);
        out.set(ex.id, capabilitiesForExercise(slugs));
      }
      return out;
    },
    staleTime: Infinity, // catalog is immutable per release
  });
}
