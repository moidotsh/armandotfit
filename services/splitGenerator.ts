// services/splitGenerator.ts
// THE SPLIT GENERATOR — read-only alternative editions, produced by
// construction from THE SPLIT LAWS (shared/exercises/splitRules.ts).
// The constraint suite proved "any future split that passes the tests
// is structurally sound"; this service turns that proof into a dial:
// seed in, edition out, laws checked on the way.
//
// PURE: no DB, no stores, no persistence — the Split Lab previews the
// result and throws it away. Nothing here can touch the live program
// (the authored splits stay the authored asset; overrides stay a
// separate user mechanism this service never reads or writes).
//
// Determinism: one seed → one edition (mulberry32). The UI's reroll
// picks a new root seed; the same seed always rebuilds the same
// edition, so a generated split is nameable ("seed 4271, upper,
// two-a-day") without ever being stored.

import {
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  FEMALE_TWO_A_DAY_SPLITS,
  FEMALE_ONE_A_DAY_SPLITS,
  getSlotsForDay,
  getStarterDays,
  type ProgramEdition,
  type ResolvedSlot,
  type SessionWindow,
  type SystemExerciseData,
  ALL_REGIONS,
  MUSCLE_TO_REGION,
  REGION_MUSCLES,
  checkEditionLaws,
  checkProgramLaws,
  dayThemesFor,
  lawsPass,
  primaryMusclesOf,
  primaryRegionsOf,
  type LawDay,
  type RuleResult,
  type ProgramType,
  type DayThemeSpec,
  EQUAL_MUSCLES,
} from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

// ── The pool ───────────────────────────────────────────────────────────
// The gym the program lives in: machine / cable / dumbbell / floor
// entries with at least one primary muscle (cardio stations have none
// and never qualify; barbell stays out the way it stays out of the
// authored program). Includes the imported catalog — the alternatives
// are the point.

const POOL_MODALITIES = new Set(['machine', 'cable', 'dumbbell', 'floor']);

const POOL: SystemExerciseData[] = SYSTEM_EXERCISES.filter(
  (e) => e.primaryMuscles.length > 0 && POOL_MODALITIES.has(e.modality ?? 'floor'),
);

const POOL_BY_REGION: Map<string, SystemExerciseData[]> = (() => {
  const map = new Map<string, SystemExerciseData[]>();
  for (const region of ALL_REGIONS) map.set(region, []);
  for (const entry of POOL) {
    for (const region of new Set(
      entry.primaryMuscles.map((m) => MUSCLE_TO_REGION[m]).filter(Boolean),
    )) {
      map.get(region)?.push(entry);
    }
  }
  return map;
})();

// Role pools (the PPL-class program types) and muscle pools (the bro
// split's muscle-themed days) — same POOL, indexed by the movement
// role / primary muscle axes.
const POOL_BY_ROLE: Map<string, SystemExerciseData[]> = (() => {
  const map = new Map<string, SystemExerciseData[]>();
  for (const entry of POOL) {
    if (!entry.movementRole) continue;
    const list = map.get(entry.movementRole) ?? [];
    list.push(entry);
    map.set(entry.movementRole, list);
  }
  return map;
})();

const POOL_BY_MUSCLE: Map<string, SystemExerciseData[]> = (() => {
  const map = new Map<string, SystemExerciseData[]>();
  for (const entry of POOL) {
    for (const m of entry.primaryMuscles) {
      const list = map.get(m) ?? [];
      list.push(entry);
      map.set(m, list);
    }
  }
  return map;
})();

// Authored suggested-tags carry over when a generated slot lands on an
// exercise the authored program already realizes (the tags belong to
// the identity, not the edition).
const AUTHORED_TAGS: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const day of [
    ...TWO_A_DAY_SPLITS,
    ...ONE_A_DAY_SPLITS,
    ...FEMALE_TWO_A_DAY_SPLITS,
    ...FEMALE_ONE_A_DAY_SPLITS,
  ]) {
    // Two-a-day days carry am/pm; one-a-day days carry a session.
    const slots = 'session' in day ? day.session : [...day.am, ...day.pm];
    for (const slot of slots) {
      if (slot.suggestedTags.length > 0 && !map.has(slot.exercise)) {
        map.set(slot.exercise, [...slot.suggestedTags]);
      }
    }
  }
  return map;
})();

