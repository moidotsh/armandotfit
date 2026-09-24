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
import { type MovementRole } from './movementRole';

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

// ──────────────────────────────────────────────────────────────────────
// THE PROGRAM TYPES — archetype laws beyond full body. Each type's
// days carry a THEME (the movement roles or muscles that may appear)
// and REQUIRED coverage groups (any-of muscle sets); the archetype
// law set checks purity, coverage, and the shared sanity laws. The
// full-body types keep the original law set above.
// ──────────────────────────────────────────────────────────────────────

/** The six generator program types (the lab's card list). */
export type ProgramType =
  | 'fullBodyOneADay'
  | 'fullBodyHighFrequency'
  | 'pushPullLegs'
  | 'upperLower'
  | 'broSplit'
  | 'fullyEqual'
  | 'anythingGoes';

/** A day's theme: what may appear and what must appear. */
export interface DayThemeSpec {
  /** Chapter title ('Push', 'Upper A', 'Chest'…). */
  title: string;
  /** Role-themed days: the movement roles allowed on this day. */
  roles?: readonly MovementRole[];
  /** Muscle-themed days (bro): a slot qualifies when a primary muscle
   *  hits this set (roles then fall where they fall — a rear-delt fly
   *  is pull but belongs on Shoulders day). */
  muscles?: readonly string[];
  /** Coverage contract: every group must be hit by some slot's
   *  primary muscles (any-of semantics). */
  require: ReadonlyArray<{ id: string; label: string; anyOf: readonly string[] }>;
  /** Muscle-themed days: ≥ this many DISTINCT theme muscles on the day. */
  distinctMuscles?: number;
  /** Slots per session. */
  slots: number;
}

const CHEST = ['chest', 'upper-chest', 'lower-chest'];
const DELTS = ['front-delts', 'side-delts', 'rear-delts'];
const LEGS = ['quads', 'hamstrings', 'glutes'];
const CALVES = ['calves', 'tibialis'];

/** PUSH/PULL/LEG — the 6-day double pass (PPL×2, the classic high-
 *  frequency rotation). The A rotation and the B rotation are TWO
 *  PASSES through the same themes, and the 6-day variety law binds
 *  them: a theme's A and B days share NO exercise identity — the
 *  second pass changes the angle and the implements (bench → incline
 *  dumbbell; row → chin-up; squat → RDL), it never repeats the
 *  station. Rear delts + traps pull; front/side delts push; core
 *  rides every theme's tail (one slot at most, the core-balance law). */
const PPL_PUSH_CONTRACT: DayThemeSpec = {
  title: 'Push',
  roles: ['push', 'core'],
  slots: 7,
  require: [
    { id: 'chest', label: 'CHEST', anyOf: CHEST },
    { id: 'delt', label: 'DELTS', anyOf: ['front-delts', 'side-delts'] },
    { id: 'triceps', label: 'TRICEPS', anyOf: ['triceps'] },
  ],
};

const PPL_PULL_CONTRACT: DayThemeSpec = {
  title: 'Pull',
  roles: ['pull', 'core'],
  slots: 7,
  require: [
    { id: 'width', label: 'WIDTH', anyOf: ['lats', 'upper-back'] },
    { id: 'biceps', label: 'BICEPS', anyOf: ['biceps'] },
    { id: 'rear', label: 'REAR DELT / TRAPS', anyOf: ['rear-delts', 'traps'] },
  ],
};

const PPL_LEGS_CONTRACT: DayThemeSpec = {
  title: 'Legs',
  roles: ['legs', 'core'],
  slots: 7,
  require: [
    { id: 'quads', label: 'QUADS', anyOf: ['quads'] },
    { id: 'hamstrings', label: 'HAMSTRINGS', anyOf: ['hamstrings'] },
    { id: 'glutes', label: 'GLUTES', anyOf: ['glutes'] },
    { id: 'calves', label: 'CALVES', anyOf: CALVES },
  ],
};

export const PPL_DAYS: readonly DayThemeSpec[] = [
  { ...PPL_PUSH_CONTRACT, title: 'Push A' },
  { ...PPL_PULL_CONTRACT, title: 'Pull A' },
  { ...PPL_LEGS_CONTRACT, title: 'Legs A' },
  { ...PPL_PUSH_CONTRACT, title: 'Push B' },
  { ...PPL_PULL_CONTRACT, title: 'Pull B' },
  { ...PPL_LEGS_CONTRACT, title: 'Legs B' },
];

/** UPPER/LOWER — the 4-day alternation. Abs ride the lower days.
 *  A and B days share their contracts and differ only in title. */
