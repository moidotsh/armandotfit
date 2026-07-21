// __tests__/repositories/SetupPresetRepository.test.ts
//
// Locks the boundary validator contract: label 1..60 chars (after
// trim), capabilitySlug must be a known EquipmentCapabilitySlug, and
// notes-only presets (gripText + attachmentSlug both null) are allowed
// per Phase 6 contract amendment (Option A).
//
// The full CRUD path is verified by the management-route integration
// test under __tests__/app/SetupPresetManagement.test.tsx. The
// history-independence guarantee (deleting a preset leaves saved
// workouts unchanged) is verified by the store-level test under
// __tests__/stores/workoutStore.history-independence.test.ts and the
// schema-level no-FK invariant under
// __tests__/supabase/setup-preset-migration.test.ts. This file locks
// the pure validator that runs at the create/update boundary so UI
// bypass cannot land invalid data, plus the repository's public method
// surface (CRUD entrypoints) for user-isolation coverage.

import { describe, it, expect } from 'vitest';
import {
  validateSetupPresetInput,
  setupPresetRepository,
  SetupPresetRepository,
} from '../../utils/supabase/repositories';
import { EquipmentCapabilitySlug } from '../../constants/equipmentCapabilities';
import type { CreateSetupPresetDTO } from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────────────────────────────

function makeDTO(overrides: Partial<CreateSetupPresetDTO> = {}): CreateSetupPresetDTO {
  return {
    label: 'Cable column 3 — neutral rope',
    capabilitySlug: EquipmentCapabilitySlug.CABLE_STATION,
    gripText: null,
    attachmentSlug: null,
    equipmentNotes: null,
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Label validation
// ──────────────────────────────────────────────────────────────────────

describe('validateSetupPresetInput — label', () => {
  it('accepts a 1-character label after trim', () => {
    const res = validateSetupPresetInput(makeDTO({ label: ' x ' }));
    expect(res.success).toBe(true);
  });

  it('accepts a 60-character label', () => {
    const res = validateSetupPresetInput(makeDTO({ label: 'x'.repeat(60) }));
    expect(res.success).toBe(true);
  });

  it('rejects a 0-character label after trim (whitespace-only)', () => {
    const res = validateSetupPresetInput(makeDTO({ label: '   ' }));
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('VALIDATION_ERROR');
      expect(res.error.message).toMatch(/Label/i);
    }
  });

  it('rejects a label longer than 60 characters after trim', () => {
    const res = validateSetupPresetInput(makeDTO({ label: 'x'.repeat(61) }));
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('trims before checking length — a label with surrounding whitespace that trims to 60 chars passes', () => {
    const res = validateSetupPresetInput(makeDTO({ label: `  ${'x'.repeat(60)}  ` }));
    expect(res.success).toBe(true);
  });

  it('rejects a label with only surrounding whitespace that trims to > 60 chars', () => {
    const res = validateSetupPresetInput(makeDTO({ label: `  ${'x'.repeat(61)}  ` }));
    expect(res.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Capability slug validation
// ──────────────────────────────────────────────────────────────────────

describe('validateSetupPresetInput — capabilitySlug', () => {
  it('accepts every canonical EquipmentCapabilitySlug', () => {
    // Round-trip: the DB stores TEXT so vocabulary extends without a
    // migration, but the boundary narrows to the TS union.
    for (const slug of Object.values(EquipmentCapabilitySlug)) {
      const res = validateSetupPresetInput(makeDTO({ capabilitySlug: slug }));
      expect(res.success, `expected ${slug} to be accepted`).toBe(true);
    }
  });

  it('rejects an unknown capability slug', () => {
    const res = validateSetupPresetInput(
      makeDTO({ capabilitySlug: 'time-machine' as unknown as EquipmentCapabilitySlug }),
    );
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('VALIDATION_ERROR');
      expect(res.error.message).toMatch(/unknown capability slug/i);
    }
  });

  it('rejects an empty string', () => {
    const res = validateSetupPresetInput(
      makeDTO({ capabilitySlug: '' as unknown as EquipmentCapabilitySlug }),
    );
    expect(res.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Notes-only decision (Option A — allowed)
// ──────────────────────────────────────────────────────────────────────

describe('validateSetupPresetInput — notes-only presets (Option A)', () => {
  it('accepts a preset with gripText=null AND attachmentSlug=null', () => {
    // Per Phase 6 amended contract: notes-only presets are compatible
    // with any capability-compatible exercise. The validator does NOT
    // reject them at create/update time.
    const res = validateSetupPresetInput(
      makeDTO({
        gripText: null,
        attachmentSlug: null,
        equipmentNotes: 'Cable column 3',
      }),
    );
    expect(res.success).toBe(true);
  });

  it('accepts a preset with gripText set AND attachmentSlug null', () => {
    const res = validateSetupPresetInput(
      makeDTO({ gripText: 'neutral', attachmentSlug: null }),
    );
    expect(res.success).toBe(true);
  });

  it('accepts a preset with gripText null AND attachmentSlug set', () => {
    const res = validateSetupPresetInput(
      makeDTO({ gripText: null, attachmentSlug: 'cable-rope' }),
    );
    expect(res.success).toBe(true);
  });

  it('accepts a preset with all setup fields null (capability-only)', () => {
    const res = validateSetupPresetInput(
      makeDTO({ gripText: null, attachmentSlug: null, equipmentNotes: null }),
    );
    expect(res.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Repository class shape — locks the singleton export + the seven methods
// ──────────────────────────────────────────────────────────────────────

describe('SetupPresetRepository — public API surface', () => {
  it('exports a singleton instance', () => {
    expect(setupPresetRepository).toBeInstanceOf(SetupPresetRepository);
  });

  it('exposes the seven public methods (list-active, list-all, create, update, retire, un-retire, delete)', () => {
    const repo = setupPresetRepository;
    expect(typeof repo.listActiveForUser).toBe('function');
    expect(typeof repo.listAllForUser).toBe('function');
    expect(typeof repo.create).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.retire).toBe('function');
    expect(typeof repo.unretire).toBe('function');
    expect(typeof repo.delete).toBe('function');
  });
});

// ──────────────────────────────────────────────────────────────────────
// User-isolation — the two list methods take userId as a required first
// argument so the caller cannot accidentally fetch cross-user rows. RLS
// at the DB level (verified in setup-preset-migration.test.ts) is the
// last-mile gate, but the repository signature forces every caller to
// declare which user they're querying for. Hard-delete takes only the
// presetId — RLS scoping ensures the row is owned by the calling user.
// ──────────────────────────────────────────────────────────────────────

describe('SetupPresetRepository — user-isolation signatures', () => {
  it('listActiveForUser.length === 1 — userId is a required parameter', () => {
    // Function.length is the number of declared parameters before the
    // first default/rest. Locks the contract: every read takes a userId.
    expect(setupPresetRepository.listActiveForUser.length).toBe(1);
  });

  it('listAllForUser.length === 1 — userId is a required parameter', () => {
    expect(setupPresetRepository.listAllForUser.length).toBe(1);
  });

  it('create.length >= 2 — userId + dto are both required', () => {
    // create is `(userId, dto)` — two declared params, before any
    // default-valued arg. Locks that the caller cannot create a preset
    // without declaring ownership.
    expect(setupPresetRepository.create.length).toBeGreaterThanOrEqual(2);
  });
});
