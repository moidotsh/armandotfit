// hooks/queries/useEquipmentCapabilities.ts
// Read path for the current user's equipment capability inventory (Phase 2).
// Caches under queryKeys.userEquipment.capabilities() and revalidates on
// focus/visibility via React Query defaults. Pulls userId from the auth
// store so callers don't have to thread it.

import { useQuery } from '@tanstack/react-query';
import { exerciseRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { UserEquipmentCapability } from '../../shared/types';

/**
 * Returns the current user's equipment capability selections. Empty
 * array while the userId is unset or the row set hasn't been fetched
 * yet — consumers should treat `[]` + isLoading as "still booting".
 */
export function useEquipmentCapabilities() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<UserEquipmentCapability[]>({
    queryKey: queryKeys.userEquipment.capabilities(),
    queryFn: async () => {
      if (!userId) return [];
      const res = await exerciseRepository.listEquipmentCapabilities(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}
