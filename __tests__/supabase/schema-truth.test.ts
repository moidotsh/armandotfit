// __tests__/supabase/schema-truth.test.ts
// The client must never query a column the canonical schema does not
// define. This is the live-400 lesson: WorkoutRepository selected +
// ordered logged_exercises.created_at — a column that exists in NO
// migration and on NO deployed table — and PostgREST answered
// 42703 (400) on every session start. Vitest couldn't catch it
// because fixtures fabricate columns freely; the live DB is the only
// honest fixture. These goldens parse the canonical sources so the
// mismatch class fails at commit time, not in the owner's console.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) =>
  readFileSync(resolve(process.cwd(), p), 'utf8');

const HISTORY_TABLES = ['sessions', 'logged_exercises', 'logged_sets'] as const;

function historyBlock(sql: string, table: string): string {
  const match = sql.match(
    new RegExp(`CREATE TABLE public\\.${table}[\\s\\S]*?\\);`),
  );
  return match?.[0] ?? '';
}

describe('schema truth: client queries ⊆ canonical schema', () => {
  const greenslate = read('supabase/migrations/20261001000000_greenslate_rebuild.sql');

  it('history tables define no created_at (recency is sessions.started_at)', () => {
    for (const table of HISTORY_TABLES) {
      const block = historyBlock(greenslate, table);
      expect(block, `missing CREATE TABLE block for ${table}`).not.toBe('');
      expect(
        block,
        `${table} grew a created_at column — if that is deliberate, ` +
          'update the client queries in the same change and relax this golden',
      ).not.toContain('created_at');
    }
  });

  it('WorkoutRepository never references created_at', () => {
    const repo = read('utils/supabase/repositories/WorkoutRepository.ts');
    expect(
      repo,
      'created_at appeared in WorkoutRepository — the history tables ' +
        'carry no such column; ordering recency goes through the ' +
        'embedded sessions(started_at)',
    ).not.toContain('created_at');
  });

  it('the last-tags query orders by the embedded session recency', () => {
    const repo = read('utils/supabase/repositories/WorkoutRepository.ts');
    // The load-bearing shape (probed against the live project):
    //   select=tags,exercise:exercises(name),sessions(started_at)
    //   &order=sessions(started_at).desc&limit=300
    expect(repo).toContain(
      "'tags, exercise:exercises(name), sessions(started_at)'",
    );
    expect(repo).toContain(
      ".order('started_at', { referencedTable: 'sessions', ascending: false })",
    );
  });

  it('the shared history types carry no createdAt on history rows', () => {
    const types = read('shared/types/workout.ts');
    expect(
      types,
      'createdAt on TrainingSession/LoggedExercise/LoggedExercise-set ' +
        'types is written-but-never-read weight; the wire rows have none',
    ).not.toContain('createdAt');
  });
});