const UPPER_CONTRACT: DayThemeSpec = {
  title: 'Upper',
  roles: ['push', 'pull'],
  slots: 7,
  require: [
    { id: 'chest', label: 'CHEST', anyOf: CHEST },
    { id: 'back', label: 'BACK', anyOf: ['lats', 'upper-back'] },
    { id: 'delt', label: 'DELTS', anyOf: DELTS },
    { id: 'arm', label: 'ARM', anyOf: ['biceps', 'triceps'] },
  ],
};

const LOWER_CONTRACT: DayThemeSpec = {
  title: 'Lower',
  roles: ['legs', 'core'],
  slots: 7,
  require: [
    { id: 'quads', label: 'QUADS', anyOf: ['quads'] },
    { id: 'hamstrings', label: 'HAMSTRINGS', anyOf: ['hamstrings'] },
    { id: 'glutes', label: 'GLUTES', anyOf: ['glutes'] },
    { id: 'calves', label: 'CALVES', anyOf: CALVES },
  ],
};

export const UPPER_LOWER_DAYS: readonly DayThemeSpec[] = [
  { ...UPPER_CONTRACT, title: 'Upper A' },
  { ...LOWER_CONTRACT, title: 'Lower A' },
  { ...UPPER_CONTRACT, title: 'Upper B' },
  { ...LOWER_CONTRACT, title: 'Lower B' },
];

/** BRO SPLIT — five muscle-themed days, one region each. */
export const BRO_DAYS: readonly DayThemeSpec[] = [
  {
    title: 'Chest',
    muscles: CHEST,
    slots: 6,
    distinctMuscles: 2,
    require: [
      { id: 'chest', label: 'CHEST', anyOf: CHEST },
      { id: 'upper', label: 'UPPER CHEST', anyOf: ['upper-chest'] },
    ],
  },
  {
    title: 'Back',
    muscles: ['lats', 'traps', 'upper-back', 'lower-back'],
    slots: 6,
    distinctMuscles: 3,
    require: [
      { id: 'width', label: 'WIDTH', anyOf: ['lats', 'upper-back'] },
      { id: 'traps', label: 'TRAPS / UPPER BACK', anyOf: ['traps', 'upper-back'] },
    ],
  },
  {
    title: 'Legs',
    muscles: [...LEGS, ...CALVES],
    slots: 6,
    distinctMuscles: 4,
    require: [
      { id: 'quads', label: 'QUADS', anyOf: ['quads'] },
      { id: 'hamstrings', label: 'HAMSTRINGS', anyOf: ['hamstrings'] },
      { id: 'calves', label: 'CALVES', anyOf: CALVES },
    ],
  },
  {
    title: 'Shoulders',
    muscles: [...DELTS, 'traps'],
    slots: 6,
    distinctMuscles: 3,
    require: [
      { id: 'front', label: 'FRONT OR SIDE DELT', anyOf: ['front-delts', 'side-delts'] },
      { id: 'rear', label: 'REAR DELT OR TRAPS', anyOf: ['rear-delts', 'traps'] },
    ],
  },
  {
    title: 'Arms',
    muscles: ['biceps', 'triceps', 'forearms'],
    slots: 6,
    distinctMuscles: 2,
    require: [
      { id: 'biceps', label: 'BICEPS', anyOf: ['biceps'] },
      { id: 'triceps', label: 'TRICEPS', anyOf: ['triceps'] },
    ],
  },
];

/** The day themes for a program type ('anythingGoes' has none — its
 *  laws are weekly; the full-body types keep the original law set). */
export function dayThemesFor(program: ProgramType): readonly DayThemeSpec[] | null {
  switch (program) {
    case 'pushPullLegs':
      return PPL_DAYS;
    case 'upperLower':
      return UPPER_LOWER_DAYS;
    case 'broSplit':
      return BRO_DAYS;
    default:
      return null;
  }
}

// ── The archetype law checks ───────────────────────────────────────────

/** Core slots allowed per role-themed day (a legs day of abs is not a
 *  legs day). */
const MAX_CORE_PER_DAY = 2;

function slotQualifies(slot: LawSlot, theme: DayThemeSpec): boolean {
  if (theme.muscles) {
    return primaryMusclesOf(slot.exercise).some((m) => theme.muscles!.includes(m));
  }
  const role = SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.movementRole;
  return role != null && (theme.roles ?? []).includes(role);
}

/**
 * THEME laws for a themed edition (PPL / Upper-Lower / Bro): purity,
 * coverage, distinctness (bro), core balance, slugs, day repeats.
 */
