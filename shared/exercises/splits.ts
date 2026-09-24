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
  | 'cable-curl'
  // Lower-focus edition identities
  | 'barbell-back-squat'
  | 'romanian-deadlift-barbell'
  | 'dumbbell-romanian-deadlift'
  | 'leg-extension'
  | 'seated-calf-raise-machine'
  | 'lying-leg-curl-machine'
  | 'glute-bridge'
  | 'glute-kickback'
  | 'thigh-abductor'
  | 'thigh-adductor'
  | 'plie-dumbbell-squat'
  // Program-starter identities (the PPL / Upper-Lower / Bro starters
  // below — all CORE + seeded, same catalog, authored the same way)
  | 'flat-barbell-bench-press'
  | 'incline-dumbbell-press'
  | 'barbell-overhead-press'
  | 'dumbbell-lateral-raise'
  | 'machine-lateral-raise'
  | 'arnold-press'
  | 'cable-tricep-pushdown'
  | 'machine-overhead-tricep-extension'
  | 'close-grip-bench-press'
  | 'barbell-skull-crusher'
  | 'cable-wood-chop'
  | 'cable-rope-crunch'
  | 'floor-crunch'
  | 'hanging-knee-raise'
  | 'barbell-row'
  | 'machine-seated-row'
  | 'wide-grip-cable-row'
  | 't-bar-row'
  | 'chin-up'
  | 'dumbbell-rear-delt-fly'
  | 'ez-bar-curl'
  | 'hammer-curl'
  | 'preacher-curl-machine'
  | 'barbell-curl'
  | 'dumbbell-pullover'
  | 'barbell-shrug'
  | 'cable-wrist-curl'
  | 'front-squat';

/** AM vs PM session — planning-time context for twoADay splits. */
export type SessionWindow = 'am' | 'pm' | 'single';

/** A slot resolved for use: the programmed shape, identity possibly overridden. */
export interface ResolvedSlot {
  /** Catalog slug — the programmed ExerciseKey or an override's slug. */
  exercise: string;
  suggestedTags: string[];
  sets: [number, number];
  reps: [number, number];
}

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
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
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
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
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
  'ez-bar',
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
  // Station-instance qualifiers — the same lift on different hardware
  // (one cable vs two; duplicate machines). One axis per tag.
  'single-pulley',
  'dual-pulley',
];

// ──────────────────────────────────────────────────────────────────────
// TAG AXES — mutually exclusive qualifier families. The DB store stays
// flat TEXT[] (governance §2: no dimension tables, no CHECKs); the
// axis is an INPUT-BOUNDARY authoring rule: picking a member of an
// axis REPLACES the axis's other member on the draft (you cannot be
// single-pulley and dual-pulley, underhand and overhand, seated and
// standing). One axis per concern, one token per value; tags outside
// every axis stay free-form and co-exist with everything.
// ──────────────────────────────────────────────────────────────────────

export interface TagAxis {
  /** Stable id ('grip', 'pulley'…). */
  id: string;
  /** Furniture label for grouped suggestions. */
  label: string;
  /** The mutually exclusive members. */
  members: readonly string[];
}

export const TAG_AXES: readonly TagAxis[] = [
  { id: 'grip', label: 'GRIP', members: ['underhand', 'overhand', 'neutral'] },
  { id: 'attachment', label: 'ATTACHMENT', members: ['rope', 'straight-bar', 'ez-bar', 'lat-bar', 'v-grip', 'handle'] },
  { id: 'implement', label: 'IMPLEMENT', members: ['machine', 'dumbbell', 'barbell', 'cable'] },
  { id: 'stance', label: 'STANCE', members: ['seated', 'standing', 'kneeling'] },
  { id: 'pulley', label: 'PULLEYS', members: ['single-pulley', 'dual-pulley'] },
  { id: 'station', label: 'STATION', members: ['station-1', 'station-2'] },
];

/** The axis a tag belongs to, if any. */
export function tagAxisOf(tag: string): TagAxis | undefined {
  return TAG_AXES.find((axis) => axis.members.includes(tag));
}

/**
 * ADD a tag with the axes respected: if the incoming tag belongs to an
 * axis, the axis's other members leave (single choice per axis); free
 * tags append untouched. Pure — the store calls it at the toggle seam.
 */
export function tagsWithAxisRespected(current: readonly string[], incoming: string): string[] {
  const axis = tagAxisOf(incoming);
  if (!axis) return [...current, incoming];
  return [...current.filter((t) => !axis.members.includes(t)), incoming];
}