// ── The seeded RNG (mulberry32 — small, fast, deterministic) ──────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffled = <T>(items: readonly T[], rand: () => number): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// ── The generator ──────────────────────────────────────────────────────

export interface GeneratedSplitDay extends LawDay {
  am: ResolvedSlot[];
  pm: ResolvedSlot[];
}

export interface GeneratedSplit {
  /** The root seed — the edition's name (deterministic input). */
  seed: number;
  /** The generator program type (the lab's card list). */
  program: ProgramType;
  /** The full-body shape, when the program type is full body; else null. */
  shape: PreferredSplit | null;
  edition: ProgramEdition;
  days: GeneratedSplitDay[];
  /** The laws' verdict on the returned days (all pass unless exhausted). */
  rules: RuleResult[];
  ok: boolean;
  /** Derived seeds spent before the laws passed. */
  attempts: number;
}

export interface GenerateSplitOptions {
  seed: number;
  shape: PreferredSplit;
  edition: ProgramEdition;
  /** Retry budget for derived seeds (default 400). */
  maxAttempts?: number;
}

/** How often one identity may repeat across an edition (the authored
 *  editions re-run their staples ~2×/week; generated ones stay in that
 *  register rather than stapling one lift to every day). */
const MAX_FREQUENCY = 2;

function rxFor(entry: SystemExerciseData): Pick<ResolvedSlot, 'sets' | 'reps'> {
  // The catalog's own planning defaults (data.ts: display-level
  // defaults for browsing) — the Rx a generated slot carries.
  return { sets: [entry.defaultSets, entry.defaultSets], reps: entry.defaultReps };
}

function buildDay(
  dayNumber: number,
  shape: PreferredSplit,
  rand: () => number,
  frequency: Map<string, number>,
  compounds: Set<string>,
  compoundBudget: number,
): GeneratedSplitDay | null {
  const title =
    shape === 'twoADay' ? `Workout Day ${dayNumber}` : `Full Body Day ${dayNumber}`;

  // Every day: the 7 regions, shuffled, split across the windows.
  const regions = shuffled(ALL_REGIONS, rand);
  const pickFor = (
    region: string,
    own: Set<string>,
    other: Set<string>,
  ): ResolvedSlot | null => {
    const candidates = (POOL_BY_REGION.get(region) ?? []).filter((e) => {
      const muscles = primaryMusclesOf(e.slug);
      // ASYNC by construction: never touch the other window's muscles.
      if (muscles.some((m) => other.has(m))) return false;
      // No repeat identity within the day, no over-stapled lift.
      if (own.has(e.slug) || other.has(e.slug)) return false;
      if ((frequency.get(e.slug) ?? 0) >= MAX_FREQUENCY) return false;
      // The isolation budget: a NEW compound only while budget remains.
      if (muscles.length > 1 && !compounds.has(e.slug) && compounds.size >= compoundBudget) {
        return false;
      }
      return true;
    });
    // Prefer the least-used candidate that also avoids intra-window
    // muscle repeats; fall back to whatever still passes the laws.
    const rank = (e: SystemExerciseData) =>
      (frequency.get(e.slug) ?? 0) * 2 +
      (primaryMusclesOf(e.slug).some((m) => own.has(m)) ? 1 : 0);
    const best = candidates.length
      ? candidates.reduce((a, b) => (rank(b) < rank(a) ? b : a))
      : null;
    const entry =
      best ?? (POOL_BY_REGION.get(region) ?? []).filter((e) => !own.has(e.slug) && !other.has(e.slug))[0];
    if (!entry) return null; // pool thinner than the day — retry the seed
    const muscles = primaryMusclesOf(entry.slug);
    muscles.forEach((m) => own.add(m));
    frequency.set(entry.slug, (frequency.get(entry.slug) ?? 0) + 1);
    if (muscles.length > 1) compounds.add(entry.slug);
    return {
      exercise: entry.slug,
      suggestedTags: AUTHORED_TAGS.get(entry.slug) ?? [],
      ...rxFor(entry),
    };
  };

  if (shape === 'oneADay') {
    // Full body in one session: one slot per region, async vacuous.
    const own = new Set<string>();
    const session: ResolvedSlot[] = [];
    for (const region of regions) {
      const slot = pickFor(region, own, new Set());
      if (!slot) return null;
      session.push(slot);
    }
    return { day: dayNumber, title, am: session, pm: [] };
  }

  // Two-a-day: AM takes 4 regions, PM takes 3 + one PM region repeated
  // (8 slots, 7 regions, every region in exactly one window — the
  // async principle is structural, not checked after the fact).
  const amRegions = regions.slice(0, 4);
  const pmRegions = regions.slice(4);
  pmRegions.push(pmRegions[Math.floor(rand() * pmRegions.length)]);
  const amMuscles = new Set<string>();
  const pmMuscles = new Set<string>();
  const am: ResolvedSlot[] = [];
  const pm: ResolvedSlot[] = [];
  for (const region of amRegions) {
    const slot = pickFor(region, amMuscles, pmMuscles);
    if (!slot) return null;
    am.push(slot);
  }
  for (const region of pmRegions) {
    const slot = pickFor(region, pmMuscles, amMuscles);
    if (!slot) return null;
    pm.push(slot);
  }
  return { day: dayNumber, title, am, pm };
}

