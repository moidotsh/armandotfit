// __tests__/supabase/program-seed.test.ts
// Phase-1 program-template seed integrity. Parses the seed migration
// (20260721000002_seed_catalog_and_programs.sql) as text and asserts
// the structural shape: 1 template, 2 variants, 8 days, 12 sessions,
// 60 slots; two-a-day AM-then-PM ordering with 4 slots each; one-a-day
// single-session per day with intentional omissions absent; slot
// prescriptions within range; alternatives graph integrity; equipment
// requirement path AND/OR semantics.
//
// Reading the SQL as text is deliberate: it lets us verify the seed
// without provisioning a live database. A test that runs the migration
// against a real Postgres would be more faithful but adds CI
// dependencies that the rest of the test suite doesn't have.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SEED_PATH = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260721000002_seed_catalog_and_programs.sql',
);
const SEED_SQL = readFileSync(SEED_PATH, 'utf8');

// ──────────────────────────────────────────────────────────────────────
// Helpers — extract VALUES tuple blocks for specific tables.
// ──────────────────────────────────────────────────────────────────────

/** Returns the substring of `sql` between `INSERT INTO public.<table>` and the next `;`. */
function valuesBlock(sql: string, table: string): string {
  const re = new RegExp(
    `INSERT\\s+INTO\\s+public\\.${table}\\b[\\s\\S]*?\\nFROM\\s+\\(VALUES\\n([\\s\\S]*?)\\n\\)\\s+AS\\s+`,
    'm',
  );
  const m = sql.match(re);
  if (!m) throw new Error(`VALUES block for ${table} not found`);
  return m[1];
}

/** Extracts the parenthesized tuples from a VALUES block, returning them as raw strings. */
function tupleStrings(block: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch === '(') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && start >= 0) {
        tuples.push(block.slice(start + 1, i));
        start = -1;
      }
    }
  }
  return tuples;
}

/**
 * Splits a tuple body on commas that are at the top level (not inside
 * nested parens or quoted strings). Used to extract individual column
 * values from each VALUES tuple.
 */
function splitTopLevelCommas(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inStr: '\'' | null = null;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) {
      // SQL escape: '' inside a '…' string is a literal single quote.
      if (ch === inStr && body[i + 1] === inStr) {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '\'') {
      inStr = '\'';
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(body.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(body.slice(start).trim());
  return out;
}

/** Strips surrounding quotes from a SQL string literal. */
function unquote(s: string): string {
  const m = s.match(/^'([\s\S]*)'$/);
  if (!m) return s;
  return m[1].replace(/''/g, '\'');
}

// ──────────────────────────────────────────────────────────────────────
// Parsed seed slices
// ──────────────────────────────────────────────────────────────────────

const slotTuples = tupleStrings(valuesBlock(SEED_SQL, 'program_slots')).map((t) => {
  const c = splitTopLevelCommas(t);
  // variant_slug, day_index, session_window, exercise_slug, order_index,
  // sets_min, sets_max, reps_min, reps_max, per_side, slot_notes
  return {
    variantSlug: unquote(c[0]),
    dayIndex: Number(c[1]),
    sessionWindow: unquote(c[2]),
    exerciseSlug: unquote(c[3]),
    orderIndex: Number(c[4]),
    setsMin: Number(c[5]),
    setsMax: Number(c[6]),
    repsMin: Number(c[7]),
    repsMax: Number(c[8]),
    perSide: c[9].toUpperCase() === 'TRUE',
    slotNotes: c[10] === 'NULL' ? null : unquote(c[10]),
  };
});

const sessionTuples = tupleStrings(valuesBlock(SEED_SQL, 'program_sessions')).map((t) => {
  const c = splitTopLevelCommas(t);
  // variant_slug, day_index, session_window, label, order_index
  return {
    variantSlug: unquote(c[0]),
    dayIndex: Number(c[1]),
    sessionWindow: unquote(c[2]),
    label: unquote(c[3]),
    orderIndex: Number(c[4]),
  };
});

const dayTuples = tupleStrings(valuesBlock(SEED_SQL, 'program_days')).map((t) => {
  const c = splitTopLevelCommas(t);
  return { variantSlug: unquote(c[0]), dayIndex: Number(c[1]), title: unquote(c[2]) };
});

// program_templates + program_schedule_variants use direct `VALUES`
// (not SELECT FROM (VALUES)) and only seed 1 + 2 rows respectively — we
// assert those by substring in the tests below rather than parsing.

const altTuples = tupleStrings(valuesBlock(SEED_SQL, 'exercise_alternatives')).map((t) => {
  const c = splitTopLevelCommas(t);
  // src_slug, alt_slug, alt_type, priority, intent_note
  return {
    src: unquote(c[0]),
    alt: unquote(c[1]),
    altType: unquote(c[2]),
    priority: Number(c[3]),
  };
});

const reqPathTuples = tupleStrings(
  valuesBlock(SEED_SQL, 'exercise_equipment_requirement_paths'),
).map((t) => {
  const c = splitTopLevelCommas(t);
  return { exerciseSlug: unquote(c[0]), pathIndex: Number(c[1]) };
});

const reqTuples = tupleStrings(
  valuesBlock(SEED_SQL, 'exercise_equipment_requirements'),
).map((t) => {
  const c = splitTopLevelCommas(t);
  // slug, path_index, equipment_slug, min_quantity
  return {
    exerciseSlug: unquote(c[0]),
    pathIndex: Number(c[1]),
    equipmentSlug: unquote(c[2]),
  };
});

// Catalog slugs known to the seed (43 total). Pulled from exercises
// inserts + the exercise_muscles block; we just verify slot/alt slugs
// are present in the SYSTEM_EXERCISES mirror (single source of truth
// for the slug set). Imported lazily so a test failure names the file.
import { SYSTEM_EXERCISES } from '../../shared/exercises/data';
const CATALOG_SLUGS = new Set(SYSTEM_EXERCISES.map((e) => e.slug));

// ──────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────

describe('program_templates + variants', () => {
  it('seeds exactly one active template', () => {
    expect(SEED_SQL).toMatch(/INSERT\s+INTO\s+public\.program_templates/);
    expect(SEED_SQL).toContain("'arman-fit-commercial-gym-v1'");
    expect(SEED_SQL).toContain("'active'");
    expect(SEED_SQL).toContain("default_variant_slug");
    expect(SEED_SQL).toContain("'one-a-day'");
  });

  it('seeds two variants with the expected slugs and patterns', () => {
    // The variants INSERT is small enough to assert by substring rather
    // than parsing the direct-VALUES block.
    expect(SEED_SQL).toMatch(/INSERT\s+INTO\s+public\.program_schedule_variants/);
    expect(SEED_SQL).toContain("'one-a-day',\n   'One-a-Day',");
    expect(SEED_SQL).toMatch(/'one-a-day'[\s\S]*?'single'[\s\S]*?4[\s\S]*?'active'[\s\S]*?1\)/);
    expect(SEED_SQL).toMatch(/'two-a-day'[\s\S]*?'am-pm'[\s\S]*?4[\s\S]*?'active'[\s\S]*?2\)/);
  });
});

