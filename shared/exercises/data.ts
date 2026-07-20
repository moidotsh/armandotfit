// shared/exercises/data.ts
// Canonical exercise library data (43 system exercises). Ported from
// archive-v1/data/{workoutDataRefactored,exercise-detail-enhanced}.ts.
// This file is the TS-side source of truth; the SQL seed migration
// (supabase/migrations/20260718000002_seed_system_exercises.sql +
// 20260721000002_seed_catalog_and_programs.sql) mirrors it into the DB
// so ExerciseRepository.findAll returns the same set.
//
// The original 26 ship in 20260718000002; the 17-exercise substitution
// pool (migration 20260721000002) is referenced by the alternatives graph
// and the program-template slots but is NOT placed on a oneADay/twoADay
// split day — see splits.ts.
//
// Adding a new system exercise means landing it here AND in the seed SQL
// in the same change. The splits.ts ExerciseKey union must also extend.

import type { ExerciseType, DifficultyLevel } from '../types';

// ──────────────────────────────────────────────────────────────────────
// Muscle + equipment slugs (match seed SQL slugs)
// ──────────────────────────────────────────────────────────────────────

/**
 * Stable slugs for muscle reference rows. Mirrors the `slug` column added
 * by migration 20260718000002. Used to join exercises to muscles without
 * relying on UUID round-trips.
 */
export const MuscleSlug = {
  CHEST: 'chest',
  UPPER_CHEST: 'upper-chest',
  LOWER_CHEST: 'lower-chest',
  UPPER_BACK: 'upper-back',
  LATS: 'lats',
  LOWER_BACK: 'lower-back',
  TRAPS: 'traps',
  RHOMBOIDS: 'rhomboids',
  FRONT_DELTS: 'front-delts',
  SIDE_DELTS: 'side-delts',
  REAR_DELTS: 'rear-delts',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  FOREARMS: 'forearms',
  ABS: 'abs',
  LOWER_ABS: 'lower-abs',
  OBLIQUES: 'obliques',
  QUADS: 'quads',
  HAMSTRINGS: 'hamstrings',
  GLUTES: 'glutes',
  CALVES: 'calves',
  TIBIALIS: 'tibialis',
} as const;

export type MuscleSlug = (typeof MuscleSlug)[keyof typeof MuscleSlug];

/** Stable slugs for equipment reference rows. */
export const EquipmentSlug = {
  BARBELL: 'barbell',
  DUMBBELL: 'dumbbell',
  KETTLEBELL: 'kettlebell',
  INCLINE_BENCH: 'incline-bench',
  FLAT_BENCH: 'flat-bench',
  DECLINE_BENCH: 'decline-bench',
  SQUAT_RACK: 'squat-rack',
  PULL_UP_BAR: 'pull-up-bar',
  CABLE_ROPE: 'cable-rope',
  CABLE_HANDLE: 'cable-handle',
  CABLE_STRAIGHT_BAR: 'cable-straight-bar',
  CABLE_V_BAR: 'cable-v-bar',
  CABLE_LAT_BAR: 'cable-lat-bar',
  LEG_PRESS_MACHINE: 'leg-press-machine',
  CHEST_FLY_MACHINE: 'chest-fly-machine',
  CHEST_PRESS_MACHINE: 'chest-press-machine',
  LAT_PULLDOWN_MACHINE: 'lat-pulldown-machine',
  SEATED_ROW_MACHINE: 'seated-row-machine',
  LEG_EXTENSION_MACHINE: 'leg-extension-machine',
  LEG_CURL_MACHINE: 'leg-curl-machine',
  HIP_ADDUCTION_MACHINE: 'hip-adduction-machine',
  CALF_RAISE_MACHINE: 'calf-raise-machine',
  TRICEP_EXTENSION_MACHINE: 'tricep-extension-machine',
  DIP_MACHINE: 'dip-machine',
  ABDOMINAL_MACHINE: 'abdominal-machine',
  BACK_EXTENSION_STATION: 'back-extension-station',
  CAPTAINS_CHAIR: 'captains-chair',
  RESISTANCE_BAND: 'resistance-band',
  TIBIA_RAISE_MACHINE: 'tibia-raise-machine',
  SHOULDER_PRESS_MACHINE: 'shoulder-press-machine',
  SHRUG_MACHINE: 'shrug-machine',
  // Added by migration 20260721000002 (catalog extension).
  HACK_SQUAT_MACHINE: 'hack-squat-machine',
  SEATED_CALF_RAISE_MACHINE: 'seated-calf-raise-machine',
  LYING_LEG_CURL_MACHINE: 'lying-leg-curl-machine',
  PEC_DECK_MACHINE: 'pec-deck-machine',
  FLOOR_SPACE: 'floor-space',
} as const;

export type EquipmentSlug = (typeof EquipmentSlug)[keyof typeof EquipmentSlug];

// ──────────────────────────────────────────────────────────────────────
// Display-name maps (slug → human string)
// ──────────────────────────────────────────────────────────────────────
// Local canonical display strings. Mirrors the seed migration's
// display_name columns so attribute chips can render without a DB
// round-trip on the split-preview / active-session surfaces. If the two
// drift, the seed SQL is the source of truth — fix it here to match.

