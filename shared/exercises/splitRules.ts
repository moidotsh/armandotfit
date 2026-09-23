// shared/exercises/splitRules.ts
// THE SPLIT LAWS — the constraints that define a structurally sound
// full-body edition, extracted from the split-constraint suite so the
// runtime (the Split Lab's generator) and the tests share ONE law
// book. The tests stay canonical proof; this file is the executable
// text of the laws themselves:
//
//   ASYNCHRONOUS     no primary muscle appears in both AM and PM on
//                    any day (the async principle).
//   REGION COVERAGE  all 7 body regions covered every day (AM+PM
//                    combined) — full body means full body.
//   MOSTLY ISOLATION unique compound identities (multi-primary-muscle)
//                    stay under the edition's cap (the upper edition
//                    carries the heavy pressing; the lower stays
//                    machine/isolation).
//   NO SLUG ERRORS   every exercise resolves in the catalog with at
//                    least one primary muscle.
//   VARIETY          biceps AND triceps across the week; ≥3 distinct
//                    back muscles; quads + hamstrings + glutes all
//                    present.
//
// A one-a-day edition checks against the same laws with the whole
// session in `am` and an empty `pm` (async is then vacuous; coverage
// and the rest still bind).

import { type ProgramEdition } from './splits';
import { SYSTEM_EXERCISES_BY_SLUG, type SystemExerciseData } from './data';

// ── The muscle → region map (the 7 regions every day must cover) ──────

export const REGION_MUSCLES: Readonly<Record<string, string[]>> = {
  'Lower Leg': ['calves', 'tibialis'],
  'Upper Leg': ['quads', 'hamstrings', 'glutes'],
  Core: ['abs', 'lower-abs', 'obliques'],
  Delt: ['front-delts', 'side-delts', 'rear-delts'],
  Back: ['lats', 'traps', 'upper-back', 'lower-back'],
  Chest: ['chest', 'upper-chest', 'lower-chest'],
  Arm: ['biceps', 'triceps', 'forearms'],
};

export const MUSCLE_TO_REGION: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const [region, muscles] of Object.entries(REGION_MUSCLES)) {
    for (const muscle of muscles) map[muscle] = region;
  }
  return map;
})();

export const ALL_REGIONS: readonly string[] = Object.keys(REGION_MUSCLES);

/** The edition's compound cap (unique multi-primary-muscle identities). */
export function compoundCap(edition: ProgramEdition): number {
  return edition === 'upper' ? 12 : 6;
}

// ── Catalog lookups ────────────────────────────────────────────────────

export function primaryMusclesOf(slug: string): string[] {
  return SYSTEM_EXERCISES_BY_SLUG[slug]?.primaryMuscles ?? [];
}

export function primaryRegionsOf(slug: string): string[] {
  const muscles = primaryMusclesOf(slug);
  if (muscles.length === 0) return [];
  return [...new Set(muscles.map((m) => MUSCLE_TO_REGION[m]).filter(Boolean))];
}

// ── The law shapes ─────────────────────────────────────────────────────

/** A slot as the laws read it (SplitSlot and ResolvedSlot both fit). */
export interface LawSlot {
  exercise: string;
  suggestedTags: string[];
  sets: [number, number];
  reps: [number, number];
}

/** One day as the laws read it (TwoADayDay and OneADayDay both fit:
 * a one-a-day session rides `am` with an empty `pm`). */
export interface LawDay {
  day: number;
  title: string;
  am: LawSlot[];
  pm: LawSlot[];
}

/** One law's verdict for one edition. */
export interface RuleResult {
  /** Stable id ('async', 'coverage', 'isolation', 'slugs', 'variety-arm',
   *  'variety-back', 'variety-legs'). */
  id: string;
  /** Furniture-caps label for the checklist. */
  label: string;
  ok: boolean;
  /** Why it failed (empty when passing). */
  detail?: string;
}

const dayMuscles = (day: LawDay, window: 'am' | 'pm'): Set<string> => {
  const set = new Set<string>();
  for (const slot of day[window]) {
    for (const m of primaryMusclesOf(slot.exercise)) set.add(m);
  }
  return set;
};

export function dayRegions(day: LawDay): Set<string> {
  const set = new Set<string>();
  for (const slot of [...day.am, ...day.pm]) {
    for (const r of primaryRegionsOf(slot.exercise)) set.add(r);
  }
  return set;
}