describe('program_days', () => {
  it('seeds 4 days per variant (8 total)', () => {
    expect(dayTuples).toHaveLength(8);
    for (const variantSlug of ['one-a-day', 'two-a-day']) {
      const days = dayTuples.filter((d) => d.variantSlug === variantSlug);
      expect(days).toHaveLength(4);
      const indices = days.map((d) => d.dayIndex).sort((a, b) => a - b);
      expect(indices).toEqual([1, 2, 3, 4]);
    }
  });
});

describe('program_sessions', () => {
  it('seeds 12 sessions: 4 single + 4 am + 4 pm', () => {
    expect(sessionTuples).toHaveLength(12);
    const singles = sessionTuples.filter((s) => s.sessionWindow === 'single');
    const ams = sessionTuples.filter((s) => s.sessionWindow === 'am');
    const pms = sessionTuples.filter((s) => s.sessionWindow === 'pm');
    expect(singles).toHaveLength(4);
    expect(ams).toHaveLength(4);
    expect(pms).toHaveLength(4);
  });

  it('one-a-day sessions are all single-window with order_index 1', () => {
    const oneADay = sessionTuples.filter((s) => s.variantSlug === 'one-a-day');
    expect(oneADay).toHaveLength(4);
    for (const s of oneADay) {
      expect(s.sessionWindow).toBe('single');
      expect(s.orderIndex).toBe(1);
    }
  });

  it('two-a-day sessions are AM (order 1) then PM (order 2) per day', () => {
    for (const dayIndex of [1, 2, 3, 4]) {
      const day = sessionTuples
        .filter((s) => s.variantSlug === 'two-a-day' && s.dayIndex === dayIndex)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      expect(day).toHaveLength(2);
      expect(day[0].sessionWindow).toBe('am');
      expect(day[0].orderIndex).toBe(1);
      expect(day[1].sessionWindow).toBe('pm');
      expect(day[1].orderIndex).toBe(2);
    }
  });
});

