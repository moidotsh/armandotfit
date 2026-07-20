// __tests__/services/eligibility.test.ts
//
// Locks the Phase 3 eligibility engine + slot resolution contract:
//
//   • AND-within-path / OR-across-path semantics
//   • Structured capability matching (cable attachments, bench
//     positions encoded as distinct equipment_type_ids)
//   • Resolution order: override → template → direct → close →
//     fallback → missing
//   • Deterministic selection (same input → same output, no
//     nondeterminism)
//   • Unresolved slots surface as resolution='missing'
//   • listReplacementCandidates enumeration (manual-replacement
//     surface)
//
// All tests are pure-function — no DB. The plan generation service
// feeds real catalog data into these functions; a regression here is
// the single biggest source of "why did the preview pick X when Y
// is eligible" bugs.

import { describe, it, expect } from 'vitest';
import {
  isExerciseEligible,
  resolveSlot,
  listReplacementCandidates,
  type ExerciseRequirementGraph,
  type AlternativeEdge,
  type UserEquipmentInventory,
} from '../../services/eligibilityService';
import type { ID } from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/** Build an inventory map from equipment_type_id → quantity. */
function inventory(pairs: Array<[ID, number]>): UserEquipmentInventory {
  return new Map(pairs);
}

/** Build a single-path requirement graph. */
function singlePath(
  exerciseId: ID,
  equipmentIds: ID[],
  rationale: string | null = null,
): ExerciseRequirementGraph {
  return {
    exerciseId,
    paths: [
      {
        pathId: `path-${exerciseId}-1`,
        pathIndex: 1,
        rationale,
        requirements: equipmentIds.map((id) => ({
          requirementPathId: `path-${exerciseId}-1`,
          equipmentTypeId: id,
          minQuantity: 1,
        })),
      },
    ],
  };
}

/** Build a two-path OR-across requirement graph. */
function twoPath(
  exerciseId: ID,
  path1Equipment: ID[],
  path2Equipment: ID[],
): ExerciseRequirementGraph {
  return {
    exerciseId,
    paths: [
      {
        pathId: `path-${exerciseId}-1`,
        pathIndex: 1,
        rationale: 'Machine path',
        requirements: path1Equipment.map((id) => ({
          requirementPathId: `path-${exerciseId}-1`,
          equipmentTypeId: id,
          minQuantity: 1,
        })),
      },
      {
        pathId: `path-${exerciseId}-2`,
        pathIndex: 2,
        rationale: 'Dumbbell path',
        requirements: path2Equipment.map((id) => ({
          requirementPathId: `path-${exerciseId}-2`,
          equipmentTypeId: id,
          minQuantity: 1,
        })),
      },
    ],
  };
}

// Equipment IDs used in the tests (stable UUID-like strings).
const E = {
  BARBELL: 'eq-barbell',
  DUMBBELL: 'eq-dumbbell',
  KETTLEBELL: 'eq-kettlebell',
  INCLINE_BENCH: 'eq-incline-bench',
  FLAT_BENCH: 'eq-flat-bench',
  CABLE_ROPE: 'eq-cable-rope',
  CABLE_HANDLE: 'eq-cable-handle',
  CABLE_LAT_BAR: 'eq-cable-lat-bar',
  SHOULDER_PRESS_MACHINE: 'eq-shoulder-press-machine',
  TIBIA_RAISE_MACHINE: 'eq-tibia-raise-machine',
  RESISTANCE_BAND: 'eq-resistance-band',
  BACK_EXTENSION_STATION: 'eq-back-extension-station',
  PULL_UP_BAR: 'eq-pull-up-bar',
} as const;

// ──────────────────────────────────────────────────────────────────────
// 1. AND-within-path eligibility
// ──────────────────────────────────────────────────────────────────────

