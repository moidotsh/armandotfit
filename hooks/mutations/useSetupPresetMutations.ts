// hooks/mutations/useSetupPresetMutations.ts
// Mutation hooks for the Phase 6 user-owned setup preset layer.
//
//   • useCreateSetupPreset  — create a fresh preset
//   • useUpdateSetupPreset  — edit label / capability / setup values
//   • useRetireSetupPreset  — soft-retire (is_retired=TRUE)
//   • useUnretireSetupPreset — un-retire (is_retired=FALSE)
//   • useDeleteSetupPreset  — hard delete (safe; history has no FK)
//
// Cache contract (D3): every mutation touches the cache on the way in
// (optimistic update), rolls back on error, and invalidates both the
// activeList + allList keys on settle. The two views share the same
// underlying row set; a write visible in one is visible in the other.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setupPresetRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../stores';
import type {
  CreateSetupPresetDTO,
  ID,
  SetupPreset,
  UpdateSetupPresetDTO,
} from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────

interface PresetListContext {
  previousActive?: SetupPreset[];
  previousAll?: SetupPreset[];
}

async function snapshotLists(queryClient: ReturnType<typeof useQueryClient>): Promise<PresetListContext> {
  const activeKey = queryKeys.setupPresets.activeList();
  const allKey = queryKeys.setupPresets.allList();
  await Promise.all([
    queryClient.cancelQueries({ queryKey: activeKey }),
    queryClient.cancelQueries({ queryKey: allKey }),
  ]);
  return {
    previousActive: queryClient.getQueryData<SetupPreset[]>(activeKey),
    previousAll: queryClient.getQueryData<SetupPreset[]>(allKey),
  };
}

function rollbackLists(
  queryClient: ReturnType<typeof useQueryClient>,
  context: PresetListContext | undefined,
) {
  if (!context) return;
  const activeKey = queryKeys.setupPresets.activeList();
  const allKey = queryKeys.setupPresets.allList();
  if (context.previousActive !== undefined) {
    queryClient.setQueryData(activeKey, context.previousActive);
  }
  if (context.previousAll !== undefined) {
    queryClient.setQueryData(allKey, context.previousAll);
  }
}

function invalidateLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.setupPresets.activeList() });
  queryClient.invalidateQueries({ queryKey: queryKeys.setupPresets.allList() });
}

// ──────────────────────────────────────────────────────────────────────
// useCreateSetupPreset
// ──────────────────────────────────────────────────────────────────────

interface CreatePresetVariables {
  dto: CreateSetupPresetDTO;
}

/**
 * useCreateSetupPreset — create a fresh preset. Optimistically appends
 * to both lists (the new row's server-generated id + timestamps are
 * synthesized as `optimistic-*` placeholders; the settle invalidate
 * pulls the authoritative row). Rolls back on error.
 */
export function useCreateSetupPreset() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation<SetupPreset, Error, CreatePresetVariables, PresetListContext>({
    mutationFn: async ({ dto }) => {
      if (!userId) {
        // s10-exempt: programmer-error guard.
        throw new Error('Cannot create preset: no authenticated user');
      }
      const res = await setupPresetRepository.create(userId, dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ dto }): Promise<PresetListContext> => {
      const ctx = await snapshotLists(queryClient);
      const optimistic: SetupPreset = {
        id: `optimistic-${Date.now()}`,
        userId: userId ?? '',
        label: dto.label.trim(),
        capabilitySlug: dto.capabilitySlug,
        gripText: dto.gripText ?? null,
        attachmentSlug: dto.attachmentSlug ?? null,
        equipmentNotes: dto.equipmentNotes ?? null,
        isRetired: false,
        retiredAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const activeKey = queryKeys.setupPresets.activeList();
      const allKey = queryKeys.setupPresets.allList();
      const prevActive = ctx.previousActive ?? [];
      const prevAll = ctx.previousAll ?? [];
      queryClient.setQueryData(activeKey, [optimistic, ...prevActive]);
      queryClient.setQueryData(allKey, [optimistic, ...prevAll]);
      return ctx;
    },
    onError: (err, _vars, context) => {
      logger.warn('mutations', 'useCreateSetupPreset failed, rolling back:', err.message);
      rollbackLists(queryClient, context);
    },
    onSettled: () => invalidateLists(queryClient),
  });
}

// ──────────────────────────────────────────────────────────────────────
// useUpdateSetupPreset
// ──────────────────────────────────────────────────────────────────────

interface UpdatePresetVariables {
  presetId: ID;
  dto: UpdateSetupPresetDTO;
}

/**
 * useUpdateSetupPreset — edit an existing preset. Optimistically patches
 * the matching row in both lists. Rolls back on error.
 */
export function useUpdateSetupPreset() {
  const queryClient = useQueryClient();

  return useMutation<SetupPreset, Error, UpdatePresetVariables, PresetListContext>({
    mutationFn: async ({ presetId, dto }) => {
      const res = await setupPresetRepository.update(presetId, dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ presetId, dto }): Promise<PresetListContext> => {
      const ctx = await snapshotLists(queryClient);
      const activeKey = queryKeys.setupPresets.activeList();
      const allKey = queryKeys.setupPresets.allList();
      const patchInList = (list: SetupPreset[] | undefined): SetupPreset[] | undefined => {
        if (!list) return list;
        let changed = false;
        const next = list.map((p) => {
          if (p.id !== presetId) return p;
          changed = true;
          return {
            ...p,
            label: dto.label !== undefined ? dto.label.trim() : p.label,
            capabilitySlug: dto.capabilitySlug ?? p.capabilitySlug,
            gripText: dto.gripText !== undefined ? dto.gripText : p.gripText,
            attachmentSlug: dto.attachmentSlug !== undefined ? dto.attachmentSlug : p.attachmentSlug,
            equipmentNotes: dto.equipmentNotes !== undefined ? dto.equipmentNotes : p.equipmentNotes,
            updatedAt: new Date().toISOString(),
          };
        });
        return changed ? next : list;
      };
      queryClient.setQueryData(activeKey, patchInList(ctx.previousActive));
      queryClient.setQueryData(allKey, patchInList(ctx.previousAll));
      return ctx;
    },
    onError: (err, _vars, context) => {
      logger.warn('mutations', 'useUpdateSetupPreset failed, rolling back:', err.message);
      rollbackLists(queryClient, context);
    },
    onSettled: () => invalidateLists(queryClient),
  });
}

