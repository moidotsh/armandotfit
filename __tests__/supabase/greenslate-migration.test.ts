// __tests__/supabase/greenslate-migration.test.ts
// Shape goldens for the single-migration schema. Parses the SQL text —
// no DB required. Catches the classes of bugs found in review (missing
// trigger drop, broken CHECK, missing backfill) ever being reintroduced.

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

const SQL = readFileSync(
  new URL('../../supabase/migrations/20261001000000_greenslate_rebuild.sql', import.meta.url),
  'utf8',
);

describe('greenslate migration', () => {
  it('creates exactly the five tables', () => {
    const created = SQL.match(/CREATE TABLE public\.(\w+)/g) ?? [];
    expect(created.sort()).toEqual([
      'CREATE TABLE public.exercises',
      'CREATE TABLE public.logged_exercises',
      'CREATE TABLE public.logged_sets',
      'CREATE TABLE public.sessions',
      'CREATE TABLE public.users',
    ]);
  });

  it('drops the old auth-users trigger BEFORE the function it references', () => {
    const triggerDrop = SQL.indexOf('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users');
    const fnDrop = SQL.indexOf('DROP FUNCTION IF EXISTS public.handle_new_user()');
    expect(triggerDrop).toBeGreaterThanOrEqual(0);
    expect(fnDrop).toBeGreaterThan(triggerDrop);
  });

  it('backfills users rows for pre-existing auth accounts', () => {
    const backfill = SQL.indexOf('INSERT INTO public.users (id, display_name)');
    const seed = SQL.lastIndexOf('INSERT INTO public.exercises');
    expect(backfill).toBeGreaterThan(0);
    expect(backfill).toBeLessThan(seed);
    expect(SQL).toContain('FROM auth.users u');
  });

  it('rest_days uses the Postgres-safe subset idiom, not a text regex', () => {
    expect(SQL).toContain('rest_days <@ ARRAY[0,1,2,3,4,5,6]::integer[]');
    expect(SQL).not.toMatch(/rest_days::text ~ /);
  });

  it('history carries no FKs to mutable user data beyond exercise identity', () => {
    const historyTables = SQL.match(
      /CREATE TABLE public\.(sessions|logged_exercises|logged_sets)[\s\S]*?\);/g,
    ) ?? [];
    expect(historyTables).toHaveLength(3);
    for (const block of historyTables) {
      if (block.includes('CREATE TABLE public.logged_sets')) {
        expect(block).toContain('REFERENCES public.logged_exercises');
        continue;
      }
      if (block.includes('CREATE TABLE public.logged_exercises')) {
        expect(block).toContain('REFERENCES public.exercises(id) ON DELETE RESTRICT');
        expect(block).toContain('tags TEXT[]');
        continue;
      }
      expect(block).toContain('REFERENCES public.users(id) ON DELETE CASCADE');
    }
  });

  it('enables + forces RLS on all five tables', () => {
    const enabled = SQL.match(/ENABLE ROW LEVEL SECURITY/g) ?? [];
    const forced = SQL.match(/FORCE ROW LEVEL SECURITY/g) ?? [];
    expect(enabled).toHaveLength(5);
    expect(forced).toHaveLength(5);
  });

  it('grants companion: every table reaches anon/authenticated', async () => {
    const grants = readFileSync(
      new URL('../../supabase/migrations/20261001000001_grants.sql', import.meta.url),
      'utf8',
    );
    for (const t of ['users', 'exercises', 'sessions', 'logged_exercises', 'logged_sets']) {
      expect(grants).toContain(`public.${t} TO`);
    }
    expect(grants).toContain('GRANT USAGE ON SCHEMA public TO anon, authenticated');
  });

  it('seeds the 26 coarse identities incl. the two calf raises', () => {
    const seeds = SQL.match(/\(NULL, '[^']+'\)/g) ?? [];
    expect(seeds).toHaveLength(26);
    expect(SQL).toContain("'Leg Press Calf Raise'");
    expect(SQL).toContain("'Standing Machine Calf Raise'");
  });
});
