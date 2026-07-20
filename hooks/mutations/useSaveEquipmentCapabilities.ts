// hooks/mutations/useSaveEquipmentCapabilities.ts
// Replace the current user's equipment capability inventory with a new
// selection list. Idempotent save: the repository deletes existing rows
// then inserts the new set, plus additively upserts the resolved
// user_available_equipment rows (ON CONFLICT DO NOTHING).
//
// Cache contract (D3): touches setQueryData (optimistic update) on the
// way in, rolls back on error, and invalidates on settle so the server-
// authoritative row set takes over. Also invalidates the
// userEquipment.list key because the additive reconciliation may have
// added new user_available_equipment rows that consumers of that key
// need to see.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciseRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../stores';
import type {
  EquipmentCapabilitySelectionDTO,
  UserEquipmentCapability,
} from '../../shared/types';

interface SaveCapabilitiesContext {
  previousCapabilities?: UserEquipmentCapability[];
}

/**
 * useSaveEquipmentCapabilities — replace the user's capability
 * inventory. Optimistically writes the selection list into the cache so
 * the wizard's "saving..." state can flip to "saved" without waiting
 * on the network round trip, rolls back on error, and invalidates both
 * the capabilities key and the equipment list key on success.
 */
export function useSaveEquipmentCapabilities() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const capabilitiesKey = queryKeys.userEquipment.capabilities();
  const equipmentListKey = queryKeys.userEquipment.list();

  return useMutation<
    UserEquipmentCapability[],
    Error,
    EquipmentCapabilitySelectionDTO[],
    SaveCapabilitiesContext
  >({
    mutationFn: async (selections: EquipmentCapabilitySelectionDTO[]) => {
      if (!userId) {
        // s10-exempt: programmer-error guard. The wizard only renders for
        // an authenticated user — an unset userId here is a wiring bug,
        // not a user-facing condition.
        throw new Error('Cannot save equipment capabilities: no authenticated user');
      }
      const res = await exerciseRepository.replaceAllEquipmentCapabilities(
        userId,
        selections,
      );
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (selections): Promise<SaveCapabilitiesContext> => {
      await queryClient.cancelQueries({ queryKey: capabilitiesKey });
      const previousCapabilities =
        queryClient.getQueryData<UserEquipmentCapability[]>(capabilitiesKey);
      // Optimistic shape: synthesize a provisional capability list from
      // the selection input. Real IDs/timestamps come from the server
      // response — these placeholders are only used to flip the UI's
      // "saved" state and are replaced by the settle invalidate.
      const now = new Date().toISOString();
      const optimistic: UserEquipmentCapability[] = selections.map((sel) => ({
        id: `optimistic-${sel.slug}`,
        userId: userId ?? '',
        capabilitySlug: sel.slug,
        details: sel.details ?? {},
        createdAt: now,
        updatedAt: now,
      }));
      queryClient.setQueryData<UserEquipmentCapability[]>(capabilitiesKey, optimistic);
      return { previousCapabilities };
    },
    onError: (err, _selections, context) => {
      logger.warn(
        'mutations',
        'useSaveEquipmentCapabilities failed, rolling back cache:',
        err.message,
      );
      if (context?.previousCapabilities !== undefined) {
        queryClient.setQueryData(capabilitiesKey, context.previousCapabilities);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userEquipment.capabilities() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userEquipment.list() });
    },
  });
}
