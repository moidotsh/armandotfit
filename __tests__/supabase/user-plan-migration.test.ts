// __tests__/supabase/user-plan-migration.test.ts
//
// Phase-3 user-plan migration integrity. Parses the migration
// (20260723000000_user_program_plans.sql) as text and asserts the
// structural shape: three tables (user_program_plans,
// user_program_plan_slots, user_program_plan_slot_overrides), the
// resolution + status CHECK constraints, the UNIQUE constraints that
// make the adoption idempotent, the prescription_snapshot JSONB
// column that freezes slot prescriptions at adoption time, and the
// RLS policies that gate every write through the plan ownership
// chain.
//
// Reading the SQL as text mirrors __tests__/supabase/program-seed.test.ts:
// it lets us verify the migration without provisioning a live
// database. The actual RLS behavior is enforced by Postgres at query
// time; this test guarantees the policy text is present and reaches
// auth.uid() through the right join chain.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION_PATH = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260723000000_user_program_plans.sql',
);
const MIGRATION_SQL = readFileSync(MIGRATION_PATH, 'utf8');

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/**
 * Returns the substring of `sql` for one CREATE TABLE block, from
 * `CREATE TABLE [IF NOT EXISTS] public.<table>` through the matching
 * closing `);` at the end of the statement.
 */
function tableBlock(sql: string, table: string): string {
  const re = new RegExp(
    `CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+public\\.${table}\\b([\\s\\S]*?)\\n\\)\\s*;`,
    'm',
  );
  const m = sql.match(re);
  if (!m) throw new Error(`CREATE TABLE block for ${table} not found`);
  return m[1];
}

// ──────────────────────────────────────────────────────────────────────
// 1. user_program_plans
// ──────────────────────────────────────────────────────────────────────

