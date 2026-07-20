// hooks/mutations/useUserPlanMutations.ts
// Mutation hooks for the user-owned plan layer (Phase 3).
//
//   • useSaveUserPlan   — adopt or replace a plan from a GeneratedPlan
//   • useReplacePlanSlot — apply a manual override to a slot
//
// Cache contract (D3): both mutations touch the cache on the way in
// (optimistic update where applicable), roll back on error, and
// invalidate on settle so the server-authoritative row set takes
// over. Mirrors hooks/mutations/useSaveEquipmentCapabilities.ts.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userPlanRepository } from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../stores';
import { flattenGeneratedPlan } from '../../services';
import type {
  GeneratedPlan,
  ReplacePlanSlotDTO,
  SavePlanDTO,
  UserProgramPlanSlotOverride,
  UserProgramPlanWithSlots,
  ID,
} from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// useSaveUserPlan
// ──────────────────────────────────────────────────────────────────────

interface SavePlanContext {
  previousActiveList?: UserProgramPlanWithSlots[];
}

/**
 * useSaveUserPlan — adopt or replace a plan from a GeneratedPlan tree.
 * Flattens the tree into per-slot DTO entries and delegates to
 * UserPlanRepository.savePlan. Invalidates the userPlans.activeList
 * key on settle so the saved plan appears in subsequent reads.
 *
 * No optimistic update: the saved plan's server-generated fields (slot
 * IDs, override IDs, timestamps) can't be predicted client-side, so
 * we'd have to synthesize them — easier to let the settle invalidate
 * pull the authoritative row set.
 */
export function useSaveUserPlan() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const activeListKey = queryKeys.userPlans.activeList();

  return useMutation<
    UserProgramPlanWithSlots,
    Error,
    GeneratedPlan,
    SavePlanContext
  >({
    mutationFn: async (plan: GeneratedPlan) => {
      if (!userId) {
        // s10-exempt: programmer-error guard. The preview UI only
        // renders for an authenticated user.
        throw new Error('Cannot save plan: no authenticated user');
      }
      const dto: SavePlanDTO = {
        templateId: plan.templateId,
        variantId: plan.variantId,
        slots: flattenGeneratedPlan(plan),
      };
      const res = await userPlanRepository.savePlan(userId, dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (): Promise<SavePlanContext> => {
      await queryClient.cancelQueries({ queryKey: activeListKey });
      const previousActiveList =
        queryClient.getQueryData<UserProgramPlanWithSlots[]>(activeListKey);
      return { previousActiveList };
    },
    onError: (err, _plan, context) => {
      logger.warn(
        'mutations',
        'useSaveUserPlan failed, rolling back cache:',
        err.message,
      );
      if (context?.previousActiveList !== undefined) {
        queryClient.setQueryData(activeListKey, context.previousActiveList);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userPlans.activeList() });
      // Invalidate the specific plan preview so a subsequent re-preview
      // picks up any catalog changes that landed between save + re-preview.
      queryClient.invalidateQueries({
        queryKey: queryKeys.userPlans.preview(variables.variantSlug),
      });
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// useReplacePlanSlot
// ──────────────────────────────────────────────────────────────────────

interface ReplaceSlotContext {
  previousPlan?: UserProgramPlanWithSlots | null;
  previousList?: UserProgramPlanWithSlots[];
}

interface ReplaceSlotVariables {
  planId: ID;
  planSlotId: ID;
  chosenExerciseId: ID;
  altEdgeId?: ID | null;
  intentNote?: string | null;
}

/**
 * useReplacePlanSlot — apply a manual override to a slot. Optimistically
 * updates both the per-plan detail cache and the active-list cache so
 * the UI flips immediately; rolls back on error; invalidates on settle.
 */
export function useReplacePlanSlot() {
  const queryClient = useQueryClient();
  const activeListKey = queryKeys.userPlans.activeList();

  return useMutation<
    UserProgramPlanSlotOverride,
    Error,
    ReplaceSlotVariables,
    ReplaceSlotContext
  >({
    mutationFn: async (vars: ReplaceSlotVariables) => {
      const dto: ReplacePlanSlotDTO = {
        planSlotId: vars.planSlotId,
        chosenExerciseId: vars.chosenExerciseId,
        altEdgeId: vars.altEdgeId ?? null,
        intentNote: vars.intentNote ?? null,
      };
      const res = await userPlanRepository.replaceSlot(dto);
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (vars): Promise<ReplaceSlotContext> => {
      const planKey = queryKeys.userPlans.detail(vars.planId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: planKey }),
        queryClient.cancelQueries({ queryKey: activeListKey }),
      ]);
      const previousPlan =
        queryClient.getQueryData<UserProgramPlanWithSlots | null>(planKey) ?? null;
      const previousList =
        queryClient.getQueryData<UserProgramPlanWithSlots[]>(activeListKey);

      // Optimistic: patch the slot's chosen_exercise_id + resolution
      // in both caches so the UI flips immediately.
      const optimisticPlan = applyOptimisticOverride(previousPlan, vars);
      if (optimisticPlan !== previousPlan) {
        queryClient.setQueryData(planKey, optimisticPlan);
      }
      if (previousList) {
        const optimisticList = previousList.map((p) =>
          p.id === vars.planId ? applyOptimisticOverride(p, vars) : p,
        );
        queryClient.setQueryData(activeListKey, optimisticList);
      }

      return { previousPlan, previousList };
    },
    onError: (err, vars, context) => {
      logger.warn(
        'mutations',
        'useReplacePlanSlot failed, rolling back cache:',
        err.message,
      );
      const planKey = queryKeys.userPlans.detail(vars.planId);
      if (context?.previousPlan !== undefined) {
        queryClient.setQueryData(planKey, context.previousPlan);
      }
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(activeListKey, context.previousList);
      }
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userPlans.detail(vars.planId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.userPlans.activeList() });
    },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/**
 * Apply the optimistic override to a plan's slot row in-place. Returns
 * the same reference if the slot isn't in the plan (no copy needed).
 */
function applyOptimisticOverride(
  plan: UserProgramPlanWithSlots | null,
  vars: ReplaceSlotVariables,
): UserProgramPlanWithSlots | null {
  if (!plan) return plan;
  const slotIndex = plan.slots.findIndex((s) => s.slot.id === vars.planSlotId);
  if (slotIndex === -1) return plan;
  const slotEntry = plan.slots[slotIndex];
  const nextSlot: typeof slotEntry = {
    slot: {
      ...slotEntry.slot,
      chosenExerciseId: vars.chosenExerciseId,
      resolution: 'manual',
    },
    override: {
      id: slotEntry.override?.id ?? `optimistic-${vars.planSlotId}`,
      planSlotId: vars.planSlotId,
      chosenExerciseId: vars.chosenExerciseId,
      altEdgeId: vars.altEdgeId ?? null,
      intentNote: vars.intentNote ?? null,
      createdAt: slotEntry.override?.createdAt ?? new Date().toISOString(),
    },
  };
  const nextSlots = [...plan.slots];
  nextSlots[slotIndex] = nextSlot;
  return { ...plan, slots: nextSlots };
}
