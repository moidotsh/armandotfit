// hooks/queries/usePlanLaunchHydration.ts
// Phase 4 launch-path resolver. Given an active draft + its plan context,
// returns the PlanHydrationSlot[] the workout-detail screen passes to
// workoutStore.hydrateFromPlan. Built as a single hook so the screen
// stays declarative — the three cached queries (plan, variant tree,
// chosen-exercise display data) are coordinated here.
//
// Inputs: the draft from workoutStore (already carries planId, splitType,
// day, sessionMode, sessionWindow from startSession's plan arg).
//
// Output: PlanHydrationSlot[] when every input has resolved; null while
// pending or when the draft isn't plan-backed. The screen treats null +
// launchSource==='plan' as "still resolving" and renders a spinner.
//
// This hook does NOT call hydrateFromPlan itself — the screen owns the
// hydration call (idempotency guard lives there, mirroring the suggested-
// exercises path).

import { useQuery } from '@tanstack/react-query';
import {
  exerciseRepository,
  userPlanRepository,
  programRepository,
} from '../../utils/supabase/repositories';
import { queryKeys } from '../../lib/react-query';
import {
  SPLIT_TO_VARIANT_SLUG,
  sessionWindowForLaunch,
  selectPlanSlotsForSession,
  buildHydrationPayloadFromResolved,
  type PlanHydrationSlot,
  type ResolvedPlanSlot,
} from '../../services';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';
import type { ID, PreferredSplit } from '../../shared/types';

/** Draft slice needed to resolve the hydration payload. */
export interface PlanLaunchDraftSlice {
  launchSource: 'plan' | 'static' | null;
  planId: ID | null;
  splitType: PreferredSplit;
  day: number;
  sessionMode: 'am' | 'pm';
}

/**
 * Resolve the plan-launch hydration payload for the given draft. Returns
 * null while pending; the caller must guard against re-hydration via a
 * ref + empty-draft check (same pattern as the suggested-exercises path).
 */
export function usePlanLaunchHydration(draft: PlanLaunchDraftSlice | null) {
  const variantSlug = draft
    ? SPLIT_TO_VARIANT_SLUG[draft.splitType]
    : null;

  return useQuery<PlanHydrationSlot[] | null>({
    queryKey: queryKeys.userPlans.launchHydration(
      draft?.planId ?? 'pending',
      draft?.splitType ?? 'oneADay',
      draft?.day ?? 0,
      draft?.sessionMode ?? 'am',
    ),
    queryFn: async () => {
      if (!draft || !draft.planId) return null;

      // 1. Plan + variant tree — both already cached by split-selection.
      const planRes = await userPlanRepository.findPlanById(draft.planId);
      if (!planRes.success) throw planRes.error;
      if (!planRes.data) return null;
      const plan = planRes.data;

      // variantTree lookup is cache-driven via useVariantTree at the
      // call site; here we resolve it through the repository directly so
      // the hook is self-contained.
      const treeRes = await programRepository.findVariantTree(variantSlug!);
      if (!treeRes.success) throw treeRes.error;
      if (!treeRes.data) return null;

      // 2. Filter plan slots down to the requested session.
      const window = sessionWindowForLaunch(
        draft.splitType as PreferredSplit,
        draft.sessionMode,
      );
      const sessionSlots = selectPlanSlotsForSession(
        plan,
        treeRes.data,
        draft.day,
        window,
      );
      if (sessionSlots.length === 0) return null;

      // 3. Resolve chosen-exercise display data via one batch lookup.
      //    We need slug + name + variation for each chosen exercise; the
      //    exercise row carries slug + name, variation lives in the
      //    TS-side SYSTEM_EXERCISES_BY_SLUG mirror.
      const chosenIds = sessionSlots
        .map((s) => s.slot.chosenExerciseId)
        .filter((id): id is ID => id !== null);
      if (chosenIds.length !== sessionSlots.length) return null;

      const exRes = await exerciseRepository.findByIds(chosenIds);
      if (!exRes.success) throw exRes.error;
      const byId = new Map(exRes.data.map((e) => [e.id, e]));

      // 4. Pair each plan slot entry with its resolved display data.
      //    Skip entries whose chosen exercise has no slug — system
      //    exercises always do; a null slug means a stale row reference
      //    we can't resolve to display data. (Shouldn't happen for an
      //    adopted plan, but defensive.)
      const resolved: ResolvedPlanSlot[] = [];
      for (const entry of sessionSlots) {
        const chosen = byId.get(entry.slot.chosenExerciseId as ID);
        if (!chosen) continue;
        if (!chosen.slug) continue;
        const tsData = SYSTEM_EXERCISES_BY_SLUG[chosen.slug];
        resolved.push({
          entry,
          chosenExerciseSlug: chosen.slug,
          chosenExerciseName: chosen.name,
          chosenExerciseVariation: tsData?.variation ?? null,
        });
      }
      if (resolved.length === 0) return null;

      return buildHydrationPayloadFromResolved(resolved);
    },
    enabled: !!draft && draft.launchSource === 'plan' && !!draft.planId,
    // The payload is launch-time-only; don't keep it cached across
    // sessions. A stale payload would race with a freshly-saved plan.
    staleTime: 0,
  });
}
