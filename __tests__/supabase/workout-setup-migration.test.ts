// __tests__/supabase/workout-setup-migration.test.ts
//
// Phase 5 equipment-setup snapshot migration integrity. Parses the
// migration (20260725000000_workout_setup_snapshot.sql) as text and
// asserts the structural shape: one new nullable TEXT column on
// workout_session_exercises, ADD COLUMN IF NOT EXISTS for idempotency,
// no FK / no CHECK / no index / no RLS / no trigger / no RPC, and the
// COMMENT documents the six invariants.
//
// Mirrors the text-parsing approach in workout-provenance-migration.test.ts
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
  '20260725000000_workout_setup_snapshot.sql',
);
const MIGRATION_SQL = readFileSync(MIGRATION_PATH, 'utf8');

// ──────────────────────────────────────────────────────────────────────
// 1. The new column
// ──────────────────────────────────────────────────────────────────────

describe('workout_session_exercises.attachment_slug', () => {
  it('adds attachment_slug TEXT with ADD COLUMN IF NOT EXISTS', () => {
    expect(MIGRATION_SQL).toMatch(
      /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+attachment_slug\s+TEXT/,
    );
  });

  it('does NOT add a DEFAULT clause', () => {
    // NULL is the only sensible "unset" value; a default would silently
    // backfill historical rows with a non-null sentinel that the UI would
    // then have to filter out.
    const m = MIGRATION_SQL.match(
      /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+attachment_slug\s+TEXT/,
    );
    expect(m, 'attachment_slug column definition must exist').not.toBeNull();
    const segment = MIGRATION_SQL.slice(m!.index!, m!.index! + 200);
    expect(segment).not.toMatch(/DEFAULT/);
  });

  it('does NOT add a CHECK constraint', () => {
    // The TS CableAttachmentSlug union is canonical; the DB stores TEXT so
    // the vocabulary can extend without a migration. A CHECK would defeat
    // the design.
    const m = MIGRATION_SQL.match(
      /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+attachment_slug\s+TEXT/,
    );
    expect(m, 'attachment_slug column definition must exist').not.toBeNull();
    const segment = MIGRATION_SQL.slice(m!.index!, m!.index! + 200);
    expect(segment).not.toMatch(/CHECK/i);
  });

  it('does NOT add a REFERENCES clause (no FK)', () => {
    // History must survive any catalog change. The column references a
    // TS-side vocabulary, not a DB table.
    const m = MIGRATION_SQL.match(
      /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+attachment_slug\s+TEXT/,
    );
    expect(m, 'attachment_slug column definition must exist').not.toBeNull();
    const segment = MIGRATION_SQL.slice(m!.index!, m!.index! + 200);
    expect(segment).not.toMatch(/REFERENCES/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 2. No index / no RLS / no trigger / no RPC
// ──────────────────────────────────────────────────────────────────────

describe('no ancillary DB objects', () => {
  it('does NOT create an index on attachment_slug', () => {
    // The column is never queried by — display-only metadata on a
    // historical row. An index would bloat every insert for no gain.
    expect(MIGRATION_SQL).not.toMatch(/CREATE\s+INDEX/i);
  });

  it('does NOT create or drop any RLS policy', () => {
    // The existing workout_session_exercises policy (baseline +
    // Phase 4) already gates reads/writes by user_id = auth.uid() through
    // the ownership chain. The new column inherits that scoping
    // automatically — no policy edit needed.
    expect(MIGRATION_SQL).not.toMatch(/CREATE\s+POLICY/i);
    expect(MIGRATION_SQL).not.toMatch(/DROP\s+POLICY/i);
    expect(MIGRATION_SQL).not.toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  });

  it('does NOT create a trigger', () => {
    expect(MIGRATION_SQL).not.toMatch(/CREATE\s+TRIGGER/i);
    expect(MIGRATION_SQL).not.toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
    expect(MIGRATION_SQL).not.toMatch(/CREATE\s+FUNCTION/i);
  });

  it('does NOT define an RPC', () => {
    expect(MIGRATION_SQL).not.toMatch(/RETURNS\s+\w+/i);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 3. COMMENT documents the six invariants
// ──────────────────────────────────────────────────────────────────────

describe('COMMENT documents Phase 5 invariants', () => {
  it('comments on the attachment_slug column', () => {
    expect(MIGRATION_SQL).toMatch(
      /COMMENT\s+ON\s+COLUMN\s+public\.workout_session_exercises\.attachment_slug\s+IS/i,
    );
  });

  it('documents that the column is nullable + passive metadata', () => {
    expect(MIGRATION_SQL).toMatch(/passive metadata/i);
    expect(MIGRATION_SQL).toMatch(/NULL/i);
  });

  it('documents the no-FK-by-design rule', () => {
    expect(MIGRATION_SQL).toMatch(/NO FK by design/i);
  });

  it('documents the no-CHECK rule with TS-canonical rationale', () => {
    expect(MIGRATION_SQL).toMatch(/no CHECK/i);
    expect(MIGRATION_SQL).toMatch(/TS union is canonical/i);
  });

  it('documents the CableAttachmentSlug vocabulary', () => {
    expect(MIGRATION_SQL).toMatch(/CableAttachmentSlug TS union/i);
    expect(MIGRATION_SQL).toMatch(/rope/);
    expect(MIGRATION_SQL).toMatch(/straight-bar/);
    expect(MIGRATION_SQL).toMatch(/v-bar/);
    expect(MIGRATION_SQL).toMatch(/lat-bar/);
    expect(MIGRATION_SQL).toMatch(/handle/);
  });
});

// ──────────────────────────────────────────────────────────────────────
// 4. Idempotency
// ──────────────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('every ALTER TABLE column uses ADD COLUMN IF NOT EXISTS', () => {
    const addTotal = (MIGRATION_SQL.match(/ADD\s+COLUMN/g) ?? []).length;
    const addIfNotExists = (
      MIGRATION_SQL.match(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/g) ?? []
    ).length;
    expect(addIfNotExists).toBe(addTotal);
    expect(addTotal).toBeGreaterThanOrEqual(1);
  });
});