const editionMuscles = (days: readonly LawDay[]): Set<string> => {
  const set = new Set<string>();
  for (const day of days) {
    for (const slot of [...day.am, ...day.pm]) {
      for (const m of primaryMusclesOf(slot.exercise)) set.add(m);
    }
  }
  return set;
};

// ── The laws ───────────────────────────────────────────────────────────

/**
 * Check every per-edition law. Cross-edition (couples) alignment is
 * deliberately NOT here — it binds two editions together and stays in
 * the constraint suite.
 */
export function checkEditionLaws(days: readonly LawDay[], edition: ProgramEdition): RuleResult[] {
  // 1. ASYNCHRONOUS — no primary muscle in both AM and PM on any day.
  const asyncFailures: string[] = [];
  for (const day of days) {
    const am = dayMuscles(day, 'am');
    const pm = dayMuscles(day, 'pm');
    const overlap = [...am].filter((m) => pm.has(m));
    if (overlap.length > 0) {
      asyncFailures.push(`Day ${day.day}: [${overlap.join(', ')}] in both AM and PM`);
    }
  }

  // 2. REGION COVERAGE — all 7 regions covered every day.
  const coverageFailures: string[] = [];
  for (const day of days) {
    const regions = dayRegions(day);
    const missing = ALL_REGIONS.filter((r) => !regions.has(r));
    if (missing.length > 0) {
      coverageFailures.push(`Day ${day.day}: missing [${missing.join(', ')}]`);
    }
  }

  // 3. MOSTLY ISOLATION — unique compounds under the edition's cap.
  const compoundSlugs = new Set(
    days.flatMap((day) =>
      [...day.am, ...day.pm]
        .filter((slot) => primaryMusclesOf(slot.exercise).length > 1)
        .map((slot) => slot.exercise),
    ),
  );
  const cap = compoundCap(edition);

  // 4. NO SLUG ERRORS — every exercise resolves with ≥1 primary muscle.
  const slugFailures: string[] = [];
  for (const day of days) {
    for (const slot of [...day.am, ...day.pm]) {
      const entry: SystemExerciseData | undefined = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
      if (!entry) slugFailures.push(`Day ${day.day}: '${slot.exercise}' not in catalog`);
      else if (entry.primaryMuscles.length === 0) {
        slugFailures.push(`Day ${day.day}: '${slot.exercise}' has no primary muscles`);
      }
    }
  }

  // 5–7. VARIETY — the week works the body from more than one angle.
  const all = editionMuscles(days);
  const backMuscles = new Set(
    [...all].filter((m) => REGION_MUSCLES.Back.includes(m)),
  );

  return [
    {
      id: 'async',
      label: 'ASYNCHRONOUS',
      ok: asyncFailures.length === 0,
      detail: asyncFailures.join('; ') || undefined,
    },
    {
      id: 'coverage',
      label: 'REGION COVERAGE',
      ok: coverageFailures.length === 0,
      detail: coverageFailures.join('; ') || undefined,
    },
    {
      id: 'isolation',
      label: 'MOSTLY ISOLATION',
      ok: compoundSlugs.size <= cap,
      detail:
        compoundSlugs.size > cap
          ? `${compoundSlugs.size} unique compounds (max ${cap}): ${[...compoundSlugs].join(', ')}`
          : undefined,
    },
    {
      id: 'slugs',
      label: 'NO SLUG ERRORS',
      ok: slugFailures.length === 0,
      detail: slugFailures.join('; ') || undefined,
    },
    {
      id: 'variety-arm',
      label: 'VARIETY — ARM',
      ok: all.has('biceps') && all.has('triceps'),
      detail: !all.has('biceps')
        ? 'No biceps exercise in the edition'
        : !all.has('triceps')
          ? 'No triceps exercise in the edition'
          : undefined,
    },
    {
      id: 'variety-back',
      label: 'VARIETY — BACK',
      ok: backMuscles.size >= 3,
      detail:
        backMuscles.size < 3
          ? `Only ${backMuscles.size} distinct back muscles: [${[...backMuscles].join(', ')}]`
          : undefined,
    },
    {
      id: 'variety-legs',
      label: 'VARIETY — LEGS',
      ok: all.has('quads') && all.has('hamstrings') && all.has('glutes'),
      detail: ['quads', 'hamstrings', 'glutes']
        .filter((m) => !all.has(m))
        .map((m) => `No ${m} exercise in the edition`)
        .join('; ') || undefined,
    },
  ];
}

/** All laws pass (the generator's success condition). */
export function lawsPass(rules: readonly RuleResult[]): boolean {
  return rules.every((r) => r.ok);
}
