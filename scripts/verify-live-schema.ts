#!/usr/bin/env bun
// scripts/verify-live-schema.ts
//
// Read-only verification that the LIVE Supabase project's schema is a
// superset of what this repo's repositories actually query — the tool
// the live-400 lesson earned: WorkoutRepository once selected a
// created_at column no migration defines, and only the owner's console
// saw the 42703.
//
// How it works (no auth, no writes): PostgREST validates a query's
// shape against the schema cache BEFORE privileges, so an anon-key GET
// distinguishes everything we need —
//   200    column exists + anon may read it
//   401/42501  column exists (privileges deny anon — the expected
//          posture for owner-only tables; grants target authenticated)
//   400/42703  column does not exist       → FAIL
//   400/42P01  table does not exist        → FAIL
// Embedded-relationship probes additionally catch FK drift (a select
// shape the repositories use failing to resolve).
//
// Run: bun run scripts/verify-live-schema.ts
// Reads EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY from
// the environment or .env.local. Exit 0 = live schema covers the repo.

import { readFileSync, existsSync } from 'node:fs';

// ── env ────────────────────────────────────────────────────────────────
function envValue(name: string): string {
  const direct = process.env[name];
  if (direct) return direct;
  if (existsSync('.env.local')) {
    const m = readFileSync('.env.local', 'utf8').match(
      new RegExp(`^${name}=(.*)$`, 'm'),
    );
    if (m) return m[1].trim();
  }
  return '';
}

const URL_ = envValue('EXPO_PUBLIC_SUPABASE_URL');
const KEY = envValue('EXPO_PUBLIC_SUPABASE_ANON_KEY');
if (!URL_ || !KEY) {
  console.error(
    '✗ EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not found (env or .env.local).',
  );
  process.exit(2);
}

// ── expectations ────────────────────────────────────────────────────────
// Exactly the columns the repositories name. Keep in sync with
// utils/supabase/repositories/*.ts (the schema-truth test pins the
// client side; this pins the live side).
const TABLE_COLUMNS: Record<string, string[]> = {
  users: ['id', 'display_name', 'weight_unit', 'rest_days'],
  exercises: ['id', 'user_id', 'name'],
  sessions: ['id', 'user_id', 'started_at', 'note', 'split_day'],
  logged_exercises: [
    'id',
    'session_id',
    'exercise_id',
    'position',
    'tags',
    'note',
  ],
  logged_sets: [
    'id',
    'logged_exercise_id',
    'position',
    'reps',
    'weight',
    'note',
  ],
  music_picks: ['id', 'user_id', 'video_id', 'title', 'artist', 'picked_at'],
};

// The embedded select shapes the repositories actually issue (the
// shape drift that produced the live 400 lived here).
const EMBED_SHAPES: Array<{ table: string; select: string; why: string }> = [
  {
    table: 'sessions',
    select: '*,logged_exercises(*,exercise:exercises(name),logged_sets(*))',
    why: 'findRecentWithDetails / findByIdWithDetails',
  },
  {
    table: 'logged_exercises',
    select: 'tags,exercise:exercises(name),sessions(started_at)',
    why: 'findLastTagsByExerciseNames (the live-400 fix shape)',
  },
];

type Row = { check: string; status: 'ok' | 'fail'; detail: string };
const rows: Row[] = [];

async function probe(path: string): Promise<{ code: number; detail: string }> {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const body = (await res.json().catch(() => '')) as unknown;
  const code =
    typeof body === 'object' && body !== null && 'code' in body
      ? String((body as { code: unknown }).code)
      : '';
  return { code: res.status, detail: code };
}

// Column probes.
for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
  for (const col of columns) {
    const { code, detail } = await probe(
      `${table}?select=${col}&limit=1`,
    );
    // 200 (readable) and 401/42501 (exists, privileges deny) both pass.
    const ok = code === 200 || code === 401 || (code === 400 && detail === '42501');
    rows.push({
      check: `${table}.${col}`,
      status: ok ? 'ok' : 'fail',
      detail: ok
        ? code === 200
          ? 'exists (anon-readable)'
          : 'exists (anon denied — expected)'
        : `HTTP ${code} ${detail}`,
    });
  }
}

// Embedded-relationship probes.
for (const shape of EMBED_SHAPES) {
  const { code, detail } = await probe(
    `${shape.table}?select=${encodeURIComponent(shape.select)}&limit=1`,
  );
  const ok = code === 200 || code === 401 || (code === 400 && detail === '42501');
  rows.push({
    check: `${shape.table} ▸ ${shape.why}`,
    status: ok ? 'ok' : 'fail',
    detail: ok ? 'shape resolves' : `HTTP ${code} ${detail}`,
  });
}

// ── report ──────────────────────────────────────────────────────────────
const width = Math.max(...rows.map((r) => r.check.length));
for (const r of rows) {
  console.log(`${r.status === 'ok' ? '✓' : '✗'} ${r.check.padEnd(width)}  ${r.detail}`);
}
const failed = rows.filter((r) => r.status === 'fail');
console.log(
  `\n${rows.length - failed.length}/${rows.length} checks passed against ${URL_.replace('https://', '')}`,
);
if (failed.length > 0) {
  console.log(
    '\nThe live project is missing structures the app queries. Apply the pending\n' +
      'supabase/migrations to the live project (owner step — approval-gated), then re-run.',
  );
  process.exit(1);
}
console.log('\nLive schema covers everything the repositories query.');