describe('program_slots', () => {
  it('seeds 60 slots: 32 two-a-day + 28 one-a-day', () => {
    expect(slotTuples).toHaveLength(60);
    const twoADay = slotTuples.filter((s) => s.variantSlug === 'two-a-day');
    const oneADay = slotTuples.filter((s) => s.variantSlug === 'one-a-day');
    expect(twoADay).toHaveLength(32);
    expect(oneADay).toHaveLength(28);
  });

  it('every slot exercise_slug resolves to a catalog slug', () => {
    for (const slot of slotTuples) {
      expect(
        CATALOG_SLUGS.has(slot.exerciseSlug),
        `slot slug not in catalog: ${slot.exerciseSlug}`,
      ).toBe(true);
    }
  });

  it('two-a-day has 4 slots per session with order_index 1..4', () => {
    for (const dayIndex of [1, 2, 3, 4]) {
      for (const window of ['am', 'pm'] as const) {
        const slots = slotTuples
          .filter(
            (s) =>
              s.variantSlug === 'two-a-day' &&
              s.dayIndex === dayIndex &&
              s.sessionWindow === window,
          )
          .sort((a, b) => a.orderIndex - b.orderIndex);
        expect(slots, `two-a-day day ${dayIndex} ${window}`).toHaveLength(4);
        expect(slots.map((s) => s.orderIndex)).toEqual([1, 2, 3, 4]);
      }
    }
  });

  it('one-a-day has 7 slots per day with order_index 1..7', () => {
    for (const dayIndex of [1, 2, 3, 4]) {
      const slots = slotTuples
        .filter((s) => s.variantSlug === 'one-a-day' && s.dayIndex === dayIndex)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      expect(slots, `one-a-day day ${dayIndex}`).toHaveLength(7);
      expect(slots.map((s) => s.orderIndex)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it('preserves intentional one-a-day omissions', () => {
    const day1 = slotTuples.filter((s) => s.variantSlug === 'one-a-day' && s.dayIndex === 1).map((s) => s.exerciseSlug);
    const day2 = slotTuples.filter((s) => s.variantSlug === 'one-a-day' && s.dayIndex === 2).map((s) => s.exerciseSlug);
    const day3 = slotTuples.filter((s) => s.variantSlug === 'one-a-day' && s.dayIndex === 3).map((s) => s.exerciseSlug);
    const day4 = slotTuples.filter((s) => s.variantSlug === 'one-a-day' && s.dayIndex === 4).map((s) => s.exerciseSlug);

    expect(day1).not.toContain('lower-back-extension-calisthenic');
    expect(day2).not.toContain('machine-ab-crunch-eccentric-emphasized');
    expect(day3).not.toContain('leg-raise-captains-chair');
    expect(day4).not.toContain('dumbbell-shrug');
  });

  it('all prescriptions are within range (sets_min <= sets_max, reps_min <= reps_max)', () => {
    for (const slot of slotTuples) {
      expect(slot.setsMin).toBeGreaterThanOrEqual(1);
      expect(slot.setsMax).toBeGreaterThanOrEqual(slot.setsMin);
      expect(slot.repsMin).toBeGreaterThanOrEqual(0);
      expect(slot.repsMax).toBeGreaterThanOrEqual(slot.repsMin);
    }
  });

  it('set ranges stay in the 2-3 envelope', () => {
    for (const slot of slotTuples) {
      expect(slot.setsMin).toBeGreaterThanOrEqual(2);
      expect(slot.setsMax).toBeLessThanOrEqual(3);
    }
  });

  it('marks Bulgarian Split Squat per_side = TRUE with "Per leg." note', () => {
    const bulgarianSlots = slotTuples.filter((s) => s.exerciseSlug === 'bulgarian-split-squat-dumbbell');
    expect(bulgarianSlots.length).toBeGreaterThan(0);
    for (const slot of bulgarianSlots) {
      expect(slot.perSide).toBe(true);
      expect(slot.slotNotes).toBe('Per leg.');
    }
  });

  it('only Bulgarian Split Squat is per_side = TRUE', () => {
    const perSide = slotTuples.filter((s) => s.perSide);
    const slugs = new Set(perSide.map((s) => s.exerciseSlug));
    expect([...slugs]).toEqual(['bulgarian-split-squat-dumbbell']);
  });
});

describe('exercise_alternatives', () => {
  it('seeds at least one alternative edge', () => {
    expect(altTuples.length).toBeGreaterThan(0);
  });

  it('has no self-references', () => {
    for (const edge of altTuples) {
      expect(edge.src, `self-reference on ${edge.src}`).not.toBe(edge.alt);
    }
  });

  it('has no duplicate (source, alt_type, priority) triples', () => {
    const seen = new Set<string>();
    for (const edge of altTuples) {
      const key = `${edge.src}|${edge.altType}|${edge.priority}`;
      expect(seen.has(key), `duplicate alt key: ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it('every source + alt slug resolves to a catalog slug', () => {
    for (const edge of altTuples) {
      expect(CATALOG_SLUGS.has(edge.src), `alt src not in catalog: ${edge.src}`).toBe(true);
      expect(CATALOG_SLUGS.has(edge.alt), `alt target not in catalog: ${edge.alt}`).toBe(true);
    }
  });

  it('uses only the allowed alt_type values', () => {
    const allowed = new Set(['direct', 'close', 'fallback']);
    for (const edge of altTuples) {
      expect(allowed.has(edge.altType), `bad alt_type: ${edge.altType}`).toBe(true);
    }
  });

  it('RDL → back-extension is classified close (not direct)', () => {
    const rdl = altTuples.find(
      (e) => e.src === 'lower-back-extension-calisthenic' && e.alt === 'romanian-deadlift-barbell',
    );
    expect(rdl).toBeDefined();
    expect(rdl!.altType).toBe('close');
  });

  it('barbell row → seated cable row is classified close (not direct)', () => {
    const row = altTuples.find(
      (e) => e.src === 'seated-cable-row-v-grip' && e.alt === 'barbell-row',
    );
    expect(row).toBeDefined();
    expect(row!.altType).toBe('close');
  });
});

describe('exercise_equipment_requirement_paths', () => {
  it('seeds at least one path per exercise in the catalog', () => {
    const exercisedWithPaths = new Set(reqPathTuples.map((p) => p.exerciseSlug));
    for (const slug of CATALOG_SLUGS) {
      expect(exercisedWithPaths.has(slug), `no requirement path for ${slug}`).toBe(true);
    }
  });

  it('shoulder-press-machine-or-dumbbell has exactly 2 paths (OR-across)', () => {
    const paths = reqPathTuples.filter((p) => p.exerciseSlug === 'shoulder-press-machine-or-dumbbell');
    expect(paths).toHaveLength(2);
    const indices = paths.map((p) => p.pathIndex).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2]);
  });

  it('tibia-raise-machine-or-band has exactly 2 paths (OR-across)', () => {
    const paths = reqPathTuples.filter((p) => p.exerciseSlug === 'tibia-raise-machine-or-band');
    expect(paths).toHaveLength(2);
    const indices = paths.map((p) => p.pathIndex).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2]);
  });

  it('every other exercise has exactly 1 path', () => {
    const orCases = new Set([
      'shoulder-press-machine-or-dumbbell',
      'tibia-raise-machine-or-band',
    ]);
    const counts = new Map<string, number>();
    for (const p of reqPathTuples) {
      counts.set(p.exerciseSlug, (counts.get(p.exerciseSlug) ?? 0) + 1);
    }
    for (const [slug, count] of counts) {
      if (orCases.has(slug)) {
        expect(count, `${slug} should have 2 paths`).toBe(2);
      } else {
        expect(count, `${slug} should have 1 path`).toBe(1);
      }
    }
  });
});

describe('exercise_equipment_requirements (AND-within-path)', () => {
  it('every requirement references a path that exists', () => {
    const pathKeys = new Set(reqPathTuples.map((p) => `${p.exerciseSlug}|${p.pathIndex}`));
    for (const req of reqTuples) {
      expect(
        pathKeys.has(`${req.exerciseSlug}|${req.pathIndex}`),
        `orphan requirement: ${req.exerciseSlug} path ${req.pathIndex}`,
      ).toBe(true);
    }
  });

  it('AND-within: barbell-press-incline path 1 requires both barbell AND incline-bench', () => {
    const reqs = reqTuples.filter(
      (r) => r.exerciseSlug === 'barbell-press-incline' && r.pathIndex === 1,
    );
    const equipmentSlugs = new Set(reqs.map((r) => r.equipmentSlug));
    expect(equipmentSlugs.has('barbell')).toBe(true);
    expect(equipmentSlugs.has('incline-bench')).toBe(true);
  });

  it('OR-across: shoulder-press path 1 is machine-only, path 2 is dumbbell-only', () => {
    const path1 = reqTuples.filter(
      (r) => r.exerciseSlug === 'shoulder-press-machine-or-dumbbell' && r.pathIndex === 1,
    );
    const path2 = reqTuples.filter(
      (r) => r.exerciseSlug === 'shoulder-press-machine-or-dumbbell' && r.pathIndex === 2,
    );
    expect(path1.map((r) => r.equipmentSlug)).toEqual(['shoulder-press-machine']);
    expect(path2.map((r) => r.equipmentSlug)).toEqual(['dumbbell']);
  });

  it('OR-across: tibia-raise path 1 is machine-only, path 2 is band-only', () => {
    const path1 = reqTuples.filter(
      (r) => r.exerciseSlug === 'tibia-raise-machine-or-band' && r.pathIndex === 1,
    );
    const path2 = reqTuples.filter(
      (r) => r.exerciseSlug === 'tibia-raise-machine-or-band' && r.pathIndex === 2,
    );
    expect(path1.map((r) => r.equipmentSlug)).toEqual(['tibia-raise-machine']);
    expect(path2.map((r) => r.equipmentSlug)).toEqual(['resistance-band']);
  });
});
