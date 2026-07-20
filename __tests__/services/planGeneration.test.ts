// __tests__/services/planGeneration.test.ts
//
// Locks the Phase 3 plan-generation service contract:
//
//   • snapshotPrescription freezes all six prescription fields
//     (setsMin/Max, repsMin/Max, perSide, slotNotes) — the snapshot
//     lives in JSONB on user_program_plan_slots and survives later
//     template edits unchanged.
//   • flattenGeneratedPlan preserves the day → session → slot order
//     of the underlying tree (the save mutation writes rows in this
//     order; out-of-order writes would shuffle the plan).
//   • Empty slot set is handled without an error (defensive guard
//     for hypothetical variants with zero slots).
//
// All tests are pure-function — no DB. The full generate-plan happy
// path is exercised in __tests__/supabase/program-seed.test.ts (the
// seed integrity test) + __tests__/services/eligibility.test.ts (the
// resolver); this file holds the helper-level guarantees that the
// seed + resolver tests don't cover.

import { describe, it, expect } from 'vitest';
import {
  snapshotPrescription,
  flattenGeneratedPlan,
} from '../../services/planGenerationService';
import type { GeneratedPlan, PrescriptionSnapshot } from '../../shared/types/userPlan';
import type { ProgramSlot, ID } from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function makeSlot(over: Partial<ProgramSlot> = {}): ProgramSlot {
  return {
    id: over.id ?? 'slot-1',
    programSessionId: over.programSessionId ?? 'session-1',
    exerciseId: over.exerciseId ?? 'ex-1',
    exerciseSlug: over.exerciseSlug ?? 'squat-barbell',
    orderIndex: over.orderIndex ?? 1,
    setsMin: over.setsMin ?? 2,
    setsMax: over.setsMax ?? 3,
    repsMin: over.repsMin ?? 8,
    repsMax: over.repsMax ?? 12,
    perSide: over.perSide ?? false,
    slotNotes: over.slotNotes ?? null,
    createdAt: over.createdAt ?? '2026-01-01T00:00:00Z',
  };
}

// ──────────────────────────────────────────────────────────────────────
// 1. snapshotPrescription — freezes all six fields at adoption time
// ──────────────────────────────────────────────────────────────────────

