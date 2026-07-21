// __tests__/services/setupPresetCompatibility.test.ts
//
// Locks the Phase 6 field-level compatibility rule between a preset
// and an active exercise (amendment #2). The pure helper
// `isPresetCompatibleWithExercise` is the canonical contract — the
// picker UI uses it to filter the visible list (UX) and the store's
// applyPresetToDraftExercise action uses it as the load-bearing gate
// (correctness).
//
// Rule (per Phase 6 amended contract):
//
//   compatible iff
//     (1) preset.capabilitySlug ∈ exerciseCapabilities
//     (2) preset.gripText == null
//         OR exerciseGripOptions.includes(preset.gripText)
//     (3) preset.attachmentSlug == null
//         OR exerciseAttachmentOptions.includes(preset.attachmentSlug)

import { describe, it, expect } from 'vitest';
import { isPresetCompatibleWithExercise } from '../../services/setupPresetCompatibility';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

type PresetSlice = Parameters<typeof isPresetCompatibleWithExercise>[0];

function makePreset(overrides: Partial<PresetSlice> = {}): PresetSlice {
  return {
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: null,
    attachmentSlug: null,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Rule (1) — capability gate
// ──────────────────────────────────────────────────────────────────────

describe('capability gate', () => {
  it('matches when the preset capability is in the exercise capability set', () => {
    const preset = makePreset({ capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      [],
    );
    expect(result).toBe(true);
  });

  it('rejects when the preset capability is NOT in the exercise capability set', () => {
    const preset = makePreset({ capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.DUMBBELLS, EquipmentCapabilitySlug.BARBELL],
      [],
      [],
    );
    expect(result).toBe(false);
  });

  it('rejects when the exercise capability set is empty', () => {
    const preset = makePreset({ capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION });
    const result = isPresetCompatibleWithExercise(preset, [], [], []);
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Rule (2) — grip field-level gate
// ──────────────────────────────────────────────────────────────────────

describe('grip field-level gate', () => {
  it('passes when preset.gripText is null (no preference)', () => {
    const preset = makePreset({ gripText: null });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      // Exercise declares NO grip options — but preset has none either,
      // so the rule trivially holds.
      [],
      [],
    );
    expect(result).toBe(true);
  });

  it('passes when preset.gripText is declared by the exercise catalog', () => {
    const preset = makePreset({ gripText: 'neutral' });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      ['neutral', 'overhand'],
      [],
    );
    expect(result).toBe(true);
  });

  it('rejects when preset.gripText is NOT declared by the exercise catalog', () => {
    // A capability-compatible preset is rejected because the grip
    // value isn't in the exercise's declared options — this is the
    // core difference from the original two-stage rule.
    const preset = makePreset({ gripText: 'supinated' });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      ['neutral', 'overhand'],
      [],
    );
    expect(result).toBe(false);
  });

  it('rejects when preset.gripText is set but the exercise declares no grip options at all', () => {
    const preset = makePreset({ gripText: 'neutral' });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      [],
    );
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Rule (3) — attachment field-level gate
// ──────────────────────────────────────────────────────────────────────

describe('attachment field-level gate', () => {
  it('passes when preset.attachmentSlug is null (no preference)', () => {
    const preset = makePreset({ attachmentSlug: null });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      [],
    );
    expect(result).toBe(true);
  });

  it('passes when preset.attachmentSlug is declared by the exercise catalog', () => {
    const preset = makePreset({ attachmentSlug: 'cable-rope' });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      ['cable-rope', 'cable-v-bar'],
    );
    expect(result).toBe(true);
  });

  it('rejects when preset.attachmentSlug is NOT declared by the exercise catalog', () => {
    const preset = makePreset({ attachmentSlug: 'cable-lat-bar' });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      ['cable-rope', 'cable-v-bar'],
    );
    expect(result).toBe(false);
  });

  it('preserves the catalog seed vocabulary (cable-* prefixed) — does NOT normalize to the TS union', () => {
    // The catalog seed stores cable-rope, cable-v-bar, cable-lat-bar,
    // cable-handle (prefixed). The TS union uses unprefixed (rope,
    // v-bar, lat-bar, handle). The compatibility rule treats them as
    // DISTINCT — a preset with attachmentSlug='rope' is NOT compatible
    // with an exercise that only declares 'cable-rope'. This is the
    // deliberate vocabulary mismatch preservation from Phase 5.
    const preset = makePreset({ attachmentSlug: 'rope' });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      ['cable-rope'],
    );
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Notes-only decision (Option A — allowed for capability-compatible exercises)
// ──────────────────────────────────────────────────────────────────────

describe('notes-only presets (Option A)', () => {
  it('a notes-only preset is compatible with ANY capability-compatible exercise', () => {
    // Even if the exercise declares no grip / attachment options, the
    // notes-only preset is still offered — equipment_notes is free
    // text and applies regardless.
    const preset = makePreset({
      gripText: null,
      attachmentSlug: null,
    });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      [],
      [],
    );
    expect(result).toBe(true);
  });

  it('a notes-only preset is rejected when the capability does NOT match', () => {
    const preset = makePreset({
      capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
      gripText: null,
      attachmentSlug: null,
    });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.DUMBBELLS],
      [],
      [],
    );
    expect(result).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Combined field-level + capability gating
// ──────────────────────────────────────────────────────────────────────

describe('combined rule (capability + both fields)', () => {
  it('matches when capability + grip + attachment all line up', () => {
    const preset = makePreset({
      capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
      gripText: 'neutral',
      attachmentSlug: 'cable-rope',
    });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      ['neutral', 'overhand'],
      ['cable-rope', 'cable-v-bar'],
    );
    expect(result).toBe(true);
  });

  it('rejects when grip matches but attachment does not', () => {
    const preset = makePreset({
      gripText: 'neutral',
      attachmentSlug: 'cable-handle',
    });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      ['neutral'],
      ['cable-rope'],
    );
    expect(result).toBe(false);
  });

  it('rejects when attachment matches but grip does not', () => {
    const preset = makePreset({
      gripText: 'supinated',
      attachmentSlug: 'cable-rope',
    });
    const result = isPresetCompatibleWithExercise(
      preset,
      [EquipmentCapabilitySlug.CABLE_STATION],
      ['neutral'],
      ['cable-rope'],
    );
    expect(result).toBe(false);
  });

  it('exercises independent of equipment_notes (never part of the rule)', () => {
    // equipmentNotes is free text and never affects compatibility —
    // confirmed by the helper signature (no equipmentNotes param).
    // This test exists to lock the helper surface.
    const preset = makePreset({ gripText: null, attachmentSlug: null });
    expect(
      isPresetCompatibleWithExercise(
        preset,
        [EquipmentCapabilitySlug.CABLE_STATION],
        [],
        [],
      ),
    ).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Type narrowing — preset shape uses Pick<SetupPreset, ...>
// ──────────────────────────────────────────────────────────────────────

describe('preset slice shape', () => {
  it('reads only capabilitySlug + gripText + attachmentSlug', () => {
    // A preset object with only the three rule-relevant keys must type-
    // check. Locks the Pick<SetupPreset, ...> narrow.
    const minimal: PresetSlice = {
      capabilitySlug: EquipmentCapabilitySlug.DUMBBELLS,
      gripText: null,
      attachmentSlug: null,
    };
    const result = isPresetCompatibleWithExercise(
      minimal,
      [EquipmentCapabilitySlug.DUMBBELLS],
      [],
      [],
    );
    expect(result).toBe(true);
  });
});
