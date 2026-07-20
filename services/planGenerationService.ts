// services/planGenerationService.ts
//
// Orchestrates the catalog reads + eligibility engine into a single
// in-memory GeneratedPlan tree. The preview UI walks this shape
// directly; the save mutation snapshots it into the persisted row set
// (UserProgramPlan + UserProgramPlanSlot).
//
// Inputs:
//   - A variant tree (loaded via ProgramRepository.findVariantTree).
//   - The user's available-equipment set (loaded via
//     ExerciseRepository.listAvailableEquipment).
//   - The user's capability selections (loaded via
//     ExerciseRepository.listEquipmentCapabilities) — resolved into
//     EquipmentSlug values and merged with the available-equipment
//     set per CLAUDE.md invariant #13: the capability layer is
//     advisory and the user_available_equipment relation stays
//     canonical. Phase 3 unions both sources so a capability
//     selection that hasn't been reconciled into a row yet still
//     drives eligibility.
//
// Output: a GeneratedPlan tree with one GeneratedPlanSlot per
// program_slots row, ordered by day → session → slot order_index.
//
// This service is the only place that translates between the
// engine's normalized shapes (ExerciseRequirementGraph, AlternativeEdge)
// and the repository's camelCased row shapes. Keeping the translation
// here means the engine stays shape-stable and the repo stays a
// thin data accessor.

import { exerciseRepository, programRepository, ok, err, type RepositoryResult, RepositoryErrorCode } from '../utils/supabase/repositories';
import { resolveCapabilitiesToEquipmentSlugs, type SelectedCapability } from '../constants/equipmentCapabilities';
import type {
  ExerciseEquipmentRequirement,
  ExerciseEquipmentRequirementPath,
  ExerciseAlternative,
  ID,
  UserAvailableEquipment,
  UserEquipmentCapability,
  ProgramVariantTree,
} from '../shared/types';
import type { EquipmentSlug } from '../shared/exercises/data';
import type { GeneratedPlan, GeneratedPlanSlot, PrescriptionSnapshot } from '../shared/types/userPlan';
import {
  type ExerciseRequirementGraph,
  type AlternativeEdge,
  type UserEquipmentInventory,
  resolveSlot,
} from './eligibilityService';

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

/**
 * Build a GeneratedPlan for the given variant + user. Loads:
 *   1. Variant tree (template_id, variant_id, day/session/slot tree).
 *   2. User's equipment inventory (capabilities resolved + available-
 *      equipment rows; union per CLAUDE.md invariant #13).
 *   3. Requirement paths + requirements + alternatives for every
 *      exercise referenced by the variant's slots.
 *
 * Then runs resolveSlot per slot and returns the plan tree.
 *
 * This is the in-memory shape the preview UI walks; the save mutation
 * snapshots it into the persisted row set on the user's confirmation.
 */
