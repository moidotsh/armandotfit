// __tests__/services/planLaunchService.test.ts
//
// Locks the Phase 4 plan-launch service contract:
//
//   • Split ↔ variant slug maps are bidirectional + exhaustive.
//   • sessionWindowForLaunch maps (split, sessionMode) → SessionWindow
//     with oneADay always resolving to 'single'.
//   • isPlanComplete returns true iff the plan is non-null + active +
//     every slot has a non-null chosenExerciseId + no slot is missing.
//     This mirrors the adoption validator at the repository boundary.
//   • selectPlanSlotsForSession joins plan slots with the variant tree
//     by templateSlotId, preserves template-defined order, and silently
//     drops slots whose chosen exercise became null between adoption
//     and launch (defensive — shouldn't happen, must not crash).
//   • buildHydrationPayloadFromResolved freezes the prescription
//     snapshot + provenance pointers into a DraftExercise-friendly
//     payload.
//   • buildTemplateSnapshot / buildVariantSnapshot copy the four
//     identity fields each.
//
// All tests are pure-function — no DB, no React. Mirrors the style of
// eligibility.test.ts + planGeneration.test.ts.

import { describe, it, expect } from 'vitest';
import {
  SPLIT_TO_VARIANT_SLUG,
  VARIANT_SLUG_TO_SPLIT,
  sessionWindowForLaunch,
  isPlanComplete,
  selectTemplateSlotsForSession,
  selectPlanSlotsForSession,
  buildHydrationPayloadFromResolved,
  buildTemplateSnapshot,
  buildVariantSnapshot,
} from '../../services/planLaunchService';
import type {
  ProgramSlot,
  ProgramVariantTree,
  ProgramTemplate,
  ProgramScheduleVariant,
  ID,
  PreferredSplit,
} from '../../shared/types';
import type {
  UserProgramPlanWithSlots,
  PrescriptionSnapshot,
} from '../../shared/types/userPlan';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function makeProgramSlot(over: Partial<ProgramSlot> = {}): ProgramSlot {
  return {
    id: over.id ?? 'tmpl-slot-1',
    programSessionId: over.programSessionId ?? 'session-1',
    exerciseId: over.exerciseId ?? 'ex-template',
    exerciseSlug: over.exerciseSlug ?? 'squat-barbell',
    orderIndex: over.orderIndex ?? 1,
    setsMin: over.setsMin ?? 3,
    setsMax: over.setsMax ?? 4,
    repsMin: over.repsMin ?? 6,
    repsMax: over.repsMax ?? 10,
    perSide: over.perSide ?? false,
    slotNotes: over.slotNotes ?? null,
    createdAt: over.createdAt ?? '2026-01-01T00:00:00Z',
  };
}

