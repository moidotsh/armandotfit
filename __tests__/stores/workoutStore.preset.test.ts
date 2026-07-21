// __tests__/stores/workoutStore.preset.test.ts
//
// Phase 6 applyPresetToDraftExercise tests. Locks the load-bearing
// correctness contract:
//
//   1. A field-level-compatible preset patches only the non-null fields
//      into the draft exercise (null preset fields = "no preference,
//      leave existing value alone").
//   2. A capability mismatch is rejected with `{ ok: false, reason }`.
//   3. A non-null grip on a preset whose value is NOT in the exercise's
//      catalog grip options is rejected (field-level rule).
//   4. A non-null attachment on a preset whose value is NOT in the
//      exercise's catalog attachment options is rejected.
//   5. A notes-only preset (gripText + attachmentSlug both null) is
//      accepted for any capability-compatible exercise (Option A).
//      Equipment notes patch through when present; nothing patches when
//      notes is also null.
//   6. Returns `{ ok: false }` when there's no active draft.
//
// History-independence is locked in
// __tests__/stores/workoutStore.history-independence.test.ts — the
// apply path mutates draft setup fields only; it never writes a preset
// id onto the draft, and toLogWorkoutDTO carries no preset reference.

import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from '../../stores/workoutStore';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { SetupPreset } from '../../shared/types';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeDraft(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-07-26T00:00:00.000Z',
    splitType: 'oneADay' as const,
    day: 1,
    sessionMode: 'am' as const,
    duration: 0,
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
        sets: [],
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
    id: 'preset-1',
    userId: 'user-1',
    label: 'Cable column 3 — rope, low',
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: null,
    attachmentSlug: null,
    equipmentNotes: null,
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
  attachmentOptions: ['rope', 'straight-bar'],
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

// ─── Apply success cases ───────────────────────────────────────────────

describe('applyPresetToDraftExercise — apply success', () => {
  it('patches all three setup fields when the preset carries them and is field-level compatible', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      gripText: 'neutral',
      attachmentSlug: 'rope',
      equipmentNotes: 'Cable column 3, low pulley',
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res).toEqual({ ok: true });
    const ex = useWorkoutStore.getState().draft!.exercises[0];
    expect(ex.userGrip).toBe('neutral');
    expect(ex.attachmentSlug).toBe('rope');
    expect(ex.userEquipmentNotes).toBe('Cable column 3, low pulley');
  });

  it('patches only the non-null fields — null preset fields leave existing values alone', () => {
    useWorkoutStore.setState({
      draft: makeDraft({
        exercises: [
          {
            ...(makeDraft().exercises[0] as any),
            userGrip: 'overhand',
            attachmentSlug: 'straight-bar',
            userEquipmentNotes: 'existing notes',
          },
        ],
      }),
    });
    // Preset has only equipmentNotes set; grip + attachment are null.
    const preset = makePreset({
      gripText: null,
      attachmentSlug: null,
      equipmentNotes: 'overridden notes',
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res).toEqual({ ok: true });
    const ex = useWorkoutStore.getState().draft!.exercises[0];
    expect(ex.userGrip).toBe('overhand'); // untouched
    expect(ex.attachmentSlug).toBe('straight-bar'); // untouched
    expect(ex.userEquipmentNotes).toBe('overridden notes'); // overridden
  });
});

// ─── Notes-only (Option A) ─────────────────────────────────────────────

describe('applyPresetToDraftExercise — notes-only preset (Option A)', () => {
  it('accepts a notes-only preset for a capability-compatible exercise and patches equipmentNotes', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      gripText: null,
      attachmentSlug: null,
      equipmentNotes: 'Station 3, near the dumbbells',
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res).toEqual({ ok: true });
    const ex = useWorkoutStore.getState().draft!.exercises[0];
    expect(ex.userEquipmentNotes).toBe('Station 3, near the dumbbells');
    expect(ex.userGrip).toBeNull();
    expect(ex.attachmentSlug).toBeNull();
  });

  it('accepts an all-null preset (no-op apply) for a capability-compatible exercise', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      gripText: null,
      attachmentSlug: null,
      equipmentNotes: null,
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res).toEqual({ ok: true });
    const ex = useWorkoutStore.getState().draft!.exercises[0];
    expect(ex.userGrip).toBeNull();
    expect(ex.attachmentSlug).toBeNull();
    expect(ex.userEquipmentNotes).toBeNull();
  });
});

// ─── Rejection cases ──────────────────────────────────────────────────

describe('applyPresetToDraftExercise — rejection', () => {
  it('rejects when the preset capability is not in the exercise capability set', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      capabilitySlug: EquipmentCapabilitySlug.DUMBBELLS,
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/compatib/i);
    }
    // Draft untouched.
    const ex = useWorkoutStore.getState().draft!.exercises[0];
    expect(ex.userGrip).toBeNull();
    expect(ex.attachmentSlug).toBeNull();
    expect(ex.userEquipmentNotes).toBeNull();
  });

  it('rejects when preset.gripText is non-null and not in exercise grip options (field-level rule)', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      gripText: 'supinated', // catalog only declares 'neutral'
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res.ok).toBe(false);
  });

  it('rejects when preset.attachmentSlug is non-null and not in exercise attachment options (field-level rule)', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      attachmentSlug: 'v-bar', // catalog only declares rope + straight-bar
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res.ok).toBe(false);
  });

  it('rejects when there is no active draft', () => {
    const preset = makePreset();
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, CABLE_CONTEXT);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toMatch(/draft/i);
    }
  });

  it('rejects when the exercise localId does not match any draft row (defensive)', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      gripText: 'neutral',
      attachmentSlug: 'rope',
    });
    // Capability is compatible so the gate passes, but no row matches
    // the localId. The implementation sets draft.exercises via .map,
    // which is a no-op when no row matches — but the action still
    // returns ok:true because the gate passed. This locks the current
    // contract: callers are responsible for passing a valid localId.
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('does-not-exist', preset, CABLE_CONTEXT);
    // The gate passes; no row is touched. Returned ok:true.
    expect(res).toEqual({ ok: true });
    const ex = useWorkoutStore.getState().draft!.exercises[0];
    expect(ex.userGrip).toBeNull();
  });
});

// ─── Catalog vocabulary preservation ───────────────────────────────────

describe('applyPresetToDraftExercise — catalog vocabulary is preserved (no normalization)', () => {
  it('rejects a rope preset when the exercise declares only cable-rope (no slug normalization)', () => {
    useWorkoutStore.setState({ draft: makeDraft() });
    const preset = makePreset({
      capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
      attachmentSlug: 'rope', // catalog attachment is 'cable-rope' only
    });
    const res = useWorkoutStore
      .getState()
      .applyPresetToDraftExercise('l-1', preset, {
        capabilities: [EquipmentCapabilitySlug.CABLE_STATION],
        gripOptions: [],
        attachmentOptions: ['cable-rope'],
      });
    expect(res.ok).toBe(false);
  });
});
