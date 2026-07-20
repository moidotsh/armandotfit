-- armandotfit: replace split exercise library
--
-- Context:
--   The split assignments in shared/exercises/splits.ts were rewritten to
--   match a new programming model (4 days × {oneADay, twoADay AM/PM}).
--   8 of the exercises in the new programming didn't exist in the library
--   yet, and 10 of the previous library exercises aren't referenced by
--   any day in the new programming. This migration lands the matching
--   DB-side delta so the slug vocabulary in the exercises table matches
--   the ExerciseKey union in splits.ts.
--
--   The TS-side changes landed in shared/exercises/splits.ts (day
--   assignments + ExerciseKey union) and shared/exercises/data.ts
--   (SYSTEM_EXERCISES array + 3 new equipment slugs + updated
--   defaultSets/defaultReps on existing exercises per the new spec).
--   Per CLAUDE.md invariant #9, the four places that must stay in sync
--   are: splits.ts ExerciseKey union + day assignments, data.ts
--   SYSTEM_EXERCISES array + display-name maps, and the DB seed. This
--   migration is the DB half of that contract.
--
-- Direction:
--   Adds 3 new equipment_types (shoulder-press-machine, chest-press-
--   machine, shrug-machine) and 8 new exercises + their exercise_muscles
--   and exercise_equipment junctions. Removes 10 exercises that are no
--   longer on any split day; their exercise_muscles, exercise_equipment,
--   user_favorite_exercises, and exercise_variations rows cascade on
--   DELETE.
--
-- Failure mode:
--   workout_session_exercises.exercise_id is ON DELETE RESTRICT. If any
--   historical workout_session_exercises row references one of the 10
--   removed exercises, the DELETE below fails with a foreign-key
--   violation. This is intentional — it surfaces the conflict instead
--   of silently destroying workout history. To unblock: either keep
--   the exercise in the library (don't delete), or manually delete the
--   referencing workout_session_exercises row (and its exercise_sets,
--   which cascade) before re-running.
--
-- Idempotency:
--   ON CONFLICT (slug) DO NOTHING on equipment_types and exercises
--   inserts. The DELETE is a no-op if the slugs are already gone.
--   Re-running against an already-migrated DB is safe.
--
-- Triangulation:
--   TS-side companion change in shared/exercises/{splits,data}.ts. Closes
--   the slug-vocabulary gap between the new programming and the DB.
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: add 3 new equipment types
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.equipment_types (slug, name, display_name, category) VALUES
  ('shoulder-press-machine', 'Shoulder Press Machine', 'Shoulder Press Machine', 'machine'),
  ('chest-press-machine',    'Chest Press Machine',    'Chest Press Machine',    'machine'),
  ('shrug-machine',          'Shrug Machine',          'Shrug Machine',          'machine')
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: delete the 10 exercises no longer on any split day
-- ──────────────────────────────────────────────────────────────────────
-- exercise_muscles, exercise_equipment, user_favorite_exercises, and
-- exercise_variations all have ON DELETE CASCADE — only
-- workout_session_exercises is RESTRICT. See "Failure mode" in the
-- migration header.

DELETE FROM public.exercises
WHERE slug IN (
  'dumbbell-press-incline',
  'tricep-kickback-cable',
  'reverse-plus-hammer-curl-superset',
  'lateral-raise-cable',
  'dumbbell-lateral-raise-standing',
  'reverse-flyes-cable',
  'dumbbell-pullover-bridge-position',
  'lever-row-chest-supported',
  'leg-extension-machine',
  'hip-adduction-machine'
);

-- ──────────────────────────────────────────────────────────────────────
-- Step 3: insert 8 new exercises
-- ──────────────────────────────────────────────────────────────────────
-- slug matches the ExerciseKey union in shared/exercises/splits.ts.
-- is_system_exercise = TRUE; created_by_user_id = NULL (per the
-- system_exercises_have_no_creator CHECK constraint).

INSERT INTO public.exercises
  (slug, name, description, exercise_type, difficulty_level, instructions, tips, is_system_exercise) VALUES
  -- Chest
  ('incline-machine-press', 'Machine Press',
   'Incline chest press machine targeting the upper chest with a controlled path.',
   'machine', 'intermediate',
   'Set the seat to incline. Press the handles up to full extension, then lower under control.',
   'Keep the shoulder blades retracted; control the negative; full range of motion at the bottom.',
   TRUE),
  -- Arms
  ('cable-rope-curl', 'Cable Curl',
   'Cable curl with a rope attachment for continuous tension on the biceps.',
   'cable', 'beginner',
   'Attach a rope to a low pulley. Curl the rope toward your shoulders, squeezing at the top.',
   'Keep the elbows pinned to your sides; control the negative; avoid swinging.',
   TRUE),
  -- Shoulders
  ('egyptian-cable-lateral-raise', 'Lateral Raise',
   'Cable lateral raise leaning away from the stack (Egyptian style) for constant tension on the side delt.',
   'cable', 'intermediate',
   'Set a low pulley. Stand side-on, lean away from the stack, and raise the handle out to shoulder height.',
   'Lead with the elbow; keep a slight bend; maintain the lean throughout for continuous tension.',
   TRUE),
  ('shoulder-press-machine-or-dumbbell', 'Shoulder Press',
   'Overhead shoulder press using either a machine or dumbbells, targeting the front and side delts.',
   'machine', 'intermediate',
   'Sit upright (machine) or sit/stand with dumbbells at shoulder height. Press upward to full overhead extension, then lower under control.',
   'Don''t lock out the elbows at the top; keep the core braced; avoid excessive lower-back arch.',
   TRUE),
  ('dumbbell-overhead-press', 'Overhead Press',
   'Standing or seated dumbbell overhead press for the front and side delts.',
   'free_weight', 'intermediate',
   'Hold dumbbells at shoulder height. Press overhead to full extension, then lower under control.',
   'Brace the core; avoid excessive back arch; don''t lock out the elbows at the top.',
   TRUE),
  -- Back
  ('straight-arm-cable-pulldown', 'Straight-Arm Pulldown',
   'Cable pulldown with straight arms to isolate the lats without biceps involvement.',
   'cable', 'intermediate',
   'Attach a rope to a high pulley. With arms straight, press the rope down toward your thighs.',
   'Keep arms straight throughout; lead with the lats, not the triceps; avoid leaning forward.',
   TRUE),
  ('machine-shrug-plate-loaded', 'Machine Shrug',
   'Plate-loaded shrug machine for targeted trap development with minimal lower-back involvement.',
   'machine', 'beginner',
   'Sit or stand in the shrug machine. Shrug the shoulders straight up toward the ears, then lower under control.',
   'Don''t roll the shoulders; pause at peak contraction; avoid jerking the weight up.',
   TRUE),
  ('dumbbell-shrug', 'Dumbbell Shrug',
   'Standing dumbbell shrug for targeted trap development.',
   'free_weight', 'beginner',
   'Hold dumbbells at your sides. Shrug the shoulders straight up toward the ears, then lower under control.',
   'Don''t roll the shoulders; pause at peak contraction; avoid jerking the weight up.',
   TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 4: exercise_muscles junctions for the 8 new exercises
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercise_muscles (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, j.is_primary
FROM (VALUES
  -- incline-machine-press
  ('incline-machine-press', 'upper-chest',  TRUE),
  ('incline-machine-press', 'front-delts',  TRUE),
  ('incline-machine-press', 'triceps',      FALSE),
  -- cable-rope-curl
  ('cable-rope-curl', 'biceps',   TRUE),
  ('cable-rope-curl', 'forearms', FALSE),
  -- egyptian-cable-lateral-raise
  ('egyptian-cable-lateral-raise', 'side-delts',   TRUE),
  ('egyptian-cable-lateral-raise', 'front-delts',  FALSE),
  ('egyptian-cable-lateral-raise', 'traps',        FALSE),
  -- shoulder-press-machine-or-dumbbell
  ('shoulder-press-machine-or-dumbbell', 'front-delts', TRUE),
  ('shoulder-press-machine-or-dumbbell', 'side-delts',  TRUE),
  ('shoulder-press-machine-or-dumbbell', 'triceps',     FALSE),
  -- dumbbell-overhead-press
  ('dumbbell-overhead-press', 'front-delts', TRUE),
  ('dumbbell-overhead-press', 'side-delts',  TRUE),
  ('dumbbell-overhead-press', 'triceps',     FALSE),
  -- straight-arm-cable-pulldown
  ('straight-arm-cable-pulldown', 'lats',  TRUE),
  ('straight-arm-cable-pulldown', 'chest', FALSE),
  -- machine-shrug-plate-loaded
  ('machine-shrug-plate-loaded', 'traps', TRUE),
  -- dumbbell-shrug
  ('dumbbell-shrug', 'traps', TRUE)
) AS j(exercise_slug, muscle_slug, is_primary)
JOIN public.exercises e ON e.slug = j.exercise_slug
JOIN public.muscles   m ON m.slug = j.muscle_slug
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 5: exercise_equipment junctions for the 8 new exercises
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercise_equipment (exercise_id, equipment_type_id, is_required)
SELECT e.id, et.id, j.is_required
FROM (VALUES
  ('incline-machine-press',                 'chest-press-machine',     TRUE),
  ('cable-rope-curl',                       'cable-rope',              TRUE),
  ('egyptian-cable-lateral-raise',          'cable-handle',            TRUE),
  ('shoulder-press-machine-or-dumbbell',    'shoulder-press-machine',  FALSE),
  ('shoulder-press-machine-or-dumbbell',    'dumbbell',                FALSE),
  ('dumbbell-overhead-press',               'dumbbell',                TRUE),
  ('straight-arm-cable-pulldown',           'cable-rope',              TRUE),
  ('machine-shrug-plate-loaded',            'shrug-machine',           TRUE),
  ('dumbbell-shrug',                        'dumbbell',                TRUE)
) AS j(exercise_slug, equipment_slug, is_required)
JOIN public.exercises      e  ON e.slug = j.exercise_slug
JOIN public.equipment_types et ON et.slug = j.equipment_slug
ON CONFLICT (exercise_id, equipment_type_id) DO NOTHING;
