// hooks/queries/useUserPlans.ts
// Read paths for the user-owned program plan layer (Phase 3).
//
//   • useUserPlans          — all active plans for the current user
//   • useUserPlan           — single plan by id (with slots + overrides)
//   • useGeneratedPlanPreview — in-memory GeneratedPlan tree for a
//                                variant slug (pre-save preview)
//   • useReplacementCandidates — eligible alternatives for one slot
//                                 (drives the replacement UI)
//
// Cache contract: userPlans.* namespaces; the save + replace-slot
// mutations in hooks/mutations/useUserPlanMutations invalidate the
// right slices on settle.

import { useQuery } from '@tanstack/react-query';
import { userPlanRepository, exerciseRepository, programRepository } from '../../utils/supabase/repositories';
import {
  generatePlanForVariant,
  buildUserEquipmentInventory,
  listReplacementCandidates,
  type AlternativeEdge,
  type ExerciseRequirementGraph,
  type ReplacementCandidate,
} from '../../services';
import { queryKeys } from '../../lib/react-query';
import { useAuthStore } from '../../stores';
import type {
  ExerciseEquipmentRequirement,
  ExerciseEquipmentRequirementPath,
  ExerciseAlternative,
  ID,
} from '../../shared/types';

/**
 * Returns all active plans for the current user with slots + overrides
 * pre-joined. Empty array while the userId is unset or the row set
 * hasn't been fetched yet — consumers should treat `[]` + isLoading as
 * "still booting".
 */
export function useUserPlans() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.userPlans.activeList(),
    queryFn: async () => {
      if (!userId) return [];
      const res = await userPlanRepository.findActivePlansForUser(userId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId,
  });
}

/**
 * Returns a single plan by id with slots + overrides pre-joined.
 * Disabled until planId is provided.
 */
export function useUserPlan(planId: ID | null | undefined) {
  return useQuery({
    queryKey: planId ? queryKeys.userPlans.detail(planId) : ['userPlans', 'detail', 'pending'],
    queryFn: async () => {
      if (!planId) return null;
      const res = await userPlanRepository.findPlanById(planId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!planId,
  });
}

/**
 * Returns the user's active plan for a specific variant, or null if
 * the user has not adopted the variant yet.
 */
export function useActivePlanForVariant(variantId: ID | null | undefined) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: queryKeys.userPlans.activeForVariant(variantId ?? 'pending'),
    queryFn: async () => {
      if (!userId || !variantId) return null;
      const res = await userPlanRepository.findActivePlanForVariant(userId, variantId);
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId && !!variantId,
  });
}

/**
 * Generates a preview plan for the given variant slug. Loads the
 * variant tree + user equipment inventory + catalog requirement/
 * alternative graphs, runs the deterministic resolution per slot,
 * and returns the in-memory GeneratedPlan tree. The preview UI walks
 * this shape; the save mutation snapshots it into the persisted row
 * set on the user's confirmation.
 *
 * Disabled until variantSlug is provided.
 */
export function useGeneratedPlanPreview(variantSlug: string | null | undefined) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery({
    queryKey: variantSlug ? queryKeys.userPlans.preview(variantSlug) : ['userPlans', 'preview', 'pending'],
    queryFn: async () => {
      if (!variantSlug || !userId) return null;
      const res = await generatePlanForVariant({ variantSlug, userId });
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!userId && !!variantSlug,
  });
}

/**
 * Returns the list of replacement candidates for a single slot,
 * ordered: template exercise first, then alternatives in
 * (alt_type, priority) order. Each candidate carries its eligibility
 * flag so the replacement UI can render eligible candidates as
 * tappable and ineligible ones as disabled.
 *
 * Inputs: the slot's template exercise id + the user id (the slot's
 * plan id + plan slot id are NOT required — the candidate list is
 * a pure function of the catalog + the user's equipment).
 *
 * Disabled until templateExerciseId is provided.
 */
export function useReplacementCandidates(
  templateExerciseId: ID | null | undefined,
) {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<ReplacementCandidate[] | null>({
    queryKey: queryKeys.userPlans.candidates(templateExerciseId ?? 'pending'),
    queryFn: async () => {
      if (!userId || !templateExerciseId) return null;

      // Load alternatives first so the full exercise set (template +
      // alts) is known before loading requirement graphs.
      const [altRes, inventoryRes] = await Promise.all([
        exerciseRepository.listAlternativesForExercises([templateExerciseId]),
        buildUserEquipmentInventory(userId),
      ]);
      if (!altRes.success) throw altRes.error;
      if (!inventoryRes.success) throw inventoryRes.error;

      const allExerciseIds = new Set<ID>([templateExerciseId]);
      for (const edge of altRes.data) allExerciseIds.add(edge.altExerciseId);

      const pathsRes = await exerciseRepository.listRequirementPathsForExercises([...allExerciseIds]);
      if (!pathsRes.success) throw pathsRes.error;
      const requirementsRes = await exerciseRepository.listRequirementsForPaths(
        pathsRes.data.map((p) => p.id),
      );
      if (!requirementsRes.success) throw requirementsRes.error;

      // Build the engine-shape graphs + alternatives map.
      const graphsByExerciseId = buildRequirementGraphs(pathsRes.data, requirementsRes.data);
      const alternativesBySource = new Map<ID, AlternativeEdge[]>();
      alternativesBySource.set(
        templateExerciseId,
        altRes.data.map((e) => toEngineEdge(e)),
      );

      return listReplacementCandidates({
        templateExerciseId,
        graphsByExerciseId,
        alternativesBySource,
        inventory: inventoryRes.data,
      });
    },
    enabled: !!userId && !!templateExerciseId,
  });
}

// Local helpers — mirror the service-side buildRequirementGraphs +
// toEngineEdge but kept here so the hook is self-contained without
// exposing private functions from the service.

function toEngineEdge(row: ExerciseAlternative): AlternativeEdge {
  return {
    edgeId: row.id,
    sourceExerciseId: row.sourceExerciseId,
    altExerciseId: row.altExerciseId,
    altType: row.altType,
    priority: row.priority,
    intentNote: row.intentNote,
  };
}

function buildRequirementGraphs(
  paths: ExerciseEquipmentRequirementPath[],
  requirements: ExerciseEquipmentRequirement[],
): Map<ID, ExerciseRequirementGraph> {
  const requirementsByPath = new Map<ID, ExerciseEquipmentRequirement[]>();
  for (const req of requirements) {
    const list = requirementsByPath.get(req.requirementPathId) ?? [];
    list.push(req);
    requirementsByPath.set(req.requirementPathId, list);
  }
  const graphs = new Map<ID, ExerciseRequirementGraph>();
  for (const path of paths) {
    const graph = graphs.get(path.exerciseId) ?? {
      exerciseId: path.exerciseId,
      paths: [],
    };
    graph.paths.push({
      pathId: path.id,
      pathIndex: path.pathIndex,
      rationale: path.rationale,
      requirements: (requirementsByPath.get(path.id) ?? []).map((r) => ({
        requirementPathId: r.requirementPathId,
        equipmentTypeId: r.equipmentTypeId,
        minQuantity: r.minQuantity,
      })),
    });
    graphs.set(path.exerciseId, graph);
  }
  for (const graph of graphs.values()) {
    graph.paths.sort((a, b) => a.pathIndex - b.pathIndex);
  }
  return graphs;
}

// Re-exported for callers that also need the underlying repository
// (kept out of the index barrel to keep the barrel focused on hooks).
export { exerciseRepository, programRepository };