/**
 * Generate one alternative FULL-BODY edition for the seed. Retries
 * derived seeds (seed + attempt) until every law passes or the budget
 * runs out — an exhausted budget still returns the last candidate WITH
 * its failing rules, so the lab shows the truth instead of a spinner.
 */
export function generateSplit({
  seed,
  shape,
  edition,
  maxAttempts = 400,
}: GenerateSplitOptions): GeneratedSplit {
  const program: ProgramType = shape === 'twoADay' ? 'fullBodyHighFrequency' : 'fullBodyOneADay';
  const compoundBudget = edition === 'upper' ? 12 : 6;
  let days: GeneratedSplitDay[] = [];
  let rules: RuleResult[] = [];
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    const rand = mulberry32(seed * 1000 + attempts);
    const frequency = new Map<string, number>();
    const compounds = new Set<string>();
    const candidate: GeneratedSplitDay[] = [];
    let starved = false;
    for (const n of [1, 2, 3, 4]) {
      const day = buildDay(n, shape, rand, frequency, compounds, compoundBudget);
      if (!day) {
        starved = true; // pool thinner than the day — next derived seed
        break;
      }
      candidate.push(day);
    }
    if (starved) continue;
    days = candidate;
    rules = checkEditionLaws(days, edition);
    if (lawsPass(rules)) {
      return { seed, program, shape, edition, days, rules, ok: true, attempts };
    }
  }
  return { seed, program, shape, edition, days, rules, ok: false, attempts };
}

// ── The themed builders (PPL / Upper-Lower / Bro / Anything) ───────────

/** Core slots allowed per themed day (mirrors the law's cap). */
const MAX_CORE_PER_DAY = 2;

interface DayBuildState {
  rand: () => number;
  frequency: Map<string, number>;
  usedSlugs: Set<string>;
  usedMuscles: Set<string>;
  coreCount: number;
}

function themedPool(theme: DayThemeSpec): SystemExerciseData[] {
  if (theme.muscles) {
    const seen = new Set<string>();
    const out: SystemExerciseData[] = [];
    for (const m of theme.muscles) {
      for (const e of POOL_BY_MUSCLE.get(m) ?? []) {
        if (!seen.has(e.slug)) {
          seen.add(e.slug);
          out.push(e);
        }
      }
    }
    return out;
  }
  const out: SystemExerciseData[] = [];
  for (const role of theme.roles ?? []) out.push(...(POOL_BY_ROLE.get(role) ?? []));
  return out;
}