describe('AND-within-path eligibility', () => {
  it('barbell + incline-bench exercise: both required → both present → eligible', () => {
    const graph = singlePath('ex-incline-press', [E.BARBELL, E.INCLINE_BENCH]);
    const inv = inventory([[E.BARBELL, 1], [E.INCLINE_BENCH, 1]]);
    const result = isExerciseEligible(graph, inv);
    expect(result.eligible).toBe(true);
  });

  it('barbell + incline-bench exercise: missing incline-bench → ineligible', () => {
    const graph = singlePath('ex-incline-press', [E.BARBELL, E.INCLINE_BENCH]);
    const inv = inventory([[E.BARBELL, 1]]); // No incline bench
    const result = isExerciseEligible(graph, inv);
    expect(result.eligible).toBe(false);
  });

  it('missing barbell but has incline-bench → ineligible (AND not OR)', () => {
    const graph = singlePath('ex-incline-press', [E.BARBELL, E.INCLINE_BENCH]);
    const inv = inventory([[E.INCLINE_BENCH, 1]]); // No barbell
    const result = isExerciseEligible(graph, inv);
    expect(result.eligible).toBe(false);
  });

  it('bulgarian split squat: dumbbell + flat-bench both required', () => {
    const graph = singlePath('ex-bulgarian', [E.DUMBBELL, E.FLAT_BENCH]);
    expect(isExerciseEligible(graph, inventory([[E.DUMBBELL, 1], [E.FLAT_BENCH, 1]])).eligible).toBe(true);
    expect(isExerciseEligible(graph, inventory([[E.DUMBBELL, 1]])).eligible).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. OR-across-path eligibility
// ──────────────────────────────────────────────────────────────────────

describe('OR-across-path eligibility', () => {
  it('shoulder-press-machine-or-dumbbell: machine path 1 alone → eligible', () => {
    const graph = twoPath('ex-sp', [E.SHOULDER_PRESS_MACHINE], [E.DUMBBELL]);
    const inv = inventory([[E.SHOULDER_PRESS_MACHINE, 1]]);
    const result = isExerciseEligible(graph, inv);
    expect(result.eligible).toBe(true);
    expect(result.eligible && result.satisfiedPath.pathIndex).toBe(1);
  });

  it('shoulder-press-machine-or-dumbbell: dumbbell path 2 alone → eligible', () => {
    const graph = twoPath('ex-sp', [E.SHOULDER_PRESS_MACHINE], [E.DUMBBELL]);
    const inv = inventory([[E.DUMBBELL, 1]]);
    const result = isExerciseEligible(graph, inv);
    expect(result.eligible).toBe(true);
    expect(result.eligible && result.satisfiedPath.pathIndex).toBe(2);
  });

  it('tibia-raise-machine-or-band: neither path → ineligible', () => {
    const graph = twoPath('ex-tibia', [E.TIBIA_RAISE_MACHINE], [E.RESISTANCE_BAND]);
    const inv = inventory([[E.BARBELL, 1]]);
    expect(isExerciseEligible(graph, inv).eligible).toBe(false);
  });

  it('returns the lower-indexed satisfied path first (deterministic)', () => {
    // Both paths satisfiable → path 1 wins.
    const graph = twoPath('ex-sp', [E.SHOULDER_PRESS_MACHINE], [E.DUMBBELL]);
    const inv = inventory([[E.SHOULDER_PRESS_MACHINE, 1], [E.DUMBBELL, 1]]);
    const result = isExerciseEligible(graph, inv);
    expect(result.eligible && result.satisfiedPath.pathIndex).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. Structured capability matching (cable attachments + bench positions
//    encoded as distinct equipment_type_ids — Phase 1 already split them)
// ──────────────────────────────────────────────────────────────────────

describe('structured capability matching (distinct equipment_type_ids)', () => {
  it('overhead-tricep-extension-cable: cable-rope specifically required', () => {
    // The Phase 1 seed encodes cable attachment as a specific
    // equipment_type_id (cable-rope), not a JSONB predicate. A user
    // with a cable-handle attachment but no rope must be ineligible.
    const graph = singlePath('ex-triext', [E.CABLE_ROPE]);
    expect(isExerciseEligible(graph, inventory([[E.CABLE_ROPE, 1]])).eligible).toBe(true);
    expect(isExerciseEligible(graph, inventory([[E.CABLE_HANDLE, 1]])).eligible).toBe(false);
  });

  it('egyptian-cable-lateral-raise: cable-handle specifically required', () => {
    const graph = singlePath('ex-egypt', [E.CABLE_HANDLE]);
    expect(isExerciseEligible(graph, inventory([[E.CABLE_HANDLE, 1]])).eligible).toBe(true);
    expect(isExerciseEligible(graph, inventory([[E.CABLE_ROPE, 1]])).eligible).toBe(false);
  });

  it('lat-pulldown-reverse-grip: cable-lat-bar specifically required', () => {
    const graph = singlePath('ex-latpulldown', [E.CABLE_LAT_BAR]);
    expect(isExerciseEligible(graph, inventory([[E.CABLE_LAT_BAR, 1]])).eligible).toBe(true);
    expect(isExerciseEligible(graph, inventory([[E.CABLE_HANDLE, 1]])).eligible).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. Resolution order (override → template → direct → close → fallback → missing)
// ──────────────────────────────────────────────────────────────────────

describe('resolveSlot — order', () => {
  const templateId: ID = 'ex-template';
  const directId: ID = 'ex-direct';
  const closeId: ID = 'ex-close';
  const fallbackId: ID = 'ex-fallback';

  const graphsByExerciseId = new Map<ID, ExerciseRequirementGraph>([
    [templateId, singlePath(templateId, [E.BARBELL])],
    [directId, singlePath(directId, [E.DUMBBELL])],
    [closeId, singlePath(closeId, [E.KETTLEBELL])],
    [fallbackId, singlePath(fallbackId, [E.RESISTANCE_BAND])],
  ]);

  const alternativesBySource = new Map<ID, AlternativeEdge[]>([
    [
      templateId,
      [
        {
          edgeId: 'edge-1',
          sourceExerciseId: templateId,
          altExerciseId: directId,
          altType: 'direct',
          priority: 1,
          intentNote: 'Direct sub.',
        },
        {
          edgeId: 'edge-2',
          sourceExerciseId: templateId,
          altExerciseId: closeId,
          altType: 'close',
          priority: 1,
          intentNote: 'Close sub.',
        },
        {
          edgeId: 'edge-3',
          sourceExerciseId: templateId,
          altExerciseId: fallbackId,
          altType: 'fallback',
          priority: 1,
          intentNote: 'Fallback sub.',
        },
      ],
    ],
  ]);

  it('template-eligible → resolution=template', () => {
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inventory([[E.BARBELL, 1]]),
    });
    expect(result.resolution).toBe('template');
    expect(result.chosenExerciseId).toBe(templateId);
  });

  it('template-ineligible, direct-eligible → resolution=direct', () => {
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inventory([[E.DUMBBELL, 1]]),
    });
    expect(result.resolution).toBe('direct');
    expect(result.chosenExerciseId).toBe(directId);
  });

  it('template-ineligible, direct-ineligible, close-eligible → resolution=close', () => {
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inventory([['eq-kettlebell', 1]]),
    });
    expect(result.resolution).toBe('close');
    expect(result.chosenExerciseId).toBe(closeId);
  });

  it('template + direct + close ineligible, fallback-eligible → resolution=fallback', () => {
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inventory([[E.RESISTANCE_BAND, 1]]),
    });
    expect(result.resolution).toBe('fallback');
    expect(result.chosenExerciseId).toBe(fallbackId);
  });

  it('nothing eligible → resolution=missing', () => {
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inventory([]),
    });
    expect(result.resolution).toBe('missing');
    expect(result.chosenExerciseId).toBeNull();
  });

  it('override present and eligible → resolution=manual (skips template check)', () => {
    const overrideId: ID = 'ex-override';
    const graphs = new Map(graphsByExerciseId);
    graphs.set(overrideId, singlePath(overrideId, [E.DUMBBELL]));
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource,
      inventory: inventory([[E.BARBELL, 1], [E.DUMBBELL, 1]]), // both template + override eligible
      override: { exerciseId: overrideId },
    });
    expect(result.resolution).toBe('manual');
    expect(result.chosenExerciseId).toBe(overrideId);
  });

  it('override present but ineligible → falls through to template resolution', () => {
    const overrideId: ID = 'ex-override-bad';
    const graphs = new Map(graphsByExerciseId);
    graphs.set(overrideId, singlePath(overrideId, [E.CABLE_ROPE]));
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource,
      inventory: inventory([[E.BARBELL, 1]]), // template eligible, override ineligible
      override: { exerciseId: overrideId },
    });
    expect(result.resolution).toBe('template');
    expect(result.chosenExerciseId).toBe(templateId);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 5. Deterministic selection
// ──────────────────────────────────────────────────────────────────────

describe('resolveSlot — determinism', () => {
  const templateId: ID = 'ex-template';
  const direct1: ID = 'ex-direct-1';
  const direct2: ID = 'ex-direct-2';

  const graphsByExerciseId = new Map<ID, ExerciseRequirementGraph>([
    [templateId, singlePath(templateId, [E.BARBELL])],
    [direct1, singlePath(direct1, [E.DUMBBELL])],
    [direct2, singlePath(direct2, [E.KETTLEBELL])],
  ]);

  const alternativesBySource = new Map<ID, AlternativeEdge[]>([
    [
      templateId,
      [
        { edgeId: 'e1', sourceExerciseId: templateId, altExerciseId: direct1, altType: 'direct', priority: 1, intentNote: null },
        { edgeId: 'e2', sourceExerciseId: templateId, altExerciseId: direct2, altType: 'direct', priority: 2, intentNote: null },
      ],
    ],
  ]);

  it('two eligible direct alts: lower priority wins (deterministic)', () => {
    const inv = inventory([[E.DUMBBELL, 1], ['eq-kettlebell', 1]]);
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inv,
    });
    expect(result.chosenExerciseId).toBe(direct1);
  });

  it('first call == second call (idempotent)', () => {
    const inv = inventory([[E.DUMBBELL, 1]]);
    const r1 = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inv,
    });
    const r2 = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inv,
    });
    expect(r2).toEqual(r1);
  });

  it('alternatives list with shuffled order yields the same chosen id', () => {
    const shuffled: AlternativeEdge[] = [
      { edgeId: 'e2', sourceExerciseId: templateId, altExerciseId: direct2, altType: 'direct', priority: 2, intentNote: null },
      { edgeId: 'e1', sourceExerciseId: templateId, altExerciseId: direct1, altType: 'direct', priority: 1, intentNote: null },
    ];
    const altMap = new Map(alternativesBySource);
    altMap.set(templateId, shuffled);
    const inv = inventory([[E.DUMBBELL, 1], ['eq-kettlebell', 1]]);
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource: altMap,
      inventory: inv,
    });
    expect(result.chosenExerciseId).toBe(direct1);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 6. Unresolved slots