export const MUSCLE_DISPLAY_NAMES: Record<MuscleSlug, string> = {
  [MuscleSlug.CHEST]: 'Chest',
  [MuscleSlug.UPPER_CHEST]: 'Upper Chest',
  [MuscleSlug.LOWER_CHEST]: 'Lower Chest',
  [MuscleSlug.UPPER_BACK]: 'Upper Back',
  [MuscleSlug.LATS]: 'Lats',
  [MuscleSlug.LOWER_BACK]: 'Lower Back',
  [MuscleSlug.TRAPS]: 'Traps',
  [MuscleSlug.RHOMBOIDS]: 'Rhomboids',
  [MuscleSlug.FRONT_DELTS]: 'Front Delts',
  [MuscleSlug.SIDE_DELTS]: 'Side Delts',
  [MuscleSlug.REAR_DELTS]: 'Rear Delts',
  [MuscleSlug.BICEPS]: 'Biceps',
  [MuscleSlug.TRICEPS]: 'Triceps',
  [MuscleSlug.FOREARMS]: 'Forearms',
  [MuscleSlug.ABS]: 'Abs',
  [MuscleSlug.LOWER_ABS]: 'Lower Abs',
  [MuscleSlug.OBLIQUES]: 'Obliques',
  [MuscleSlug.QUADS]: 'Quads',
  [MuscleSlug.HAMSTRINGS]: 'Hamstrings',
  [MuscleSlug.GLUTES]: 'Glutes',
  [MuscleSlug.CALVES]: 'Calves',
  [MuscleSlug.TIBIALIS]: 'Tibialis',
};

export const EQUIPMENT_DISPLAY_NAMES: Record<EquipmentSlug, string> = {
  [EquipmentSlug.BARBELL]: 'Barbell',
  [EquipmentSlug.DUMBBELL]: 'Dumbbell',
  [EquipmentSlug.KETTLEBELL]: 'Kettlebell',
  [EquipmentSlug.INCLINE_BENCH]: 'Incline Bench',
  [EquipmentSlug.FLAT_BENCH]: 'Flat Bench',
  [EquipmentSlug.DECLINE_BENCH]: 'Decline Bench',
  [EquipmentSlug.SQUAT_RACK]: 'Squat Rack',
  [EquipmentSlug.PULL_UP_BAR]: 'Pull-up Bar',
  [EquipmentSlug.CABLE_ROPE]: 'Cable Rope',
  [EquipmentSlug.CABLE_HANDLE]: 'Cable Handle',
  [EquipmentSlug.CABLE_STRAIGHT_BAR]: 'Cable Straight Bar',
  [EquipmentSlug.CABLE_V_BAR]: 'Cable V-Bar',
  [EquipmentSlug.CABLE_LAT_BAR]: 'Cable Lat Bar',
  [EquipmentSlug.LEG_PRESS_MACHINE]: 'Leg Press Machine',
  [EquipmentSlug.CHEST_FLY_MACHINE]: 'Chest Fly Machine',
  [EquipmentSlug.CHEST_PRESS_MACHINE]: 'Chest Press Machine',
  [EquipmentSlug.LAT_PULLDOWN_MACHINE]: 'Lat Pulldown Machine',
  [EquipmentSlug.SEATED_ROW_MACHINE]: 'Seated Row Machine',
  [EquipmentSlug.LEG_EXTENSION_MACHINE]: 'Leg Extension Machine',
  [EquipmentSlug.LEG_CURL_MACHINE]: 'Leg Curl Machine',
  [EquipmentSlug.HIP_ADDUCTION_MACHINE]: 'Hip Adduction Machine',
  [EquipmentSlug.CALF_RAISE_MACHINE]: 'Calf Raise Machine',
  [EquipmentSlug.TRICEP_EXTENSION_MACHINE]: 'Tricep Extension Machine',
  [EquipmentSlug.DIP_MACHINE]: 'Dip Machine',
  [EquipmentSlug.ABDOMINAL_MACHINE]: 'Abdominal Machine',
  [EquipmentSlug.BACK_EXTENSION_STATION]: 'Back Extension Station',
  [EquipmentSlug.CAPTAINS_CHAIR]: "Captain's Chair",
  [EquipmentSlug.RESISTANCE_BAND]: 'Resistance Band',
  [EquipmentSlug.TIBIA_RAISE_MACHINE]: 'Tibia Raise Machine',
  [EquipmentSlug.SHOULDER_PRESS_MACHINE]: 'Shoulder Press Machine',
  [EquipmentSlug.SHRUG_MACHINE]: 'Shrug Machine',
  [EquipmentSlug.HACK_SQUAT_MACHINE]: 'Hack Squat Machine',
  [EquipmentSlug.SEATED_CALF_RAISE_MACHINE]: 'Seated Calf Raise Machine',
  [EquipmentSlug.LYING_LEG_CURL_MACHINE]: 'Lying Leg Curl Machine',
  [EquipmentSlug.PEC_DECK_MACHINE]: 'Pec Deck Machine',
  [EquipmentSlug.FLOOR_SPACE]: 'Floor Space',
};

// ──────────────────────────────────────────────────────────────────────
// Exercise data shape
// ──────────────────────────────────────────────────────────────────────

/**
 * Client-side exercise definition. Mirrors the exercises DB row plus its
 * junctions, keyed by slug (matches splits.ts ExerciseKey). The default
 * sets/reps are suggestions surfaced in the active-session UI when the
 * user adds the exercise to a draft.
 */
export interface SystemExerciseData {
  slug: string;
  name: string;
  /** Display category for the browse UI (Chest / Arms / etc.). */
  category: string;
  /** Sub-label, e.g. 'Incline' or 'Cable'. */
  variation?: string;
  exerciseType: ExerciseType;
  difficultyLevel: DifficultyLevel;
  description: string;
  instructions: string;
  tips: string;
  /** Muscle slugs + primary/secondary flag. */
  primaryMuscles: MuscleSlug[];
  secondaryMuscles: MuscleSlug[];
  /** Equipment slugs + required/optional flag (default required). */
  equipment: Array<EquipmentSlug | { slug: EquipmentSlug; isRequired: boolean }>;
  /** Suggested sets (planning hint only). */
  defaultSets: number;
  /** Suggested rep range as [min, max]. */
  defaultReps: [number, number];
}

// ──────────────────────────────────────────────────────────────────────
// The 43 system exercises
// ──────────────────────────────────────────────────────────────────────

