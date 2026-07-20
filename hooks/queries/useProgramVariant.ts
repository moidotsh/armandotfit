// hooks/queries/useProgramVariant.ts
// Read path over the program-template catalog (Phase 1 hierarchy).
// Phase 4 launch surface uses useVariantTree to resolve which plan slots
// belong to the requested (dayIndex, sessionWindow) — the variant tree
// owns the session→slot mapping that selectPlanSlotsForSession walks.
//
// Catalog rows are read-only reference data (RLS denies authenticated
// writes), so the cache is safe to hold across sessions. The query is
// disabled until variantSlug is provided.

import { useQuery } from '@tanstack/react-query';
import { programRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';

/**
 * Returns the full day/session/slot tree for a variant slug, or null
 * when the slug matches no row. Drives the launch-time session-slot
 * resolver (services/planLaunchService → selectPlanSlotsForSession).
 *
 * Disabled until variantSlug is provided. Callers should treat
 * `undefined` (loading) distinctly from `null` (slug not found).
 */
export function useVariantTree(variantSlug: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.programVariants.tree(variantSlug ?? 'pending'),
    queryFn: async () => {
      if (!variantSlug) return null;
      const res = await programRepository.findVariantTree(variantSlug);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!variantSlug,
  });
}
