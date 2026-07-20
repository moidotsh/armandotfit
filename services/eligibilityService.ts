// services/eligibilityService.ts
//
// Pure eligibility + resolution functions over the Phase 1 catalog
// tables (exercise_equipment_requirement_paths +
// exercise_equipment_requirements + exercise_alternatives) and the
// Phase 2 user-equipment set. Mirrors constants/equipmentCapabilities.ts
// in shape: runtime data + helpers, no DB calls, no side effects.
//
// Two layers live here:
//   1. isExerciseEligible — AND-within-path / OR-across-path evaluation
//      of one exercise's requirement graph against a user equipment
//      inventory. Returns the satisfied path index for surfacing in the
//      replacement UI ("eligible via Machine path" vs "eligible via
//      Dumbbell path").
//   2. resolveSlot — the per-slot deterministic walk:
//        a. Manual override (if still eligible)
//        b. Template exercise if eligible
//        c. direct alternatives by priority
//        d. close alternatives by priority
//        e. fallback alternatives by priority
//        f. Unresolved (resolution='missing', chosenExerciseId=null)
//
// The plan generation service feeds the catalog data + user equipment
// set into these functions; the functions themselves never touch the
// DB. That keeps the resolution algorithm unit-testable without
// provisioning a live database.
//
// Resolution order is fixed and documented in
// shared/types/userPlan.ts → SlotResolution. A regression here is the
// single biggest source of "why did the preview pick X when Y is
// eligible" bugs.

import type { ID } from '../shared/types';
import type {
  AlternativeType,
} from '../shared/types/program';
import type { SlotResolution } from '../shared/types/userPlan';

// ──────────────────────────────────────────────────────────────────────
// Input shapes
// ──────────────────────────────────────────────────────────────────────

/**
 * One requirement node within a path. All requirements in a path must
 * be satisfied together (AND-within-path). Mirrors
 * exercise_equipment_requirements.
 */
export interface EquipmentRequirement {
  requirementPathId: ID;
  equipmentTypeId: ID;
  minQuantity: number;
}

/**
 * One complete way to perform an exercise. Paths are OR-across —
 * satisfying any complete path makes the exercise eligible. Mirrors
 * exercise_equipment_requirement_paths (with the joined requirements
 * inlined for batch-friendly loading).
 */
export interface RequirementPath {
  pathId: ID;
  pathIndex: number;
  rationale: string | null;
  requirements: EquipmentRequirement[];
}

/**
 * An exercise + its full requirement graph. The eligibility evaluator
 * walks paths in path_index order and returns the first satisfied one.
 */
export interface ExerciseRequirementGraph {
  exerciseId: ID;
  paths: RequirementPath[];
}

/**
 * Directional substitution edge from one exercise to another. Walked
 * in (alt_type, priority) order: direct before close before fallback,
 * lower priority first within each tier. Mirrors exercise_alternatives.
 */
export interface AlternativeEdge {
  edgeId: ID;
  sourceExerciseId: ID;
  altExerciseId: ID;
  altType: AlternativeType;
  priority: number;
  intentNote: string | null;
}

/**
 * User's available-equipment set. Keyed by equipment_type_id → count.
 * Count comes from user_available_equipment.quantity; most users will
 * have 1 of each so the eligibility check degenerates to a set
 * membership test, but the engine honors min_quantity correctly when
 * it doesn't.
 */
export type UserEquipmentInventory = ReadonlyMap<ID, number>;

/**
 * Manual override to consider first in the resolution order. Carries
 * the exercise + optional alternative-edge metadata so the persistence
 * layer can record where the override came from. Null when no override
 * exists for the slot.
 */