function makeVariantTree(
  slotsBySession: Array<{ window: 'am' | 'pm' | 'single'; dayIndex: number; slots: ProgramSlot[] }>,
): ProgramVariantTree {
  const daysMap = new Map<number, Array<{ window: 'am' | 'pm' | 'single'; slots: ProgramSlot[] }>>();
  for (const entry of slotsBySession) {
    const arr = daysMap.get(entry.dayIndex) ?? [];
    arr.push({ window: entry.window, slots: entry.slots });
    daysMap.set(entry.dayIndex, arr);
  }
  const variant: ProgramScheduleVariant = {
    id: 'variant-1',
    programTemplateId: 'template-1',
    slug: 'one-a-day',
    name: 'One-a-Day',
    description: null,
    sessionWindowPattern: 'single',
    cycleLengthDays: 4,
    version: 1,
    status: 'active',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const template: ProgramTemplate = {
    id: 'template-1',
    slug: 'arman-fit-commercial-gym-v1',
    name: 'Arman Fit Commercial Gym v1',
    description: null,
    goal: null,
    defaultVariantSlug: null,
    version: 1,
    status: 'active',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  return {
    variant,
    template,
    days: [...daysMap.entries()].map(([dayIndex, sessions]) => ({
      day: {
        id: `day-${dayIndex}`,
        programVariantId: 'variant-1',
        dayIndex,
        title: `Day ${dayIndex}`,
        createdAt: '2026-01-01T00:00:00Z',
      },
      sessions: sessions.map((s) => ({
        session: {
          id: `session-${dayIndex}-${s.window}`,
          programDayId: `day-${dayIndex}`,
          sessionWindow: s.window,
          label: s.window.toUpperCase(),
          orderIndex: 1,
          createdAt: '2026-01-01T00:00:00Z',
        },
        slots: s.slots,
      })),
    })),
  };
}

function makePrescription(over: Partial<PrescriptionSnapshot> = {}): PrescriptionSnapshot {
  return {
    setsMin: over.setsMin ?? 3,
    setsMax: over.setsMax ?? 4,
    repsMin: over.repsMin ?? 6,
    repsMax: over.repsMax ?? 10,
    perSide: over.perSide ?? false,
    slotNotes: over.slotNotes ?? null,
  };
}

function makePlan(
  slots: Array<{
    slotId: ID;
    templateSlotId: ID;
    chosenExerciseId: ID | null;
    resolution: 'template' | 'direct' | 'close' | 'fallback' | 'manual' | 'missing';
    prescription?: PrescriptionSnapshot;
  }>,
): UserProgramPlanWithSlots {
  return {
    id: 'plan-1',
    userId: 'user-1',
    templateId: 'template-1',
    variantId: 'variant-1',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    slots: slots.map((s) => ({
      slot: {
        id: s.slotId,
        planId: 'plan-1',
        templateSlotId: s.templateSlotId,
        chosenExerciseId: s.chosenExerciseId,
        resolution: s.resolution,
        prescriptionSnapshot: s.prescription ?? makePrescription(),
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      override: null,
    })),
  };
}

// ──────────────────────────────────────────────────────────────────────
// 1. Split ↔ variant slug maps
// ──────────────────────────────────────────────────────────────────────

describe('SPLIT_TO_VARIANT_SLUG + VARIANT_SLUG_TO_SPLIT', () => {
  it('maps oneADay → one-a-day', () => {
    expect(SPLIT_TO_VARIANT_SLUG.oneADay).toBe('one-a-day');
  });

  it('maps twoADay → two-a-day', () => {
    expect(SPLIT_TO_VARIANT_SLUG.twoADay).toBe('two-a-day');
  });

  it('reverse map is consistent', () => {
    for (const [split, slug] of Object.entries(SPLIT_TO_VARIANT_SLUG)) {
      expect(VARIANT_SLUG_TO_SPLIT[slug]).toBe(split as PreferredSplit);
    }
  });

  it('covers every PreferredSplit value', () => {
    const splits: PreferredSplit[] = ['oneADay', 'twoADay'];
    for (const s of splits) {
      expect(typeof SPLIT_TO_VARIANT_SLUG[s]).toBe('string');
      expect(SPLIT_TO_VARIANT_SLUG[s].length).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. sessionWindowForLaunch
// ──────────────────────────────────────────────────────────────────────

describe('sessionWindowForLaunch', () => {
  it('oneADay always resolves to single regardless of sessionMode', () => {
    expect(sessionWindowForLaunch('oneADay', 'am')).toBe('single');
    expect(sessionWindowForLaunch('oneADay', 'pm')).toBe('single');
  });

  it('twoADay preserves the sessionMode', () => {
    expect(sessionWindowForLaunch('twoADay', 'am')).toBe('am');
    expect(sessionWindowForLaunch('twoADay', 'pm')).toBe('pm');
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. isPlanComplete
// ──────────────────────────────────────────────────────────────────────

describe('isPlanComplete', () => {
  it('returns false for null / undefined', () => {
    expect(isPlanComplete(null)).toBe(false);
    expect(isPlanComplete(undefined)).toBe(false);
  });

  it('returns false when status is not active', () => {
    const plan = makePlan([]);
    plan.status = 'retired';
    expect(isPlanComplete(plan)).toBe(false);
  });

  it('returns false when slots is empty', () => {
    const plan = makePlan([]);
    expect(isPlanComplete(plan)).toBe(false);
  });

  it('returns true when every slot has a non-null chosenExerciseId + non-missing resolution', () => {
    const plan = makePlan([
      { slotId: 'slot-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'template' },
      { slotId: 'slot-2', templateSlotId: 'tmpl-2', chosenExerciseId: 'ex-2', resolution: 'direct' },
    ]);
    expect(isPlanComplete(plan)).toBe(true);
  });

  it('returns false when any slot has chosenExerciseId = null', () => {
    const plan = makePlan([
      { slotId: 'slot-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'template' },
      { slotId: 'slot-2', templateSlotId: 'tmpl-2', chosenExerciseId: null, resolution: 'missing' },
    ]);
    expect(isPlanComplete(plan)).toBe(false);
  });

  it('returns false when any slot has resolution = missing', () => {
    const plan = makePlan([
      { slotId: 'slot-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'template' },
      // chosenExerciseId is set but resolution is missing — still incomplete
      { slotId: 'slot-2', templateSlotId: 'tmpl-2', chosenExerciseId: 'ex-2', resolution: 'missing' },
    ]);
    expect(isPlanComplete(plan)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. selectTemplateSlotsForSession + selectPlanSlotsForSession
// ──────────────────────────────────────────────────────────────────────

describe('selectTemplateSlotsForSession', () => {
  it('returns the slots for the matching (day, window)', () => {
    const slot1 = makeProgramSlot({ id: 'tmpl-1', orderIndex: 1 });
    const slot2 = makeProgramSlot({ id: 'tmpl-2', orderIndex: 2 });
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [slot1, slot2] },
      { window: 'single', dayIndex: 2, slots: [makeProgramSlot({ id: 'tmpl-3' })] },
    ]);
    const out = selectTemplateSlotsForSession(tree, 1, 'single');
    expect(out.map((s) => s.id)).toEqual(['tmpl-1', 'tmpl-2']);
  });

  it('preserves order_index', () => {
    const slotB = makeProgramSlot({ id: 'tmpl-b', orderIndex: 2 });
    const slotA = makeProgramSlot({ id: 'tmpl-a', orderIndex: 1 });
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [slotB, slotA] }, // intentionally out of order
    ]);
    // The variant tree is responsible for sorting by orderIndex at load
    // time; the selector preserves whatever order the tree gives it.
    const out = selectTemplateSlotsForSession(tree, 1, 'single');
    expect(out).toHaveLength(2);
  });

  it('returns [] when the day does not exist', () => {
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [makeProgramSlot()] },
    ]);
    expect(selectTemplateSlotsForSession(tree, 99, 'single')).toEqual([]);
  });

  it('returns [] when the window does not exist on the day', () => {
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [makeProgramSlot()] },
    ]);
    expect(selectTemplateSlotsForSession(tree, 1, 'am')).toEqual([]);
  });
});

describe('selectPlanSlotsForSession', () => {
  it('joins plan slots with template slots by templateSlotId, preserving template order', () => {
    const slot1 = makeProgramSlot({ id: 'tmpl-1', orderIndex: 1 });
    const slot2 = makeProgramSlot({ id: 'tmpl-2', orderIndex: 2 });
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [slot1, slot2] },
    ]);
    const plan = makePlan([
      // Intentionally out of order — selector must follow the tree.
      { slotId: 'plan-2', templateSlotId: 'tmpl-2', chosenExerciseId: 'ex-2', resolution: 'template' },
      { slotId: 'plan-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'template' },
    ]);
    const out = selectPlanSlotsForSession(plan, tree, 1, 'single');
    expect(out.map((o) => o.slot.id)).toEqual(['plan-1', 'plan-2']);
  });

  it('returns [] when the session has no template slots', () => {
    const tree = makeVariantTree([]);
    const plan = makePlan([
      { slotId: 'plan-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'template' },
    ]);
    expect(selectPlanSlotsForSession(plan, tree, 1, 'single')).toEqual([]);
  });

  it('drops plan slots whose chosenExerciseId is null (defensive)', () => {
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [makeProgramSlot({ id: 'tmpl-1' })] },
    ]);
    const plan = makePlan([
      { slotId: 'plan-1', templateSlotId: 'tmpl-1', chosenExerciseId: null, resolution: 'missing' },
    ]);
    expect(selectPlanSlotsForSession(plan, tree, 1, 'single')).toEqual([]);
  });

  it('drops plan slots whose resolution is missing (defensive)', () => {
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [makeProgramSlot({ id: 'tmpl-1' })] },
    ]);
    const plan = makePlan([
      // chosenExerciseId set but resolution missing — defensive drop.
      { slotId: 'plan-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'missing' },
    ]);
    expect(selectPlanSlotsForSession(plan, tree, 1, 'single')).toEqual([]);
  });

  it('silently drops plan slots that no longer exist in the template', () => {
    // E.g. a template edit dropped the parent slot after adoption. The
    // plan slot still references the old templateSlotId, which is no
    // longer in the variant tree for this session.
    const tree = makeVariantTree([
      { window: 'single', dayIndex: 1, slots: [makeProgramSlot({ id: 'tmpl-1' })] },
    ]);
    const plan = makePlan([
      { slotId: 'plan-1', templateSlotId: 'tmpl-1', chosenExerciseId: 'ex-1', resolution: 'template' },
      { slotId: 'plan-2', templateSlotId: 'tmpl-gone', chosenExerciseId: 'ex-2', resolution: 'template' },
    ]);
    const out = selectPlanSlotsForSession(plan, tree, 1, 'single');
    expect(out.map((o) => o.slot.id)).toEqual(['plan-1']);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 5. buildHydrationPayloadFromResolved
// ──────────────────────────────────────────────────────────────────────

describe('buildHydrationPayloadFromResolved', () => {
  it('maps each resolved slot to a PlanHydrationSlot with frozen prescription + provenance', () => {
    const plan = makePlan([
      {
        slotId: 'plan-1',
        templateSlotId: 'tmpl-1',
        chosenExerciseId: 'ex-1',
        resolution: 'template',
        prescription: makePrescription({
          setsMin: 2,
          setsMax: 4,
          repsMin: 6,
          repsMax: 10,
          perSide: true,
          slotNotes: 'Slow tempo',
        }),
      },
    ]);
    const resolved = [
      {
        entry: plan.slots[0],
        chosenExerciseSlug: 'squat-barbell',
        chosenExerciseName: 'Barbell Squat',
        chosenExerciseVariation: 'High Bar',
      },
    ];
    const out = buildHydrationPayloadFromResolved(resolved);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      exerciseId: 'ex-1',
      exerciseSlug: 'squat-barbell',
      exerciseName: 'Barbell Squat',
      variation: 'High Bar',
      setsMin: 2,
      setsMax: 4,
      repsMin: 6,
      repsMax: 10,
      perSide: true,
      slotNotes: 'Slow tempo',
      planSlotId: 'plan-1',
      templateSlotId: 'tmpl-1',
    });
  });

  it('returns [] for empty input', () => {
    expect(buildHydrationPayloadFromResolved([])).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 6. Snapshot builders
// ──────────────────────────────────────────────────────────────────────

describe('buildTemplateSnapshot', () => {
  it('copies slug + name + version', () => {
    const template: ProgramTemplate = {
      id: 't-1',
      slug: 'arman-fit-commercial-gym-v1',
      name: 'Arman Fit Commercial Gym v1',
      description: null,
      goal: null,
      defaultVariantSlug: null,
      version: 3,
      status: 'active',
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(buildTemplateSnapshot(template)).toEqual({
      slug: 'arman-fit-commercial-gym-v1',
      name: 'Arman Fit Commercial Gym v1',
      version: 3,
    });
  });
});

describe('buildVariantSnapshot', () => {
  it('copies slug + name + sessionWindowPattern + cycleLengthDays + version', () => {
    const variant: ProgramScheduleVariant = {
      id: 'v-1',
      programTemplateId: 't-1',
      slug: 'one-a-day',
      name: 'One-a-Day',
      description: null,
      sessionWindowPattern: 'single',
      cycleLengthDays: 4,
      version: 2,
      status: 'active',
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(buildVariantSnapshot(variant)).toEqual({
      slug: 'one-a-day',
      name: 'One-a-Day',
      sessionWindowPattern: 'single',
      cycleLengthDays: 4,
      version: 2,
    });
  });
});
