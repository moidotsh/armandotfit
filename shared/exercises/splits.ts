// shared/exercises/splits.ts
// Day→exercise assignments for the two split archetypes armandotfit ships
// with. Ported from archive-v1/data/workoutDataRefactored.ts. The exercise
// keys here (e.g. 'barbell-press-incline') match the `key` column in the
// seed migration (supabase/migrations/20260718000001_seed_system_exercises.sql)
// — both sides of this contract must stay in sync. A key present in this
// file but missing from the DB will resolve to undefined at lookup time,
// and the suggested-exercises helper drops it.
//
// The v1 data structure (4 days each for oneADay + twoADay) is preserved
// verbatim. Days 5–7 are rest days in both splits — the user logs those
// ad-hoc via the active-session UI.

// ──────────────────────────────────────────────────────────────────────
// Exercise keys (union type for compile-time safety)
// ──────────────────────────────────────────────────────────────────────

/**
 * String-keyed identifier for each system exercise. Mirrors the seed
 * migration's exercises.key column. The union is intentionally closed —
 * adding a new system exercise means landing it here AND in the seed SQL
 * in the same change.
 */
export type ExerciseKey =
  // Chest
  | 'barbell-press-incline'
  | 'dumbbell-press-incline'
  | 'dumbbell-fly-incline'
  | 'chest-fly-machine'
  // Arms
  | 'overhead-tricep-extension-cable'
  | 'tricep-kickback-cable'
  | 'tricep-dip-machine'
  | 'reverse-plus-hammer-curl-superset'
  | 'dumbbell-curl-seated-incline'
  // Shoulders
  | 'lateral-raise-cable'
  | 'dumbbell-lateral-raise-standing'
  | 'reverse-flyes-cable'
  | 'face-pull-cable-rope-grip'
  // Back
  | 'lower-back-extension-calisthenic'
  | 'seated-cable-row-v-grip'
  | 'lat-pulldown-reverse-grip'
  | 'dumbbell-pullover-bridge-position'
  | 'lever-row-chest-supported'
  // Upper leg
  | 'leg-press-machine'
  | 'bulgarian-split-squat-dumbbell'
  | 'machine-leg-curl-seated'
  | 'leg-extension-machine'
  | 'hip-adduction-machine'
  // Lower leg
  | 'tibia-raise-machine-or-band'
  | 'calf-raise-leg-press-machine'
  | 'machine-calf-raise-standing'
  // Abs
  | 'leg-raise-captains-chair'
  | 'machine-ab-crunch-eccentric-emphasized';

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
      'barbell-press-incline',
      'leg-press-machine',
      'overhead-tricep-extension-cable',
      'lower-back-extension-calisthenic',
      'lateral-raise-cable',
      'tibia-raise-machine-or-band',
      'leg-raise-captains-chair',
    ],
  },
  {
    day: 2,
    title: 'Full Body Day 2',
    exercises: [
      'lat-pulldown-reverse-grip',
      'machine-leg-curl-seated',
      'chest-fly-machine',
      'machine-calf-raise-standing',
      'dumbbell-curl-seated-incline',
      'reverse-flyes-cable',
      'machine-ab-crunch-eccentric-emphasized',
    ],
  },
  {
    day: 3,
    title: 'Full Body Day 3',
    exercises: [
      'dumbbell-press-incline',
      'bulgarian-split-squat-dumbbell',
      'dumbbell-pullover-bridge-position',
      'tibia-raise-machine-or-band',
      'tricep-dip-machine',
      'dumbbell-lateral-raise-standing',
      'leg-raise-captains-chair',
    ],
  },
  {
    day: 4,
    title: 'Full Body Day 4',
    exercises: [
      'lever-row-chest-supported',
      'leg-extension-machine',
      'dumbbell-fly-incline',
      'calf-raise-leg-press-machine',
      'reverse-plus-hammer-curl-superset',
      'face-pull-cable-rope-grip',
      'machine-ab-crunch-eccentric-emphasized',
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
      'barbell-press-incline',
      'leg-press-machine',
      'overhead-tricep-extension-cable',
      'lateral-raise-cable',
    ],
    pm: [
      'tibia-raise-machine-or-band',
      'lower-back-extension-calisthenic',
      'leg-raise-captains-chair',
      'tricep-kickback-cable',
    ],
  },
  {
    day: 2,
    title: 'Workout Day 2',
    am: [
      'seated-cable-row-v-grip',
      'dumbbell-curl-seated-incline',
      'chest-fly-machine',
      'machine-leg-curl-seated',
    ],
    pm: [
      'reverse-flyes-cable',
      'machine-calf-raise-standing',
      'face-pull-cable-rope-grip',
      'machine-ab-crunch-eccentric-emphasized',
    ],
  },
  {
    day: 3,
    title: 'Workout Day 3',
    am: [
      'dumbbell-press-incline',
      'tricep-dip-machine',
      'dumbbell-lateral-raise-standing',
      'bulgarian-split-squat-dumbbell',
    ],
    pm: [
      'tibia-raise-machine-or-band',
      'dumbbell-pullover-bridge-position',
      'leg-raise-captains-chair',
      'hip-adduction-machine',
    ],
  },
  {
    day: 4,
    title: 'Workout Day 4',
    am: [
      'lat-pulldown-reverse-grip',
      'leg-extension-machine',
      'dumbbell-fly-incline',
      'reverse-plus-hammer-curl-superset',
    ],
    pm: [
      'face-pull-cable-rope-grip',
      'calf-raise-leg-press-machine',
      'machine-ab-crunch-eccentric-emphasized',
      'lever-row-chest-supported',
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