function pickFrom(
  pool: SystemExerciseData[],
  state: DayBuildState,
  preferMuscles?: readonly string[],
): SystemExerciseData | null {
  const { rand, frequency, usedSlugs, coreCount } = state;
  const eligible = pool.filter((e) => {
    if (usedSlugs.has(e.slug)) return false;
    if ((frequency.get(e.slug) ?? 0) >= MAX_FREQUENCY) return false;
    if (e.movementRole === 'core' && coreCount >= MAX_CORE_PER_DAY) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  // Rank: least-used identity first, unused muscles next, the seeded
  // jitter last — variety by construction, determinism by seed.
  const rank = (e: SystemExerciseData) => {
    const hitsPreferred =
      preferMuscles !== undefined && e.primaryMuscles.some((m) => preferMuscles.includes(m));
    const hitsUsed = e.primaryMuscles.some((m) => state.usedMuscles.has(m)) ? 1 : 0;
    return (
      (frequency.get(e.slug) ?? 0) * 2 + hitsUsed + (hitsPreferred ? -2 : 0) + rand() * 0.5
    );
  };
  return eligible.reduce((a, b) => (rank(b) < rank(a) ? b : a));
}

function commit(entry: SystemExerciseData, state: DayBuildState): ResolvedSlot {
  state.usedSlugs.add(entry.slug);
  for (const m of primaryMusclesOf(entry.slug)) state.usedMuscles.add(m);
  if (entry.movementRole === 'core') state.coreCount += 1;
  state.frequency.set(entry.slug, (state.frequency.get(entry.slug) ?? 0) + 1);
  return {
    exercise: entry.slug,
    suggestedTags: AUTHORED_TAGS.get(entry.slug) ?? [],
    ...rxFor(entry),
  };
}

/** One themed day: cover the require groups, then fill to slot count.
 *  `forbidden` carries the paired pass's identities (the A/B variety
 *  law — Push B may not repeat Push A's stations). */
function buildThemedDay(
  dayNumber: number,
  theme: DayThemeSpec,
  rand: () => number,
  frequency: Map<string, number>,
  forbidden: ReadonlySet<string> = new Set(),
): GeneratedSplitDay | null {
  const pool = themedPool(theme);
  const state: DayBuildState = {
    rand,
    frequency,
    usedSlugs: new Set(forbidden),
    usedMuscles: new Set(),
    coreCount: 0,
  };
  const slots: ResolvedSlot[] = [];

  for (const group of theme.require) {
    if (slots.length >= theme.slots) break;
    const entry = pickFrom(pool, state, group.anyOf);
    if (!entry) return null;
    slots.push(commit(entry, state));
  }
  while (slots.length < theme.slots) {
    const entry = pickFrom(pool, state);
    if (!entry) return null;
    slots.push(commit(entry, state));
  }
  return { day: dayNumber, title: theme.title, am: slots, pm: [] };
}

/** One anything-goes day: unconstrained by theme, but biased toward
 *  regions the WEEK has not yet worked (the weekly coverage law is
 *  otherwise a coin flip against Lower Leg's small pool). */
function buildAnythingDay(
  dayNumber: number,
  slotCount: number,
  rand: () => number,
  frequency: Map<string, number>,
  coveredRegions: Set<string>,
): GeneratedSplitDay | null {
  const state: DayBuildState = {
    rand,
    frequency,
    usedSlugs: new Set(),
    usedMuscles: new Set(),
    coreCount: 0,
  };
  const unseenMuscles = (): string[] => {
    const out: string[] = [];
    for (const [region, muscles] of Object.entries(REGION_MUSCLES)) {
      if (!coveredRegions.has(region)) out.push(...muscles);
    }
    return out;
  };
  const slots: ResolvedSlot[] = [];
  while (slots.length < slotCount) {
    const entry = pickFrom(POOL, state, unseenMuscles());
    if (!entry) return null;
    slots.push(commit(entry, state));
    for (const r of primaryRegionsOf(entry.slug)) coveredRegions.add(r);
  }
  return { day: dayNumber, title: `Day ${dayNumber}`, am: slots, pm: [] };
}


// ── The fully-equal builder ────────────────────────────────────────────
// 20 muscles, every one landing at the SAME set volume. Construction:
// every slot carries UNIFORM sets (3) and only hits muscles still at
// zero — so a multi-primary pick must pair two unfinished muscles
// (upper-chest has no single-muscle entry in the catalog; its incline
// presses share the budget with front-delts or chest, and the builder
// processes upper-chest FIRST so a partner is always unfinished).

const EQUAL_SETS: [number, number] = [3, 3];

function buildFullyEqualDays(
  rand: () => number,
  frequency: Map<string, number>,
): GeneratedSplitDay[] | null {
  const done = new Set<string>();
  const daySlots: ResolvedSlot[][] = [[], [], [], []];
  const usedSlugs = new Set<string>();

  // Upper-chest first (it must pair); the rest shuffled.
  const order = [
    'upper-chest',
    ...shuffled(EQUAL_MUSCLES.filter((m) => m !== 'upper-chest'), rand),
  ];

  for (const muscle of order) {
    if (done.has(muscle)) continue;
    // Candidates: every primary muscle still at zero (the pick will
    // complete them all at EQUAL_SETS), identity fresh.
    const candidates = POOL.filter((e) => {
      if (usedSlugs.has(e.slug)) return false;
      if ((frequency.get(e.slug) ?? 0) >= MAX_FREQUENCY) return false;
      const ms = e.primaryMuscles as readonly string[];
      if (ms.length === 0 || ms.length > 3) return false;
      if (!ms.includes(muscle)) return false;
      return ms.every((m) => EQUAL_MUSCLES.includes(m) && !done.has(m));
    });
    if (candidates.length === 0) return null;
    const entry = candidates[Math.floor(rand() * candidates.length)];
    usedSlugs.add(entry.slug);
    frequency.set(entry.slug, (frequency.get(entry.slug) ?? 0) + 1);
    for (const m of entry.primaryMuscles) done.add(m);
    // Round-robin the day with the fewest slots (5/5/5/5 across 20
    // slots when every pick is single-muscle; pair picks land wherever
    // the count needs it).
    const target = daySlots.reduce((a, b, i) => (b.length < daySlots[a].length ? i : a), 0);
    daySlots[target].push({
      exercise: entry.slug,
      suggestedTags: AUTHORED_TAGS.get(entry.slug) ?? [],
      sets: EQUAL_SETS,
      reps: entry.defaultReps,
    });
  }
  if (!EQUAL_MUSCLES.every((m) => done.has(m))) return null;
  return daySlots.map((slots, i) => ({
    day: i + 1,
    title: `Equal Day ${i + 1}`,
    am: slots,
    pm: [],
  }));
}

export interface GenerateProgramOptions {
  seed: number;
  program: ProgramType;
  edition?: ProgramEdition;
  maxAttempts?: number;
}

/**
 * Generate any program type for the seed — the lab's single entry.
 * Full-body types delegate to the region builder; themed types build
 * by their day contracts; Anything Goes rolls its own structure and
 * answers to the weekly laws. Same retry/verdict contract everywhere.
 */
export function generateProgram({
  seed,
  program,
  edition = 'upper',
  maxAttempts = 400,
}: GenerateProgramOptions): GeneratedSplit {
  if (program === 'fullBodyOneADay' || program === 'fullBodyHighFrequency') {
    return generateSplit({
      seed,
      shape: program === 'fullBodyHighFrequency' ? 'twoADay' : 'oneADay',
      edition,
      maxAttempts,
    });
  }

  const themes = dayThemesFor(program);
  let days: GeneratedSplitDay[] = [];
  let rules: RuleResult[] = [];
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    const rand = mulberry32(seed * 1000 + attempts);
    const frequency = new Map<string, number>();
    const candidate: GeneratedSplitDay[] = [];
    let starved = false;

    if (program === 'fullyEqual') {
      const days = buildFullyEqualDays(rand, frequency);
      if (days) {
        candidate.push(...days);
      } else {
        starved = true;
      }
    } else if (program === 'anythingGoes') {
      // The structure itself rolls: 3–6 days, 5–8 slots each.
      const dayCount = 3 + Math.floor(rand() * 4);
      const coveredRegions = new Set<string>();
      for (let d = 1; d <= dayCount; d += 1) {
        const slotCount = 5 + Math.floor(rand() * 4);
        const day = buildAnythingDay(d, slotCount, rand, frequency, coveredRegions);
        if (!day) {
          starved = true;
          break;
        }
        candidate.push(day);
      }
    } else if (themes) {
      // A/B VARIETY by construction: each pass through a theme forbids
      // its paired pass's identities (the base theme strips ' A'/' B').
      const passesByTheme = new Map<string, Set<string>>();
      for (let d = 0; d < themes.length; d += 1) {
        const base = themes[d].title.replace(/\s+[AB]$/, '');
        const forbidden = passesByTheme.get(base) ?? new Set<string>();
        const day = buildThemedDay(d + 1, themes[d], rand, frequency, forbidden);
        if (!day) {
          starved = true;
          break;
        }
        for (const slot of day.am) forbidden.add(slot.exercise);
        passesByTheme.set(base, forbidden);
        candidate.push(day);
      }
    }
    if (starved) continue;

    days = candidate;
    rules = checkProgramLaws(days, program, edition);
    if (lawsPass(rules)) {
      return { seed, program, shape: null, edition, days, rules, ok: true, attempts };
    }
  }
  return { seed, program, shape: null, edition, days, rules, ok: false, attempts };
}

/** Display name for a generated slot (catalog name, slug fallback). */
export function nameForSlug(slug: string): string {
  return SYSTEM_EXERCISES_BY_SLUG[slug]?.name ?? slug;
}

// ── The comparison baseline ────────────────────────────────────────────
// The lab's second question: how does a generated edition's muscle
// share compare to THE PROGRAM's own for the same shape? The authored
// slots (upper edition, splits.ts as authored — overrides never enter;
// the lab compares programs, not user state).

/** The authored program's slots for a shape (the comparison baseline). */
export function authoredProgramSlots(shape: PreferredSplit): ResolvedSlot[] {
  const windows: SessionWindow[] = shape === 'twoADay' ? ['am', 'pm'] : ['am'];
  return [1, 2, 3, 4].flatMap((day) =>
    windows.flatMap((w) =>
      getSlotsForDay(shape, day, w).map((slot) => ({ ...slot, exercise: slot.exercise })),
    ),
  );
}

/**
 * The authored baseline a generated program compares against: the
 * archetype's own starter when one exists (PPL / Upper-Lower / Bro),
 * the authored full-body edition of the same shape for the full-body
 * types, and the shape you actually run for Anything Goes.
 */
export function authoredBaselineFor(
  program: ProgramType,
  preferredShape: PreferredSplit = 'twoADay',
): ResolvedSlot[] {
  if (program === 'fullBodyOneADay') return authoredProgramSlots('oneADay');
  if (program === 'fullBodyHighFrequency') return authoredProgramSlots('twoADay');
  if (
    program === 'pushPullLegs' ||
    program === 'upperLower' ||
    program === 'broSplit' ||
    program === 'fullyEqual'
  ) {
    const starterId = program === 'pushPullLegs' ? 'ppl' : program;
    return getStarterDays(starterId).flatMap((d) =>
      d.session.map((slot) => ({ ...slot, exercise: slot.exercise })),
    );
  }
  return authoredProgramSlots(preferredShape);
}

// ── THE DELTA — muscle share, generated vs authored ───────────────────

export interface MuscleDeltaRow {
  muscle: string;
  /** Generated edition's share of its own total set-muscle volume (%). */
  generated: number;
  /** The authored program's share for the same shape (%). */
  authored: number;
  /** generated − authored, percentage points. */
  delta: number;
}

export interface MuscleShareDelta {
  rows: MuscleDeltaRow[];
  /** Largest |delta| — the diverging bars' normalization scale. */
  maxAbsDelta: number;
}

/** Same weighting as derivePlanMuscleShare (sets × each primary muscle). */
function shareOf(slots: readonly ResolvedSlot[]): Map<string, number> {
  const tally = new Map<string, number>();
  for (const slot of slots) {
    const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
    for (const m of SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.primaryMuscles ?? []) {
      tally.set(m, (tally.get(m) ?? 0) + sets);
    }
  }
  return tally;
}

/**
 * Per-muscle share deltas, generated vs authored, ordered by the
 * AUTHORED program's share (the reference frame stays put; muscles
 * only the generated edition works append at the end).
 */
export function muscleShareDeltas(
  generated: readonly ResolvedSlot[],
  authored: readonly ResolvedSlot[],
): MuscleShareDelta {
  const gen = shareOf(generated);
  const auth = shareOf(authored);
  const genTotal = [...gen.values()].reduce((a, b) => a + b, 0);
  const authTotal = [...auth.values()].reduce((a, b) => a + b, 0);

  const pct = (n: number, total: number) => (total === 0 ? 0 : (n / total) * 100);
  const muscles = [
    ...[...auth.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m),
    ...[...gen.keys()].filter((m) => !auth.has(m)).sort((a, b) => (gen.get(b) ?? 0) - (gen.get(a) ?? 0)),
  ];

  const rows: MuscleDeltaRow[] = muscles.map((muscle) => {
    const generated = pct(gen.get(muscle) ?? 0, genTotal);
    const authored = pct(auth.get(muscle) ?? 0, authTotal);
    return { muscle, generated, authored, delta: generated - authored };
  });
  const maxAbsDelta = rows.reduce((max, r) => Math.max(max, Math.abs(r.delta)), 0);
  return { rows, maxAbsDelta };
}
