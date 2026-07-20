-- armandotfit: seed program-template catalog + Arman Fit Commercial Gym v1
--
-- Context:
--   Phase 1 of the program-template work. The catalog-extensions migration
--   (20260721000000) and the program-templates migration (20260721000001)
--   have already landed the empty tables. This seed populates them:
--
--     • 20 movement families (exercise_families).
--     • Catalog extensions on the 26 existing exercises: display_name,
--       movement_pattern_id, laterality. catalog_version stays at 1.
--     • 5 new equipment_types (hack-squat-machine, seated-calf-raise-machine,
--       lying-leg-curl-machine, pec-deck-machine, floor-space).
--     • 17 new system exercises with full metadata (instructions, tips),
--       their exercise_muscles and exercise_equipment junctions, and
--       catalog cues.
--     • Equipment requirement paths for all 43 exercises (most are single-
--       path; shoulder-press-machine-or-dumbbell and tibia-raise-machine-or-
--       band are two-path OR cases).
--     • Grip/attachment options for the 8 cable + reverse-grip exercises
--       where the attachment is non-trivial.
--     • 32 directional exercise_alternatives seeded from the 26 template
--       exercises. Tier labels (direct | close | fallback) honestly classify
--       how well the alternative preserves the source's intent — Romanian
--       deadlift as a back-extension alternative is `close` (not direct)
--       and barbell row as a seated-cable-row alternative is `close` (not
--       direct), per Phase 1 brief.
--     • 1 program_template (arman-fit-commercial-gym-v1) + 2 variants
--       (one-a-day, two-a-day) + 8 days (4 per variant) + 12 sessions
--       (8 two-a-day AM/PM + 4 one-a-day single) + 60 slots (32 two-a-day
--       + 28 one-a-day). The one-a-day omissions (Day 1 LB-ext, Day 2
--       ab-crunch, Day 3 captains-chair, Day 4 dumbbell-shrug) are
--       preserved exactly.
--
-- Direction:
--   All inserts are ON CONFLICT DO NOTHING / DO UPDATE — re-runnable.
--   No existing catalog row is mutated except the ALTER-style UPDATE on
--   exercises to populate the new columns. The existing exercise_equipment
--   junction is preserved; exercise_equipment_requirement_paths is the new
--   additive eligibility model.
--
-- Failure mode:
--   Slugs are the source of truth. Every JOIN on a slug assumes the slug
--   exists in the target table. If a referenced slug is missing, the JOIN
--   produces zero rows for that record and the insert silently drops it.
--   The Phase 1 tests assert the 43-slug presence on both sides.
--
-- Idempotency:
--   Every INSERT is ON CONFLICT DO NOTHING (or DO UPDATE for the exercises
--   column backfill). Re-running against an already-migrated DB is a no-op.
--
-- Triangulation:
--   Companion catalog-extensions migration: 20260721000000. Companion
--   program-templates migration: 20260721000001. TS-side mirror:
--   shared/exercises/data.ts (17 new SystemExerciseData rows) and the
--   ExerciseKey union in shared/exercises/splits.ts (17 new slugs). Static
--   splits.ts day assignments stay UNCHANGED — runtime still reads from
--   the TS arrays until Phase 4 switches to plan-backed hydration.
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: exercise_families (20 movement patterns)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercise_families (slug, name, display_name) VALUES
  ('chest-press-incline',          'Chest Press (Incline)',        'Incline Press'),
  ('chest-fly',                    'Chest Fly',                    'Chest Fly'),
  ('overhead-press',               'Overhead Press',               'Overhead Press'),
  ('lateral-raise',                'Lateral Raise',                'Lateral Raise'),
  ('face-pull',                    'Face Pull',                    'Face Pull'),
  ('elbow-extension-overhead',     'Overhead Triceps Extension',   'Overhead Triceps Extension'),
  ('elbow-extension-press',        'Pressing Triceps Extension',   'Dip / Press Triceps'),
  ('elbow-flexion',                'Elbow Flexion',                'Bicep Curl'),
  ('vertical-pull',                'Vertical Pull',                'Vertical Pull'),
  ('vertical-pull-straight-arm',   'Vertical Pull (Straight Arm)', 'Straight-Arm Pulldown / Pullover'),
  ('horizontal-pull',              'Horizontal Pull',              'Horizontal Row'),
  ('scapular-elevation',           'Scapular Elevation',           'Shrug'),
  ('knee-dominant-bilateral',      'Knee-Dominant (Bilateral)',    'Bilateral Squat / Leg Press'),
  ('knee-dominant-unilateral',     'Knee-Dominant (Unilateral)',   'Unilateral Squat / Lunge'),
  ('knee-flexion',                 'Knee Flexion',                 'Leg Curl'),
  ('hip-hinge-spinal-extension',   'Hip Hinge / Spinal Extension', 'Hip Hinge / Back Extension'),
  ('plantar-flexion',              'Plantar Flexion',              'Calf Raise'),
  ('dorsi-flexion',                'Dorsi Flexion',                'Tibialis Raise'),
  ('vertical-leg-raise',           'Vertical Leg Raise',           'Vertical Leg Raise'),
  ('trunk-flexion',                'Trunk Flexion',                'Ab Crunch')
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: extend the 26 existing exercises with display_name, family, laterality
-- ──────────────────────────────────────────────────────────────────────
-- Per Phase 1 brief: "Seed all existing catalog metadata needed by the
-- current 26 exercises." The extensions are: display_name (user-facing
-- full label), movement_pattern_id (substitution intent), laterality.
-- catalog_version is left at its default (1) — the row identity is
-- unchanged.

UPDATE public.exercises e SET
  display_name = v.display_name,
  movement_pattern_id = f.id,
  laterality = v.laterality
FROM (VALUES
  -- slug,                              display_name,                          family_slug,                       laterality
  ('barbell-press-incline',              'Incline Barbell Press',               'chest-press-incline',             'bilateral'),
  ('dumbbell-fly-incline',               'Dumbbell Flye',                       'chest-fly',                       'bilateral'),
  ('chest-fly-machine',                  'Machine Flye',                        'chest-fly',                       'bilateral'),
  ('incline-machine-press',              'Incline Machine Press',               'chest-press-incline',             'bilateral'),
  ('overhead-tricep-extension-cable',    'Overhead Cable Triceps Extension',    'elbow-extension-overhead',        'bilateral'),
  ('tricep-dip-machine',                 'Machine Dips',                        'elbow-extension-press',           'bilateral'),
  ('dumbbell-curl-seated-incline',       'Incline Dumbbell Curl',               'elbow-flexion',                   'unilateral'),
  ('cable-rope-curl',                    'Cable Rope-Grip Curl',                'elbow-flexion',                   'bilateral'),
  ('egyptian-cable-lateral-raise',       'Egyptian Cable Lateral Raise',        'lateral-raise',                   'unilateral'),
  ('face-pull-cable-rope-grip',          'Cable Rope Face Pull',                'face-pull',                       'bilateral'),
  ('shoulder-press-machine-or-dumbbell', 'Machine or Dumbbell Shoulder Press',  'overhead-press',                  'bilateral'),
  ('dumbbell-overhead-press',            'Dumbbell Overhead Press',             'overhead-press',                  'bilateral'),
  ('lower-back-extension-calisthenic',   'Lower Back Extension',                'hip-hinge-spinal-extension',      'bilateral'),
  ('seated-cable-row-v-grip',            'Seated Machine Cable Row',            'horizontal-pull',                 'bilateral'),
  ('lat-pulldown-reverse-grip',          'Underhand Machine Lat Pulldown',      'vertical-pull',                   'bilateral'),
  ('straight-arm-cable-pulldown',        'Straight-Arm Cable Pulldown',         'vertical-pull-straight-arm',      'bilateral'),
  ('machine-shrug-plate-loaded',         'Plate-Loaded Machine Shrug',          'scapular-elevation',              'bilateral'),
  ('dumbbell-shrug',                     'Dumbbell Shrug',                      'scapular-elevation',              'bilateral'),
  ('leg-press-machine',                  'Leg Press Machine',                   'knee-dominant-bilateral',         'bilateral'),
  ('bulgarian-split-squat-dumbbell',     'Dumbbell Bulgarian Split Squat',      'knee-dominant-unilateral',        'unilateral'),
  ('machine-leg-curl-seated',            'Seated Leg Curl',                     'knee-flexion',                    'bilateral'),
  ('tibia-raise-machine-or-band',        'Tibialis Raise',                      'dorsi-flexion',                   'bilateral'),
  ('calf-raise-leg-press-machine',       'Leg Press Machine Calf Press',        'plantar-flexion',                 'bilateral'),
  ('machine-calf-raise-standing',        'Standing Calf Raise Machine',         'plantar-flexion',                 'bilateral'),
  ('leg-raise-captains-chair',           'Captain''s Chair Leg Raise',          'vertical-leg-raise',              'bilateral'),
  ('machine-ab-crunch-eccentric-emphasized', 'Machine Ab Crunch',               'trunk-flexion',                   'bilateral')
) AS v(slug, display_name, family_slug, laterality)
JOIN public.exercise_families f ON f.slug = v.family_slug
WHERE e.slug = v.slug;