// ──────────────────────────────────────────────────────────────────────
// Program editions — 'upper' (the original) and 'lower' (the female
// equivalent). Both editions share the same 4-day async structure and
// 17 of 32 slot positions, so a couple training together meets at the
// same station 53% of the workout (the shared exercises rotate sets;
// the solo exercises use different equipment in the same area).
// ──────────────────────────────────────────────────────────────────────

export type ProgramEdition = 'upper' | 'lower';

// ──────────────────────────────────────────────────────────────────────
// Lower-focus edition (female equivalent) — 4 days × AM + PM.
// AM = lower body (the primary session); PM = mostly shared upper
// body (the together session) + one glute accessory.
// ──────────────────────────────────────────────────────────────────────

export const FEMALE_TWO_A_DAY_SPLITS: TwoADayDay[] = [
  {
    day: 1,
    title: 'Workout Day 1',
    am: [
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-press-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'back-extension', suggestedTags: ['glute-bias'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'plie-dumbbell-squat', suggestedTags: ['kettlebell'], sets: [2, 3], reps: [12, 15] },
    ],
    pm: [
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [2, 2], reps: [10, 12] },
      { exercise: 'cable-overhead-tricep-extension', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [10, 12] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [2, 2], reps: [15, 20] },
    ],
  },
  {
    day: 2,
    title: 'Workout Day 2',
    am: [
      { exercise: 'thigh-abductor', suggestedTags: [], sets: [2, 3], reps: [12, 15] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
    ],
    pm: [
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'dumbbell-curl', suggestedTags: ['seated', 'incline'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [12, 15] },
    ],
  },
  {
    day: 3,
    title: 'Workout Day 3',
    am: [
      { exercise: 'bulgarian-split-squat', suggestedTags: ['dumbbell', 'per-leg'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'straight-arm-pulldown', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [12, 15] },
      { exercise: 'lying-leg-curl-machine', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
    ],
    pm: [
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [2, 2], reps: [10, 12] },
      { exercise: 'cable-curl', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [10, 12] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [2, 2], reps: [15, 20] },
    ],
  },
  {
    day: 4,
    title: 'Workout Day 4',
    am: [
      { exercise: 'plie-dumbbell-squat', suggestedTags: ['kettlebell'], sets: [2, 3], reps: [12, 15] },
      { exercise: 'incline-dumbbell-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
    ],
    pm: [
      { exercise: 'cable-row', suggestedTags: ['seated', 'v-grip', 'neutral'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-curl', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [10, 12] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [12, 15] },
    ],
  },
];

// One-a-day compressionion — 7 lifts per day, 28 total.
// Omissions vs AM+PM: standing-machine-calf-raise (D1), seated-calf-raise
// (D2), incline-dumbbell-fly (D3), leg-press-calf-raise (D4).
export const FEMALE_ONE_A_DAY_SPLITS: OneADayDay[] = [
  {
    day: 1,
    title: 'Full Body Day 1',
    session: [
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'back-extension', suggestedTags: ['glute-bias'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'leg-press-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [2, 2], reps: [10, 12] },
      { exercise: 'cable-overhead-tricep-extension', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [10, 12] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [2, 2], reps: [15, 20] },
    ],
  },
  {
    day: 2,
    title: 'Full Body Day 2',
    session: [
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'thigh-abductor', suggestedTags: [], sets: [2, 3], reps: [12, 15] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'dumbbell-curl', suggestedTags: ['seated', 'incline'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [12, 15] },
    ],
  },
  {
    day: 3,
    title: 'Full Body Day 3',
    session: [
      { exercise: 'bulgarian-split-squat', suggestedTags: ['dumbbell', 'per-leg'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'lying-leg-curl-machine', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'straight-arm-pulldown', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [12, 15] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [2, 2], reps: [10, 12] },
      { exercise: 'cable-curl', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [10, 12] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [2, 2], reps: [15, 20] },
    ],
  },
  {
    day: 4,
    title: 'Full Body Day 4',
    session: [
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'plie-dumbbell-squat', suggestedTags: ['kettlebell'], sets: [2, 3], reps: [12, 15] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'incline-dumbbell-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'cable-row', suggestedTags: ['seated', 'v-grip', 'neutral'], sets: [2, 2], reps: [8, 10] },
      { exercise: 'cable-curl', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [10, 12] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 2], reps: [12, 15] },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// THE PROGRAM STARTERS — authored editions for the other archetypes
// (PPL / Upper-Lower / Bro), the same authored-asset discipline as
// the full-body programs above: pure TypeScript, never the database,
// slots carrying coarse identity + suggested tags + programmed Rx.
// Each starter must pass its archetype's law set (the suite proves
// it); the Split Lab's generator draws from the same law book.
// ──────────────────────────────────────────────────────────────────────

/** The starter program ids (the lab's non-full-body program types). */
export type StarterProgram = 'ppl' | 'upperLower' | 'broSplit' | 'fullyEqual';

/** One single-session starter day (the day count varies by program). */
export interface StarterDay {
  day: number;
  title: string;
  session: SplitSlot[];
}

// PUSH/PULL/LEG — the 6-day double pass. The A rotation trains the
// heavy compounds (bench, row, squat); the B rotation changes the
// angle and the implements (incline dumbbell, chin-up, RDL) — every
// theme's two days share NO identity, the 6-day variety law in the
// law book. Abs ride five of the six days (one slot: crunch, leg
// raise, rope crunch, wood chop, hanging knee raise).
export const PPL_STARTER: StarterDay[] = [
  {
    day: 1,
    title: 'Push A',
    session: [
      { exercise: 'flat-barbell-bench-press', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'barbell-overhead-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'cable-tricep-pushdown', suggestedTags: ['rope', 'neutral'], sets: [3, 3], reps: [10, 12] },
      { exercise: 'machine-overhead-tricep-extension', suggestedTags: [], sets: [2, 3], reps: [10, 12] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [2, 3], reps: [15, 20] },
    ],
  },
  {
    day: 2,
    title: 'Pull A',
    session: [
      { exercise: 'barbell-row', suggestedTags: ['overhand'], sets: [4, 4], reps: [6, 8] },
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-seated-row', suggestedTags: ['v-grip', 'neutral'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'dumbbell-curl', suggestedTags: ['seated', 'incline'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'hammer-curl', suggestedTags: ['neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'leg-raise', suggestedTags: ['captains-chair'], sets: [2, 3], reps: [15, 20] },
    ],
  },
  {
    day: 3,
    title: 'Legs A',
    session: [
      { exercise: 'barbell-back-squat', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-extension', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'cable-rope-crunch', suggestedTags: ['rope', 'kneeling'], sets: [2, 3], reps: [15, 20] },
    ],
  },
  {
    day: 4,
    title: 'Push B',
    session: [
      { exercise: 'incline-dumbbell-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'dumbbell-overhead-press', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'dumbbell-lateral-raise', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'cable-overhead-tricep-extension', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'machine-dip', suggestedTags: [], sets: [2, 2], reps: [8, 10] },
      { exercise: 'cable-wood-chop', suggestedTags: ['high-to-low'], sets: [2, 3], reps: [12, 15] },
    ],
  },
  {
    day: 5,
    title: 'Pull B',
    session: [
      { exercise: 't-bar-row', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'chin-up', suggestedTags: ['neutral'], sets: [3, 3], reps: [6, 10] },
      { exercise: 'wide-grip-cable-row', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'dumbbell-rear-delt-fly', suggestedTags: [], sets: [2, 3], reps: [12, 15] },
      { exercise: 'ez-bar-curl', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'preacher-curl-machine', suggestedTags: [], sets: [2, 3], reps: [10, 12] },
      { exercise: 'hanging-knee-raise', suggestedTags: [], sets: [2, 3], reps: [12, 15] },
    ],
  },
  {
    day: 6,
    title: 'Legs B',
    session: [
      { exercise: 'romanian-deadlift-barbell', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'bulgarian-split-squat', suggestedTags: ['dumbbell', 'per-leg'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'lying-leg-curl-machine', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'glute-bridge', suggestedTags: ['barbell'], sets: [3, 3], reps: [10, 12] },
      { exercise: 'seated-calf-raise-machine', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'thigh-abductor', suggestedTags: [], sets: [2, 3], reps: [12, 15] },
      { exercise: 'back-extension', suggestedTags: [], sets: [2, 3], reps: [10, 12] },
    ],
  },
];

// UPPER/LOWER — the 4-day alternation. Upper A leads with the barbell
// bench + pulldown; Upper B flips to incline dumbbell + row. Lower A
// squats; Lower B fronts. Abs ride both lower days.
export const UPPER_LOWER_STARTER: StarterDay[] = [
  {
    day: 1,
    title: 'Upper A',
    session: [
      { exercise: 'flat-barbell-bench-press', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'barbell-overhead-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-seated-row', suggestedTags: ['v-grip', 'neutral'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'barbell-curl', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'cable-tricep-pushdown', suggestedTags: ['rope', 'neutral'], sets: [3, 3], reps: [10, 12] },
    ],
  },
  {
    day: 2,
    title: 'Lower A',
    session: [
      { exercise: 'barbell-back-squat', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'romanian-deadlift-barbell', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [2, 3], reps: [15, 20] },
      { exercise: 'floor-crunch', suggestedTags: [], sets: [2, 3], reps: [15, 20] },
    ],
  },
  {
    day: 3,
    title: 'Upper B',
    session: [
      { exercise: 'incline-dumbbell-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'barbell-row', suggestedTags: ['overhand'], sets: [4, 4], reps: [6, 8] },
      { exercise: 'dumbbell-overhead-press', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'chin-up', suggestedTags: ['neutral'], sets: [3, 3], reps: [6, 10] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'hammer-curl', suggestedTags: ['neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'machine-overhead-tricep-extension', suggestedTags: [], sets: [2, 3], reps: [10, 12] },
    ],
  },
  {
    day: 4,
    title: 'Lower B',
    session: [
      { exercise: 'front-squat', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'bulgarian-split-squat', suggestedTags: ['dumbbell', 'per-leg'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'lying-leg-curl-machine', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-extension', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'glute-bridge', suggestedTags: ['barbell'], sets: [3, 3], reps: [10, 12] },
      { exercise: 'seated-calf-raise-machine', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
      { exercise: 'cable-rope-crunch', suggestedTags: ['rope', 'kneeling'], sets: [2, 3], reps: [15, 20] },
    ],
  },
];

// BRO SPLIT — the five region days. Each day stays inside its muscle
// theme with the distinctness the law demands (two chest muscles,
// three back, four leg, three delt heads, both arms).
export const BRO_STARTER: StarterDay[] = [
  {
    day: 1,
    title: 'Chest',
    session: [
      { exercise: 'flat-barbell-bench-press', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'incline-dumbbell-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-incline-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'incline-dumbbell-fly', suggestedTags: [], sets: [2, 2], reps: [12, 15] },
      { exercise: 'dumbbell-pullover', suggestedTags: [], sets: [2, 3], reps: [10, 12] },
    ],
  },
  {
    day: 2,
    title: 'Back',
    session: [
      { exercise: 'barbell-row', suggestedTags: ['overhand'], sets: [4, 4], reps: [6, 8] },
      { exercise: 'chin-up', suggestedTags: ['neutral'], sets: [3, 3], reps: [6, 10] },
      { exercise: 't-bar-row', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'straight-arm-pulldown', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [12, 15] },
      { exercise: 'machine-seated-row', suggestedTags: ['v-grip', 'neutral'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'dumbbell-shrug', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
    ],
  },
  {
    day: 3,
    title: 'Legs',
    session: [
      { exercise: 'barbell-back-squat', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'romanian-deadlift-barbell', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-extension', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
    ],
  },
  {
    day: 4,
    title: 'Shoulders',
    session: [
      { exercise: 'barbell-overhead-press', suggestedTags: [], sets: [4, 4], reps: [6, 8] },
      { exercise: 'arnold-press', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-lateral-raise', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'dumbbell-rear-delt-fly', suggestedTags: [], sets: [2, 3], reps: [12, 15] },
      { exercise: 'barbell-shrug', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
    ],
  },
  {
    day: 5,
    title: 'Arms',
    session: [
      { exercise: 'close-grip-bench-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'barbell-curl', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'barbell-skull-crusher', suggestedTags: [], sets: [3, 3], reps: [10, 12] },
      { exercise: 'hammer-curl', suggestedTags: ['neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'cable-overhead-tricep-extension', suggestedTags: ['rope', 'neutral'], sets: [2, 3], reps: [10, 12] },
      { exercise: 'preacher-curl-machine', suggestedTags: [], sets: [2, 3], reps: [10, 12] },
    ],
  },
];


// FULLY EQUAL — every muscle in the vocabulary trained EXACTLY the
// same: 20 muscles × 3 sets, a perfectly flat share chart (the one
// multi-primary slot is deliberate: upper-chest has no single-muscle
// exercise in the catalog, so the incline press carries upper-chest
// AND front-delts' shared budget — both land at 3).
export const FULLY_EQUAL_STARTER: StarterDay[] = [
  {
    day: 1,
    title: 'Equal Day 1',
    session: [
      { exercise: 'machine-chest-fly', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'lat-pulldown', suggestedTags: ['underhand', 'lat-bar'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'leg-extension', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'cable-lateral-raise', suggestedTags: ['egyptian', 'handle'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'dumbbell-curl', suggestedTags: ['seated', 'incline'], sets: [3, 3], reps: [8, 10] },
    ],
  },
  {
    day: 2,
    title: 'Equal Day 2',
    session: [
      { exercise: 'incline-dumbbell-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'wide-grip-cable-row', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      { exercise: 'machine-leg-curl', suggestedTags: ['seated'], sets: [3, 3], reps: [8, 10] },
      { exercise: 'cable-tricep-pushdown', suggestedTags: ['rope', 'neutral'], sets: [3, 3], reps: [10, 12] },
      { exercise: 'machine-shrug', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
    ],
  },
  {
    day: 3,
    title: 'Equal Day 3',
    session: [
      { exercise: 'face-pull', suggestedTags: ['rope', 'neutral'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'back-extension', suggestedTags: [], sets: [3, 3], reps: [10, 12] },
      { exercise: 'tibia-raise', suggestedTags: ['machine'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'machine-ab-crunch', suggestedTags: ['eccentric'], sets: [3, 3], reps: [15, 20] },
      { exercise: 'glute-bridge', suggestedTags: ['barbell'], sets: [3, 3], reps: [10, 12] },
    ],
  },
  {
    day: 4,
    title: 'Equal Day 4',
    session: [
      { exercise: 'hanging-knee-raise', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'cable-wood-chop', suggestedTags: ['high-to-low'], sets: [3, 3], reps: [12, 15] },
      { exercise: 'cable-wrist-curl', suggestedTags: [], sets: [3, 3], reps: [12, 15] },
      { exercise: 'standing-machine-calf-raise', suggestedTags: [], sets: [3, 3], reps: [15, 20] },
    ],
  },
];

/** The starter days for a program (empty for unknown ids). */
export function getStarterDays(program: StarterProgram): StarterDay[] {
  switch (program) {
    case 'ppl':
      return PPL_STARTER;
    case 'upperLower':
      return UPPER_LOWER_STARTER;
    case 'broSplit':
      return BRO_STARTER;
    case 'fullyEqual':
      return FULLY_EQUAL_STARTER;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────────────

/** Programmed slots for a split + day + window. Empty for rest/out-of-range. */
export function getSlotsForDay(
  split: 'oneADay' | 'twoADay',
  day: number,
  window: SessionWindow = 'am',
  edition: ProgramEdition = 'upper',
): SplitSlot[] {
  if (day < 1 || day > 4) return [];
  if (split === 'oneADay') {
    const source = edition === 'lower' ? FEMALE_ONE_A_DAY_SPLITS : ONE_A_DAY_SPLITS;
    return source.find((d) => d.day === day)?.session ?? [];
  }
  const source = edition === 'lower' ? FEMALE_TWO_A_DAY_SPLITS : TWO_A_DAY_SPLITS;
  const entry = source.find((d) => d.day === day);
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
export function getDayTitle(split: 'oneADay' | 'twoADay', day: number, edition: ProgramEdition = 'upper'): string {
  if (day < 1 || day > 4) return '';
  if (split === 'oneADay') {
    return (edition === 'lower' ? FEMALE_ONE_A_DAY_SPLITS : ONE_A_DAY_SPLITS).find((d) => d.day === day)?.title ?? '';
  }
  return (edition === 'lower' ? FEMALE_TWO_A_DAY_SPLITS : TWO_A_DAY_SPLITS).find((d) => d.day === day)?.title ?? '';
}

// ── PROGRAM ERAS ─────────────────────────────────────────────────────
// The program is TypeScript (invariant 8) — editing it redefines what
// a day means. An ERA is a dated label for each program revision: UI
// display context ONLY (sessions carry no version column; the schema
// is untouched). Bump this list whenever the split changes materially
// — receipts and facts then name the era a session ran under, and
// "what did November look like" answers from dates alone.

export interface ProgramEra {
  /** ISO date (inclusive) this program revision took effect. */
  from: string;
  /** Short furniture label (CAPS, ≤4 chars). */
  label: string;
}

export const PROGRAM_ERAS: readonly ProgramEra[] = [
  { from: '2026-10-01', label: 'V1' },
];

/** The era a given ISO date ran under (the latest era.from ≤ date). */
export function eraFor(isoDate: string): string {
  let label = '';
  for (const era of PROGRAM_ERAS) {
    if (era.from <= isoDate) label = era.label;
  }
  return label;
}

/** The current program era's label. */
export const CURRENT_ERA: string = PROGRAM_ERAS[PROGRAM_ERAS.length - 1].label;
