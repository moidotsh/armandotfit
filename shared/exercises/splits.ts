// shared/exercises/splits.ts
// The AM/PM training program — the one authored asset this app carries.
// Pure TypeScript data; deliberately NOT modeled in the database.
//
// Identity model: each slot names one COARSE exercise identity (matching
// a `name` in the seeded exercises table + an entry in data.ts by slug).
// Where the program implies a specific realization (grip, attachment,
// style), that lives in `suggestedTags` — pre-filled into the session
// draft as tags on the logged exercise, editable at log time. Tags never
// affect identity; two logged exercises with different tags are the same
// exercise row.
//
// Prescriptions (sets/reps ranges) live here, on the slot — program data
// belongs to the program, not to the exercise catalog. data.ts keeps only
// display-level defaults for browsing.

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

/** Slug of a coarse exercise identity placed on a split day. */
export type ExerciseKey =
  | 'leg-press'
  | 'leg-press-calf-raise'
  | 'standing-machine-calf-raise'
  | 'back-extension'
  | 'leg-raise'
  | 'incline-barbell-press'
  | 'cable-overhead-tricep-extension'
  | 'shoulder-press'
  | 'cable-lateral-raise'
  | 'machine-shrug'
  | 'machine-chest-fly'
  | 'tibia-raise'
  | 'machine-leg-curl'
  | 'lat-pulldown'
  | 'machine-ab-crunch'
  | 'dumbbell-curl'
  | 'face-pull'
  | 'bulgarian-split-squat'
  | 'straight-arm-pulldown'
  | 'machine-incline-press'
  | 'machine-dip'
  | 'dumbbell-overhead-press'
  | 'dumbbell-shrug'
  | 'incline-dumbbell-fly'
  | 'cable-row'
  | 'cable-curl';

/** AM vs PM session — planning-time context for twoADay splits. */
export type SessionWindow = 'am' | 'pm' | 'single';

/** One programmed slot: coarse identity + suggested realization tags + Rx. */
export interface SplitSlot {
  exercise: ExerciseKey;
  /** Pre-filled tags on the logged exercise (editable at log time). */
  suggestedTags: string[];
  /** Programmed set range as [min, max]. */
  sets: [number, number];
  /** Programmed rep range as [min, max]. */
  reps: [number, number];
}

export interface TwoADayDay {
  day: 1 | 2 | 3 | 4;
  title: string;
  am: SplitSlot[];
  pm: SplitSlot[];
}

export interface OneADayDay {
  day: 1 | 2 | 3 | 4;
  title: string;
  session: SplitSlot[];
}

// ──────────────────────────────────────────────────────────────────────
// Two-a-day (AM/PM) — 4 days × 2 sessions × 4 slots
// ──────────────────────────────────────────────────────────────────────