export function checkThemeLaws(
  days: readonly LawDay[],
  themes: readonly DayThemeSpec[],
): RuleResult[] {
  const purityFailures: string[] = [];
  const coverageFailures: string[] = [];
  const distinctFailures: string[] = [];
  const coreFailures: string[] = [];
  const repeatFailures: string[] = [];
  const slugFailures: string[] = [];
  const abFailures: string[] = [];

  // A/B VARIETY — paired passes through a theme ('Push A' / 'Push B',
  // 'Upper A' / 'Upper B') share NO exercise identity: the second
  // pass changes the angle and the implements, never the station.
  const baseOf = (title: string) => title.replace(/\s+[AB]$/, '');
  const passesByTheme = new Map<string, Array<{ title: string; slugs: Set<string> }>>();

  days.forEach((day, di) => {
    const theme = themes[di];
    if (!theme) {
      coverageFailures.push(`Day ${day.day}: no theme for day ${di + 1}`);
      return;
    }
    const slots = [...day.am, ...day.pm];
    let coreSlots = 0;
    const seen = new Set<string>();
    for (const slot of slots) {
      const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
      if (!entry || entry.primaryMuscles.length === 0) {
        slugFailures.push(`Day ${day.day}: '${slot.exercise}' unresolved or muscle-less`);
        continue;
      }
      if (!slotQualifies(slot, theme)) {
        purityFailures.push(`Day ${day.day} (${theme.title}): '${slot.exercise}' off-theme`);
      }
      if (entry.movementRole === 'core') coreSlots += 1;
      if (seen.has(slot.exercise)) {
        repeatFailures.push(`Day ${day.day}: '${slot.exercise}' twice`);
      }
      seen.add(slot.exercise);
    }
    for (const group of theme.require) {
      const hit = slots.some((slot) =>
        primaryMusclesOf(slot.exercise).some((m) => group.anyOf.includes(m)),
      );
      if (!hit) coverageFailures.push(`Day ${day.day} (${theme.title}): missing ${group.label}`);
    }
    if (theme.distinctMuscles != null && theme.muscles) {
      const distinct = new Set(
        slots.flatMap((slot) =>
          primaryMusclesOf(slot.exercise).filter((m) => theme.muscles!.includes(m)),
        ),
      ).size;
      if (distinct < theme.distinctMuscles) {
        distinctFailures.push(
          `Day ${day.day} (${theme.title}): only ${distinct} distinct ${theme.title.toLowerCase()} muscles (need ${theme.distinctMuscles})`,
        );
      }
    }
    if (theme.roles?.includes('core') && coreSlots > MAX_CORE_PER_DAY) {
      coreFailures.push(`Day ${day.day} (${theme.title}): ${coreSlots} core slots (max ${MAX_CORE_PER_DAY})`);
    }

    const base = baseOf(theme.title);
    const passes = passesByTheme.get(base) ?? [];
    const clash = passes.find((p) => [...seen].some((s) => p.slugs.has(s)));
    if (clash) {
      abFailures.push(
        `${theme.title} repeats ${clash.title}'s ${[...seen].filter((s) => clash.slugs.has(s)).join(', ')}`,
      );
    }
    passes.push({ title: theme.title, slugs: seen });
    passesByTheme.set(base, passes);
  });

  const r = (id: string, label: string, failures: string[]): RuleResult => ({
    id,
    label,
    ok: failures.length === 0,
    detail: failures.join('; ') || undefined,
  });
  return [
    r('theme-purity', 'ON THEME', purityFailures),
    r('theme-coverage', 'THEME COVERAGE', coverageFailures),
    r('theme-distinct', 'DISTINCT WITHIN DAY', distinctFailures),
    r('theme-core', 'CORE BALANCE', coreFailures),
    r('ab-variety', 'A/B VARIETY', abFailures),
    r('slugs', 'NO SLUG ERRORS', slugFailures),
    r('theme-repeats', 'NO DAY REPEATS', repeatFailures),
  ];
}

/**
 * WEEKLY laws for the unconstrained type (Anything Goes): structure is
 * the seed's business; the week still has to be a week — every region
 * worked, identities resolve, nothing stapled.
 */