export async function generatePlanForVariant(params: {
  variantSlug: string;
  userId: ID;
}): Promise<RepositoryResult<GeneratedPlan>> {
  const { variantSlug, userId } = params;

  // 1. Variant tree.
  const variantRes = await programRepository.findVariantTree(variantSlug);
  if (!variantRes.success) return variantRes;
  if (!variantRes.data) {
    return err(
      `Variant not found: ${variantSlug}`,
      RepositoryErrorCode.NOT_FOUND,
    );
  }
  const variantTree = variantRes.data;

  // 2. User equipment inventory (union of capabilities resolved +
  // available-equipment rows).
  const inventoryRes = await buildUserEquipmentInventory(userId);
  if (!inventoryRes.success) return inventoryRes;
  const inventory = inventoryRes.data;

  // 3. Catalog data for every exercise referenced by the variant.
  // Collect template exercise IDs + walk the alternatives graph to
  // pre-load all candidate exercise IDs the resolver might consult.
  const templateExerciseIds = collectTemplateExerciseIds(variantTree);
  if (templateExerciseIds.length === 0) {
    return ok(
      buildEmptyPlan(variantTree.variant.programTemplateId, variantTree.variant.id, variantTree.variant.slug, variantTree.variant.name),
    );
  }

  // Load alternatives first so we can collect the full exercise ID set
  // (template IDs + alt IDs) before loading the requirement graphs.
  const altRes = await exerciseRepository.listAlternativesForExercises(templateExerciseIds);
  if (!altRes.success) return altRes;
  const alternatives = altRes.data;

  // All exercises whose requirement graph the resolver might consult:
  // every template exercise + every alternative target.
  const allExerciseIds = new Set<ID>(templateExerciseIds);
  for (const edge of alternatives) allExerciseIds.add(edge.altExerciseId);
  const allExerciseIdList = [...allExerciseIds];

  const pathsRes = await exerciseRepository.listRequirementPathsForExercises(allExerciseIdList);
  if (!pathsRes.success) return pathsRes;
  const requirementsRes = await exerciseRepository.listRequirementsForPaths(pathsRes.data.map((p) => p.id));
  if (!requirementsRes.success) return requirementsRes;

  const graphsByExerciseId = buildRequirementGraphs(pathsRes.data, requirementsRes.data);
  const alternativesBySource = groupAlternativesBySource(alternatives);

  // 4. Resolve each slot. chosenExerciseSlug is only populated when
  // the resolution is 'template' (where the template slot's slug is
  // already known from the variant tree). For substitutions the UI
  // looks up the chosen exercise by ID via ExerciseRepository —
  // keeping the slug lookup out of the service lets the engine stay
  // pure and avoids a second round-trip when the caller doesn't need
  // the slug (e.g. the persistence path uses IDs only).
  const days: GeneratedPlan['days'] = variantTree.days.map((dayItem) => ({
    dayId: dayItem.day.id,
    dayIndex: dayItem.day.dayIndex,
    dayTitle: dayItem.day.title,
    sessions: dayItem.sessions.map((sessionItem) => ({
      sessionId: sessionItem.session.id,
      sessionWindow: sessionItem.session.sessionWindow,
      sessionLabel: sessionItem.session.label,
      slots: sessionItem.slots.map((slot) => {
        const result = resolveSlot({
          templateExerciseId: slot.exerciseId,
          graphsByExerciseId,
          alternativesBySource,
          inventory,
          override: null, // No override during initial generation
        });
        return {
          templateSlot: slot,
          chosenExerciseSlug:
            result.resolution === 'template' ? slot.exerciseSlug : null,
          chosenExerciseId: result.chosenExerciseId,
          resolution: result.resolution,
          rationale: result.rationale,
        };
      }),
    })),
  }));

  return ok({
    templateId: variantTree.variant.programTemplateId,
    variantId: variantTree.variant.id,
    variantSlug: variantTree.variant.slug,
    variantName: variantTree.variant.name,
    days,
  });
}

/**
 * Build a UserEquipmentInventory (Map<equipment_type_id, quantity>) for
 * a user. The inventory is the union of:
 *   - Equipment slugs resolved from the user's capability selections
 *     (via constants/equipmentCapabilities.resolveCapabilitiesToEquipmentSlugs).
 *   - Rows in user_available_equipment (which may include user-managed
 *     entries not derived from capabilities).
 *
 * Both sources are needed because the capability layer's reconciliation
 * into user_available_equipment is additive + ON CONFLICT DO NOTHING —
 * a capability saved after the row already existed at default quantity
 * won't update the row, and a capability saved before reconciliation
 * runs won't have a row yet. Unioning both is the conservative read.
 */
export async function buildUserEquipmentInventory(
  userId: ID,
): Promise<RepositoryResult<UserEquipmentInventory>> {
  const [capsRes, availRes, slugToIdRes] = await Promise.all([
    exerciseRepository.listEquipmentCapabilities(userId),
    exerciseRepository.listAvailableEquipment(userId),
    exerciseRepository.findAllEquipmentTypes(),
  ]);
  if (!capsRes.success) return capsRes;
  if (!availRes.success) return availRes;
  if (!slugToIdRes.success) return slugToIdRes;

  const map = new Map<ID, number>();

  // (a) Capability-resolved slugs → equipment_type IDs.
  const selections: SelectedCapability[] = capsRes.data.map((row) => ({
    slug: row.capabilitySlug as SelectedCapability['slug'],
    details: row.details,
  }));
  const resolvedSlugs = new Set<EquipmentSlug>(resolveCapabilitiesToEquipmentSlugs(selections));
  for (const equipmentType of slugToIdRes.data) {
    if (equipmentType.slug && resolvedSlugs.has(equipmentType.slug as EquipmentSlug)) {
      map.set(equipmentType.id, Math.max(map.get(equipmentType.id) ?? 0, 1));
    }
  }

  // (b) user_available_equipment rows (canonical; may include user-
  // managed rows with quantity > 1 or notes). The MAX with (a) ensures
  // a capability-resolved row doesn't downgrade a user-managed quantity.
  for (const row of availRes.data as UserAvailableEquipment[]) {
    const existing = map.get(row.equipmentTypeId) ?? 0;
    map.set(row.equipmentTypeId, Math.max(existing, row.quantity));
  }

  return ok(map);
}