export const TWO_A_DAY_SPLITS: TwoADayDay[] = [
  {
    day: 1,
    title: 'Workout Day 1',
    am: [
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-press-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'back-extension', suggestedTags: [], sets: [2, 2], reps: [10, 12] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
    ],
    pm: [
      { exercise: 'incline-barbell-press', suggestedTags: [], sets: [3, 3], reps: [6, 8] },
      { exercise: 'cable-overhead-tricep-extension', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'shoulder-press', suggestedTags: ['machine'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
    ],
  },
  {
    day: 2,
    title: 'Workout Day 2',
    am: [
      { exercise: 'machine-shrug', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
    ],
    pm: [
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'dumbbell-curl', suggestedTags: ['seated', 'incline'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [15, 20] },
    ],
  },
  {
    day: 3,
    title: 'Workout Day 3',
    am: [
      { exercise: 'bulgarian-split-squat', suggestedTags: ['dumbbell', 'per-leg'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'straight-arm-pulldown', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [12, 15] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
    ],
    pm: [
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-dip', suggestedTags: [], sets: [2, 2], reps: [8, 10] },
      { exercise: 'dumbbell-overhead-press', suggestedTags: [], sets: [2, 2], reps: [8, 10] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
    ],
  },
  {
    day: 4,
    title: 'Workout Day 4',
    am: [
      { exercise: 'dumbbell-shrug', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'incline-dumbbell-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
    ],
    pm: [
      { exercise: 'cable-row', suggestedTags: ['seated', 'v-grip', 'neutral'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-curl', suggestedTags: ['rope', 'neutral'], sets: [3, 3], reps: [10, 12] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [15, 20] },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// One-a-day — same content compressed to one 7-exercise session per day.
// Deliberate omissions vs the AM+PM union: Back Extension (Day 1),
// Machine Ab Crunch (Day 2), Leg Raise (Day 3), Dumbbell Shrug (Day 4).
// ──────────────────────────────────────────────────────────────────────

export const ONE_A_DAY_SPLITS: OneADayDay[] = [
  {
    day: 1,
    title: 'Full Body Day 1',
    session: [
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-press-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'incline-barbell-press', suggestedTags: [], sets: [3, 3], reps: [6, 8] },
      { exercise: 'cable-overhead-tricep-extension', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'shoulder-press', suggestedTags: ['machine'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
    ],
  },
  {
    day: 2,
    title: 'Full Body Day 2',
    session: [
      { exercise: 'machine-shrug', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'dumbbell-curl', suggestedTags: ['seated', 'incline'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [15, 20] },
    ],
  },
  {
    day: 3,
    title: 'Full Body Day 3',
    session: [
      { exercise: 'bulgarian-split-squat', suggestedTags: ['dumbbell', 'per-leg'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'straight-arm-pulldown', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [12, 15] },
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-dip', suggestedTags: [], sets: [2, 2], reps: [8, 10] },
      { exercise: 'dumbbell-overhead-press', suggestedTags: [], sets: [2, 2], reps: [8, 10] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
    ],
  },
  {
    day: 4,
    title: 'Full Body Day 4',
    session: [
      { exercise: 'incline-dumbbell-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'cable-row', suggestedTags: ['seated', 'v-grip', 'neutral'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-curl', suggestedTags: ['rope', 'neutral'], sets: [3, 3], reps: [10, 12] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [15, 20] },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Tag vocabulary seed — autocomplete suggestions for the tag input.
// Folded from the old exercise_grip_options seed values (normalized,
// unprefixed) plus the program's suggested realization tags.
// ──────────────────────────────────────────────────────────────────────

export const TAG_VOCABULARY_SEED: string[] = [
  'rope',
  'straight-bar',
  'lat-bar',
  'v-grip',
  'handle',
  'neutral',
  'underhand',
  'overhand',
  'machine',
  'dumbbell',
  'seated',
  'standing',
  'incline',
  'captains-chair',
  'egyptian',
  'eccentric',
  'per-leg',
];

// ──────────────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────────────

/** Programmed slots for a split + day + window. Empty for rest/out-of-range. */
export function getSlotsForDay(
  split: 'oneADay' | 'twoADay',
  day: number,
  window: SessionWindow = 'am',
): SplitSlot[] {
  if (day < 1 || day > 4) return [];
  if (split === 'oneADay') {
    return ONE_A_DAY_SPLITS.find((d) => d.day === day)?.session ?? [];
  }
  const entry = TWO_A_DAY_SPLITS.find((d) => d.day === day);
  if (!entry) return [];
  return window === 'am' ? entry.am : entry.pm;
}

/** Coarse exercise keys for a split + day + window (order preserved). */
export function getExercisesForDay(
  split: 'oneADay' | 'twoADay',
  day: number,
  window: SessionWindow = 'am',
): ExerciseKey[] {
  return getSlotsForDay(split, day, window).map((s) => s.exercise);
}

/** Day title for headers ("Workout Day 1" / "Full Body Day 1"). */
export function getDayTitle(split: 'oneADay' | 'twoADay', day: number): string {
  if (day < 1 || day > 4) return '';
  if (split === 'oneADay') {
    return ONE_A_DAY_SPLITS.find((d) => d.day === day)?.title ?? '';
  }
  return TWO_A_DAY_SPLITS.find((d) => d.day === day)?.title ?? '';
}
