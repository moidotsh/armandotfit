// __tests__/supabase/workout-provenance-migration.test.ts
//
// Phase-4 workout-session provenance migration integrity. Parses the
// migration (20260724000000_workout_session_provenance.sql) as text
// and asserts the structural shape: every new column is ADD COLUMN IF
// NOT EXISTS + nullable (so historical rows read without backfill), the
// CHECK constraints on session_window + source mirror the domain
// unions, the partial indexes scope plan_id + plan_slot_id lookups to
// non-null rows, and the NO-FK design preserves history integrity when
// a plan/template/variant row is later deleted.
//
// Mirrors the text-parsing approach in user-plan-migration.test.ts +
// program-seed.test.ts — verifies the migration without provisioning a
// live database. The actual NULL/CHECK behavior is enforced by Postgres
// at query time; this test guarantees the policy text is present.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION_PATH = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260724000000_workout_session_provenance.sql',
);
const MIGRATION_SQL = readFileSync(MIGRATION_PATH, 'utf8');

// ──────────────────────────────────────────────────────────────────────
// 1. workout_sessions provenance columns
// ──────────────────────────────────────────────────────────────────────

describe('workout_sessions provenance columns', () => {
  it('adds session_window TEXT with CHECK (am | pm | single | NULL)', () => {
    expect(MIGRATION_SQL).toMatch(
      /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+session_window\s+TEXT\s+CHECK\s*\(session_window\s+IS\s+NULL\s+OR\s+session_window\s+IN\s*\(\s*'am',\s*'pm',\s*'single'\s*\)\)/,
    );
  });

  it('adds started_at TIMESTAMPTZ (nullable)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+started_at\s+TIMESTAMPTZ/);
  });

  it('adds completed_at TIMESTAMPTZ (nullable)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+completed_at\s+TIMESTAMPTZ/);
  });

  it('adds plan_id UUID (nullable, NO foreign key)', () => {
    // History integrity: deleting a plan must never invalidate a
    // historical workout. The JSONB snapshots carry the immutable
    // identity context if the plan row is later removed.
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+plan_id\s+UUID(?!\s+REFERENCES)/);
  });

  it('adds plan_template_snapshot JSONB (nullable)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+plan_template_snapshot\s+JSONB/);
  });

  it('adds plan_variant_snapshot JSONB (nullable)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+plan_variant_snapshot\s+JSONB/);
  });

  it('partial index on plan_id WHERE plan_id IS NOT NULL', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_workout_sessions_plan_id\s+ON\s+public\.workout_sessions\s*\(\s*plan_id\s*\)\s+WHERE\s+plan_id\s+IS\s+NOT\s+NULL/,
    );
  });

  it('does NOT add a foreign key constraint on plan_id', () => {
    // Defensive: history must survive plan deletion. Match the
    // ADD COLUMN block then assert it has no REFERENCES clause.
    const m = MIGRATION_SQL.match(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+plan_id\s+UUID(?:[,\n])/);
    expect(m, 'plan_id column definition must exist').not.toBeNull();
    const segment = MIGRATION_SQL.slice(m!.index!, m!.index! + 200);
    expect(segment).not.toMatch(/REFERENCES/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. workout_session_exercises provenance columns
// ──────────────────────────────────────────────────────────────────────

describe('workout_session_exercises provenance columns', () => {
  it('adds plan_slot_id UUID (nullable, NO foreign key)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+plan_slot_id\s+UUID/);
  });

  it('adds template_slot_id UUID (nullable, NO foreign key)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+template_slot_id\s+UUID/);
  });

  it('adds per_side BOOLEAN (nullable)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+per_side\s+BOOLEAN/);
  });

  it('adds slot_notes TEXT (nullable)', () => {
    expect(MIGRATION_SQL).toMatch(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+slot_notes\s+TEXT/);
  });

  it('adds source TEXT with CHECK (plan | static | NULL)', () => {
    expect(MIGRATION_SQL).toMatch(
      /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+source\s+TEXT\s+CHECK\s*\(source\s+IS\s+NULL\s+OR\s+source\s+IN\s*\(\s*'plan',\s*'static'\s*\)\)/,
    );
  });

  it('partial index on plan_slot_id WHERE plan_slot_id IS NOT NULL', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_workout_session_exercises_plan_slot\s+ON\s+public\.workout_session_exercises\s*\(\s*plan_slot_id\s*\)\s+WHERE\s+plan_slot_id\s+IS\s+NOT\s+NULL/,
    );
  });

  it('does NOT add a foreign key constraint on plan_slot_id or template_slot_id', () => {
    // Both must remain bare UUID columns so historical workouts survive
    // plan slot / template slot deletion. The prescription snapshot
    // columns (per_side + slot_notes) preserve the immutable context.
    for (const col of ['plan_slot_id', 'template_slot_id']) {
      const re = new RegExp(
        `ADD\\s+COLUMN\\s+IF\\s+NOT\\s+EXISTS\\s+${col}\\s+UUID(?:[\\s,\\n])`,
      );
      const m = MIGRATION_SQL.match(re);
      expect(m, `${col} column definition must exist`).not.toBeNull();
      const segment = MIGRATION_SQL.slice(m!.index!, m!.index! + 200);
      expect(segment).not.toMatch(/REFERENCES/);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. Comments document the invariants
// ──────────────────────────────────────────────────────────────────────

describe('COMMENTs document Phase 4 invariants', () => {
  it('plan_id COMMENT explains the no-FK-by-design rule', () => {
    expect(MIGRATION_SQL).toMatch(/NO foreign key constraint by design/);
    expect(MIGRATION_SQL).toMatch(/deleting a plan must never delete or invalidate historical workout rows/);
  });

  it('plan_slot_id COMMENT explains the snapshot independence rule', () => {
    expect(MIGRATION_SQL).toMatch(/preserves history if the plan slot is deleted/);
  });

  it('source COMMENT enumerates the three values', () => {
    expect(MIGRATION_SQL).toMatch(/plan = hydrated from a saved user_program_plan/);
    expect(MIGRATION_SQL).toMatch(/static = hydrated from the legacy suggested-split path/);
  });

  it('session_window COMMENT disclaims wall-clock intent', () => {
    expect(MIGRATION_SQL).toMatch(/NOT a wall-clock claim/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. Idempotency
// ──────────────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('every ALTER TABLE column uses ADD COLUMN IF NOT EXISTS', () => {
    const addTotal = (MIGRATION_SQL.match(/ADD\s+COLUMN/g) ?? []).length;
    const addIfNotExists = (MIGRATION_SQL.match(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/g) ?? []).length;
    expect(addIfNotExists).toBe(addTotal);
  });

  it('every CREATE INDEX uses IF NOT EXISTS', () => {
    const indexMatches = MIGRATION_SQL.match(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS/g) ?? [];
    const indexTotal = (MIGRATION_SQL.match(/CREATE\s+INDEX/g) ?? []).length;
    expect(indexMatches.length).toBe(indexTotal);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 5. RLS unchanged (intentional — new columns inherit existing policy)
// ──────────────────────────────────────────────────────────────────────

describe('RLS policy edits', () => {
  it('does NOT create or drop any RLS policy', () => {
    // Phase 4 inherits the existing workout_sessions + workout_session_exercises
    // RLS policies (baseline 00000000000000 lines 341-373). A new policy
    // here would indicate an unintentional scoping change.
    expect(MIGRATION_SQL).not.toMatch(/CREATE\s+POLICY/);
    expect(MIGRATION_SQL).not.toMatch(/DROP\s+POLICY/);
    expect(MIGRATION_SQL).not.toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/);
  });
});
