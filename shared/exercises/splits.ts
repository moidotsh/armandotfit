// shared/exercises/splits.ts
// Day→exercise assignments for the two split archetypes armandotfit ships
// with. Ported from archive-v1/data/workoutDataRefactored.ts. The exercise
// keys here (e.g. 'barbell-press-incline') match the `slug` column in the
// seed migration (supabase/migrations/20260718000002_seed_system_exercises.sql
// + 20260721000002_seed_catalog_and_programs.sql) — both sides of this
// contract must stay in sync. A key present in this file but missing from
// the DB will resolve to undefined at lookup time, and the
// suggested-exercises helper drops it.
//
// The v2 data structure (4 days each for oneADay + twoADay) is preserved.
// Days 5–7 are rest days in both splits — the user logs those ad-hoc via
// the active-session UI.
//
// The catalog extension migration (20260721000002) adds 17 substitution
// pool exercises that are NOT placed on a split day. They live in the
// ExerciseKey union so the browse UI, alternatives graph, and
// program-template slots can reference them — but the day-assignment
// arrays below intentionally do not include them.

// ──────────────────────────────────────────────────────────────────────
// Exercise keys (union type for compile-time safety)
// ──────────────────────────────────────────────────────────────────────

/**
 * String-keyed identifier for each system exercise. Mirrors the seed
 * migration's exercises.slug column. The union is intentionally closed —
 * adding a new system exercise means landing it here AND in the seed SQL
 * in the same change.
 *
 * The 17 pool slugs (substitutes referenced by the alternatives graph and
 * the program-template slot seed) are listed separately. They are not
 * placed on a split day.
 */
export type ExerciseKey =
  // Chest
  | 'barbell-press-incline'
  | 'dumbbell-fly-incline'
  | 'chest-fly-machine'
  | 'incline-machine-press'
  // Arms
  | 'overhead-tricep-extension-cable'
  | 'tricep-dip-machine'
  | 'dumbbell-curl-seated-incline'
  | 'cable-rope-curl'
  // Shoulders
  | 'egyptian-cable-lateral-raise'
  | 'face-pull-cable-rope-grip'
  | 'shoulder-press-machine-or-dumbbell'
  | 'dumbbell-overhead-press'
  // Back
  | 'lower-back-extension-calisthenic'
  | 'seated-cable-row-v-grip'
  | 'lat-pulldown-reverse-grip'
  | 'straight-arm-cable-pulldown'
  | 'machine-shrug-plate-loaded'
  | 'dumbbell-shrug'
  // Upper leg
  | 'leg-press-machine'
  | 'bulgarian-split-squat-dumbbell'
  | 'machine-leg-curl-seated'
  // Lower leg
  | 'tibia-raise-machine-or-band'
  | 'calf-raise-leg-press-machine'
  | 'machine-calf-raise-standing'
  // Abs
  | 'leg-raise-captains-chair'
  | 'machine-ab-crunch-eccentric-emphasized'
  // Substitution pool — catalog extension (migration 20260721000002).
  // Referenced by exercise_alternatives and program-template slots; not
  // placed on a oneADay/twoADay split day.
  | 'hack-squat-machine'
  | 'seated-calf-raise-machine'
  | 'romanian-deadlift-barbell'
  | 'floor-leg-raise'
  | 'incline-dumbbell-press'
  | 'overhead-dumbbell-tricep-extension'
  | 'barbell-overhead-press'
  | 'dumbbell-lateral-raise'
  | 'lying-leg-curl-machine'
  | 'pull-up-bar'
  | 'cable-rope-crunch'
  | 'dumbbell-curl-standing'
  | 'reverse-pec-deck'
  | 'walking-lunge-dumbbell'
  | 'dumbbell-pullover'
  | 'bench-dip'
  | 'barbell-row';

// ──────────────────────────────────────────────────────────────────────
// 1-a-day splits (4 days)
// ──────────────────────────────────────────────────────────────────────

export interface OneADayDay {
  day: 1 | 2 | 3 | 4;
  title: string;
  exercises: ExerciseKey[];
}