export interface ManualOverride {
  exerciseId: ID;
  altEdgeId?: ID | null;
  intentNote?: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Output shapes
// ──────────────────────────────────────────────────────────────────────

export type EligibilityResult =
  | { eligible: true; satisfiedPath: RequirementPath }
  | { eligible: false; satisfiedPath: null };

export interface SlotResolutionResult {
  resolution: SlotResolution;
  chosenExerciseId: ID | null;
  /**
   * The alternative edge that produced the chosen exercise, if any.
   * Null for template/missing resolutions and for manual overrides
   * that didn't come from a known alternatives-graph edge.
   */
  altEdge: AlternativeEdge | null;
  /**
   * Human-readable rationale for the resolution. Surfaced as an
   * eyebrow in the preview UI ("Template eligible via path 1",
   * "Direct alt for X", etc.).
   */
  rationale: string;
}

// ──────────────────────────────────────────────────────────────────────
// Eligibility evaluator
// ──────────────────────────────────────────────────────────────────────

/**
 * Evaluate one exercise's requirement graph against the user's
 * available-equipment inventory. Walks paths in path_index order and
 * returns the first satisfied one (OR-across). Within a path, every
 * requirement must be satisfied (AND-within) — equipment_type_id must
 * be present with quantity >= min_quantity.
 *
 * Returns { eligible: true, satisfiedPath } when any path is
 * satisfiable; { eligible: false, satisfiedPath: null } otherwise.
 *
 * Deterministic: paths are pre-sorted by path_index by the loader, so
 * the same input always yields the same satisfiedPath index.
 */
export function isExerciseEligible(
  graph: ExerciseRequirementGraph | undefined,
  inventory: UserEquipmentInventory,
): EligibilityResult {
  if (!graph || graph.paths.length === 0) {
    return { eligible: false, satisfiedPath: null };
  }
  // Defensive sort — the loader already sorts by path_index, but the
  // eligibility contract is "first satisfied path in path_index order"
  // so we re-sort here to make the function self-contained.
  const orderedPaths = [...graph.paths].sort((a, b) => a.pathIndex - b.pathIndex);
  for (const path of orderedPaths) {
    if (pathSatisfied(path, inventory)) {
      return { eligible: true, satisfiedPath: path };
    }
  }
  return { eligible: false, satisfiedPath: null };
}

function pathSatisfied(path: RequirementPath, inventory: UserEquipmentInventory): boolean {
  if (path.requirements.length === 0) {
    // A path with no requirements shouldn't exist (the seed always
    // attaches ≥1), but treat it as ineligible rather than trivially
    // eligible. The catalog test catches this case at seed time.
    return false;
  }
  for (const req of path.requirements) {
    const have = inventory.get(req.equipmentTypeId) ?? 0;
    if (have < req.minQuantity) return false;
  }
  return true;
}

// ──────────────────────────────────────────────────────────────────────
// Slot resolution
// ──────────────────────────────────────────────────────────────────────

/**
 * Resolve a single slot per the deterministic walk:
 *
 *   1. Manual override (if present AND the override's exercise is still
 *      eligible) → resolution='manual'.
 *   2. Template exercise if eligible → resolution='template'.
 *   3. direct alternatives by priority (lower priority first) — first
 *      eligible wins → resolution='direct'.
 *   4. close alternatives by priority → resolution='close'.
 *   5. fallback alternatives by priority → resolution='fallback'.
 *   6. Unresolved → resolution='missing', chosenExerciseId=null.
 *
 * Inputs:
 *   - templateExerciseId: the slot's program_slots.exercise_id.
 *   - graphsByExerciseId: lookup of requirement graph for the template
 *     exercise AND every alternative candidate. The loader pre-loads
 *     these for the variant's exercise set in one query.
 *   - alternativesBySource: lookup of alternative edges keyed by
 *     source_exercise_id.
 *   - inventory: user equipment map.
 *   - override: optional manual override to consider first.
 *
 * The function is pure — same inputs always yield the same output.
 */
export function resolveSlot(params: {
  templateExerciseId: ID;
  graphsByExerciseId: ReadonlyMap<ID, ExerciseRequirementGraph>;
  alternativesBySource: ReadonlyMap<ID, AlternativeEdge[]>;
  inventory: UserEquipmentInventory;
  override?: ManualOverride | null;
}): SlotResolutionResult {
  const {
    templateExerciseId,
    graphsByExerciseId,
    alternativesBySource,
    inventory,
    override,
  } = params;

  // 1. Manual override (must still be eligible — equipment changes
  // since the override was set can invalidate it).
  if (override) {
    const overrideGraph = graphsByExerciseId.get(override.exerciseId);
    const eligibility = isExerciseEligible(overrideGraph, inventory);
    if (eligibility.eligible) {
      return {
        resolution: 'manual',
        chosenExerciseId: override.exerciseId,
        altEdge: null,
        rationale: formatManualRationale(eligibility.satisfiedPath),
      };
    }
  }

  // 2. Template exercise.
  const templateGraph = graphsByExerciseId.get(templateExerciseId);
  const templateEligibility = isExerciseEligible(templateGraph, inventory);
  if (templateEligibility.eligible) {
    return {
      resolution: 'template',
      chosenExerciseId: templateExerciseId,
      altEdge: null,
      rationale: formatTemplateRationale(templateEligibility.satisfiedPath),
    };
  }

  // 3-5. Walk alternatives in tier + priority order.
  const tierOrder: AlternativeType[] = ['direct', 'close', 'fallback'];
  const alternatives = alternativesBySource.get(templateExerciseId) ?? [];
  for (const tier of tierOrder) {
    const inTier = alternatives
      .filter((edge) => edge.altType === tier)
      .sort((a, b) => a.priority - b.priority);
    for (const edge of inTier) {
      const altGraph = graphsByExerciseId.get(edge.altExerciseId);
      const altEligibility = isExerciseEligible(altGraph, inventory);
      if (altEligibility.eligible) {
        return {
          resolution: tier,
          chosenExerciseId: edge.altExerciseId,
          altEdge: edge,
          rationale: formatAlternativeRationale(tier, edge, altEligibility.satisfiedPath),
        };
      }
    }
  }

  // 6. Unresolved.
  return {
    resolution: 'missing',
    chosenExerciseId: null,
    altEdge: null,
    rationale: 'No eligible exercise found for your equipment.',
  };
}

// ──────────────────────────────────────────────────────────────────────
// Rationale formatters (returned with the resolution so the UI doesn't
// need to re-derive the explanation from raw path data)
// ──────────────────────────────────────────────────────────────────────

function formatTemplateRationale(path: RequirementPath): string {
  if (path.rationale) {
    return `Template eligible via ${path.rationale}.`;
  }
  return 'Template exercise is eligible for your equipment.';
}

function formatAlternativeRationale(
  tier: AlternativeType,
  edge: AlternativeEdge,
  path: RequirementPath,
): string {
  const tierLabel =
    tier === 'direct' ? 'Direct' : tier === 'close' ? 'Close' : 'Fallback';
  const reason = path.rationale ? ` via ${path.rationale}` : '';
  if (edge.intentNote) {
    return `${tierLabel} alternative — ${edge.intentNote}${reason}.`;
  }
  return `${tierLabel} alternative${reason}.`;
}

function formatManualRationale(path: RequirementPath): string {
  const reason = path.rationale ? ` via ${path.rationale}` : '';
  return `Manual pick is eligible${reason}.`;
}

// ──────────────────────────────────────────────────────────────────────
// Replacement candidate enumeration
// ──────────────────────────────────────────────────────────────────────

/**
 * One candidate exercise for the replacement UI. Carries the
 * alternative edge metadata (tier + priority + intent note) plus the
 * pre-computed eligibility flag so the UI can show eligible candidates
 * as tappable and ineligible ones as dimmed/disabled.
 */
export interface ReplacementCandidate {
  exerciseId: ID;
  altEdge: AlternativeEdge | null;
  eligible: boolean;
  satisfiedPath: RequirementPath | null;
}

/**
 * Enumerate replacement candidates for a slot, in display order:
 *   - Template exercise (altEdge=null) first.
 *   - All alternatives in tier + priority order.
 *
 * Each candidate carries its eligibility flag so the replacement UI
 * can render eligible candidates as tappable and ineligible ones as
 * disabled. This is what the manual replacement flow uses to source
 * its list — the resolver itself only cares about the first eligible
 * candidate; the UI shows all options.
 */
export function listReplacementCandidates(params: {
  templateExerciseId: ID;
  graphsByExerciseId: ReadonlyMap<ID, ExerciseRequirementGraph>;
  alternativesBySource: ReadonlyMap<ID, AlternativeEdge[]>;
  inventory: UserEquipmentInventory;
}): ReplacementCandidate[] {
  const { templateExerciseId, graphsByExerciseId, alternativesBySource, inventory } = params;
  const out: ReplacementCandidate[] = [];

  // Template exercise first (no alt edge).
  const templateGraph = graphsByExerciseId.get(templateExerciseId);
  const templateEligibility = isExerciseEligible(templateGraph, inventory);
  out.push({
    exerciseId: templateExerciseId,
    altEdge: null,
    eligible: templateEligibility.eligible,
    satisfiedPath: templateEligibility.eligible ? templateEligibility.satisfiedPath : null,
  });

  // Alternatives in tier + priority order.
  const tierOrder: AlternativeType[] = ['direct', 'close', 'fallback'];
  const alternatives = alternativesBySource.get(templateExerciseId) ?? [];
  for (const tier of tierOrder) {
    const inTier = alternatives
      .filter((edge) => edge.altType === tier)
      .sort((a, b) => a.priority - b.priority);
    for (const edge of inTier) {
      const graph = graphsByExerciseId.get(edge.altExerciseId);
      const eligibility = isExerciseEligible(graph, inventory);
      out.push({
        exerciseId: edge.altExerciseId,
        altEdge: edge,
        eligible: eligibility.eligible,
        satisfiedPath: eligibility.eligible ? eligibility.satisfiedPath : null,
      });
    }
  }

  return out;
}