export const SYSTEM_EXERCISES: SystemExerciseData[] = [
  // ── Chest ──────────────────────────────────────────────────────────
  {
    slug: 'barbell-press-incline',
    name: 'Barbell Press',
    variation: 'Incline',
    category: 'Chest',
    exerciseType: 'free_weight',
    difficultyLevel: 'advanced',
    description:
      'Lie on an incline bench and press the barbell upward, focusing on upper chest activation.',
    instructions:
      'Set the incline to 30–45°. Grip slightly wider than shoulder-width. Lower the bar to the upper chest, then press up to full extension.',
    tips: 'Keep your lower back slightly arched; lower the bar to the upper part of your chest; ensure your elbows don\u2019t flare too much.',
    primaryMuscles: [MuscleSlug.UPPER_CHEST, MuscleSlug.FRONT_DELTS],
    secondaryMuscles: [MuscleSlug.TRICEPS, MuscleSlug.CHEST],
    equipment: [EquipmentSlug.BARBELL, EquipmentSlug.INCLINE_BENCH],
    defaultSets: 3,
    defaultReps: [6, 8],
  },
  {
    slug: 'dumbbell-fly-incline',
    name: 'Dumbbell Fly',
    variation: 'Incline',
    category: 'Chest',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Perform a fly movement with arms slightly bent while lying on an incline bench.',
    instructions:
      'With a slight elbow bend, lower the dumbbells in a wide arc until you feel a chest stretch, then squeeze back up.',
    tips: 'Keep a slight bend in your elbows throughout; focus on the stretch in your chest at the bottom; imagine you\u2019re hugging a barrel on the way up.',
    primaryMuscles: [MuscleSlug.UPPER_CHEST, MuscleSlug.CHEST],
    secondaryMuscles: [MuscleSlug.FRONT_DELTS],
    equipment: [EquipmentSlug.DUMBBELL, EquipmentSlug.INCLINE_BENCH],
    defaultSets: 2,
    defaultReps: [12, 15],
  },
  {
    slug: 'chest-fly-machine',
    name: 'Chest Fly',
    variation: 'Machine',
    category: 'Chest',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description:
      'Use the chest fly machine to perform a controlled fly movement that isolates the chest muscles.',
    instructions:
      'Adjust the seat so handles align with chest height. Bring the pads together in a wide arc and squeeze, then return under control.',
    tips: 'Adjust the seat height so handles align with chest; focus on squeezing your chest at the peak of contraction; control the eccentric (opening) phase.',
    primaryMuscles: [MuscleSlug.CHEST],
    secondaryMuscles: [MuscleSlug.FRONT_DELTS],
    equipment: [EquipmentSlug.CHEST_FLY_MACHINE],
    defaultSets: 2,
    defaultReps: [12, 15],
  },
  {
    slug: 'incline-machine-press',
    name: 'Machine Press',
    variation: 'Incline',
    category: 'Chest',
    exerciseType: 'machine',
    difficultyLevel: 'intermediate',
    description:
      'Incline chest press machine targeting the upper chest with a controlled path.',
    instructions:
      'Set the seat to incline. Press the handles up to full extension, then lower under control.',
    tips: 'Keep the shoulder blades retracted; control the negative; full range of motion at the bottom.',
    primaryMuscles: [MuscleSlug.UPPER_CHEST, MuscleSlug.FRONT_DELTS],
    secondaryMuscles: [MuscleSlug.TRICEPS],
    equipment: [EquipmentSlug.CHEST_PRESS_MACHINE],
    defaultSets: 3,
    defaultReps: [8, 10],
  },

  // ── Arms ───────────────────────────────────────────────────────────
  {
    slug: 'overhead-tricep-extension-cable',
    name: 'Tricep Extension',
    variation: 'Cable Overhead',
    category: 'Arms',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Using a rope attachment on a cable machine, extend your arms overhead to work the triceps.',
    instructions:
      'Attach a rope to a low pulley. Facing away, press the rope overhead to full tricep extension.',
    tips: 'Keep your upper arms stationary and close to your head; fully extend your elbows at the end of the movement; control the weight on the way back.',
    primaryMuscles: [MuscleSlug.TRICEPS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.CABLE_ROPE],
    defaultSets: 3,
    defaultReps: [10, 12],
  },
  {
    slug: 'tricep-dip-machine',
    name: 'Tricep Dip',
    variation: 'Machine',
    category: 'Arms',
    exerciseType: 'machine',
    difficultyLevel: 'intermediate',
    description:
      'Using a machine, perform dips to primarily target the triceps muscles.',
    instructions:
      'Sit upright on the assisted dip machine. Press the handles down to full arm extension.',
    tips: 'Keep your elbows tucked in to target triceps; control the descent without bouncing at the bottom; don\u2019t lock out the elbows at the top.',
    primaryMuscles: [MuscleSlug.TRICEPS],
    secondaryMuscles: [MuscleSlug.CHEST, MuscleSlug.FRONT_DELTS],
    equipment: [EquipmentSlug.TRICEP_EXTENSION_MACHINE],
    defaultSets: 2,
    defaultReps: [8, 10],
  },
  {
    slug: 'dumbbell-curl-seated-incline',
    name: 'Dumbbell Curl',
    variation: 'Seated Incline',
    category: 'Arms',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Seated incline dumbbell curl with arms hanging behind the torso for a deep bicep stretch.',
    instructions:
      'Set incline to 30–45°. With dumbbells at arm\u2019s length behind you, curl up without swinging.',
    tips: 'Let the arms hang fully at the bottom; squeeze at the top; avoid leaning forward to lift heavier.',
    primaryMuscles: [MuscleSlug.BICEPS],
    secondaryMuscles: [MuscleSlug.FOREARMS],
    equipment: [EquipmentSlug.DUMBBELL, EquipmentSlug.INCLINE_BENCH],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'cable-rope-curl',
    name: 'Cable Curl',
    variation: 'Rope Grip',
    category: 'Arms',
    exerciseType: 'cable',
    difficultyLevel: 'beginner',
    description:
      'Cable curl with a rope attachment for continuous tension on the biceps.',
    instructions:
      'Attach a rope to a low pulley. Curl the rope toward your shoulders, squeezing at the top.',
    tips: 'Keep the elbows pinned to your sides; control the negative; avoid swinging.',
    primaryMuscles: [MuscleSlug.BICEPS],
    secondaryMuscles: [MuscleSlug.FOREARMS],
    equipment: [EquipmentSlug.CABLE_ROPE],
    defaultSets: 3,
    defaultReps: [10, 12],
  },

  // ── Shoulders ──────────────────────────────────────────────────────
  {
    slug: 'egyptian-cable-lateral-raise',
    name: 'Lateral Raise',
    variation: 'Egyptian Cable',
    category: 'Shoulders',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Cable lateral raise leaning away from the stack (Egyptian style) for constant tension on the side delt.',
    instructions:
      'Set a low pulley. Stand side-on, lean away from the stack, and raise the handle out to shoulder height.',
    tips: 'Lead with the elbow; keep a slight bend; maintain the lean throughout for continuous tension.',
    primaryMuscles: [MuscleSlug.SIDE_DELTS],
    secondaryMuscles: [MuscleSlug.FRONT_DELTS, MuscleSlug.TRAPS],
    equipment: [EquipmentSlug.CABLE_HANDLE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'face-pull-cable-rope-grip',
    name: 'Face Pull',
    variation: 'Cable Rope Grip',
    category: 'Shoulders',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Cable face pull with a rope attachment for rear delts and rotator cuff health.',
    instructions:
      'Set the pulley to face height. Pull the rope toward your face, splitting the ends outward.',
    tips: 'Keep the upper arms parallel to the floor; externally rotate at the top; use a moderate weight.',
    primaryMuscles: [MuscleSlug.REAR_DELTS],
    secondaryMuscles: [MuscleSlug.TRAPS, MuscleSlug.RHOMBOIDS],
    equipment: [EquipmentSlug.CABLE_ROPE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'shoulder-press-machine-or-dumbbell',
    name: 'Shoulder Press',
    variation: 'Machine or Dumbbell',
    category: 'Shoulders',
    exerciseType: 'machine',
    difficultyLevel: 'intermediate',
    description:
      'Overhead shoulder press using either a machine or dumbbells, targeting the front and side delts.',
    instructions:
      'Sit upright (machine) or sit/stand with dumbbells at shoulder height. Press upward to full overhead extension, then lower under control.',
    tips: 'Don\u2019t lock out the elbows at the top; keep the core braced; avoid excessive lower-back arch.',
    primaryMuscles: [MuscleSlug.FRONT_DELTS, MuscleSlug.SIDE_DELTS],
    secondaryMuscles: [MuscleSlug.TRICEPS],
    equipment: [
      { slug: EquipmentSlug.SHOULDER_PRESS_MACHINE, isRequired: false },
      { slug: EquipmentSlug.DUMBBELL, isRequired: false },
    ],
    defaultSets: 2,
    defaultReps: [8, 10],
  },
  {
    slug: 'dumbbell-overhead-press',
    name: 'Overhead Press',
    variation: 'Dumbbell',
    category: 'Shoulders',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Standing or seated dumbbell overhead press for the front and side delts.',
    instructions:
      'Hold dumbbells at shoulder height. Press overhead to full extension, then lower under control.',
    tips: 'Brace the core; avoid excessive back arch; don\u2019t lock out the elbows at the top.',
    primaryMuscles: [MuscleSlug.FRONT_DELTS, MuscleSlug.SIDE_DELTS],
    secondaryMuscles: [MuscleSlug.TRICEPS],
    equipment: [EquipmentSlug.DUMBBELL],
    defaultSets: 2,
    defaultReps: [8, 10],
  },

  // ── Back ───────────────────────────────────────────────────────────
  {
    slug: 'lower-back-extension-calisthenic',
    name: 'Back Extension',
    variation: 'Calisthenic',
    category: 'Back',
    exerciseType: 'calisthenic',
    difficultyLevel: 'beginner',
    description:
      'Bodyweight back extension on a Roman chair to target the lower back.',
    instructions:
      'Mount the back-extension station. Hinge at the hips, lower the torso, then raise back to neutral.',
    tips: 'Avoid hyperextension; move with control, not momentum; engage the glutes mildly at the top.',
    primaryMuscles: [MuscleSlug.LOWER_BACK],
    secondaryMuscles: [MuscleSlug.GLUTES, MuscleSlug.HAMSTRINGS],
    equipment: [EquipmentSlug.BACK_EXTENSION_STATION],
    defaultSets: 2,
    defaultReps: [10, 12],
  },
  {
    slug: 'seated-cable-row-v-grip',
    name: 'Seated Cable Row',
    variation: 'V Grip',
    category: 'Back',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Seated cable row with a V-grip attachment targeting the lats and upper back.',
    instructions:
      'Sit upright at the cable row station. Pull the V-grip to your lower chest, squeezing the shoulder blades.',
    tips: 'Keep the torso upright; lead with the elbows; full stretch at the bottom without rounding the spine.',
    primaryMuscles: [MuscleSlug.LATS, MuscleSlug.UPPER_BACK],
    secondaryMuscles: [MuscleSlug.BICEPS, MuscleSlug.RHOMBOIDS],
    equipment: [EquipmentSlug.CABLE_V_BAR],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'lat-pulldown-reverse-grip',
    name: 'Lat Pulldown',
    variation: 'Reverse Grip',
    category: 'Back',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Lat pulldown with a shoulder-width reverse (underhand) grip to bias the lats and biceps.',
    instructions:
      'Grip the bar shoulder-width with palms facing you. Pull to the upper chest, then control back up.',
    tips: 'Lead with the elbows; avoid leaning back excessively; full overhead stretch at the top.',
    primaryMuscles: [MuscleSlug.LATS],
    secondaryMuscles: [MuscleSlug.BICEPS, MuscleSlug.UPPER_BACK],
    equipment: [EquipmentSlug.CABLE_LAT_BAR],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'straight-arm-cable-pulldown',
    name: 'Straight-Arm Pulldown',
    variation: 'Cable',
    category: 'Back',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Cable pulldown with straight arms to isolate the lats without biceps involvement.',
    instructions:
      'Attach a rope to a high pulley. With arms straight, press the rope down toward your thighs.',
    tips: 'Keep arms straight throughout; lead with the lats, not the triceps; avoid leaning forward.',
    primaryMuscles: [MuscleSlug.LATS],
    secondaryMuscles: [MuscleSlug.CHEST],
    equipment: [EquipmentSlug.CABLE_ROPE],
    defaultSets: 3,
    defaultReps: [12, 15],
  },
  {
    slug: 'machine-shrug-plate-loaded',
    name: 'Machine Shrug',
    variation: 'Plate-Loaded',
    category: 'Back',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description:
      'Plate-loaded shrug machine for targeted trap development with minimal lower-back involvement.',
    instructions:
      'Sit or stand in the shrug machine. Shrug the shoulders straight up toward the ears, then lower under control.',
    tips: 'Don\u2019t roll the shoulders; pause at peak contraction; avoid jerking the weight up.',
    primaryMuscles: [MuscleSlug.TRAPS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.SHRUG_MACHINE],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'dumbbell-shrug',
    name: 'Dumbbell Shrug',
    variation: 'Standing',
    category: 'Back',
    exerciseType: 'free_weight',
    difficultyLevel: 'beginner',
    description: 'Standing dumbbell shrug for targeted trap development.',
    instructions:
      'Hold dumbbells at your sides. Shrug the shoulders straight up toward the ears, then lower under control.',
    tips: 'Don\u2019t roll the shoulders; pause at peak contraction; avoid jerking the weight up.',
    primaryMuscles: [MuscleSlug.TRAPS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.DUMBBELL],
    defaultSets: 3,
    defaultReps: [8, 10],
  },

  // ── Upper leg ──────────────────────────────────────────────────────
  {
    slug: 'leg-press-machine',
    name: 'Leg Press',
    variation: 'Machine',
    category: 'UpperLeg',
    exerciseType: 'machine',
    difficultyLevel: 'advanced',
    description: 'Push weight away from your body using your legs on a leg press machine.',
    instructions:
      'Sit in the leg press with feet shoulder-width on the platform. Lower to ~90°, then press back up.',
    tips: 'Don\u2019t lock out your knees at the top; place feet shoulder-width apart for balanced development; lower until your knees reach about 90 degrees.',
    primaryMuscles: [MuscleSlug.QUADS, MuscleSlug.GLUTES],
    secondaryMuscles: [MuscleSlug.HAMSTRINGS, MuscleSlug.CALVES],
    equipment: [EquipmentSlug.LEG_PRESS_MACHINE],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'bulgarian-split-squat-dumbbell',
    name: 'Bulgarian Split Squat',
    variation: 'Dumbbell',
    category: 'UpperLeg',
    exerciseType: 'free_weight',
    difficultyLevel: 'advanced',
    description:
      'Dumbbell split squat with the rear foot elevated on a bench, targeting the quads and glutes.',
    instructions:
      'Hold dumbbells. Place rear foot on a bench behind you. Lower the front thigh to parallel, then drive up.',
    tips: 'Track the front knee over the toe; keep the torso upright; control the descent.',
    primaryMuscles: [MuscleSlug.QUADS, MuscleSlug.GLUTES],
    secondaryMuscles: [MuscleSlug.HAMSTRINGS],
    equipment: [EquipmentSlug.DUMBBELL, EquipmentSlug.FLAT_BENCH],
    defaultSets: 2,
    defaultReps: [8, 10],
  },
  {
    slug: 'machine-leg-curl-seated',
    name: 'Machine Leg Curl',
    variation: 'Seated',
    category: 'UpperLeg',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description: 'Seated leg curl machine targeting the hamstrings.',
    instructions:
      'Sit on the leg curl. Hook the lower pad above the heels. Curl backward by bending the knees.',
    tips: 'Squeeze the hamstrings at peak contraction; avoid jerking; control the negative.',
    primaryMuscles: [MuscleSlug.HAMSTRINGS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.LEG_CURL_MACHINE],
    defaultSets: 3,
    defaultReps: [8, 10],
  },

  // ── Lower leg ──────────────────────────────────────────────────────
  {
    slug: 'tibia-raise-machine-or-band',
    name: 'Tibia Raise',
    variation: 'Machine or Band',
    category: 'LowerLeg',
    exerciseType: 'calisthenic',
    difficultyLevel: 'beginner',
    description: 'Raise your foot upward against resistance to target the tibialis anterior.',
    instructions:
      'Anchor a band or use a tib-raise machine. Dorsiflex the foot against resistance.',
    tips: 'Focus on the pulling motion from your foot, not your leg; control both phases; can be performed seated or standing.',
    primaryMuscles: [MuscleSlug.TIBIALIS],
    secondaryMuscles: [],
    equipment: [
      { slug: EquipmentSlug.TIBIA_RAISE_MACHINE, isRequired: false },
      { slug: EquipmentSlug.RESISTANCE_BAND, isRequired: false },
    ],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'calf-raise-leg-press-machine',
    name: 'Calf Raise',
    variation: 'Leg Press Machine',
    category: 'LowerLeg',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description: 'Calf raise performed on the leg press platform.',
    instructions:
      'Sit in the leg press. Place the balls of the feet on the lower edge of the platform. Press away via ankle plantarflexion.',
    tips: 'Full range of motion at the ankle; pause at peak contraction; avoid bouncing.',
    primaryMuscles: [MuscleSlug.CALVES],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.LEG_PRESS_MACHINE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'machine-calf-raise-standing',
    name: 'Machine Calf Raise',
    variation: 'Standing',
    category: 'LowerLeg',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description: 'Standing calf raise machine targeting the gastrocnemius.',
    instructions:
      'Stand in the calf raise machine. Lower the heels fully, then press up to the toes.',
    tips: 'Full stretch at the bottom; pause at peak; avoid bouncing.',
    primaryMuscles: [MuscleSlug.CALVES],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.CALF_RAISE_MACHINE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },

  // ── Abs ────────────────────────────────────────────────────────────
  {
    slug: 'leg-raise-captains-chair',
    name: 'Leg Raise',
    variation: 'Captain\u2019s Chair',
    category: 'Abs',
    exerciseType: 'calisthenic',
    difficultyLevel: 'advanced',
    description: "Support yourself on a captain's chair and raise your legs upward to target the lower abdominals.",
    instructions:
      'Support the forearms on the captain\u2019s chair pads. Raise the legs to hip height, then lower under control.',
    tips: 'Avoid swinging or using momentum; try to curl your pelvis upward at the top; control the descent rather than dropping your legs.',
    primaryMuscles: [MuscleSlug.LOWER_ABS, MuscleSlug.ABS],
    secondaryMuscles: [MuscleSlug.OBLIQUES, MuscleSlug.QUADS],
    equipment: [EquipmentSlug.CAPTAINS_CHAIR],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'machine-ab-crunch-eccentric-emphasized',
    name: 'Machine Ab Crunch',
    variation: 'Eccentric-Emphasized',
    category: 'Abs',
    exerciseType: 'machine',
    difficultyLevel: 'intermediate',
    description: 'Ab crunch machine with a slow eccentric phase to bias the rectus abdominis.',
    instructions:
      'Sit in the ab crunch machine. Crunch forward with a 3-second negative.',
    tips: 'Squeeze at peak contraction; control the negative for 3 seconds; avoid using the hip flexors.',
    primaryMuscles: [MuscleSlug.ABS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.ABDOMINAL_MACHINE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },

  // ── Substitution pool ──────────────────────────────────────────────
  // Added by migration 20260721000002. These 17 exercises are referenced
  // by the exercise_alternatives graph and by program-template slots in
  // the seed; they are NOT placed on a oneADay/twoADay split day. The
  // defaultSets/defaultReps here mirror the slot prescriptions seeded in
  // 20260721000002 Step 14 where the exercise appears in the
  // two-a-day template, and fall back to conventional defaults elsewhere.
  {
    slug: 'hack-squat-machine',
    name: 'Hack Squat',
    variation: 'Machine',
    category: 'UpperLeg',
    exerciseType: 'machine',
    difficultyLevel: 'intermediate',
    description:
      'Machine hack squat targeting the quads through a controlled vertical-path squat with the shoulders stabilized.',
    instructions:
      'Place shoulders under the pads, feet shoulder-width on the platform. Lower until thighs reach ~90°, then press through the heels.',
    tips: 'Keep the lower back flat against the pad; don\u2019t lock the knees at the top; control the negative.',
    primaryMuscles: [MuscleSlug.QUADS, MuscleSlug.GLUTES],
    secondaryMuscles: [MuscleSlug.HAMSTRINGS, MuscleSlug.CALVES],
    equipment: [EquipmentSlug.HACK_SQUAT_MACHINE],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'seated-calf-raise-machine',
    name: 'Seated Calf Raise',
    variation: 'Machine',
    category: 'LowerLeg',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description:
      'Seated calf raise machine biases the soleus and biases gastrocnemius less than the standing variant due to the bent-knee position.',
    instructions:
      'Sit with the balls of the feet on the platform and the pad across the thighs. Lower the heels, then press up to full plantar-flexion.',
    tips: 'Pause at the top; control the negative; full range of motion at the bottom.',
    primaryMuscles: [MuscleSlug.CALVES],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.SEATED_CALF_RAISE_MACHINE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'romanian-deadlift-barbell',
    name: 'Romanian Deadlift',
    variation: 'Barbell',
    category: 'UpperLeg',
    exerciseType: 'free_weight',
    difficultyLevel: 'advanced',
    description:
      'Barbell Romanian deadlift — a hip-hinge with mostly-straight knees targeting the hamstrings and lower back.',
    instructions:
      'Grip the bar shoulder-width. Hinge at the hips with soft knees, lowering the bar along the thighs until you feel a hamstring stretch.',
    tips: 'Keep the bar close to the legs; maintain a neutral spine; don\u2019t turn it into a squat by bending the knees too much.',
    primaryMuscles: [MuscleSlug.HAMSTRINGS, MuscleSlug.LOWER_BACK],
    secondaryMuscles: [MuscleSlug.GLUTES, MuscleSlug.TRAPS],
    equipment: [EquipmentSlug.BARBELL],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'floor-leg-raise',
    name: 'Floor Leg Raise',
    variation: 'Lying',
    category: 'Abs',
    exerciseType: 'calisthenic',
    difficultyLevel: 'beginner',
    description:
      'Bodyweight leg raise performed lying on the floor, targeting the lower abs through hip flexion.',
    instructions:
      'Lie flat on the floor, legs straight. Raise both legs to vertical, then lower under control without touching the floor.',
    tips: 'Keep the lower back pressed to the floor; avoid swinging; bend the knees to reduce difficulty.',
    primaryMuscles: [MuscleSlug.LOWER_ABS, MuscleSlug.ABS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.FLOOR_SPACE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    variation: 'Incline',
    category: 'Chest',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Incline dumbbell press for the upper chest, allowing a deeper stretch and independent arm path than the barbell variant.',
    instructions:
      'Set the incline to 30–45°. Press the dumbbells from shoulder-level overhead in a controlled arc.',
    tips: 'Keep a 45° elbow angle from the torso; control the negative; full range of motion at the bottom.',
    primaryMuscles: [MuscleSlug.UPPER_CHEST, MuscleSlug.FRONT_DELTS],
    secondaryMuscles: [MuscleSlug.TRICEPS, MuscleSlug.CHEST],
    equipment: [EquipmentSlug.DUMBBELL, EquipmentSlug.INCLINE_BENCH],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'overhead-dumbbell-tricep-extension',
    name: 'Overhead Tricep Extension',
    variation: 'Dumbbell',
    category: 'Arms',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Overhead dumbbell triceps extension, typically performed one arm at a time with a single dumbbell.',
    instructions:
      'Hold a single dumbbell overhead with both hands (or one). Lower behind the head, then press back to full extension.',
    tips: 'Keep the upper arms stationary; don\u2019t flare the elbows; control the negative.',
    primaryMuscles: [MuscleSlug.TRICEPS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.DUMBBELL],
    defaultSets: 3,
    defaultReps: [10, 12],
  },
  {
    slug: 'barbell-overhead-press',
    name: 'Overhead Press',
    variation: 'Barbell',
    category: 'Shoulders',
    exerciseType: 'free_weight',
    difficultyLevel: 'advanced',
    description:
      'Standing barbell overhead press for the front and side delts, with substantial core and upper-back stability demand.',
    instructions:
      'Grip the bar shoulder-width. Press from the front-rack position overhead to full extension, then lower under control.',
    tips: 'Brace the core; avoid excessive lower-back arch; don\u2019t bounce at the bottom.',
    primaryMuscles: [MuscleSlug.FRONT_DELTS, MuscleSlug.SIDE_DELTS],
    secondaryMuscles: [MuscleSlug.TRICEPS],
    equipment: [EquipmentSlug.BARBELL],
    defaultSets: 3,
    defaultReps: [6, 8],
  },
  {
    slug: 'dumbbell-lateral-raise',
    name: 'Lateral Raise',
    variation: 'Dumbbell',
    category: 'Shoulders',
    exerciseType: 'free_weight',
    difficultyLevel: 'beginner',
    description:
      'Standing dumbbell lateral raise to target the side deltoids through shoulder abduction.',
    instructions:
      'Hold dumbbells at your sides. Raise out to shoulder height with a slight elbow bend, then lower under control.',
    tips: 'Lead with the elbows; avoid shrugging; don\u2019t swing.',
    primaryMuscles: [MuscleSlug.SIDE_DELTS],
    secondaryMuscles: [MuscleSlug.FRONT_DELTS],
    equipment: [EquipmentSlug.DUMBBELL],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'lying-leg-curl-machine',
    name: 'Lying Leg Curl',
    variation: 'Machine',
    category: 'UpperLeg',
    exerciseType: 'machine',
    difficultyLevel: 'intermediate',
    description:
      'Lying leg curl machine targeting the hamstrings through knee flexion, performed prone.',
    instructions:
      'Lie prone on the machine with the pad against the lower calves. Curl the pad toward the hips, then lower under control.',
    tips: 'Keep the hips pressed to the pad; don\u2019t hyperextend the lower back; pause at peak contraction.',
    primaryMuscles: [MuscleSlug.HAMSTRINGS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.LYING_LEG_CURL_MACHINE],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'pull-up-bar',
    name: 'Pull-up',
    variation: 'Bar',
    category: 'Back',
    exerciseType: 'calisthenic',
    difficultyLevel: 'advanced',
    description:
      'Bodyweight pull-up on a bar for vertical-pull strength, primarily targeting the lats and biceps.',
    instructions:
      'Hang from the bar with overhand grip. Pull until the chin clears the bar, then lower under control.',
    tips: 'Lead with the chest; full hang at the bottom; avoid kipping.',
    primaryMuscles: [MuscleSlug.LATS, MuscleSlug.BICEPS],
    secondaryMuscles: [MuscleSlug.UPPER_BACK],
    equipment: [EquipmentSlug.PULL_UP_BAR],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'cable-rope-crunch',
    name: 'Cable Crunch',
    variation: 'Rope',
    category: 'Abs',
    exerciseType: 'cable',
    difficultyLevel: 'intermediate',
    description:
      'Cable crunch with a rope attachment on a high pulley, loading spinal flexion for the abs.',
    instructions:
      'Kneel below a high pulley with the rope behind the head. Crunch down by flexing the spine, then return under control.',
    tips: 'Curl the spine; don\u2019t hinge at the hips; pause at peak contraction.',
    primaryMuscles: [MuscleSlug.ABS],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.CABLE_ROPE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'dumbbell-curl-standing',
    name: 'Dumbbell Curl',
    variation: 'Standing',
    category: 'Arms',
    exerciseType: 'free_weight',
    difficultyLevel: 'beginner',
    description: 'Standing dumbbell curl for the biceps, optionally with supination.',
    instructions:
      'Stand with dumbbells at your sides. Curl up toward the shoulders, then lower under control.',
    tips: 'Pin the elbows to your sides; avoid swinging; full extension at the bottom.',
    primaryMuscles: [MuscleSlug.BICEPS],
    secondaryMuscles: [MuscleSlug.FOREARMS],
    equipment: [EquipmentSlug.DUMBBELL],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
  {
    slug: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    variation: 'Machine',
    category: 'Shoulders',
    exerciseType: 'machine',
    difficultyLevel: 'beginner',
    description:
      'Reverse pec deck machine for the rear delts through transverse shoulder abduction.',
    instructions:
      'Sit facing the pad. Grip the handles and pull the arms backward in a wide arc, squeezing the rear delts.',
    tips: 'Keep a slight elbow bend; lead with the elbows; pause at peak contraction.',
    primaryMuscles: [MuscleSlug.REAR_DELTS],
    secondaryMuscles: [MuscleSlug.UPPER_BACK, MuscleSlug.RHOMBOIDS],
    equipment: [EquipmentSlug.PEC_DECK_MACHINE],
    defaultSets: 3,
    defaultReps: [15, 20],
  },
  {
    slug: 'walking-lunge-dumbbell',
    name: 'Walking Lunge',
    variation: 'Dumbbell',
    category: 'UpperLeg',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Dumbbell walking lunge for unilateral quad and glute development with dynamic balance demand.',
    instructions:
      'Hold dumbbells at your sides. Step forward, lower until the back knee nearly touches the floor, then push through to step into the next rep.',
    tips: 'Keep the torso upright; don\u2019t let the front knee cave inward; full hip extension between steps.',
    primaryMuscles: [MuscleSlug.QUADS, MuscleSlug.GLUTES],
    secondaryMuscles: [MuscleSlug.HAMSTRINGS, MuscleSlug.CALVES],
    equipment: [EquipmentSlug.DUMBBELL],
    defaultSets: 2,
    defaultReps: [8, 10],
  },
  {
    slug: 'dumbbell-pullover',
    name: 'Dumbbell Pullover',
    variation: 'Flat Bench',
    category: 'Back',
    exerciseType: 'free_weight',
    difficultyLevel: 'intermediate',
    description:
      'Dumbbell pullover across a flat bench, targeting the lats through shoulder extension with some chest involvement.',
    instructions:
      'Lie upper-back across a flat bench. Lower a single dumbbell overhead behind you, then pull back over the chest.',
    tips: 'Keep a slight elbow bend; focus on the lat stretch; avoid letting the hips sag.',
    primaryMuscles: [MuscleSlug.LATS, MuscleSlug.UPPER_CHEST],
    secondaryMuscles: [],
    equipment: [EquipmentSlug.DUMBBELL, EquipmentSlug.FLAT_BENCH],
    defaultSets: 3,
    defaultReps: [12, 15],
  },
  {
    slug: 'bench-dip',
    name: 'Bench Dip',
    variation: 'Bodyweight',
    category: 'Arms',
    exerciseType: 'calisthenic',
    difficultyLevel: 'beginner',
    description:
      'Bodyweight triceps dip off a flat bench, with the feet on the floor or elevated.',
    instructions:
      'Sit on the edge of a bench, hands beside the hips. Slide off and lower by bending the elbows, then press back up.',
    tips: 'Keep the elbows pointing back, not out; control the descent; don\u2019t shrug the shoulders.',
    primaryMuscles: [MuscleSlug.TRICEPS],
    secondaryMuscles: [MuscleSlug.FRONT_DELTS],
    equipment: [EquipmentSlug.FLAT_BENCH],
    defaultSets: 3,
    defaultReps: [12, 15],
  },
  {
    slug: 'barbell-row',
    name: 'Barbell Row',
    variation: 'Bent-Over',
    category: 'Back',
    exerciseType: 'free_weight',
    difficultyLevel: 'advanced',
    description:
      'Hinge-supported barbell row for the lats and upper back, loaded through the posterior chain.',
    instructions:
      'Hinge at the hips with a flat back. Pull the bar to the lower chest, squeezing the shoulder blades, then lower under control.',
    tips: 'Keep the back flat; lead with the elbows; avoid using the lower back to row the weight.',
    primaryMuscles: [MuscleSlug.LATS, MuscleSlug.UPPER_BACK],
    secondaryMuscles: [MuscleSlug.BICEPS, MuscleSlug.REAR_DELTS],
    equipment: [EquipmentSlug.BARBELL],
    defaultSets: 3,
    defaultReps: [8, 10],
  },
];

// ──────────────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────────────

/** Indexes the system exercises by slug for O(1) lookup. */
export const SYSTEM_EXERCISES_BY_SLUG: Record<string, SystemExerciseData> =
  Object.fromEntries(SYSTEM_EXERCISES.map((e) => [e.slug, e]));

/** Returns the system exercise data for a given slug, or undefined. */
export function getSystemExercise(slug: string): SystemExerciseData | undefined {
  return SYSTEM_EXERCISES_BY_SLUG[slug];
}

// ──────────────────────────────────────────────────────────────────────
// Attribute formatting (slugs → display strings)
// ──────────────────────────────────────────────────────────────────────

/**
 * Normalizes the equipment field (which can be a slug or an isRequired
 * object) to just the slug.
 */
function equipmentSlugOf(
  entry: EquipmentSlug | { slug: EquipmentSlug; isRequired: boolean },
): EquipmentSlug {
  return typeof entry === 'string' ? entry : entry.slug;
}

export interface ExerciseAttributeLabels {
  /** Comma-joined equipment display names, e.g. "Barbell, Incline Bench". */
  equipmentLabel: string;
  /** Comma-joined primary muscle display names, e.g. "Upper Chest, Front Delts". */
  primaryMuscleLabel: string;
  /** Comma-joined secondary muscle display names (empty string if none). */
  secondaryMuscleLabel: string;
}

/**
 * Resolves a SystemExerciseData's muscle/equipment slugs into
 * human-readable display strings for chip-style attribute rendering.
 * Used by the split preview + active-session surfaces where we want to
 * show attribute context inline without a DB join round-trip.
 */
export function formatExerciseAttributes(
  exercise: SystemExerciseData,
): ExerciseAttributeLabels {
  const equipmentLabel = exercise.equipment
    .map(equipmentSlugOf)
    .map((s) => EQUIPMENT_DISPLAY_NAMES[s] ?? s)
    .join(', ');
  const primaryMuscleLabel = exercise.primaryMuscles
    .map((s) => MUSCLE_DISPLAY_NAMES[s] ?? s)
    .join(', ');
  const secondaryMuscleLabel = exercise.secondaryMuscles
    .map((s) => MUSCLE_DISPLAY_NAMES[s] ?? s)
    .join(', ');
  return { equipmentLabel, primaryMuscleLabel, secondaryMuscleLabel };
}

/** Formats a [min, max] rep range as "min-max" (or '—' if missing). */
export function formatRepRange(reps: [number, number] | null | undefined): string {
  if (!reps || reps.length !== 2) return '—';
  const [min, max] = reps;
  if (min === max) return String(min);
  return `${min}-${max}`;
}