-- ──────────────────────────────────────────────────────────────────────
-- Step 3: add 5 new equipment_types for the 17 new exercises
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.equipment_types (slug, name, display_name, category) VALUES
  ('hack-squat-machine',        'Hack Squat Machine',        'Hack Squat Machine',        'machine'),
  ('seated-calf-raise-machine', 'Seated Calf Raise Machine', 'Seated Calf Raise Machine', 'machine'),
  ('lying-leg-curl-machine',    'Lying Leg Curl Machine',    'Lying Leg Curl Machine',    'machine'),
  ('pec-deck-machine',          'Pec Deck Machine',          'Pec Deck Machine',          'machine'),
  ('floor-space',               'Floor Space',               'Floor Space',               'calisthenic')
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 4: insert 17 new system exercises
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercises
  (slug, name, description, exercise_type, difficulty_level, instructions, tips, is_system_exercise, display_name, laterality, catalog_version)
VALUES
  ('hack-squat-machine',
   'Hack Squat',
   'Machine hack squat targeting the quads through a controlled vertical-path squat with the shoulders stabilized.',
   'machine', 'intermediate',
   'Place shoulders under the pads, feet shoulder-width on the platform. Lower until thighs reach ~90°, then press through the heels.',
   'Keep the lower back flat against the pad; don''t lock the knees at the top; control the negative.',
   TRUE, 'Hack Squat Machine', 'bilateral', 1),

  ('seated-calf-raise-machine',
   'Seated Calf Raise',
   'Seated calf raise machine biases the soleus and biases gastrocnemius less than the standing variant due to the bent-knee position.',
   'machine', 'beginner',
   'Sit with the balls of the feet on the platform and the pad across the thighs. Lower the heels, then press up to full plantar-flexion.',
   'Pause at the top; control the negative; full range of motion at the bottom.',
   TRUE, 'Seated Calf Raise Machine', 'bilateral', 1),

  ('romanian-deadlift-barbell',
   'Romanian Deadlift',
   'Barbell Romanian deadlift — a hip-hinge with mostly-straight knees targeting the hamstrings and lower back.',
   'free_weight', 'advanced',
   'Grip the bar shoulder-width. Hinge at the hips with soft knees, lowering the bar along the thighs until you feel a hamstring stretch.',
   'Keep the bar close to the legs; maintain a neutral spine; don''t turn it into a squat by bending the knees too much.',
   TRUE, 'Barbell Romanian Deadlift', 'bilateral', 1),

  ('floor-leg-raise',
   'Floor Leg Raise',
   'Bodyweight leg raise performed lying on the floor, targeting the lower abs through hip flexion.',
   'calisthenic', 'beginner',
   'Lie flat on the floor, legs straight. Raise both legs to vertical, then lower under control without touching the floor.',
   'Keep the lower back pressed to the floor; avoid swinging; bend the knees to reduce difficulty.',
   TRUE, 'Floor Leg Raise', 'bilateral', 1),

  ('incline-dumbbell-press',
   'Incline Dumbbell Press',
   'Incline dumbbell press for the upper chest, allowing a deeper stretch and independent arm path than the barbell variant.',
   'free_weight', 'intermediate',
   'Set the incline to 30–45°. Press the dumbbells from shoulder-level overhead in a controlled arc.',
   'Keep a 45° elbow angle from the torso; control the negative; full range of motion at the bottom.',
   TRUE, 'Incline Dumbbell Press', 'bilateral', 1),

  ('overhead-dumbbell-tricep-extension',
   'Overhead Tricep Extension',
   'Overhead dumbbell triceps extension, typically performed one arm at a time with a single dumbbell.',
   'free_weight', 'intermediate',
   'Hold a single dumbbell overhead with both hands (or one). Lower behind the head, then press back to full extension.',
   'Keep the upper arms stationary; don''t flare the elbows; control the negative.',
   TRUE, 'Overhead Dumbbell Triceps Extension', 'unilateral', 1),

  ('barbell-overhead-press',
   'Overhead Press',
   'Standing barbell overhead press for the front and side delts, with substantial core and upper-back stability demand.',
   'free_weight', 'advanced',
   'Grip the bar shoulder-width. Press from the front-rack position overhead to full extension, then lower under control.',
   'Brace the core; avoid excessive lower-back arch; don''t bounce at the bottom.',
   TRUE, 'Barbell Overhead Press', 'bilateral', 1),

  ('dumbbell-lateral-raise',
   'Lateral Raise',
   'Standing dumbbell lateral raise to target the side deltoids through shoulder abduction.',
   'free_weight', 'beginner',
   'Hold dumbbells at your sides. Raise out to shoulder height with a slight elbow bend, then lower under control.',
   'Lead with the elbows; avoid shrugging; don''t swing.',
   TRUE, 'Dumbbell Lateral Raise', 'unilateral', 1),

  ('lying-leg-curl-machine',
   'Lying Leg Curl',
   'Lying leg curl machine targeting the hamstrings through knee flexion, performed prone.',
   'machine', 'intermediate',
   'Lie prone on the machine with the pad against the lower calves. Curl the pad toward the hips, then lower under control.',
   'Keep the hips pressed to the pad; don''t hyperextend the lower back; pause at peak contraction.',
   TRUE, 'Lying Leg Curl Machine', 'bilateral', 1),

  ('pull-up-bar',
   'Pull-up',
   'Bodyweight pull-up on a bar for vertical-pull strength, primarily targeting the lats and biceps.',
   'calisthenic', 'advanced',
   'Hang from the bar with overhand grip. Pull until the chin clears the bar, then lower under control.',
   'Lead with the chest; full hang at the bottom; avoid kipping.',
   TRUE, 'Pull-up (Bar)', 'bilateral', 1),

  ('cable-rope-crunch',
   'Cable Crunch',
   'Cable crunch with a rope attachment on a high pulley, loading spinal flexion for the abs.',
   'cable', 'intermediate',
   'Kneel below a high pulley with the rope behind the head. Crunch down by flexing the spine, then return under control.',
   'Curl the spine; don''t hinge at the hips; pause at peak contraction.',
   TRUE, 'Cable Rope Crunch', 'bilateral', 1),

  ('dumbbell-curl-standing',
   'Dumbbell Curl',
   'Standing dumbbell curl for the biceps, optionally with supination.',
   'free_weight', 'beginner',
   'Stand with dumbbells at your sides. Curl up toward the shoulders, then lower under control.',
   'Pin the elbows to your sides; avoid swinging; full extension at the bottom.',
   TRUE, 'Standing Dumbbell Curl', 'unilateral', 1),

  ('reverse-pec-deck',
   'Reverse Pec Deck',
   'Reverse pec deck machine for the rear delts through transverse shoulder abduction.',
   'machine', 'beginner',
   'Sit facing the pad. Grip the handles and pull the arms backward in a wide arc, squeezing the rear delts.',
   'Keep a slight elbow bend; lead with the elbows; pause at peak contraction.',
   TRUE, 'Reverse Pec Deck', 'bilateral', 1),

  ('walking-lunge-dumbbell',
   'Walking Lunge',
   'Dumbbell walking lunge for unilateral quad and glute development with dynamic balance demand.',
   'free_weight', 'intermediate',
   'Hold dumbbells at your sides. Step forward, lower until the back knee nearly touches the floor, then push through to step into the next rep.',
   'Keep the torso upright; don''t let the front knee cave inward; full hip extension between steps.',
   TRUE, 'Dumbbell Walking Lunge', 'unilateral', 1),

  ('dumbbell-pullover',
   'Dumbbell Pullover',
   'Dumbbell pullover across a flat bench, targeting the lats through shoulder extension with some chest involvement.',
   'free_weight', 'intermediate',
   'Lie upper-back across a flat bench. Lower a single dumbbell overhead behind you, then pull back over the chest.',
   'Keep a slight elbow bend; focus on the lat stretch; avoid letting the hips sag.',
   TRUE, 'Dumbbell Pullover', 'bilateral', 1),

  ('bench-dip',
   'Bench Dip',
   'Bodyweight triceps dip off a flat bench, with the feet on the floor or elevated.',
   'calisthenic', 'beginner',
   'Sit on the edge of a bench, hands beside the hips. Slide off and lower by bending the elbows, then press back up.',
   'Keep the elbows pointing back, not out; control the descent; don''t shrug the shoulders.',
   TRUE, 'Bench Dip', 'bilateral', 1),

  ('barbell-row',
   'Barbell Row',
   'Hinge-supported barbell row for the lats and upper back, loaded through the posterior chain.',
   'free_weight', 'advanced',
   'Hinge at the hips with a flat back. Pull the bar to the lower chest, squeezing the shoulder blades, then lower under control.',
   'Keep the back flat; lead with the elbows; avoid using the lower back to row the weight.',
   TRUE, 'Barbell Row', 'bilateral', 1)