export function checkWeeklyLaws(days: readonly LawDay[]): RuleResult[] {
  const slugFailures: string[] = [];
  const repeatFailures: string[] = [];
  const frequency = new Map<string, number>();
  const regions = new Set<string>();

  for (const day of days) {
    const seen = new Set<string>();
    for (const slot of [...day.am, ...day.pm]) {
      const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
      if (!entry || entry.primaryMuscles.length === 0) {
        slugFailures.push(`Day ${day.day}: '${slot.exercise}' unresolved or muscle-less`);
        continue;
      }
      if (seen.has(slot.exercise)) repeatFailures.push(`Day ${day.day}: '${slot.exercise}' twice`);
      seen.add(slot.exercise);
      frequency.set(slot.exercise, (frequency.get(slot.exercise) ?? 0) + 1);
      for (const r of primaryRegionsOf(slot.exercise)) regions.add(r);
    }
  }
  const missingRegions = ALL_REGIONS.filter((r) => !regions.has(r));
  const overStapled = [...frequency.entries()]
    .filter(([, n]) => n > 2)
    .map(([slug, n]) => `${slug}×${n}`);

  const r = (id: string, label: string, ok: boolean, detail?: string): RuleResult => ({
    id,
    label,
    ok,
    detail,
  });
  return [
    r('slugs', 'NO SLUG ERRORS', slugFailures.length === 0, slugFailures.join('; ') || undefined),
    r('theme-repeats', 'NO DAY REPEATS', repeatFailures.length === 0, repeatFailures.join('; ') || undefined),
    r('weekly-coverage', 'WEEKLY REGION COVERAGE', missingRegions.length === 0, missingRegions.length ? `Week misses [${missingRegions.join(', ')}]` : undefined),
    r('frequency', 'NOTHING STAPLED', overStapled.length === 0, overStapled.join(', ') || undefined),
  ];
}


// ── THE FULLY-EQUAL LAWS ───────────────────────────────────────────────
// Every muscle in the vocabulary trained EXACTLY the same — the share
// chart is perfectly flat (each muscle 1/20 of the week's set volume).

/** The 20 trainable muscles — every catalog muscle that carries
 *  programmable entries. */
export const EQUAL_MUSCLES: readonly string[] = [
  'abs', 'biceps', 'calves', 'chest', 'forearms', 'front-delts', 'glutes',
  'hamstrings', 'lats', 'lower-abs', 'lower-back', 'obliques', 'quads',
  'rear-delts', 'side-delts', 'tibialis', 'traps', 'triceps', 'upper-back',
  'upper-chest',
];

/**
 * THE FULLY-EQUAL LAWS: every muscle trained, every muscle's weekly
 * set volume IDENTICAL (a multi-primary exercise counts toward each of
 * its primary muscles — the shared budget must still land equal).
 */
export function checkFullyEqualLaws(days: readonly LawDay[]): RuleResult[] {
  const slugFailures: string[] = [];
  const repeatFailures: string[] = [];
  const tally = new Map<string, number>();

  for (const day of days) {
    const seen = new Set<string>();
    for (const slot of [...day.am, ...day.pm]) {
      const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
      if (!entry || entry.primaryMuscles.length === 0) {
        slugFailures.push(`Day ${day.day}: '${slot.exercise}' unresolved or muscle-less`);
        continue;
      }
      if (seen.has(slot.exercise)) repeatFailures.push(`Day ${day.day}: '${slot.exercise}' twice`);
      seen.add(slot.exercise);
      const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
      for (const m of entry.primaryMuscles) {
        tally.set(m, (tally.get(m) ?? 0) + sets);
      }
    }
  }

  const missing = EQUAL_MUSCLES.filter((m) => !tally.has(m));
  const volumes = EQUAL_MUSCLES.map((m) => tally.get(m) ?? 0);
  const minV = Math.min(...volumes);
  const maxV = Math.max(...volumes);
  const equal = minV === maxV && minV > 0;
  const unequalDetail = !equal
    ? EQUAL_MUSCLES.filter((m) => (tally.get(m) ?? 0) !== maxV)
        .map((m) => `${m}=${tally.get(m) ?? 0}`)
        .join(', ') + ` (max ${maxV})`
    : undefined;

  return [
    { id: 'slugs', label: 'NO SLUG ERRORS', ok: slugFailures.length === 0, detail: slugFailures.join('; ') || undefined },
    { id: 'theme-repeats', label: 'NO DAY REPEATS', ok: repeatFailures.length === 0, detail: repeatFailures.join('; ') || undefined },
    { id: 'equal-coverage', label: 'EVERY MUSCLE TRAINED', ok: missing.length === 0, detail: missing.length ? `Week misses [${missing.join(', ')}]` : undefined },
    { id: 'equal-volume', label: 'EQUAL VOLUME', ok: equal, detail: unequalDetail },
  ];
}

/**
 * The full law check for any program type: full-body types keep the
 * original edition laws; themed types check their theme laws;
 * Anything Goes checks the weekly laws.
 */
export function checkProgramLaws(
  days: readonly LawDay[],
  program: ProgramType,
  edition: ProgramEdition = 'upper',
): RuleResult[] {
  if (program === 'fullBodyOneADay' || program === 'fullBodyHighFrequency') {
    return checkEditionLaws(days, edition);
  }
  if (program === 'anythingGoes') {
    return checkWeeklyLaws(days);
  }
  if (program === 'fullyEqual') {
    return checkFullyEqualLaws(days);
  }
  const themes = dayThemesFor(program);
  return themes ? checkThemeLaws(days, themes) : checkWeeklyLaws(days);
}
