// __tests__/repositories/UserPlanRepository.test.ts
//
// Locks the adoption-completeness contract: a plan with any
// resolution='missing' or chosenExerciseId=null slot cannot become
// an active adopted plan. Enforcement lives in
// `validatePlanForAdoption` (the pure validator exported from
// UserPlanRepository.ts) which `savePlan` runs at the top of its
// try block — so UI bypass cannot create an incomplete active plan.
//
// The four canonical scenarios from the Phase 3 correction brief:
//
//   1. A complete plan can be adopted.
//   2. A plan with one missing slot cannot be adopted.
//   3. Resolving that slot with an eligible manual replacement
//      makes adoption possible.
//   4. An ineligible manual override still cannot make a plan
//      adoptable.
//
// Tests 1-2 are direct calls against `validatePlanForAdoption`.
// Tests 3-4 use the real `resolveSlot` engine to produce the slot
// resolutions, then run the validator — so the contract is verified
// end-to-end (engine output → adoption gate) without mocking supabase.

import { describe, it, expect } from 'vitest';
import { validatePlanForAdoption } from '../../utils/supabase/repositories/UserPlanRepository';
import {
  resolveSlot,
  type ExerciseRequirementGraph,
  type AlternativeEdge,
  type UserEquipmentInventory,
} from '../../services/eligibilityService';
import type {
  SavePlanDTO,
  SlotResolution,
  PrescriptionSnapshot,
  ID,
} from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

const SNAP: PrescriptionSnapshot = {
  setsMin: 2,
  setsMax: 3,
  repsMin: 8,
  repsMax: 12,
  perSide: false,
  slotNotes: null,
};

/** Build a SavePlanDTO slot list entry with the given resolution + id. */
function slot(
  templateSlotId: ID,
  resolution: SlotResolution,
  chosenExerciseId: ID | null,
): NonNullable<SavePlanDTO['slots']>[number] {
  return {
    templateSlotId,
    chosenExerciseId,
    resolution,
    prescriptionSnapshot: SNAP,
  };
}

/** Standard equipment IDs used by the engine tests. */
const EQ = {
  BARBELL: 'eq-barbell',
  DUMBBELL: 'eq-dumbbell',
  CABLE_ROPE: 'eq-cable-rope',
} as const;

function singlePathGraph(exerciseId: ID, equipmentIds: ID[]): ExerciseRequirementGraph {
  return {
    exerciseId,
    paths: [
      {
        pathId: `path-${exerciseId}`,
        pathIndex: 1,
        rationale: null,
        requirements: equipmentIds.map((id) => ({
          requirementPathId: `path-${exerciseId}`,
          equipmentTypeId: id,
          minQuantity: 1,
        })),
      },
    ],
  };
}

function inventory(pairs: Array<[ID, number]>): UserEquipmentInventory {
  return new Map(pairs);
}

/**
 * Run resolveSlot + convert to a SavePlanDTO slot entry. Mirrors what
 * generatePlanForVariant + flattenGeneratedPlan produce for the save
 * mutation. This is the integration cut point: the engine decides
 * resolution + chosenExerciseId; the validator decides adoptability.
 */
function slotFromResolve(
  templateSlotId: ID,
  resolved: ReturnType<typeof resolveSlot>,
): NonNullable<SavePlanDTO['slots']>[number] {
  return slot(templateSlotId, resolved.resolution, resolved.chosenExerciseId);
}

// ──────────────────────────────────────────────────────────────────────
// 1. Complete plan — adoptable
// ──────────────────────────────────────────────────────────────────────

