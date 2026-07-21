// __tests__/stores/workoutStore.history-independence.test.ts
//
// Phase 6 history-independence guarantee. Locks the contract that
// applying a preset + saving the workout produces a persisted row that
// does NOT reference the preset by id, so any later delete / retire /
// edit of the preset cannot invalidate or alter saved workout history.
//
// The guarantee has two halves:
//
//   1. The in-memory mutation (applyPresetToDraftExercise) copies only
//      the preset's setup values (grip / attachment / notes) onto the
//      draft exercise. No preset id is written.
//   2. The DTO produced by toLogWorkoutDTO carries the setup values
//      through to the persistence layer; it has no presetId field on
//      either the session header or the per-exercise row.
//
// The full end-to-end persistence + retrieval test lives in
// __tests__/repositories/WorkoutRepository.setup.test.ts (Phase 5) —
// this file specifically locks the Phase 6 no-FK invariant at the
// store + DTO boundary.

import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from '../../stores/workoutStore';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

function makeDraft(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-07-26T00:00:00.000Z',
    splitType: 'oneADay' as const,
    day: 1,
    sessionMode: 'am' as const,
    duration: 30,
    notes: null,
    exercises: [
      {
        localId: 'l-1',
        exerciseId: 'ex-cable',
        exerciseName: 'Cable Fly',
        orderInWorkout: 1,
        userGrip: null,
        userEquipmentNotes: null,
        targetRepRange: '8-12',
        restTimerSeconds: 60,
        notes: null,
        sets: [
          {
            localId: 's-1',
            setNumber: 1,
            targetReps: 10,
            actualReps: 10,
            weight: 20,
            repRange: '8-12',
            restDurationSeconds: null,
            notes: null,
            completed: true,
          },
        ],
        planSlotId: null,
        templateSlotId: null,
        perSide: null,
        slotNotes: null,
        source: 'static' as const,
        attachmentSlug: null,
      },
    ],
    sessionWindow: 'single' as const,
    startedAt: '2026-07-26T00:00:00.000Z',
    planId: null,
    planTemplateSnapshot: null,
    planVariantSnapshot: null,
    launchSource: 'static' as const,
    ...overrides,
  };
}

function makePreset(overrides: Partial<SetupPreset> = {}): SetupPreset {
  return {
    id: 'preset-to-be-deleted',
    userId: 'user-1',
    label: 'Cable column 3 — rope, low',
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: 'neutral',
    attachmentSlug: 'rope',
    equipmentNotes: 'Cable column 3, low pulley',
    isRetired: false,
    retiredAt: null,
    createdAt: '2026-07-26T00:00:00Z',
    updatedAt: '2026-07-26T00:00:00Z',
    ...overrides,
  };
}

const CABLE_CONTEXT = {
  capabilities: [EquipmentCapabilitySlug.CABLE_STATION],
  gripOptions: ['neutral'],
  attachmentOptions: ['rope'],
};

beforeEach(() => {
  useWorkoutStore.setState({
    draft: null,
    sessionStartedAt: null,
    isSessionActive: false,
    selectedExerciseLocalId: null,
    sessionError: null,
    isSaving: false,
  });
});

describe('Phase 6 history-independence — apply + save', () => {
  it('applyPresetToDraftExercise copies setup values only; no preset id lands on the draft', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset();

    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res).toEqual({ ok: true });
    const draft = useWorkoutStore.getState().draft!;
    // Setup values are copied through.
    expect(draft.exercises[0].userGrip).toBe('neutral');
    expect(draft.exercises[0].attachmentSlug).toBe('rope');
    expect(draft.exercises[0].userEquipmentNotes).toBe('Cable column 3, low pulley');
    // No presetId field exists on a DraftExercise — verified by type
    // narrowing at compile time. Sanity check the runtime keys don't
    // carry any preset reference either.
    const exKeys = Object.keys(draft.exercises[0]);
    expect(exKeys.some((k) => k.toLowerCase().includes('preset'))).toBe(false);
  });

  it('toLogWorkoutDTO after apply carries setup values but no preset id (header + per-exercise)', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset();

    useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    const dto = useWorkoutStore.getState().toLogWorkoutDTO();
    expect(dto).not.toBeNull();
    if (!dto) return;

    // Header-level: no preset reference.
    const headerKeys = Object.keys(dto);
    expect(headerKeys.some((k) => k.toLowerCase().includes('preset'))).toBe(false);

    // Per-exercise: setup values carried, no presetId field present.
    expect(dto.exercises.length).toBe(1);
    const ex = dto.exercises[0];
    expect(ex.userGrip).toBe('neutral');
    expect(ex.attachmentSlug).toBe('rope');
    expect(ex.userEquipmentNotes).toBe('Cable column 3, low pulley');

    const exKeys = Object.keys(ex);
    expect(exKeys.some((k) => k.toLowerCase().includes('preset'))).toBe(false);
  });

  it('the preset id surface is not threaded through (deletion-safe by construction)', () => {
    // The Phase 6 deletion contract says: deleting a preset only
    // removes the preset row; saved workouts keep the values that were
    // copied at apply time. This test locks the construction: the
    // preset id is NEVER written into the draft or the DTO, so there
    // is nothing for a later delete to invalidate.
    useWorkoutStore.setState({ draft: makeDraft() });
    const presetToDeleteLater = makePreset({ id: 'doomed-preset' });

    useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', presetToDeleteLater, CABLE_CONTEXT);

    // Snapshot the DTO + draft state, then simulate the preset being
    // deleted by dropping the variable. The DTO is unchanged because
    // it never referenced the preset id.
    const dtoBefore = useWorkoutStore.getState().toLogWorkoutDTO();
    expect(dtoBefore).not.toBeNull();
    if (!dtoBefore) return;

    // "Delete" the preset reference.
    presetToDeleteLater.id = 'gone';
    presetToDeleteLater.label = '(deleted)';

    const dtoAfter = useWorkoutStore.getState().toLogWorkoutDTO();
    expect(dtoAfter).toEqual(dtoBefore);
  });
});
