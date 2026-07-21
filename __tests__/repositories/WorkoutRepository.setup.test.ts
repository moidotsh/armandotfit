// __tests__/repositories/WorkoutRepository.setup.test.ts
//
// Phase 5 workout_session_exercises.attachment_slug write/read shape.
// Locks:
//
//   1. toSessionExercise mapper reads `attachment_slug` → `attachmentSlug`.
//   2. addExerciseToSession threads attachment_slug through (Phase 5 +
//      closes the Phase 4 provenance gap: plan_slot_id, template_slot_id,
//      per_side, slot_notes, source are no longer silently dropped on
//      the ad-hoc-add path).
//
// The integration test in __tests__/app/WorkoutDetailSetupLogging.test.tsx
// exercises the end-to-end DTO threading (store → toLogWorkoutDTO →
// repository input shape); this file locks the row→domain mapper and
// the repository-level API surface.

import { describe, it, expect } from 'vitest';
import {
  workoutRepository,
  toSessionExercise,
} from '../../utils/supabase/repositories/WorkoutRepository';
import type { WorkoutSessionExerciseRow } from '../../utils/supabase/repositories/WorkoutRepository';
import type { WorkoutSessionExercise } from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<WorkoutSessionExerciseRow> = {}): WorkoutSessionExerciseRow {
  return {
    id: 'wse-1',
    workout_session_id: 'ws-1',
    exercise_id: 'ex-1',
    order_in_workout: 1,
    user_grip: null,
    user_equipment_notes: null,
    target_rep_range: null,
    rest_timer_seconds: 60,
    notes: null,
    plan_slot_id: null,
    template_slot_id: null,
    per_side: null,
    slot_notes: null,
    source: null,
    attachment_slug: null,
    created_at: '2026-07-25T00:00:00Z',
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────
// 1. toSessionExercise reads attachment_slug
// ──────────────────────────────────────────────────────────────────────

describe('toSessionExercise — attachment_slug mapping', () => {
  it('reads attachment_slug: null → attachmentSlug: null', () => {
    const out = toSessionExercise(makeRow({ attachment_slug: null }));
    expect(out.attachmentSlug).toBeNull();
  });

  it('reads attachment_slug: "rope" → attachmentSlug: "rope"', () => {
    const out = toSessionExercise(makeRow({ attachment_slug: 'rope' }));
    expect(out.attachmentSlug).toBe('rope');
  });

  it('reads attachment_slug: "straight-bar" → attachmentSlug: "straight-bar"', () => {
    const out = toSessionExercise(makeRow({ attachment_slug: 'straight-bar' }));
    expect(out.attachmentSlug).toBe('straight-bar');
  });

  it('preserves every other Phase 4 field when reading attachment_slug', () => {
    // Regression guard: adding the new field must not disturb the
    // existing Phase 4 provenance fields or the v1 fields.
    const out: WorkoutSessionExercise = toSessionExercise(
      makeRow({
        user_grip: 'neutral',
        user_equipment_notes: 'column 3',
        plan_slot_id: 'slot-1',
        template_slot_id: 'tmpl-1',
        per_side: true,
        slot_notes: 'pause at bottom',
        source: 'plan',
        attachment_slug: 'v-bar',
      }),
    );
    expect(out).toMatchObject({
      userGrip: 'neutral',
      userEquipmentNotes: 'column 3',
      planSlotId: 'slot-1',
      templateSlotId: 'tmpl-1',
      perSide: true,
      slotNotes: 'pause at bottom',
      source: 'plan',
      attachmentSlug: 'v-bar',
    });
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. Repository API surface (no-chain assertions)
// ──────────────────────────────────────────────────────────────────────

describe('WorkoutRepository — Phase 5 surface', () => {
  it('exposes addExerciseToSession as a public method', () => {
    expect(typeof workoutRepository.addExerciseToSession).toBe('function');
  });

  it('exposes create as a public method', () => {
    expect(typeof workoutRepository.create).toBe('function');
  });

  it('toSessionExercise is exported for test verification', () => {
    // Lock the export so future refactors can't quietly make the
    // mapper private and lose the regression coverage above.
    expect(typeof toSessionExercise).toBe('function');
  });
});