describe('user_program_plans table', () => {
  const block = tableBlock(MIGRATION_SQL, 'user_program_plans');

  it('references auth.users with ON DELETE CASCADE', () => {
    expect(block).toMatch(/user_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+auth\.users\(id\)\s+ON\s+DELETE\s+CASCADE/);
  });

  it('references program_templates + program_schedule_variants with ON DELETE RESTRICT', () => {
    expect(block).toMatch(/template_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.program_templates\(id\)\s+ON\s+DELETE\s+RESTRICT/);
    expect(block).toMatch(/variant_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.program_schedule_variants\(id\)\s+ON\s+DELETE\s+RESTRICT/);
  });

  it('status has CHECK constraint with active + retired only', () => {
    expect(block).toMatch(/status\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'active'/);
    expect(block).toMatch(/CHECK\s*\(status\s+IN\s*\('active',\s*'retired'\)\)/);
  });

  it('does NOT have a global UNIQUE(user_id, variant_id) constraint', () => {
    // Lifecycle contract: a user can retain a retired plan AND adopt
    // a fresh active plan for the same variant. A global UNIQUE would
    // block this. Only the partial unique index WHERE status='active'
    // (tested below) enforces uniqueness — and only over active rows.
    expect(block).not.toMatch(/UNIQUE\s*\(\s*user_id,\s*variant_id\s*\)/);
  });

  it('enables RLS', () => {
    expect(MIGRATION_SQL).toMatch(/ALTER\s+TABLE\s+public\.user_program_plans\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/);
  });

  it('owner-only policy gates all CRUD by auth.uid()', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+POLICY\s+"Users can manage own program plans"\s+ON\s+public\.user_program_plans\s+FOR\s+ALL\s+TO\s+authenticated[\s\S]*?USING\s*\(user_id\s*=\s*auth\.uid\(\)\)[\s\S]*?WITH\s+CHECK\s*\(user_id\s*=\s*auth\.uid\(\)\)/,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 1b. Plan lifecycle — zero or one active + N retired per variant
// ──────────────────────────────────────────────────────────────────────

describe('plan lifecycle (one active + N retired per user × variant)', () => {
  it('partial unique index on (user_id, variant_id) WHERE status = active', () => {
    // The load-bearing constraint. The schema allows multiple rows
    // per (user_id, variant_id) in general; this index narrows the
    // uniqueness to active rows only.
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_user_program_plans_user_active\s+ON\s+public\.user_program_plans\s*\(\s*user_id,\s*variant_id\s*\)\s*WHERE\s+status\s*=\s*'active'/,
    );
  });

  it('a non-unique index on (user_id, variant_id) supports history scans', () => {
    // Retired-plan queries (history view, audit) filter by user_id +
    // variant_id; a non-unique index keeps them fast without
    // conflicting with the partial unique index.
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_user_program_plans_user_variant\s+ON\s+public\.user_program_plans\s*\(\s*user_id,\s*variant_id\s*\)/,
    );
  });

  it('CREATE TABLE block has no UNIQUE clause', () => {
    // Defensive: the table-level UNIQUE was removed to unlock the
    // retired-then-reactive lifecycle. If a future edit re-adds it,
    // this catches the regression.
    const block = tableBlock(MIGRATION_SQL, 'user_program_plans');
    expect(block).not.toMatch(/\bUNIQUE\b/);
  });

  it('COMMENT ON TABLE documents the retired-plan immutability invariant', () => {
    // The immutability of retired plans (their slots + prescription
    // snapshots are preserved on re-adoption) is a documented
    // invariant. The COMMENT is the canonical place this lives in
    // the DB; the repository savePlan enforces it by retiring +
    // inserting a new row rather than updating in place.
    expect(MIGRATION_SQL).toMatch(/Retired plans retain their slots \+ prescription_snapshot immutably/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. user_program_plan_slots
// ──────────────────────────────────────────────────────────────────────

describe('user_program_plan_slots table', () => {
  const block = tableBlock(MIGRATION_SQL, 'user_program_plan_slots');

  it('FK to user_program_plans is ON DELETE CASCADE', () => {
    expect(block).toMatch(/plan_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.user_program_plans\(id\)\s+ON\s+DELETE\s+CASCADE/);
  });

  it('FK to program_slots is ON DELETE RESTRICT (template edits cannot strip user plans)', () => {
    expect(block).toMatch(/template_slot_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.program_slots\(id\)\s+ON\s+DELETE\s+RESTRICT/);
  });

  it('chosen_exercise_id is nullable (resolution=missing slots have no exercise)', () => {
    // No NOT NULL on chosen_exercise_id — verified by absence of the
    // NOT NULL qualifier on the column definition.
    expect(block).toMatch(/chosen_exercise_id\s+UUID\s+REFERENCES\s+public\.exercises\(id\)\s+ON\s+DELETE\s+RESTRICT/);
    expect(block).not.toMatch(/chosen_exercise_id\s+UUID\s+NOT\s+NULL/);
  });

  it('resolution CHECK includes all six values', () => {
    expect(block).toMatch(
      /CHECK\s*\(resolution\s+IN\s*\('template',\s*'direct',\s*'close',\s*'fallback',\s*'manual',\s*'missing'\)\)/,
    );
  });

  it('prescription_snapshot is JSONB NOT NULL (snapshot freezes prescription at adoption)', () => {
    expect(block).toMatch(/prescription_snapshot\s+JSONB\s+NOT\s+NULL/);
  });

  it('UNIQUE(plan_id, template_slot_id) — one resolved row per template slot per plan', () => {
    expect(block).toMatch(/UNIQUE\s*\(\s*plan_id,\s*template_slot_id\s*\)/);
  });

  it('RLS policy reaches auth.uid() through plan ownership chain', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+POLICY\s+"Users can manage own program plan slots"[\s\S]*?EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+public\.user_program_plans\s+p\s+WHERE\s+p\.id\s*=\s*user_program_plan_slots\.plan_id\s+AND\s+p\.user_id\s*=\s*auth\.uid\s*\(\s*\)\s*\)/,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. user_program_plan_slot_overrides
// ──────────────────────────────────────────────────────────────────────

describe('user_program_plan_slot_overrides table', () => {
  const block = tableBlock(MIGRATION_SQL, 'user_program_plan_slot_overrides');

  it('FK to user_program_plan_slots is ON DELETE CASCADE', () => {
    expect(block).toMatch(/plan_slot_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.user_program_plan_slots\(id\)\s+ON\s+DELETE\s+CASCADE/);
  });

  it('chosen_exercise_id is NOT NULL (overrides always carry a chosen exercise)', () => {
    expect(block).toMatch(/chosen_exercise_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.exercises\(id\)\s+ON\s+DELETE\s+RESTRICT/);
  });

  it('alt_edge_id is nullable with ON DELETE SET NULL', () => {
    expect(block).toMatch(/alt_edge_id\s+UUID\s+REFERENCES\s+public\.exercise_alternatives\(id\)\s+ON\s+DELETE\s+SET\s+NULL/);
  });

  it('UNIQUE(plan_slot_id) — at most one override per slot', () => {
    expect(block).toMatch(/UNIQUE\s*\(\s*plan_slot_id\s*\)/);
  });

  it('RLS policy reaches auth.uid() through slot + plan join chain', () => {
    expect(MIGRATION_SQL).toMatch(
      /CREATE\s+POLICY\s+"Users can manage own plan slot overrides"[\s\S]*?EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+public\.user_program_plan_slots\s+s\s+JOIN\s+public\.user_program_plans\s+p\s+ON\s+p\.id\s*=\s*s\.plan_id\s+WHERE\s+s\.id\s*=\s*user_program_plan_slot_overrides\.plan_slot_id\s+AND\s+p\.user_id\s*=\s*auth\.uid\s*\(\s*\)\s*\)/,
    );
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. Partial unique index for active plans (covered above in lifecycle)
// ──────────────────────────────────────────────────────────────────────
// (Removed duplicate describe — see "plan lifecycle" block above.)

// ──────────────────────────────────────────────────────────────────────
// 5. updated_at triggers
// ──────────────────────────────────────────────────────────────────────

describe('updated_at triggers', () => {
  it('creates the trigger function as SECURITY DEFINER', () => {
    expect(MIGRATION_SQL).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.set_user_program_plan_updated_at\(\)\s+RETURNS\s+TRIGGER[\s\S]*?SECURITY\s+DEFINER/);
  });

  it('attaches triggers to both plans + plan_slots tables', () => {
    expect(MIGRATION_SQL).toMatch(/CREATE\s+TRIGGER\s+trg_user_program_plans_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.user_program_plans/);
    expect(MIGRATION_SQL).toMatch(/CREATE\s+TRIGGER\s+trg_user_program_plan_slots_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.user_program_plan_slots/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 6. Idempotency
// ──────────────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('uses CREATE TABLE IF NOT EXISTS for all three tables', () => {
    expect(MIGRATION_SQL).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.user_program_plans/);
    expect(MIGRATION_SQL).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.user_program_plan_slots/);
    expect(MIGRATION_SQL).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.user_program_plan_slot_overrides/);
  });

  it('uses CREATE INDEX IF NOT EXISTS for all indexes', () => {
    const indexMatches = MIGRATION_SQL.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+IF\s+NOT\s+EXISTS/g) ?? [];
    const indexTotal = (MIGRATION_SQL.match(/CREATE\s+(?:UNIQUE\s+)?INDEX/g) ?? []).length;
    expect(indexMatches.length).toBe(indexTotal);
  });

  it('DROP POLICY IF EXISTS guards every CREATE POLICY', () => {
    // Match standalone DROP POLICY statements only — skip the prose
    // mention in the header comment ("POLICY guarded by DROP POLICY
    // IF EXISTS …"). Statements start with `DROP POLICY IF EXISTS "`.
    const dropCount = (MIGRATION_SQL.match(/^DROP\s+POLICY\s+IF\s+EXISTS\s+"/gm) ?? []).length;
    const createCount = (MIGRATION_SQL.match(/^CREATE\s+POLICY\s+"/gm) ?? []).length;
    expect(dropCount).toBe(createCount);
  });
});