// ──────────────────────────────────────────────────────────────────────

describe('resolveSlot — unresolved', () => {
  it('missing template graph → resolution=missing', () => {
    const result = resolveSlot({
      templateExerciseId: 'ex-orphan',
      graphsByExerciseId: new Map(), // no graph
      alternativesBySource: new Map(),
      inventory: inventory([[E.BARBELL, 1]]),
    });
    expect(result.resolution).toBe('missing');
    expect(result.chosenExerciseId).toBeNull();
    expect(result.altEdge).toBeNull();
  });

  it('all alternatives exhausted → resolution=missing', () => {
    const templateId: ID = 'ex-template';
    const alt1: ID = 'ex-alt-1';
    const graphs = new Map<ID, ExerciseRequirementGraph>([
      [templateId, singlePath(templateId, [E.BARBELL])],
      [alt1, singlePath(alt1, [E.DUMBBELL])],
    ]);
    const altMap = new Map<ID, AlternativeEdge[]>([
      [templateId, [
        { edgeId: 'e1', sourceExerciseId: templateId, altExerciseId: alt1, altType: 'direct', priority: 1, intentNote: null },
      ]],
    ]);
    const result = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource: altMap,
      inventory: inventory([]), // nothing available
    });
    expect(result.resolution).toBe('missing');
  });

  it('missing rationale surfaces a stable string', () => {
    const result = resolveSlot({
      templateExerciseId: 'ex-orphan',
      graphsByExerciseId: new Map(),
      alternativesBySource: new Map(),
      inventory: inventory([]),
    });
    expect(result.rationale).toMatch(/No eligible exercise/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 7. listReplacementCandidates (manual-replacement surface)
// ──────────────────────────────────────────────────────────────────────

describe('listReplacementCandidates', () => {
  const templateId: ID = 'ex-template';
  const directId: ID = 'ex-direct';
  const closeId: ID = 'ex-close';
  const ineligibleId: ID = 'ex-no-eq';

  const graphs = new Map<ID, ExerciseRequirementGraph>([
    [templateId, singlePath(templateId, [E.BARBELL])],
    [directId, singlePath(directId, [E.DUMBBELL])],
    [closeId, singlePath(closeId, [E.KETTLEBELL])],
    [ineligibleId, singlePath(ineligibleId, [E.CABLE_ROPE])],
  ]);

  const altMap = new Map<ID, AlternativeEdge[]>([
    [templateId, [
      { edgeId: 'e1', sourceExerciseId: templateId, altExerciseId: directId, altType: 'direct', priority: 1, intentNote: 'Direct' },
      { edgeId: 'e2', sourceExerciseId: templateId, altExerciseId: closeId, altType: 'close', priority: 1, intentNote: 'Close' },
      { edgeId: 'e3', sourceExerciseId: templateId, altExerciseId: ineligibleId, altType: 'fallback', priority: 1, intentNote: 'Fallback' },
    ]],
  ]);

  it('returns template + alternatives in tier+priority order', () => {
    const candidates = listReplacementCandidates({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource: altMap,
      inventory: inventory([[E.BARBELL, 1], [E.DUMBBELL, 1]]),
    });
    expect(candidates.map((c) => c.exerciseId)).toEqual([
      templateId, // template first
      directId,   // direct tier
      closeId,    // close tier
      ineligibleId, // fallback tier
    ]);
  });

  it('marks ineligible candidates correctly', () => {
    const candidates = listReplacementCandidates({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource: altMap,
      inventory: inventory([[E.DUMBBELL, 1]]),
    });
    const byId = new Map(candidates.map((c) => [c.exerciseId, c]));
    expect(byId.get(templateId)?.eligible).toBe(false);
    expect(byId.get(directId)?.eligible).toBe(true);
    expect(byId.get(closeId)?.eligible).toBe(false);
    expect(byId.get(ineligibleId)?.eligible).toBe(false);
  });

  it('returns just the template when no alternatives exist', () => {
    const candidates = listReplacementCandidates({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource: new Map(), // no alts
      inventory: inventory([[E.BARBELL, 1]]),
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].exerciseId).toBe(templateId);
    expect(candidates[0].altEdge).toBeNull();
    expect(candidates[0].eligible).toBe(true);
  });

  it('satisfiedPath is populated on eligible candidates, null on ineligible', () => {
    const candidates = listReplacementCandidates({
      templateExerciseId: templateId,
      graphsByExerciseId: graphs,
      alternativesBySource: altMap,
      inventory: inventory([[E.DUMBBELL, 1]]),
    });
    const direct = candidates.find((c) => c.exerciseId === directId);
    const template = candidates.find((c) => c.exerciseId === templateId);
    expect(direct?.satisfiedPath).not.toBeNull();
    expect(template?.satisfiedPath).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────
// 8. min_quantity semantics
// ──────────────────────────────────────────────────────────────────────

describe('min_quantity semantics', () => {
  it('min_quantity=2 with quantity=1 → ineligible', () => {
    const graph: ExerciseRequirementGraph = {
      exerciseId: 'ex-double',
      paths: [{
        pathId: 'p1',
        pathIndex: 1,
        rationale: null,
        requirements: [{
          requirementPathId: 'p1',
          equipmentTypeId: E.BARBELL,
          minQuantity: 2,
        }],
      }],
    };
    expect(isExerciseEligible(graph, inventory([[E.BARBELL, 1]])).eligible).toBe(false);
    expect(isExerciseEligible(graph, inventory([[E.BARBELL, 2]])).eligible).toBe(true);
  });

  it('absent equipment_type_id is treated as quantity 0', () => {
    const graph = singlePath('ex-test', [E.BARBELL]);
    expect(isExerciseEligible(graph, inventory([])).eligible).toBe(false);
    expect(isExerciseEligible(graph, new Map()).eligible).toBe(false);
  });
});