describe('snapshotPrescription', () => {
  it('copies all six prescription fields', () => {
    const slot = makeSlot({
      setsMin: 2,
      setsMax: 3,
      repsMin: 6,
      repsMax: 10,
      perSide: false,
      slotNotes: 'Slow tempo.',
    });
    const snapshot = snapshotPrescription(slot);
    expect(snapshot).toEqual({
      setsMin: 2,
      setsMax: 3,
      repsMin: 6,
      repsMax: 10,
      perSide: false,
      slotNotes: 'Slow tempo.',
    });
  });

  it('preserves perSide = true for Bulgarian Split Squat', () => {
    const slot = makeSlot({
      perSide: true,
      slotNotes: 'Per leg.',
    });
    const snapshot = snapshotPrescription(slot);
    expect(snapshot.perSide).toBe(true);
    expect(snapshot.slotNotes).toBe('Per leg.');
  });

  it('preserves null slotNotes', () => {
    const slot = makeSlot({ slotNotes: null });
    const snapshot = snapshotPrescription(slot);
    expect(snapshot.slotNotes).toBeNull();
  });

  it('snapshot is a separate object — later mutation of source does not affect snapshot', () => {
    const slot = makeSlot({ setsMin: 2, setsMax: 3 });
    const snapshot = snapshotPrescription(slot);
    slot.setsMin = 99;
    slot.setsMax = 99;
    expect(snapshot.setsMin).toBe(2);
    expect(snapshot.setsMax).toBe(3);
  });

  it('produces a value-shaped object (no nested ProgramSlot fields leaked in)', () => {
    const slot = makeSlot();
    const snapshot: PrescriptionSnapshot = snapshotPrescription(slot);
    const keys = Object.keys(snapshot).sort();
    expect(keys).toEqual(['perSide', 'repsMax', 'repsMin', 'setsMax', 'setsMin', 'slotNotes']);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. flattenGeneratedPlan — preserves day → session → slot order
// ──────────────────────────────────────────────────────────────────────

describe('flattenGeneratedPlan', () => {
  function makePlanTree(): GeneratedPlan {
    return {
      templateId: 'tpl-1',
      variantId: 'var-1',
      variantSlug: 'one-a-day',
      variantName: 'One-a-Day',
      days: [
        {
          dayId: 'day-1',
          dayIndex: 1,
          dayTitle: 'Day 1',
          sessions: [
            {
              sessionId: 'sess-1',
              sessionWindow: 'single',
              sessionLabel: 'Main',
              slots: [
                {
                  templateSlot: makeSlot({ id: 'slot-1', orderIndex: 1 }),
                  chosenExerciseSlug: 'squat-barbell',
                  chosenExerciseId: 'ex-1',
                  resolution: 'template',
                  rationale: 'Template eligible.',
                },
                {
                  templateSlot: makeSlot({ id: 'slot-2', orderIndex: 2 }),
                  chosenExerciseSlug: 'bench-press-barbell',
                  chosenExerciseId: 'ex-2',
                  resolution: 'template',
                  rationale: 'Template eligible.',
                },
              ],
            },
          ],
        },
        {
          dayId: 'day-2',
          dayIndex: 2,
          dayTitle: 'Day 2',
          sessions: [
            {
              sessionId: 'sess-2',
              sessionWindow: 'single',
              sessionLabel: 'Main',
              slots: [
                {
                  templateSlot: makeSlot({ id: 'slot-3', orderIndex: 1 }),
                  chosenExerciseSlug: 'deadlift-barbell',
                  chosenExerciseId: 'ex-3',
                  resolution: 'template',
                  rationale: 'Template eligible.',
                },
              ],
            },
          ],
        },
      ],
    };
  }

  it('returns one entry per slot, in day → session → slot order', () => {
    const plan = makePlanTree();
    const flat = flattenGeneratedPlan(plan);
    expect(flat.map((f) => f.templateSlotId)).toEqual([
      'slot-1',
      'slot-2',
      'slot-3',
    ]);
  });

  it('each entry carries the chosen exercise id + resolution', () => {
    const plan = makePlanTree();
    const flat = flattenGeneratedPlan(plan);
    expect(flat[0]).toEqual({
      templateSlotId: 'slot-1',
      chosenExerciseId: 'ex-1',
      resolution: 'template',
      prescriptionSnapshot: expect.objectContaining({
        setsMin: 2,
        setsMax: 3,
      }),
    });
  });

  it('prescriptionSnapshot in the flat tree matches snapshotPrescription output', () => {
    const plan = makePlanTree();
    const flat = flattenGeneratedPlan(plan);
    for (const entry of flat) {
      const slot = plan.days
        .flatMap((d) => d.sessions)
        .flatMap((s) => s.slots)
        .find((s) => s.templateSlot.id === entry.templateSlotId)!;
      expect(entry.prescriptionSnapshot).toEqual(snapshotPrescription(slot.templateSlot));
    }
  });

  it('missing resolutions carry chosenExerciseId = null', () => {
    const plan: GeneratedPlan = {
      ...makePlanTree(),
      days: [
        {
          dayId: 'day-1',
          dayIndex: 1,
          dayTitle: 'Day 1',
          sessions: [
            {
              sessionId: 'sess-1',
              sessionWindow: 'single',
              sessionLabel: 'Main',
              slots: [
                {
                  templateSlot: makeSlot({ id: 'slot-x' }),
                  chosenExerciseSlug: null,
                  chosenExerciseId: null,
                  resolution: 'missing',
                  rationale: 'No eligible exercise.',
                },
              ],
            },
          ],
        },
      ],
    };
    const flat = flattenGeneratedPlan(plan);
    expect(flat[0].chosenExerciseId).toBeNull();
    expect(flat[0].resolution).toBe('missing');
  });

  it('empty plan (no days) yields an empty flat list', () => {
    const plan: GeneratedPlan = {
      templateId: 'tpl-1',
      variantId: 'var-1',
      variantSlug: 'one-a-day',
      variantName: 'One-a-Day',
      days: [],
    };
    expect(flattenGeneratedPlan(plan)).toEqual([]);
  });

  it('two-a-day AM/PM sessions keep their relative order in the flat list', () => {
    const plan: GeneratedPlan = {
      templateId: 'tpl-2',
      variantId: 'var-2',
      variantSlug: 'two-a-day',
      variantName: 'Two-a-Day',
      days: [
        {
          dayId: 'day-1',
          dayIndex: 1,
          dayTitle: 'Day 1',
          sessions: [
            {
              sessionId: 'am',
              sessionWindow: 'am',
              sessionLabel: 'AM',
              slots: [
                {
                  templateSlot: makeSlot({ id: 'am-1' }),
                  chosenExerciseSlug: 'squat-barbell',
                  chosenExerciseId: 'ex-am',
                  resolution: 'template',
                  rationale: 'AM slot.',
                },
              ],
            },
            {
              sessionId: 'pm',
              sessionWindow: 'pm',
              sessionLabel: 'PM',
              slots: [
                {
                  templateSlot: makeSlot({ id: 'pm-1' }),
                  chosenExerciseSlug: 'bench-press-barbell',
                  chosenExerciseId: 'ex-pm',
                  resolution: 'template',
                  rationale: 'PM slot.',
                },
              ],
            },
          ],
        },
      ],
    };
    const flat = flattenGeneratedPlan(plan);
    expect(flat.map((f) => f.templateSlotId)).toEqual(['am-1', 'pm-1']);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. Intentional omissions — One-a-Day variant omits one exercise per
//    day (per CLAUDE.md invariant #12 + program-seed.test.ts). The
//    flatten + snapshot helpers must not silently re-add slots: a
//    variant tree with the omission flows through unchanged.
// ──────────────────────────────────────────────────────────────────────

describe('intentional omissions flow through flatten unchanged', () => {
  it('one-a-day day 1 omits lower-back-extension-calisthenic (only 7 slots, not 8)', () => {
    // Build a tree with 7 slots on day 1 (mirrors the seed shape).
    const slots: ID[] = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
    const plan: GeneratedPlan = {
      templateId: 'tpl-1',
      variantId: 'var-1',
      variantSlug: 'one-a-day',
      variantName: 'One-a-Day',
      days: [
        {
          dayId: 'day-1',
          dayIndex: 1,
          dayTitle: 'Day 1',
          sessions: [
            {
              sessionId: 'sess-1',
              sessionWindow: 'single',
              sessionLabel: 'Main',
              slots: slots.map((id, i) => ({
                templateSlot: makeSlot({ id, orderIndex: i + 1 }),
                chosenExerciseSlug: `slug-${id}`,
                chosenExerciseId: `ex-${id}` as ID,
                resolution: 'template' as const,
                rationale: 'Template eligible.',
              })),
            },
          ],
        },
      ],
    };
    const flat = flattenGeneratedPlan(plan);
    expect(flat).toHaveLength(7);
    expect(flat.map((f) => f.templateSlotId)).toEqual(slots);
  });
});