export const ONE_A_DAY_SPLITS: OneADayDay[] = [
  {
    day: 1,
    title: 'Full Body Day 1',
    exercises: [
      'leg-press-machine',
      'calf-raise-leg-press-machine',
      'leg-raise-captains-chair',
      'barbell-press-incline',
      'overhead-tricep-extension-cable',
      'shoulder-press-machine-or-dumbbell',
      'egyptian-cable-lateral-raise',
    ],
  },
  {
    day: 2,
    title: 'Full Body Day 2',
    exercises: [
      'machine-shrug-plate-loaded',
      'chest-fly-machine',
      'tibia-raise-machine-or-band',
      'machine-leg-curl-seated',
      'lat-pulldown-reverse-grip',
      'dumbbell-curl-seated-incline',
      'face-pull-cable-rope-grip',
    ],
  },
  {
    day: 3,
    title: 'Full Body Day 3',
    exercises: [
      'bulgarian-split-squat-dumbbell',
      'machine-calf-raise-standing',
      'straight-arm-cable-pulldown',
      'incline-machine-press',
      'tricep-dip-machine',
      'dumbbell-overhead-press',
      'egyptian-cable-lateral-raise',
    ],
  },
  {
    day: 4,
    title: 'Full Body Day 4',
    exercises: [
      'dumbbell-fly-incline',
      'tibia-raise-machine-or-band',
      'machine-leg-curl-seated',
      'seated-cable-row-v-grip',
      'machine-ab-crunch-eccentric-emphasized',
      'cable-rope-curl',
      'face-pull-cable-rope-grip',
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// AM/PM splits (4 days)
// ──────────────────────────────────────────────────────────────────────

export interface TwoADayDay {
  day: 1 | 2 | 3 | 4;
  title: string;
  am: ExerciseKey[];
  pm: ExerciseKey[];
}

export const TWO_A_DAY_SPLITS: TwoADayDay[] = [
  {
    day: 1,
    title: 'Workout Day 1',
    am: [
      'leg-press-machine',
      'calf-raise-leg-press-machine',
      'lower-back-extension-calisthenic',
      'leg-raise-captains-chair',
    ],
    pm: [
      'barbell-press-incline',
      'overhead-tricep-extension-cable',
      'shoulder-press-machine-or-dumbbell',
      'egyptian-cable-lateral-raise',
    ],
  },
  {
    day: 2,
    title: 'Workout Day 2',
    am: [
      'machine-shrug-plate-loaded',
      'chest-fly-machine',
      'tibia-raise-machine-or-band',
      'machine-leg-curl-seated',
    ],
    pm: [
      'lat-pulldown-reverse-grip',
      'machine-ab-crunch-eccentric-emphasized',
      'dumbbell-curl-seated-incline',
      'face-pull-cable-rope-grip',
    ],
  },
  {
    day: 3,
    title: 'Workout Day 3',
    am: [
      'bulgarian-split-squat-dumbbell',
      'machine-calf-raise-standing',
      'straight-arm-cable-pulldown',
      'leg-raise-captains-chair',
    ],
    pm: [
      'incline-machine-press',
      'tricep-dip-machine',
      'dumbbell-overhead-press',
      'egyptian-cable-lateral-raise',
    ],
  },
  {
    day: 4,
    title: 'Workout Day 4',
    am: [
      'dumbbell-shrug',
      'dumbbell-fly-incline',
      'tibia-raise-machine-or-band',
      'machine-leg-curl-seated',
    ],
    pm: [
      'seated-cable-row-v-grip',
      'machine-ab-crunch-eccentric-emphasized',
      'cable-rope-curl',
      'face-pull-cable-rope-grip',
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────────────

/**
 * Resolves the exercise keys for a given split + day. For twoADay, returns
 * the AM set only (the user picks AM or PM at session-start time — the
 * PM set is available via a follow-up session later in the day). Returns
 * an empty array for rest days (5–7) or out-of-range days.
 *
 * Callers should hydrate these keys against the ExerciseRepository cache
 * (useExercises) before display, since the canonical exercise metadata
 * (display name, muscles, equipment) lives in the DB.
 */
export function getExercisesForDay(
  split: 'oneADay' | 'twoADay',
  day: number,
  session: 'am' | 'pm' = 'am',
): ExerciseKey[] {
  if (day < 1 || day > 4) return [];
  if (split === 'oneADay') {
    return ONE_A_DAY_SPLITS.find((d) => d.day === day)?.exercises ?? [];
  }
  const entry = TWO_A_DAY_SPLITS.find((d) => d.day === day);
  if (!entry) return [];
  return session === 'am' ? entry.am : entry.pm;
}

/**
 * Returns the day's title (e.g. "Full Body Day 1") for the active-session
 * header + split preview surfaces. Empty string for rest days / out of range.
 */
export function getDayTitle(
  split: 'oneADay' | 'twoADay',
  day: number,
): string {
  if (day < 1 || day > 4) return '';
  if (split === 'oneADay') {
    return ONE_A_DAY_SPLITS.find((d) => d.day === day)?.title ?? '';
  }
  return TWO_A_DAY_SPLITS.find((d) => d.day === day)?.title ?? '';
}