ON CONFLICT (slug) DO NOTHING;

-- Backfill movement_pattern_id on the 17 new rows (separate UPDATE because
-- the exercises INSERT can''t reference exercise_families by slug in the
-- same VALUES list cleanly).

UPDATE public.exercises e SET
  movement_pattern_id = f.id
FROM (VALUES
  ('hack-squat-machine',                'knee-dominant-bilateral'),
  ('seated-calf-raise-machine',         'plantar-flexion'),
  ('romanian-deadlift-barbell',         'hip-hinge-spinal-extension'),
  ('floor-leg-raise',                   'vertical-leg-raise'),
  ('incline-dumbbell-press',            'chest-press-incline'),
  ('overhead-dumbbell-tricep-extension','elbow-extension-overhead'),
  ('barbell-overhead-press',            'overhead-press'),
  ('dumbbell-lateral-raise',            'lateral-raise'),
  ('lying-leg-curl-machine',            'knee-flexion'),
  ('pull-up-bar',                       'vertical-pull'),
  ('cable-rope-crunch',                 'trunk-flexion'),
  ('dumbbell-curl-standing',            'elbow-flexion'),
  ('reverse-pec-deck',                  'face-pull'),
  ('walking-lunge-dumbbell',            'knee-dominant-unilateral'),
  ('dumbbell-pullover',                 'vertical-pull-straight-arm'),
  ('bench-dip',                         'elbow-extension-press'),
  ('barbell-row',                       'horizontal-pull')
) AS v(slug, family_slug)
JOIN public.exercise_families f ON f.slug = v.family_slug
WHERE e.slug = v.slug AND e.movement_pattern_id IS NULL;