describe('validatePlanForAdoption — complete plan', () => {
  it('a fully-resolved single-slot plan passes', () => {
    const result = validatePlanForAdoption([
      slot('slot-1', 'template', 'ex-1'),
    ]);
    expect(result.success).toBe(true);
  });

  it('a fully-resolved multi-slot plan with mixed resolutions passes', () => {
    const result = validatePlanForAdoption([
      slot('slot-1', 'template', 'ex-1'),
      slot('slot-2', 'direct', 'ex-2'),
      slot('slot-3', 'close', 'ex-3'),
      slot('slot-4', 'fallback', 'ex-4'),
      slot('slot-5', 'manual', 'ex-5'),
    ]);
    expect(result.success).toBe(true);
  });

  it('a large plan mirroring the seeded 28-slot one-a-day variant passes', () => {
    const slots = Array.from({ length: 28 }, (_, i) =>
      slot(`slot-${i + 1}`, 'template', `ex-${i + 1}`),
    );
    const result = validatePlanForAdoption(slots);
    expect(result.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. Incomplete plan — rejected
// ──────────────────────────────────────────────────────────────────────

describe('validatePlanForAdoption — incomplete plan', () => {
  it('rejects an empty slot list', () => {
    const result = validatePlanForAdoption([]);
    expect(result.success).toBe(false);
  });

  it('rejects a plan with one missing-resolution slot', () => {
    const result = validatePlanForAdoption([
      slot('slot-1', 'template', 'ex-1'),
      slot('slot-2', 'missing', null),
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a plan with one null chosenExerciseId (even if resolution is not missing)', () => {
    // Defensive: the engine should never produce a non-missing
    // resolution with a null chosenExerciseId, but the validator
    // catches it independently.
    const result = validatePlanForAdoption([
      slot('slot-1', 'template', null),
    ]);
    expect(result.success).toBe(false);
  });

  it('error message names the offending slot (actionable)', () => {
    const result = validatePlanForAdoption([
      slot('slot-good', 'template', 'ex-1'),
      slot('slot-bad', 'missing', null),
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('slot-bad');
      expect(result.error.message).toMatch(/missing|resolve|replace/i);
    }
  });

  it('rejects when ALL slots are missing', () => {
    const result = validatePlanForAdoption([
      slot('slot-1', 'missing', null),
      slot('slot-2', 'missing', null),
    ]);
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. Resolving a missing slot with an eligible manual override makes
//    the plan adoptable
// ──────────────────────────────────────────────────────────────────────

describe('adoption after manual replacement — eligible override', () => {
  const templateId: ID = 'ex-template';
  const overrideId: ID = 'ex-override';

  const graphsByExerciseId = new Map<ID, ExerciseRequirementGraph>([
    // Template requires a barbell; user has none → missing without override.
    [templateId, singlePathGraph(templateId, [EQ.BARBELL])],
    // Override requires a dumbbell; user has one → eligible.
    [overrideId, singlePathGraph(overrideId, [EQ.DUMBBELL])],
  ]);

  // No alternatives graph — the override is the only path to adoption.
  const alternativesBySource = new Map<ID, AlternativeEdge[]>();
  const inv = inventory([[EQ.DUMBBELL, 1]]);

  it('without override: slot resolves to missing → plan rejected', () => {
    const resolved = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inv,
      override: null,
    });
    expect(resolved.resolution).toBe('missing');
    expect(resolved.chosenExerciseId).toBeNull();

    const adoptionCheck = validatePlanForAdoption([
      slotFromResolve('slot-1', resolved),
    ]);
    expect(adoptionCheck.success).toBe(false);
  });

  it('with eligible override: slot resolves to manual → plan adoptable', () => {
    const resolved = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inv,
      override: { exerciseId: overrideId },
    });
    expect(resolved.resolution).toBe('manual');
    expect(resolved.chosenExerciseId).toBe(overrideId);

    const adoptionCheck = validatePlanForAdoption([
      slotFromResolve('slot-1', resolved),
    ]);
    expect(adoptionCheck.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. An ineligible manual override still cannot make a plan adoptable
// ──────────────────────────────────────────────────────────────────────

describe('adoption after manual replacement — ineligible override', () => {
  const templateId: ID = 'ex-template';
  const overrideId: ID = 'ex-override';

  const graphsByExerciseId = new Map<ID, ExerciseRequirementGraph>([
    // Template requires a barbell; user has none.
    [templateId, singlePathGraph(templateId, [EQ.BARBELL])],
    // Override requires a cable rope; user has none either.
    [overrideId, singlePathGraph(overrideId, [EQ.CABLE_ROPE])],
  ]);

  const alternativesBySource = new Map<ID, AlternativeEdge[]>();
  // User has only a dumbbell — neither template nor override is eligible.
  const inv = inventory([[EQ.DUMBBELL, 1]]);

  it('ineligible override falls through → still missing → still rejected', () => {
    const resolved = resolveSlot({
      templateExerciseId: templateId,
      graphsByExerciseId,
      alternativesBySource,
      inventory: inv,
      override: { exerciseId: overrideId },
    });
    // The engine drops an ineligible override and continues the walk;
    // with no eligible template/alternative either, the slot stays missing.
    expect(resolved.resolution).toBe('missing');
    expect(resolved.chosenExerciseId).toBeNull();

    const adoptionCheck = validatePlanForAdoption([
      slotFromResolve('slot-1', resolved),
    ]);
    expect(adoptionCheck.success).toBe(false);
  });

  it('an ineligible override does NOT unlock adoption even in a multi-slot plan', () => {
    // One slot is fine (template eligible); the other has only an
    // ineligible override path. The plan as a whole is rejected.
    const goodId: ID = 'ex-good';
    const graphs = new Map(graphsByExerciseId);
    graphs.set(goodId, singlePathGraph(goodId, [EQ.DUMBBELL]));

    const goodSlot = slotFromResolve(
      'slot-good',
      resolveSlot({
        templateExerciseId: goodId,
        graphsByExerciseId: graphs,
        alternativesBySource,
        inventory: inv,
      }),
    );
    const badSlot = slotFromResolve(
      'slot-bad',
      resolveSlot({
        templateExerciseId: templateId,
        graphsByExerciseId: graphs,
        alternativesBySource,
        inventory: inv,
        override: { exerciseId: overrideId },
      }),
    );
    expect(goodSlot.resolution).toBe('template');
    expect(badSlot.resolution).toBe('missing');

    const adoptionCheck = validatePlanForAdoption([goodSlot, badSlot]);
    expect(adoptionCheck.success).toBe(false);
    if (!adoptionCheck.success) {
      expect(adoptionCheck.error.message).toContain('slot-bad');
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// 5. Mixed scenarios — boundary conditions
// ──────────────────────────────────────────────────────────────────────

describe('validatePlanForAdoption — boundary conditions', () => {
  it('a plan that becomes adoptable after the last missing slot is resolved', () => {
    // Step 1: 2 slots, 1 missing → rejected.
    const before = [
      slot('slot-1', 'template', 'ex-1'),
      slot('slot-2', 'missing', null),
    ];
    expect(validatePlanForAdoption(before).success).toBe(false);

    // Step 2: same plan, slot-2 now resolved via manual replacement.
    const after = [
      slot('slot-1', 'template', 'ex-1'),
      slot('slot-2', 'manual', 'ex-replacement'),
    ];
    expect(validatePlanForAdoption(after).success).toBe(true);
  });

  it('a plan that goes from adoptable back to rejected (regression check)', () => {
    // Step 1: adoptable.
    const before = [
      slot('slot-1', 'template', 'ex-1'),
      slot('slot-2', 'manual', 'ex-replacement'),
    ];
    expect(validatePlanForAdoption(before).success).toBe(true);

    // Step 2: slot-2 equipment disappears (re-resolution yields missing).
    const after = [
      slot('slot-1', 'template', 'ex-1'),
      slot('slot-2', 'missing', null),
    ];
    expect(validatePlanForAdoption(after).success).toBe(false);
  });
});
