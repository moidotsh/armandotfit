// hooks/queries/useSetupPresets.ts
// Read paths for the Phase 6 user-owned equipment-setup preset layer.
//
//   • useActiveSetupPresets — active-only list (session-time picker)
//   • useAllSetupPresets   — active + retired (management UI)
//
// Cache contract: setupPresets.{activeList,allList} namespaces; the
// mutations in hooks/mutations/useSetupPresetMutations invalidate both
// keys on settle (an active/retired flip affects both views).

import { useQuery } from '@tanstack/react-query';
import { setupPresetRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type { SetupPreset } from '../../shared/types';

/**
 * Active (non-retired) presets for the current user. Picker hot path.
 * Empty array while the userId is unset or the row set hasn't been
 * fetched yet.
 */
export function useActiveSetupPresets() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<SetupPreset[]>({
    queryKey: queryKeys.setupPresets.activeList(),
    queryFn: async () => {
      if (!userId) return [];
      const res = await setupPresetRepository.listActiveForUser(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/**
 * All presets for the current user (active + retired). Management UI
 * path. Retired presets sort to the bottom within the repository's
 * ordering; the management UI offers edit / un-retire / delete.
 */
export function useAllSetupPresets() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<SetupPreset[]>({
    queryKey: queryKeys.setupPresets.allList(),
    queryFn: async () => {
      if (!userId) return [];
      const res = await setupPresetRepository.listAllForUser(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}