// ──────────────────────────────────────────────────────────────────────
// Helpers (private)
// ──────────────────────────────────────────────────────────────────────

function collectTemplateExerciseIds(tree: ProgramVariantTree): ID[] {
  // Extract template exercise IDs from the variant tree.
  const ids = new Set<ID>();
  for (const day of tree.days) {
    for (const session of day.sessions) {
      for (const slot of session.slots) {
        ids.add(slot.exerciseId);
      }
    }
  }
  return [...ids];
}

function buildRequirementGraphs(
  paths: ExerciseEquipmentRequirementPath[],
  requirements: ExerciseEquipmentRequirement[],
): Map<ID, ExerciseRequirementGraph> {
  // Group requirements by path id.
  const requirementsByPath = new Map<ID, ExerciseEquipmentRequirement[]>();
  for (const req of requirements) {
    const list = requirementsByPath.get(req.requirementPathId) ?? [];
    list.push(req);
    requirementsByPath.set(req.requirementPathId, list);
  }
  // Group paths by exercise id, building the engine's nested shape.
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
  // Sort each graph's paths by path_index — the engine's contract.
  for (const graph of graphs.values()) {
    graph.paths.sort((a, b) => a.pathIndex - b.pathIndex);
  }
  return graphs;
}

function groupAlternativesBySource(
  alternatives: ExerciseAlternative[],
): Map<ID, AlternativeEdge[]> {
  const map = new Map<ID, AlternativeEdge[]>();
  for (const alt of alternatives) {
    const list = map.get(alt.sourceExerciseId) ?? [];
    list.push({
      edgeId: alt.id,
      sourceExerciseId: alt.sourceExerciseId,
      altExerciseId: alt.altExerciseId,
      altType: alt.altType,
      priority: alt.priority,
      intentNote: alt.intentNote,
    });
    map.set(alt.sourceExerciseId, list);
  }
  return map;
}

function buildEmptyPlan(
  templateId: ID,
  variantId: ID,
  variantSlug: string,
  variantName: string,
): GeneratedPlan {
  return {
    templateId,
    variantId,
    variantSlug,
    variantName,
    days: [],
  };
}

/**
 * Build a prescription snapshot from a program_slots row. The snapshot
 * freezes the slot's prescription at adoption time so later template
 * edits can't silently mutate a saved plan.
 */
export function snapshotPrescription(slot: {
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  perSide: boolean;
  slotNotes: string | null;
}): PrescriptionSnapshot {
  return {
    setsMin: slot.setsMin,
    setsMax: slot.setsMax,
    repsMin: slot.repsMin,
    repsMax: slot.repsMax,
    perSide: slot.perSide,
    slotNotes: slot.slotNotes,
  };
}

/**
 * Flatten a GeneratedPlan into the per-slot DTO list the save mutation
 * consumes. Order matches the day → session → slot order of the
 * underlying tree.
 */
export function flattenGeneratedPlan(plan: GeneratedPlan): Array<{
  templateSlotId: ID;
  chosenExerciseId: ID | null;
  resolution: GeneratedPlanSlot['resolution'];
  prescriptionSnapshot: PrescriptionSnapshot;
}> {
  const out: Array<{
    templateSlotId: ID;
    chosenExerciseId: ID | null;
    resolution: GeneratedPlanSlot['resolution'];
    prescriptionSnapshot: PrescriptionSnapshot;
  }> = [];
  for (const day of plan.days) {
    for (const session of day.sessions) {
      for (const slot of session.slots) {
        out.push({
          templateSlotId: slot.templateSlot.id,
          chosenExerciseId: slot.chosenExerciseId,
          resolution: slot.resolution,
          prescriptionSnapshot: snapshotPrescription(slot.templateSlot),
        });
      }
    }
  }
  return out;
}

// Re-export for callers (hooks) that need to invoke the underlying
// engine helpers directly.
export {
  resolveSlot,
  isExerciseEligible,
  listReplacementCandidates,
} from './eligibilityService';
export type {
  ExerciseRequirementGraph,
  AlternativeEdge,
  ReplacementCandidate,
  SlotResolutionResult,
} from './eligibilityService';
