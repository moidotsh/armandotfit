// __tests__/supabase/setup-preset-migration.test.ts
//
// Phase 6 user-owned equipment-setup preset migration integrity. Parses
// the migration (20260726000000_user_equipment_setup_presets.sql) as
// text and asserts the structural shape: one new table with owner-only
// RLS, no FK from workout_session_exercises (history stays immutable),
// capability_slug TEXT with no CHECK (TS union canonical), nullable
// setup-value columns, soft-retire columns, partial active-only index,
// general user_id index, and a per-table updated_at trigger function.
//
// Mirrors the text-parsing approach in workout-setup-migration.test.ts
// + user-plan-migration.test.ts — verifies the migration without
// provisioning a live database. Postgres enforces the actual NULL +
// no-CHECK behavior at query time; this test guarantees the policy text
// is present.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION_PATH = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260726000000_user_equipment_setup_presets.sql',
);
const MIGRATION_SQL = readFileSync(MIGRATION_PATH, 'utf8');

// ──────────────────────────────────────────────────────────────────────
// 1. The new table
// ──────────────────────────────────────────────────────────────────────

describe('user_equipment_setup_presets table', () => {
  it('creates the table with CREATE TABLE IF NOT EXISTS', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.user_equipment_setup_presets/,
    );
  });

  it('has id UUID PRIMARY KEY DEFAULT gen_random_uuid()', () => {
    expect(MIGRATION_SQL).toMatch(/id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)/i);
  });

  it('has user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE', () => {
    expect(MIGRATION_SQL).toMatch(
      /user_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+auth\.users\(id\)\s+ON\s+DELETE\s+CASCADE/i,
    );
  });

  it('has label TEXT NOT NULL (no uniqueness, no CHECK)', () => {
    expect(MIGRATION_SQL).toMatch(/label\s+TEXT\s+NOT\s+NULL/i);
    expect(MIGRATION_SQL).not.toMatch(/UNIQUE\s*\(\s*label/i);
    expect(MIGRATION_SQL).not.toMatch(/UNIQUE\s*\(\s*user_id,\s*label/i);
  });

  it('has capability_slug TEXT NOT NULL with no CHECK constraint', () => {
    // Mirrors invariant #13 — TS union canonical, DB stores TEXT so
    // vocabulary extends without a migration. The RLS policy carries
    // a legitimate `WITH CHECK (user_id = auth.uid())` which is NOT
    // a column CHECK; this test scopes to column-level CHECKs only.
    const m = MIGRATION_SQL.match(/capability_slug\s+TEXT\s+NOT\s+NULL/i);
    expect(m).not.toBeNull();
    // No column-level CHECK constraint anywhere in the file. Matches
    // e.g. `CHECK (capability_slug IN` or `CONSTRAINT ... CHECK (...)`
    // but NOT the RLS `WITH CHECK (...)` clause.
    expect(MIGRATION_SQL).not.toMatch(/CONSTRAINT\s+\w+\s+CHECK\s*\(/i);
    expect(MIGRATION_SQL).not.toMatch(/CHECK\s*\(\s*capability_slug/i);
    expect(MIGRATION_SQL).not.toMatch(/capability_slug[^,)]*CHECK\s*\(/i);
  });

  it('has the three nullable setup-value columns (grip_text, attachment_slug, equipment_notes)', () => {
    expect(MIGRATION_SQL).toMatch(/grip_text\s+TEXT/i);
    expect(MIGRATION_SQL).toMatch(/attachment_slug\s+TEXT/i);
    expect(MIGRATION_SQL).toMatch(/equipment_notes\s+TEXT/i);
    // None of them carry NOT NULL.
    const setupColDef = /(?:grip_text|attachment_slug|equipment_notes)\s+TEXT(?!\s+NOT\s+NULL)/gi;
    expect(MIGRATION_SQL.match(setupColDef)).not.toBeNull();
  });

  it('has is_retired BOOLEAN NOT NULL DEFAULT FALSE', () => {
    expect(MIGRATION_SQL).toMatch(
      /is_retired\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+FALSE/i,
    );
  });

  it('has retired_at TIMESTAMPTZ (nullable, no DEFAULT)', () => {
    expect(MIGRATION_SQL).toMatch(/retired_at\s+TIMESTAMPTZ/i);
    // retired_at must not carry a DEFAULT (only set programmatically on retire).
    const m = MIGRATION_SQL.match(/retired_at\s+TIMESTAMPTZ[^,)]*/i);
    expect(m, 'retired_at column definition must exist').not.toBeNull();
    expect(m![0]).not.toMatch(/DEFAULT/i);
  });

  it('has created_at + updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()', () => {
    expect(MIGRATION_SQL).toMatch(
      /created_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+NOW\(\)/i,
    );
    expect(MIGRATION_SQL).toMatch(
      /updated_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+NOW\(\)/i,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. No FK from history to preset (Phase 6 invariant)
// ──────────────────────────────────────────────────────────────────────

describe('history independence (no FK from workout_session_exercises)', () => {
  it('does NOT add a preset_id column to workout_session_exercises', () => {
    // History stays immutable: selecting a preset at session time
    // COPIES values into existing Phase 5 columns; no FK links the
    // tables. A retired or deleted preset must never invalidate a
    // historical workout row.
    expect(MIGRATION_SQL).not.toMatch(
      /workout_session_exercises.*preset_id/i,
    );
    expect(MIGRATION_SQL).not.toMatch(/preset_id\s+UUID/i);
  });

  it('does NOT alter workout_session_exercises at all', () => {
    expect(MIGRATION_SQL).not.toMatch(
      /ALTER\s+TABLE\s+public\.workout_session_exercises/i,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. Indexes (partial active-only + general user_id)
// ──────────────────────────────────────────────────────────────────────

describe('indexes', () => {
  it('creates a partial active-only index on user_id WHERE is_retired = FALSE', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_user_equipment_setup_presets_user_active/i,
    );
    expect(MIGRATION_SQL).toMatch(/WHERE\s+is_retired\s*=\s*FALSE/i);
  });

  it('creates a general user_id index for the management scan', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_user_equipment_setup_presets_user\b/i,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. RLS — owner-only through direct user_id match
// ──────────────────────────────────────────────────────────────────────

describe('RLS — owner-only', () => {
  it('enables + forces RLS', () => {
    expect(MIGRATION_SQL).toMatch(
      /ALTER\s+TABLE\s+public\.user_equipment_setup_presets\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i,
    );
    expect(MIGRATION_SQL).toMatch(
      /ALTER\s+TABLE\s+public\.user_equipment_setup_presets\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i,
    );
  });

  it('creates a single owner-only policy using user_id = auth.uid()', () => {
    // Direct match — no ownership-chain subqueries (the table owns its
    // own user_id column). Mirrors the user_program_plans pattern.
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+POLICY\s+"Users can manage own equipment setup presets"/i,
    );
    expect(MIGRATION_SQL).toMatch(/USING\s*\(\s*user_id\s*=\s*auth\.uid\(\)\s*\)/i);
    expect(MIGRATION_SQL).toMatch(/WITH\s+CHECK\s*\(\s*user_id\s*=\s*auth\.uid\(\)\s*\)/i);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 5. updated_at trigger (per-table function — mirrors 20260723000000)
// ──────────────────────────────────────────────────────────────────────

describe('updated_at trigger', () => {
  it('creates a per-table SECURITY DEFINER trigger function', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.set_user_equipment_setup_preset_updated_at\(\)/i,
    );
    expect(MIGRATION_SQL).toMatch(/RETURNS\s+TRIGGER/i);
    expect(MIGRATION_SQL).toMatch(/LANGUAGE\s+plpgsql\s+SECURITY\s+DEFINER/i);
  });

  it('creates the BEFORE UPDATE trigger wired to the function', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+TRIGGER\s+trg_user_equipment_setup_presets_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.user_equipment_setup_presets/i,
    );
    expect(MIGRATION_SQL).toMatch(/EXECUTE\s+FUNCTION\s+public\.set_user_equipment_setup_preset_updated_at\(\)/i);
  });

  it('drops the trigger before recreating (DROP IF EXISTS)', () => {
    expect(MIGRATION_SQL).toMatch(
      /DROP\s+TRIGGER\s+IF\s+EXISTS\s+trg_user_equipment_setup_presets_updated_at/i,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 6. COMMENTs document the invariants
// ──────────────────────────────────────────────────────────────────────

describe('COMMENTs document Phase 6 invariants', () => {
  it('comments on the table', () => {
    expect(MIGRATION_SQL).toMatch(
      /COMMENT\s+ON\s+TABLE\s+public\.user_equipment_setup_presets\s+IS/i,
    );
  });

  it('comments on every column', () => {
    const columns = [
      'user_id',
      'label',
      'capability_slug',
      'grip_text',
      'attachment_slug',
      'equipment_notes',
      'is_retired',
      'retired_at',
    ];
    for (const col of columns) {
      expect(MIGRATION_SQL).toMatch(
        new RegExp(
          `COMMENT\\s+ON\\s+COLUMN\\s+public\\.user_equipment_setup_presets\\.${col}\\s+IS`,
          'i',
        ),
      );
    }
  });

  it('documents that history has no FK to presets', () => {
    expect(MIGRATION_SQL).toMatch(/no FK from history/i);
  });

  it('documents that retirement does not affect historical rows', () => {
    expect(MIGRATION_SQL).toMatch(/retire/i);
    expect(MIGRATION_SQL).toMatch(/history/i);
  });
});