-- ──────────────────────────────────────────────────────────────────────
-- Step 5: exercise_muscles junctions for the 17 new exercises
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercise_muscles (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, j.is_primary
FROM (VALUES
  -- hack-squat-machine
  ('hack-squat-machine', 'quads',      TRUE),
  ('hack-squat-machine', 'glutes',     TRUE),
  ('hack-squat-machine', 'hamstrings', FALSE),
  ('hack-squat-machine', 'calves',     FALSE),
  -- seated-calf-raise-machine
  ('seated-calf-raise-machine', 'calves', TRUE),
  -- romanian-deadlift-barbell
  ('romanian-deadlift-barbell', 'hamstrings', TRUE),
  ('romanian-deadlift-barbell', 'lower-back', TRUE),
  ('romanian-deadlift-barbell', 'glutes',     FALSE),
  ('romanian-deadlift-barbell', 'traps',      FALSE),
  -- floor-leg-raise
  ('floor-leg-raise', 'lower-abs', TRUE),
  ('floor-leg-raise', 'abs',       TRUE),
  -- incline-dumbbell-press
  ('incline-dumbbell-press', 'upper-chest', TRUE),
  ('incline-dumbbell-press', 'front-delts', TRUE),
  ('incline-dumbbell-press', 'triceps',     FALSE),
  ('incline-dumbbell-press', 'chest',       FALSE),
  -- overhead-dumbbell-tricep-extension
  ('overhead-dumbbell-tricep-extension', 'triceps', TRUE),
  -- barbell-overhead-press
  ('barbell-overhead-press', 'front-delts', TRUE),
  ('barbell-overhead-press', 'side-delts',  TRUE),
  ('barbell-overhead-press', 'triceps',     FALSE),
  -- dumbbell-lateral-raise
  ('dumbbell-lateral-raise', 'side-delts',  TRUE),
  ('dumbbell-lateral-raise', 'front-delts', FALSE),
  -- lying-leg-curl-machine
  ('lying-leg-curl-machine', 'hamstrings', TRUE),
  -- pull-up-bar
  ('pull-up-bar', 'lats',       TRUE),
  ('pull-up-bar', 'biceps',     TRUE),
  ('pull-up-bar', 'upper-back', FALSE),
  -- cable-rope-crunch
  ('cable-rope-crunch', 'abs', TRUE),
  -- dumbbell-curl-standing
  ('dumbbell-curl-standing', 'biceps',   TRUE),
  ('dumbbell-curl-standing', 'forearms', FALSE),
  -- reverse-pec-deck
  ('reverse-pec-deck', 'rear-delts',  TRUE),
  ('reverse-pec-deck', 'upper-back',  FALSE),
  ('reverse-pec-deck', 'rhomboids',   FALSE),
  -- walking-lunge-dumbbell
  ('walking-lunge-dumbbell', 'quads',      TRUE),
  ('walking-lunge-dumbbell', 'glutes',     TRUE),
  ('walking-lunge-dumbbell', 'hamstrings', FALSE),
  ('walking-lunge-dumbbell', 'calves',     FALSE),
  -- dumbbell-pullover
  ('dumbbell-pullover', 'lats',        TRUE),
  ('dumbbell-pullover', 'upper-chest', TRUE),
  -- bench-dip
  ('bench-dip', 'triceps',     TRUE),
  ('bench-dip', 'front-delts', FALSE),
  -- barbell-row
  ('barbell-row', 'lats',       TRUE),
  ('barbell-row', 'upper-back', TRUE),
  ('barbell-row', 'biceps',     FALSE),
  ('barbell-row', 'rear-delts', FALSE)
) AS j(exercise_slug, muscle_slug, is_primary)
JOIN public.exercises e ON e.slug = j.exercise_slug
JOIN public.muscles   m ON m.slug = j.muscle_slug
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 6: exercise_equipment junctions for the 17 new exercises
-- ──────────────────────────────────────────────────────────────────────
-- Preserves the existing flat exercise_equipment contract; the new
-- requirement-path model (Step 7) is the canonical eligibility source.

INSERT INTO public.exercise_equipment (exercise_id, equipment_type_id, is_required)
SELECT e.id, et.id, j.is_required
FROM (VALUES
  ('hack-squat-machine',                  'hack-squat-machine',        TRUE),
  ('seated-calf-raise-machine',           'seated-calf-raise-machine', TRUE),
  ('romanian-deadlift-barbell',           'barbell',                   TRUE),
  ('floor-leg-raise',                     'floor-space',               TRUE),
  ('incline-dumbbell-press',              'dumbbell',                  TRUE),
  ('incline-dumbbell-press',              'incline-bench',             TRUE),
  ('overhead-dumbbell-tricep-extension',  'dumbbell',                  TRUE),
  ('barbell-overhead-press',              'barbell',                   TRUE),
  ('dumbbell-lateral-raise',              'dumbbell',                  TRUE),
  ('lying-leg-curl-machine',              'lying-leg-curl-machine',    TRUE),
  ('pull-up-bar',                         'pull-up-bar',               TRUE),
  ('cable-rope-crunch',                   'cable-rope',                TRUE),
  ('dumbbell-curl-standing',              'dumbbell',                  TRUE),
  ('reverse-pec-deck',                    'pec-deck-machine',          TRUE),
  ('walking-lunge-dumbbell',              'dumbbell',                  TRUE),
  ('dumbbell-pullover',                   'dumbbell',                  TRUE),
  ('dumbbell-pullover',                   'flat-bench',                TRUE),
  ('bench-dip',                           'flat-bench',                TRUE),
  ('barbell-row',                         'barbell',                   TRUE)
) AS j(exercise_slug, equipment_slug, is_required)
JOIN public.exercises      e  ON e.slug = j.exercise_slug
JOIN public.equipment_types et ON et.slug = j.equipment_slug
ON CONFLICT (exercise_id, equipment_type_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 7: equipment requirement paths for all 43 exercises
-- ──────────────────────────────────────────────────────────────────────
-- Pattern: one INSERT into exercise_equipment_requirement_paths per path
-- (path_index 1..N), then one INSERT into exercise_equipment_requirements
-- joining by (exercise_slug, path_index) → path id, plus equipment slug.
--
-- The OR-across-path semantics show up where an exercise has multiple
-- paths: shoulder-press-machine-or-dumbbell (2 paths) and
-- tibia-raise-machine-or-band (2 paths). All other exercises have one
-- path with one or more requirements ANDed together.

INSERT INTO public.exercise_equipment_requirement_paths (exercise_id, path_index, rationale)
SELECT e.id, v.path_index, v.rationale
FROM (VALUES
  -- slug, path_index, rationale
  ('barbell-press-incline',                1, NULL),
  ('dumbbell-fly-incline',                 1, NULL),
  ('chest-fly-machine',                    1, NULL),
  ('incline-machine-press',                1, NULL),
  ('overhead-tricep-extension-cable',      1, NULL),
  ('tricep-dip-machine',                   1, NULL),
  ('dumbbell-curl-seated-incline',         1, NULL),
  ('cable-rope-curl',                      1, NULL),
  ('egyptian-cable-lateral-raise',         1, NULL),
  ('face-pull-cable-rope-grip',            1, NULL),
  ('shoulder-press-machine-or-dumbbell',   1, 'Machine path'),
  ('shoulder-press-machine-or-dumbbell',   2, 'Dumbbell path'),
  ('dumbbell-overhead-press',              1, NULL),
  ('lower-back-extension-calisthenic',     1, NULL),
  ('seated-cable-row-v-grip',              1, NULL),
  ('lat-pulldown-reverse-grip',            1, NULL),
  ('straight-arm-cable-pulldown',          1, NULL),
  ('machine-shrug-plate-loaded',           1, NULL),
  ('dumbbell-shrug',                       1, NULL),
  ('leg-press-machine',                    1, NULL),
  ('bulgarian-split-squat-dumbbell',       1, NULL),
  ('machine-leg-curl-seated',              1, NULL),
  ('tibia-raise-machine-or-band',          1, 'Machine path'),
  ('tibia-raise-machine-or-band',          2, 'Resistance-band path'),
  ('calf-raise-leg-press-machine',         1, NULL),
  ('machine-calf-raise-standing',          1, NULL),
  ('leg-raise-captains-chair',             1, NULL),
  ('machine-ab-crunch-eccentric-emphasized', 1, NULL),
  ('hack-squat-machine',                   1, NULL),
  ('seated-calf-raise-machine',            1, NULL),
  ('romanian-deadlift-barbell',            1, NULL),
  ('floor-leg-raise',                      1, NULL),
  ('incline-dumbbell-press',               1, NULL),
  ('overhead-dumbbell-tricep-extension',   1, NULL),
  ('barbell-overhead-press',               1, NULL),
  ('dumbbell-lateral-raise',               1, NULL),
  ('lying-leg-curl-machine',               1, NULL),
  ('pull-up-bar',                          1, NULL),
  ('cable-rope-crunch',                    1, NULL),
  ('dumbbell-curl-standing',               1, NULL),
  ('reverse-pec-deck',                     1, NULL),
  ('walking-lunge-dumbbell',               1, NULL),
  ('dumbbell-pullover',                    1, NULL),
  ('bench-dip',                            1, NULL),
  ('barbell-row',                          1, NULL)
) AS v(slug, path_index, rationale)
JOIN public.exercises e ON e.slug = v.slug
ON CONFLICT (exercise_id, path_index) DO NOTHING;

-- Now populate the requirement nodes within each path.
INSERT INTO public.exercise_equipment_requirements (requirement_path_id, equipment_type_id, min_quantity)
SELECT p.id, et.id, v.min_quantity
FROM (VALUES
  -- slug, path_index, equipment_slug, min_quantity
  ('barbell-press-incline',                1, 'barbell',                 1),
  ('barbell-press-incline',                1, 'incline-bench',           1),
  ('dumbbell-fly-incline',                 1, 'dumbbell',                1),
  ('dumbbell-fly-incline',                 1, 'incline-bench',           1),
  ('chest-fly-machine',                    1, 'chest-fly-machine',       1),
  ('incline-machine-press',                1, 'chest-press-machine',     1),
  ('overhead-tricep-extension-cable',      1, 'cable-rope',              1),
  ('tricep-dip-machine',                   1, 'tricep-extension-machine',1),
  ('dumbbell-curl-seated-incline',         1, 'dumbbell',                1),
  ('dumbbell-curl-seated-incline',         1, 'incline-bench',           1),
  ('cable-rope-curl',                      1, 'cable-rope',              1),
  ('egyptian-cable-lateral-raise',         1, 'cable-handle',            1),
  ('face-pull-cable-rope-grip',            1, 'cable-rope',              1),
  ('shoulder-press-machine-or-dumbbell',   1, 'shoulder-press-machine',  1),
  ('shoulder-press-machine-or-dumbbell',   2, 'dumbbell',                1),
  ('dumbbell-overhead-press',              1, 'dumbbell',                1),
  ('lower-back-extension-calisthenic',     1, 'back-extension-station',  1),
  ('seated-cable-row-v-grip',              1, 'cable-v-bar',             1),
  ('lat-pulldown-reverse-grip',            1, 'cable-lat-bar',           1),
  ('straight-arm-cable-pulldown',          1, 'cable-rope',              1),
  ('machine-shrug-plate-loaded',           1, 'shrug-machine',           1),
  ('dumbbell-shrug',                       1, 'dumbbell',                1),
  ('leg-press-machine',                    1, 'leg-press-machine',       1),
  ('bulgarian-split-squat-dumbbell',       1, 'dumbbell',                1),
  ('bulgarian-split-squat-dumbbell',       1, 'flat-bench',              1),
  ('machine-leg-curl-seated',              1, 'leg-curl-machine',        1),
  ('tibia-raise-machine-or-band',          1, 'tibia-raise-machine',     1),
  ('tibia-raise-machine-or-band',          2, 'resistance-band',         1),
  ('calf-raise-leg-press-machine',         1, 'leg-press-machine',       1),
  ('machine-calf-raise-standing',          1, 'calf-raise-machine',      1),
  ('leg-raise-captains-chair',             1, 'captains-chair',          1),
  ('machine-ab-crunch-eccentric-emphasized', 1, 'abdominal-machine',     1),
  ('hack-squat-machine',                   1, 'hack-squat-machine',      1),
  ('seated-calf-raise-machine',            1, 'seated-calf-raise-machine', 1),
  ('romanian-deadlift-barbell',            1, 'barbell',                 1),
  ('floor-leg-raise',                      1, 'floor-space',             1),
  ('incline-dumbbell-press',               1, 'dumbbell',                1),
  ('incline-dumbbell-press',               1, 'incline-bench',           1),
  ('overhead-dumbbell-tricep-extension',   1, 'dumbbell',                1),
  ('barbell-overhead-press',               1, 'barbell',                 1),
  ('dumbbell-lateral-raise',               1, 'dumbbell',                1),
  ('lying-leg-curl-machine',               1, 'lying-leg-curl-machine',  1),
  ('pull-up-bar',                          1, 'pull-up-bar',             1),
  ('cable-rope-crunch',                    1, 'cable-rope',              1),
  ('dumbbell-curl-standing',               1, 'dumbbell',                1),
  ('reverse-pec-deck',                     1, 'pec-deck-machine',        1),
  ('walking-lunge-dumbbell',               1, 'dumbbell',                1),
  ('dumbbell-pullover',                    1, 'dumbbell',                1),
  ('dumbbell-pullover',                    1, 'flat-bench',              1),
  ('bench-dip',                            1, 'flat-bench',              1),
  ('barbell-row',                          1, 'barbell',                 1)
) AS v(slug, path_index, equipment_slug, min_quantity)
JOIN public.exercises e ON e.slug = v.slug
JOIN public.exercise_equipment_requirement_paths p
  ON p.exercise_id = e.id AND p.path_index = v.path_index
JOIN public.equipment_types et ON et.slug = v.equipment_slug
ON CONFLICT (requirement_path_id, equipment_type_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 8: catalog cues for the 17 new exercises
-- ──────────────────────────────────────────────────────────────────────
-- Two cues per exercise: one setup, one execution. The brief specified
-- cues for the 17 new exercises; the existing 26 keep their prose in
-- exercises.instructions + exercises.tips for now.

INSERT INTO public.exercise_cues (exercise_id, cue_text, cue_type, is_default, display_order)
SELECT e.id, v.cue_text, v.cue_type, TRUE, v.display_order
FROM (VALUES
  -- hack-squat-machine
  ('hack-squat-machine', 'Place shoulders under the pads with feet shoulder-width on the platform.', 'setup', 1),
  ('hack-squat-machine', 'Press through the heels; keep the lower back flat against the pad.',        'execution', 1),
  -- seated-calf-raise-machine
  ('seated-calf-raise-machine', 'Sit with the balls of the feet on the platform and the pad across the thighs.', 'setup', 1),
  ('seated-calf-raise-machine', 'Pause at peak contraction; control the negative; full range at the bottom.',     'execution', 1),
  -- romanian-deadlift-barbell
  ('romanian-deadlift-barbell', 'Grip the bar shoulder-width with soft knees and a neutral spine.', 'setup', 1),
  ('romanian-deadlift-barbell', 'Hinge at the hips; keep the bar close to the legs.',               'execution', 1),
  -- floor-leg-raise
  ('floor-leg-raise', 'Lie flat on the floor with legs straight and the lower back pressed down.', 'setup', 1),
  ('floor-leg-raise', 'Raise both legs to vertical without swinging; lower under control.',        'execution', 1),
  -- incline-dumbbell-press
  ('incline-dumbbell-press', 'Set the incline to 30–45°; press from shoulder-level overhead.', 'setup', 1),
  ('incline-dumbbell-press', 'Keep a 45° elbow angle from the torso; control the negative.',   'execution', 1),
  -- overhead-dumbbell-tricep-extension
  ('overhead-dumbbell-tricep-extension', 'Hold a single dumbbell overhead with both hands.', 'setup', 1),
  ('overhead-dumbbell-tricep-extension', 'Keep the upper arms stationary; lower behind the head.', 'execution', 1),
  -- barbell-overhead-press
  ('barbell-overhead-press', 'Grip the bar shoulder-width from a front-rack position.', 'setup', 1),
  ('barbell-overhead-press', 'Brace the core; press overhead without excessive lower-back arch.', 'execution', 1),
  -- dumbbell-lateral-raise
  ('dumbbell-lateral-raise', 'Stand with dumbbells at your sides and a slight elbow bend.', 'setup', 1),
  ('dumbbell-lateral-raise', 'Lead with the elbows; raise to shoulder height; avoid shrugging.', 'execution', 1),
  -- lying-leg-curl-machine
  ('lying-leg-curl-machine', 'Lie prone with the pad against the lower calves.', 'setup', 1),
  ('lying-leg-curl-machine', 'Keep the hips pressed to the pad; curl toward the hips without hyperextending the back.', 'execution', 1),
  -- pull-up-bar
  ('pull-up-bar', 'Hang from the bar with overhand grip, shoulder-width.', 'setup', 1),
  ('pull-up-bar', 'Pull until the chin clears the bar; lower to a full hang.', 'execution', 1),
  -- cable-rope-crunch
  ('cable-rope-crunch', 'Kneel below a high pulley with the rope behind the head.', 'setup', 1),
  ('cable-rope-crunch', 'Curl the spine to crunch; don''t hinge at the hips.', 'execution', 1),
  -- dumbbell-curl-standing
  ('dumbbell-curl-standing', 'Stand with dumbbells at your sides; pin the elbows to your sides.', 'setup', 1),
  ('dumbbell-curl-standing', 'Curl toward the shoulders without swinging; full extension at the bottom.', 'execution', 1),
  -- reverse-pec-deck
  ('reverse-pec-deck', 'Sit facing the pad; grip the handles with a slight elbow bend.', 'setup', 1),
  ('reverse-pec-deck', 'Lead with the elbows; pause at peak contraction.', 'execution', 1),
  -- walking-lunge-dumbbell
  ('walking-lunge-dumbbell', 'Hold dumbbells at your sides; stand tall.', 'setup', 1),
  ('walking-lunge-dumbbell', 'Step forward, lower until the back knee nearly touches, then push through to the next rep.', 'execution', 1),
  -- dumbbell-pullover
  ('dumbbell-pullover', 'Lie upper-back across a flat bench; hold a single dumbbell overhead.', 'setup', 1),
  ('dumbbell-pullover', 'Lower overhead behind you; pull back over the chest with a slight elbow bend.', 'execution', 1),
  -- bench-dip
  ('bench-dip', 'Sit on the edge of a bench; hands beside the hips; slide the hips off.', 'setup', 1),
  ('bench-dip', 'Point the elbows back, not out; control the descent.', 'execution', 1),
  -- barbell-row
  ('barbell-row', 'Hinge at the hips with a flat back; grip the bar shoulder-width.', 'setup', 1),
  ('barbell-row', 'Pull the bar to the lower chest; lead with the elbows; avoid using the lower back.', 'execution', 1)
) AS v(slug, cue_text, cue_type, display_order)
JOIN public.exercises e ON e.slug = v.slug
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 9: grip/attachment options for cable + reverse-grip exercises
-- ──────────────────────────────────────────────────────────────────────
-- Minimal useful seed: grip/attachment data is non-trivial only for cable
-- exercises (where the attachment matters) plus the underhand pulldown
-- (where the grip matters). Dumbbell/barbell defaults aren't seeded here.

INSERT INTO public.exercise_grip_options (exercise_id, grip_slug, attachment_slug, is_primary, display_order)
SELECT e.id, v.grip_slug, v.attachment_slug, v.is_primary, v.display_order
FROM (VALUES
  ('lat-pulldown-reverse-grip',       'underhand', 'cable-lat-bar', TRUE,  1),
  ('seated-cable-row-v-grip',         'neutral',   'cable-v-bar',   TRUE,  1),
  ('cable-rope-curl',                 'neutral',   'cable-rope',    TRUE,  1),
  ('face-pull-cable-rope-grip',       'neutral',   'cable-rope',    TRUE,  1),
  ('straight-arm-cable-pulldown',     'neutral',   'cable-rope',    TRUE,  1),
  ('overhead-tricep-extension-cable', 'neutral',   'cable-rope',    TRUE,  1),
  ('egyptian-cable-lateral-raise',    'neutral',   'cable-handle',  TRUE,  1),
  ('cable-rope-crunch',               'neutral',   'cable-rope',    TRUE,  1)
) AS v(slug, grip_slug, attachment_slug, is_primary, display_order)
JOIN public.exercises e ON e.slug = v.slug
ON CONFLICT (exercise_id, grip_slug, attachment_slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 10: directional exercise alternatives (32 rows)
-- ──────────────────────────────────────────────────────────────────────
-- Each row is directional: source_exercise_id is the slot's template
-- exercise, alt_exercise_id is the substitute the algorithm tries when the
-- source is ineligible. (alt_type, priority) is the walk order:
-- direct before close before fallback, lower priority first within tier.
--
-- Honest tiers per the Phase 1 brief:
--   • Romanian deadlift as back-extension alternative is `close` (not direct).
--     RDL is a free-weight barbell hip hinge with significant loading vs
--     bodyweight spinal-extension on a station. Same primary muscles but
--     materially different apparatus and loading.
--   • Barbell row as seated-cable-row alternative is `close` (not direct).
--     Both are horizontal pulls but the barbell row is hinge-supported with
--     free-weight loading vs a cable stack with constant tension.

INSERT INTO public.exercise_alternatives (source_exercise_id, alt_exercise_id, alt_type, priority, intent_note)
SELECT src.id, alt.id, v.alt_type, v.priority, v.intent_note
FROM (VALUES
  -- slug, alt_slug, alt_type, priority, intent_note

  -- leg-press-machine
  ('leg-press-machine', 'hack-squat-machine', 'direct', 1, 'Bilateral knee-dominant machine swap.'),

  -- calf-raise-leg-press-machine
  ('calf-raise-leg-press-machine', 'machine-calf-raise-standing', 'direct', 1, 'Standing calf machine preserves plantar-flexion intent.'),
  ('calf-raise-leg-press-machine', 'seated-calf-raise-machine',   'direct', 2, 'Seated calf biases soleus over gastrocnemius.'),

  -- lower-back-extension-calisthenic
  ('lower-back-extension-calisthenic', 'romanian-deadlift-barbell', 'close', 1, 'RDL hits the same primary muscles but is a free-weight barbell hip hinge, materially different from bodyweight spinal extension on a station.'),

  -- leg-raise-captains-chair
  ('leg-raise-captains-chair', 'floor-leg-raise', 'direct', 1, 'Same vertical leg raise; floor is easier (shorter lever).'),

  -- barbell-press-incline
  ('barbell-press-incline', 'incline-dumbbell-press', 'direct', 1, 'Incline press, dumbbell swap.'),
  ('barbell-press-incline', 'incline-machine-press',  'direct', 2, 'Incline press, machine swap (same catalog family).'),

  -- overhead-tricep-extension-cable
  ('overhead-tricep-extension-cable', 'overhead-dumbbell-tricep-extension', 'direct', 1, 'Overhead triceps extension, dumbbell swap.'),

  -- shoulder-press-machine-or-dumbbell
  ('shoulder-press-machine-or-dumbbell', 'dumbbell-overhead-press', 'direct', 1, 'Dumbbell path of the source exercise as a standalone row.'),
  ('shoulder-press-machine-or-dumbbell', 'barbell-overhead-press',  'close', 1, 'Bilateral overhead press but barbell is a distinct apparatus with different stability demand.'),

  -- egyptian-cable-lateral-raise
  ('egyptian-cable-lateral-raise', 'dumbbell-lateral-raise', 'direct', 1, 'Lateral raise, dumbbell swap.'),

  -- machine-shrug-plate-loaded
  ('machine-shrug-plate-loaded', 'dumbbell-shrug', 'direct', 1, 'Shrug, dumbbell swap (same catalog family).'),

  -- chest-fly-machine
  ('chest-fly-machine', 'dumbbell-fly-incline', 'direct', 1, 'Chest fly, dumbbell swap (same catalog family).'),

  -- machine-leg-curl-seated
  ('machine-leg-curl-seated', 'lying-leg-curl-machine', 'direct', 1, 'Knee flexion machine swap; lying changes hip position relative to seated.'),

  -- lat-pulldown-reverse-grip
  ('lat-pulldown-reverse-grip', 'pull-up-bar', 'close', 1, 'Both vertical pulls but pull-up is bodyweight with overhand default grip; same primary muscles, different loading and grip.'),

  -- machine-ab-crunch-eccentric-emphasized
  ('machine-ab-crunch-eccentric-emphasized', 'cable-rope-crunch', 'direct', 1, 'Resisted spinal flexion for abs; cable swaps for machine.'),

  -- dumbbell-curl-seated-incline
  ('dumbbell-curl-seated-incline', 'dumbbell-curl-standing', 'direct', 1, 'Dumbbell curl; standing changes stability demand slightly.'),
  ('dumbbell-curl-seated-incline', 'cable-rope-curl',         'direct', 2, 'Bicep curl, cable swap (same catalog family).'),

  -- face-pull-cable-rope-grip
  ('face-pull-cable-rope-grip', 'reverse-pec-deck', 'direct', 1, 'Transverse abduction for rear delts; rope-pull adds rotator-cuff involvement, pec-deck is pure transverse abduction.'),

  -- bulgarian-split-squat-dumbbell
  ('bulgarian-split-squat-dumbbell', 'walking-lunge-dumbbell', 'direct', 1, 'Unilateral knee-dominant dumbbell swap; lunge is dynamic, split squat is static.'),

  -- machine-calf-raise-standing
  ('machine-calf-raise-standing', 'seated-calf-raise-machine',   'close', 1, 'Calf isolation but seated biases soleus over gastrocnemius; different muscle emphasis.'),
  ('machine-calf-raise-standing', 'calf-raise-leg-press-machine', 'direct', 1, 'Plantar-flexion on a leg-press-style setup.'),

  -- straight-arm-cable-pulldown
  ('straight-arm-cable-pulldown', 'dumbbell-pullover', 'direct', 1, 'Lat isolation through shoulder extension; cable swaps for dumbbell.'),

  -- incline-machine-press
  ('incline-machine-press', 'barbell-press-incline',    'direct', 1, 'Incline press (same catalog family).'),
  ('incline-machine-press', 'incline-dumbbell-press',   'direct', 2, 'Incline press, dumbbell swap.'),

  -- tricep-dip-machine
  ('tricep-dip-machine', 'bench-dip',                          'direct', 1, 'Dip pattern; bench is bodyweight.'),
  ('tricep-dip-machine', 'overhead-tricep-extension-cable',    'close',  1, 'Same target muscle but overhead extension is mechanically distinct from pressing.'),

  -- dumbbell-overhead-press
  ('dumbbell-overhead-press', 'shoulder-press-machine-or-dumbbell', 'direct', 1, 'Bilateral overhead press (sibling row).'),
  ('dumbbell-overhead-press', 'barbell-overhead-press',             'direct', 2, 'Bilateral overhead press, barbell swap.'),

  -- dumbbell-shrug
  ('dumbbell-shrug', 'machine-shrug-plate-loaded', 'direct', 1, 'Shrug, machine swap (same catalog family).'),

  -- dumbbell-fly-incline
  ('dumbbell-fly-incline', 'chest-fly-machine', 'direct', 1, 'Chest fly, machine swap (same catalog family).'),

  -- seated-cable-row-v-grip
  ('seated-cable-row-v-grip', 'barbell-row', 'close', 1, 'Both horizontal pulls but barbell row is hinge-supported free-weight vs cable stack with constant tension; mechanically distinct.'),

  -- cable-rope-curl
  ('cable-rope-curl', 'dumbbell-curl-standing',     'direct', 1, 'Bicep curl, dumbbell swap.'),
  ('cable-rope-curl', 'dumbbell-curl-seated-incline', 'direct', 2, 'Bicep curl (same catalog family).')
) AS v(src_slug, alt_slug, alt_type, priority, intent_note)
JOIN public.exercises src ON src.slug = v.src_slug
JOIN public.exercises alt ON alt.slug = v.alt_slug
ON CONFLICT (source_exercise_id, alt_exercise_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 11: program_templates + schedule variants
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.program_templates
  (slug, name, description, goal, default_variant_slug, version, status, display_order)
VALUES
  ('arman-fit-commercial-gym-v1',
   'Arman Fit Commercial Gym v1',
   'Four-day commercial-gym hypertrophy program. Two schedule variants: one-a-day (single combined daily session) and two-a-day (separate AM/PM sessions). Variants are independently authored — the one-a-day schedule intentionally omits several two-a-day exercises; those omissions are deliberate template data.',
   'Hypertrophy',
   'one-a-day',
   1,
   'active',
   1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.program_schedule_variants
  (program_template_id, slug, name, description, session_window_pattern, cycle_length_days, version, status, display_order)
VALUES
  ((SELECT id FROM public.program_templates WHERE slug = 'arman-fit-commercial-gym-v1'),
   'one-a-day',
   'One-a-Day',
   'Single combined daily session. Intentionally omits Lower Back Extension (Day 1), Machine Ab Crunch (Day 2), Captain''s Chair Leg Raise (Day 3), and Dumbbell Shrug (Day 4) relative to the two-a-day AM/PM schedule. These omissions are deliberate template data, not a mechanical merge.',
   'single', 4, 1, 'active', 1),
  ((SELECT id FROM public.program_templates WHERE slug = 'arman-fit-commercial-gym-v1'),
   'two-a-day',
   'Two-a-Day',
   'Separate AM and PM sessions per day. AM sessions bias lower body + core; PM sessions bias upper body + arms.',
   'am-pm', 4, 1, 'active', 2)
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 12: program_days (4 per variant = 8 rows)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.program_days (program_variant_id, day_index, title)
SELECT v.id, d.day_index, d.title
FROM (VALUES
  ('one-a-day', 1, 'Full Body Day 1'),
  ('one-a-day', 2, 'Full Body Day 2'),
  ('one-a-day', 3, 'Full Body Day 3'),
  ('one-a-day', 4, 'Full Body Day 4'),
  ('two-a-day', 1, 'AM/PM Day 1'),
  ('two-a-day', 2, 'AM/PM Day 2'),
  ('two-a-day', 3, 'AM/PM Day 3'),
  ('two-a-day', 4, 'AM/PM Day 4')
) AS d(variant_slug, day_index, title)
JOIN public.program_schedule_variants v ON v.slug = d.variant_slug
ON CONFLICT (program_variant_id, day_index) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 13: program_sessions (one-a-day: 4 single; two-a-day: 4 am + 4 pm = 12)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.program_sessions (program_day_id, session_window, label, order_index)
SELECT d.id, s.session_window, s.label, s.order_index
FROM (VALUES
  -- one-a-day: 1 single session per day, order_index 1
  ('one-a-day', 1, 'single', 'Daily', 1),
  ('one-a-day', 2, 'single', 'Daily', 1),
  ('one-a-day', 3, 'single', 'Daily', 1),
  ('one-a-day', 4, 'single', 'Daily', 1),
  -- two-a-day: 2 sessions per day, AM first
  ('two-a-day', 1, 'am', 'AM', 1),
  ('two-a-day', 1, 'pm', 'PM', 2),
  ('two-a-day', 2, 'am', 'AM', 1),
  ('two-a-day', 2, 'pm', 'PM', 2),
  ('two-a-day', 3, 'am', 'AM', 1),
  ('two-a-day', 3, 'pm', 'PM', 2),
  ('two-a-day', 4, 'am', 'AM', 1),
  ('two-a-day', 4, 'pm', 'PM', 2)
) AS s(variant_slug, day_index, session_window, label, order_index)
JOIN public.program_schedule_variants v ON v.slug = s.variant_slug
JOIN public.program_days d ON d.program_variant_id = v.id AND d.day_index = s.day_index
ON CONFLICT (program_day_id, order_index) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 14: program_slots (60 rows: 32 two-a-day + 28 one-a-day)
-- ──────────────────────────────────────────────────────────────────────
-- exercise_id is resolved from exercises.slug at insert time via JOIN.
-- Prescriptions are stored as sets_min/sets_max/reps_min/reps_max;
-- per_side is TRUE only for Bulgarian Split Squat. ON CONFLICT on
-- (program_session_id, order_index) keeps the seed re-runnable.

INSERT INTO public.program_slots
  (program_session_id, exercise_id, order_index, sets_min, sets_max, reps_min, reps_max, per_side, slot_notes)
SELECT s.id, e.id, v.order_index, v.sets_min, v.sets_max, v.reps_min, v.reps_max, v.per_side, v.slot_notes
FROM (VALUES
  -- ── two-a-day Day 1 AM ──
  ('two-a-day', 1, 'am', 'leg-press-machine',                  1, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 1, 'am', 'calf-raise-leg-press-machine',       2, 3, 3, 15, 20, FALSE, NULL),
  ('two-a-day', 1, 'am', 'lower-back-extension-calisthenic',   3, 2, 2, 10, 12, FALSE, NULL),
  ('two-a-day', 1, 'am', 'leg-raise-captains-chair',           4, 2, 3, 15, 20, FALSE, NULL),
  -- ── two-a-day Day 1 PM ──
  ('two-a-day', 1, 'pm', 'barbell-press-incline',              1, 3, 3, 6,  8,  FALSE, NULL),
  ('two-a-day', 1, 'pm', 'overhead-tricep-extension-cable',    2, 2, 3, 10, 12, FALSE, NULL),
  ('two-a-day', 1, 'pm', 'shoulder-press-machine-or-dumbbell', 3, 2, 2, 8,  10, FALSE, NULL),
  ('two-a-day', 1, 'pm', 'egyptian-cable-lateral-raise',       4, 3, 3, 15, 20, FALSE, NULL),
  -- ── two-a-day Day 2 AM ──
  ('two-a-day', 2, 'am', 'machine-shrug-plate-loaded',         1, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 2, 'am', 'chest-fly-machine',                  2, 2, 2, 12, 15, FALSE, NULL),
  ('two-a-day', 2, 'am', 'tibia-raise-machine-or-band',        3, 2, 3, 15, 20, FALSE, NULL),
  ('two-a-day', 2, 'am', 'machine-leg-curl-seated',            4, 3, 3, 8,  10, FALSE, NULL),
  -- ── two-a-day Day 2 PM ──
  ('two-a-day', 2, 'pm', 'lat-pulldown-reverse-grip',          1, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 2, 'pm', 'machine-ab-crunch-eccentric-emphasized', 2, 2, 3, 15, 20, FALSE, NULL),
  ('two-a-day', 2, 'pm', 'dumbbell-curl-seated-incline',       3, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 2, 'pm', 'face-pull-cable-rope-grip',          4, 2, 3, 15, 20, FALSE, NULL),
  -- ── two-a-day Day 3 AM ──
  ('two-a-day', 3, 'am', 'bulgarian-split-squat-dumbbell',     1, 2, 2, 8,  10, TRUE,  'Per leg.'),
  ('two-a-day', 3, 'am', 'machine-calf-raise-standing',        2, 3, 3, 15, 20, FALSE, NULL),
  ('two-a-day', 3, 'am', 'straight-arm-cable-pulldown',        3, 2, 3, 12, 15, FALSE, NULL),
  ('two-a-day', 3, 'am', 'leg-raise-captains-chair',           4, 2, 3, 15, 20, FALSE, NULL),
  -- ── two-a-day Day 3 PM ──
  ('two-a-day', 3, 'pm', 'incline-machine-press',              1, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 3, 'pm', 'tricep-dip-machine',                 2, 2, 2, 8,  10, FALSE, NULL),
  ('two-a-day', 3, 'pm', 'dumbbell-overhead-press',            3, 2, 2, 8,  10, FALSE, NULL),
  ('two-a-day', 3, 'pm', 'egyptian-cable-lateral-raise',       4, 3, 3, 15, 20, FALSE, NULL),
  -- ── two-a-day Day 4 AM ──
  ('two-a-day', 4, 'am', 'dumbbell-shrug',                     1, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 4, 'am', 'dumbbell-fly-incline',               2, 2, 2, 12, 15, FALSE, NULL),
  ('two-a-day', 4, 'am', 'tibia-raise-machine-or-band',        3, 2, 3, 15, 20, FALSE, NULL),
  ('two-a-day', 4, 'am', 'machine-leg-curl-seated',            4, 3, 3, 8,  10, FALSE, NULL),
  -- ── two-a-day Day 4 PM ──
  ('two-a-day', 4, 'pm', 'seated-cable-row-v-grip',            1, 3, 3, 8,  10, FALSE, NULL),
  ('two-a-day', 4, 'pm', 'machine-ab-crunch-eccentric-emphasized', 2, 2, 3, 15, 20, FALSE, NULL),
  ('two-a-day', 4, 'pm', 'cable-rope-curl',                    3, 3, 3, 10, 12, FALSE, NULL),
  ('two-a-day', 4, 'pm', 'face-pull-cable-rope-grip',          4, 2, 3, 15, 20, FALSE, NULL),

  -- ── one-a-day Day 1 ──
  ('one-a-day', 1, 'single', 'leg-press-machine',                  1, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 1, 'single', 'calf-raise-leg-press-machine',       2, 3, 3, 15, 20, FALSE, NULL),
  ('one-a-day', 1, 'single', 'leg-raise-captains-chair',           3, 2, 3, 15, 20, FALSE, NULL),
  ('one-a-day', 1, 'single', 'barbell-press-incline',              4, 3, 3, 6,  8,  FALSE, NULL),
  ('one-a-day', 1, 'single', 'overhead-tricep-extension-cable',    5, 2, 3, 10, 12, FALSE, NULL),
  ('one-a-day', 1, 'single', 'shoulder-press-machine-or-dumbbell', 6, 2, 2, 8,  10, FALSE, NULL),
  ('one-a-day', 1, 'single', 'egyptian-cable-lateral-raise',       7, 3, 3, 15, 20, FALSE, NULL),
  -- ── one-a-day Day 2 ──
  ('one-a-day', 2, 'single', 'machine-shrug-plate-loaded',         1, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 2, 'single', 'chest-fly-machine',                  2, 2, 2, 12, 15, FALSE, NULL),
  ('one-a-day', 2, 'single', 'tibia-raise-machine-or-band',        3, 2, 3, 15, 20, FALSE, NULL),
  ('one-a-day', 2, 'single', 'machine-leg-curl-seated',            4, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 2, 'single', 'lat-pulldown-reverse-grip',          5, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 2, 'single', 'dumbbell-curl-seated-incline',       6, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 2, 'single', 'face-pull-cable-rope-grip',          7, 2, 3, 15, 20, FALSE, NULL),
  -- ── one-a-day Day 3 ──
  ('one-a-day', 3, 'single', 'bulgarian-split-squat-dumbbell',     1, 2, 2, 8,  10, TRUE,  'Per leg.'),
  ('one-a-day', 3, 'single', 'machine-calf-raise-standing',        2, 3, 3, 15, 20, FALSE, NULL),
  ('one-a-day', 3, 'single', 'straight-arm-cable-pulldown',        3, 2, 3, 12, 15, FALSE, NULL),
  ('one-a-day', 3, 'single', 'incline-machine-press',              4, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 3, 'single', 'tricep-dip-machine',                 5, 2, 2, 8,  10, FALSE, NULL),
  ('one-a-day', 3, 'single', 'dumbbell-overhead-press',            6, 2, 2, 8,  10, FALSE, NULL),
  ('one-a-day', 3, 'single', 'egyptian-cable-lateral-raise',       7, 3, 3, 15, 20, FALSE, NULL),
  -- ── one-a-day Day 4 ──
  ('one-a-day', 4, 'single', 'dumbbell-fly-incline',               1, 2, 2, 12, 15, FALSE, NULL),
  ('one-a-day', 4, 'single', 'tibia-raise-machine-or-band',        2, 2, 3, 15, 20, FALSE, NULL),
  ('one-a-day', 4, 'single', 'machine-leg-curl-seated',            3, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 4, 'single', 'seated-cable-row-v-grip',            4, 3, 3, 8,  10, FALSE, NULL),
  ('one-a-day', 4, 'single', 'machine-ab-crunch-eccentric-emphasized', 5, 2, 3, 15, 20, FALSE, NULL),
  ('one-a-day', 4, 'single', 'cable-rope-curl',                    6, 3, 3, 10, 12, FALSE, NULL),
  ('one-a-day', 4, 'single', 'face-pull-cable-rope-grip',          7, 2, 3, 15, 20, FALSE, NULL)
) AS v(variant_slug, day_index, session_window, exercise_slug, order_index, sets_min, sets_max, reps_min, reps_max, per_side, slot_notes)
JOIN public.program_schedule_variants var ON var.slug = v.variant_slug
JOIN public.program_days d ON d.program_variant_id = var.id AND d.day_index = v.day_index
JOIN public.program_sessions s ON s.program_day_id = d.id AND s.session_window = v.session_window
JOIN public.exercises e ON e.slug = v.exercise_slug
ON CONFLICT (program_session_id, order_index) DO NOTHING;