// ──────────────────────────────────────────────────────────────────────
// useRetireSetupPreset / useUnretireSetupPreset
// ──────────────────────────────────────────────────────────────────────

interface PresetIdVariables {
  presetId: ID;
}

/**
 * Soft-retire a preset. Optimistically flips is_retired=TRUE +
 * retiredAt=NOW() and removes the row from the activeList (it stays in
 * allList because allList includes retired). Rolls back on error.
 */
export function useRetireSetupPreset() {
  const queryClient = useQueryClient();

  return useMutation<SetupPreset, Error, PresetIdVariables, PresetListContext>({
    mutationFn: async ({ presetId }) => {
      const res = await setupPresetRepository.retire(presetId);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ presetId }): Promise<PresetListContext> => {
      const ctx = await snapshotLists(queryClient);
      const activeKey = queryKeys.setupPresets.activeList();
      const allKey = queryKeys.setupPresets.allList();
      // activeList: drop the retired row.
      if (ctx.previousActive) {
        queryClient.setQueryData(
          activeKey,
          ctx.previousActive.filter((p) => p.id !== presetId),
        );
      }
      // allList: patch the row's retired state.
      if (ctx.previousAll) {
        queryClient.setQueryData(
          allKey,
          ctx.previousAll.map((p) =>
            p.id === presetId
              ? {
                  ...p,
                  isRetired: true,
                  retiredAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
      }
      return ctx;
    },
    onError: (err, _vars, context) => {
      logger.warn('mutations', 'useRetireSetupPreset failed, rolling back:', err.message);
      rollbackLists(queryClient, context);
    },
    onSettled: () => invalidateLists(queryClient),
  });
}

/**
 * Un-retire a preset. Optimistically flips is_retired=FALSE +
 * retiredAt=NULL and re-inserts the row into the activeList (the
 * allList entry has its retired state cleared). Rolls back on error.
 */
export function useUnretireSetupPreset() {
  const queryClient = useQueryClient();

  return useMutation<SetupPreset, Error, PresetIdVariables, PresetListContext>({
    mutationFn: async ({ presetId }) => {
      const res = await setupPresetRepository.unretire(presetId);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ presetId }): Promise<PresetListContext> => {
      const ctx = await snapshotLists(queryClient);
      const activeKey = queryKeys.setupPresets.activeList();
      const allKey = queryKeys.setupPresets.allList();
      // Find the row in allList to clone for activeList re-insertion.
      const inAll = ctx.previousAll?.find((p) => p.id === presetId);
      if (inAll && ctx.previousActive) {
        const restored: SetupPreset = {
          ...inAll,
          isRetired: false,
          retiredAt: null,
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData(activeKey, [restored, ...ctx.previousActive]);
      }
      if (ctx.previousAll) {
        queryClient.setQueryData(
          allKey,
          ctx.previousAll.map((p) =>
            p.id === presetId
              ? { ...p, isRetired: false, retiredAt: null, updatedAt: new Date().toISOString() }
              : p,
          ),
        );
      }
      return ctx;
    },
    onError: (err, _vars, context) => {
      logger.warn('mutations', 'useUnretireSetupPreset failed, rolling back:', err.message);
      rollbackLists(queryClient, context);
    },
    onSettled: () => invalidateLists(queryClient),
  });
}

// ──────────────────────────────────────────────────────────────────────
// useDeleteSetupPreset
// ──────────────────────────────────────────────────────────────────────

/**
 * Hard-delete a preset. Safe because Phase 6 has no FK from
 * workout_session_exercises to user_equipment_setup_presets — applied
 * preset values were COPIED into Phase 5 denormalized columns at save
 * time and survive deletion. Optimistically removes the row from both
 * lists. Rolls back on error.
 */
export function useDeleteSetupPreset() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PresetIdVariables, PresetListContext>({
    mutationFn: async ({ presetId }) => {
      const res = await setupPresetRepository.delete(presetId);
      if (!res.success) throw res.error;
    },
    onMutate: async ({ presetId }): Promise<PresetListContext> => {
      const ctx = await snapshotLists(queryClient);
      const activeKey = queryKeys.setupPresets.activeList();
      const allKey = queryKeys.setupPresets.allList();
      if (ctx.previousActive) {
        queryClient.setQueryData(
          activeKey,
          ctx.previousActive.filter((p) => p.id !== presetId),
        );
      }
      if (ctx.previousAll) {
        queryClient.setQueryData(
          allKey,
          ctx.previousAll.filter((p) => p.id !== presetId),
        );
      }
      return ctx;
    },
    onError: (err, _vars, context) => {
      logger.warn('mutations', 'useDeleteSetupPreset failed, rolling back:', err.message);
      rollbackLists(queryClient, context);
    },
    onSettled: () => invalidateLists(queryClient),
  });
}
