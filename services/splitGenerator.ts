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
  type ProgramEdition,
  type ResolvedSlot,
  type SessionWindow,
  type SystemExerciseData,
  ALL_REGIONS,
  MUSCLE_TO_REGION,
  checkEditionLaws,
  lawsPass,
  primaryMusclesOf,
  type LawDay,
  type RuleResult,
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
  shape: PreferredSplit;
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
 * Generate one alternative edition for the seed. Retries derived seeds
 * (seed + attempt) until every law passes or the budget runs out — an
 * exhausted budget still returns the last candidate WITH its failing
 * rules, so the lab shows the truth instead of a spinner.
 */
export function generateSplit({
  seed,
  shape,
  edition,
  maxAttempts = 400,
}: GenerateSplitOptions): GeneratedSplit {
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
      return { seed, shape, edition, days, rules, ok: true, attempts };
    }
  }
  return { seed, shape, edition, days, rules, ok: false, attempts };
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
