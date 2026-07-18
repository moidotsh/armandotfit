-- armandotfit: seed system exercise library
--
-- Context:
--   The squashed baseline (00000000000000_initial_schema.sql) is schema-only
--   by design (mirrors qep-tracker's 2026-06-21 squash discipline). This
--   migration is the first data seed and the only one expected for the
--   v2 ship: it loads the 28 system exercises + their reference data
--   (muscle_categories, muscles, equipment_types) + the junction rows
--   (exercise_muscles, exercise_equipment) that map exercises to their
--   muscles and equipment.
--
--   Ported from archive-v1/data/{workoutDataRefactored,exercise-detail-
--   enhanced}.ts. The 7 exercises with v1 detailed metadata carry their
--   full muscle/equipment assignments; the remaining 21 have name +
--   category + type + difficulty + instructions + tips but no junction
--   rows yet (those accrue via admin tooling or user contributions).
--
-- Direction:
--   Adds a UNIQUE `slug` column to muscle_categories, muscles,
--   equipment_types, and exercises. Slugs match the TS-side ExerciseKey
--   union in shared/exercises/splits.ts so the suggested-exercises helper
--   can hydrate keys against repository cache without UUID round-trips.
--   Slug is the stable identifier across DB resets; UUID is the runtime
--   join key. slug is NULL-able (existing user-created rows get NULL)
--   but system seed rows always set it.
--
-- Idempotency:
--   ON CONFLICT (slug) DO NOTHING on every INSERT. Re-running the seed
--   against an already-populated DB is safe. ON CONFLICT (name) DO
--   NOTHING for tables where slug was just added (the conflict target
--   is the pre-existing name UNIQUE constraint).
--
-- Triangulation:
--   Plan a-Phase 5 step 2 (exercise library). Closes the gap between
--   the TS-side splits.ts (typed day→exercise-keys assignments) and the
--   DB-side ExerciseRepository (returns exercises by UUID) by giving
--   both layers a shared slug vocabulary.
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: add slug columns to reference + exercise tables
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.muscle_categories
  ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.muscle_categories
  ADD CONSTRAINT muscle_categories_slug_unique UNIQUE (slug);

ALTER TABLE public.muscles
  ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.muscles
  ADD CONSTRAINT muscles_slug_unique UNIQUE (slug);

ALTER TABLE public.equipment_types
  ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.equipment_types
  ADD CONSTRAINT equipment_types_slug_unique UNIQUE (slug);

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_slug_unique UNIQUE (slug);

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: muscle categories
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.muscle_categories (slug, name, display_name) VALUES
  ('chest',      'Chest',      'Chest'),
  ('back',       'Back',       'Back'),
  ('shoulders',  'Shoulders',  'Shoulders'),
  ('arms',       'Arms',       'Arms'),
  ('core',       'Core',       'Core'),
  ('legs',       'Legs',       'Legs')
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 3: muscles (22 rows, each mapped to its category by slug)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.muscles (slug, name, display_name, muscle_category_id) VALUES
  ('chest',         'Chest',           'Chest',           (SELECT id FROM public.muscle_categories WHERE slug = 'chest')),
  ('upper-chest',   'Upper Chest',     'Upper Chest',     (SELECT id FROM public.muscle_categories WHERE slug = 'chest')),
  ('lower-chest',   'Lower Chest',     'Lower Chest',     (SELECT id FROM public.muscle_categories WHERE slug = 'chest')),
  ('upper-back',    'Upper Back',      'Upper Back',      (SELECT id FROM public.muscle_categories WHERE slug = 'back')),
  ('lats',          'Lats',            'Lats',            (SELECT id FROM public.muscle_categories WHERE slug = 'back')),
  ('lower-back',    'Lower Back',      'Lower Back',      (SELECT id FROM public.muscle_categories WHERE slug = 'back')),
  ('traps',         'Trapezius',       'Trapezius',       (SELECT id FROM public.muscle_categories WHERE slug = 'back')),
  ('rhomboids',     'Rhomboids',       'Rhomboids',       (SELECT id FROM public.muscle_categories WHERE slug = 'back')),
  ('front-delts',   'Front Deltoids',  'Front Deltoids',  (SELECT id FROM public.muscle_categories WHERE slug = 'shoulders')),
  ('side-delts',    'Side Deltoids',   'Side Deltoids',   (SELECT id FROM public.muscle_categories WHERE slug = 'shoulders')),
  ('rear-delts',    'Rear Deltoids',   'Rear Deltoids',   (SELECT id FROM public.muscle_categories WHERE slug = 'shoulders')),
  ('biceps',        'Biceps',          'Biceps',          (SELECT id FROM public.muscle_categories WHERE slug = 'arms')),
  ('triceps',       'Triceps',         'Triceps',         (SELECT id FROM public.muscle_categories WHERE slug = 'arms')),
  ('forearms',      'Forearms',        'Forearms',        (SELECT id FROM public.muscle_categories WHERE slug = 'arms')),
  ('abs',           'Abs',             'Abs',             (SELECT id FROM public.muscle_categories WHERE slug = 'core')),
  ('lower-abs',     'Lower Abs',       'Lower Abs',       (SELECT id FROM public.muscle_categories WHERE slug = 'core')),
  ('obliques',      'Obliques',        'Obliques',        (SELECT id FROM public.muscle_categories WHERE slug = 'core')),
  ('quads',         'Quadriceps',      'Quadriceps',      (SELECT id FROM public.muscle_categories WHERE slug = 'legs')),
  ('hamstrings',    'Hamstrings',      'Hamstrings',      (SELECT id FROM public.muscle_categories WHERE slug = 'legs')),
  ('glutes',        'Glutes',          'Glutes',          (SELECT id FROM public.muscle_categories WHERE slug = 'legs')),
  ('calves',        'Calves',          'Calves',          (SELECT id FROM public.muscle_categories WHERE slug = 'legs')),
  ('tibialis',      'Tibialis',        'Tibialis',        (SELECT id FROM public.muscle_categories WHERE slug = 'legs'))
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 4: equipment types (28 rows)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.equipment_types (slug, name, display_name, category) VALUES
  ('barbell',                 'Barbell',                 'Barbell',                 'free_weight'),
  ('dumbbell',                'Dumbbell',                'Dumbbell',                'free_weight'),
  ('kettlebell',              'Kettlebell',              'Kettlebell',              'free_weight'),
  ('incline-bench',           'Incline Bench',           'Incline Bench',           'accessory'),
  ('flat-bench',              'Flat Bench',              'Flat Bench',              'accessory'),
  ('decline-bench',           'Decline Bench',           'Decline Bench',           'accessory'),
  ('squat-rack',              'Squat Rack',              'Squat Rack',              'accessory'),
  ('pull-up-bar',             'Pull-up Bar',             'Pull-up Bar',             'calisthenic'),
  ('cable-rope',              'Cable Rope',              'Cable Rope',              'cable'),
  ('cable-handle',            'Cable Handle',            'Cable Handle',            'cable'),
  ('cable-straight-bar',      'Cable Straight Bar',      'Cable Straight Bar',      'cable'),
  ('cable-v-bar',             'Cable V-Bar',             'Cable V-Bar',             'cable'),
  ('cable-lat-bar',           'Cable Lat Bar',           'Cable Lat Bar',           'cable'),
  ('leg-press-machine',       'Leg Press Machine',       'Leg Press Machine',       'machine'),
  ('chest-fly-machine',       'Chest Fly Machine',       'Chest Fly Machine',       'machine'),
  ('lat-pulldown-machine',    'Lat Pulldown Machine',    'Lat Pulldown Machine',    'machine'),
  ('seated-row-machine',      'Seated Row Machine',      'Seated Row Machine',      'machine'),
  ('leg-extension-machine',   'Leg Extension Machine',   'Leg Extension Machine',   'machine'),
  ('leg-curl-machine',        'Leg Curl Machine',        'Leg Curl Machine',        'machine'),
  ('hip-adduction-machine',   'Hip Adduction Machine',   'Hip Adduction Machine',   'machine'),
  ('calf-raise-machine',      'Calf Raise Machine',      'Calf Raise Machine',      'machine'),
  ('tricep-extension-machine','Tricep Extension Machine','Tricep Extension Machine','machine'),
  ('dip-machine',             'Dip Machine',             'Dip Machine',             'machine'),
  ('abdominal-machine',       'Abdominal Machine',       'Abdominal Machine',       'machine'),
  ('back-extension-station',  'Back Extension Station',  'Back Extension Station',  'calisthenic'),
  ('captains-chair',          'Captain''s Chair',        'Captain''s Chair',        'calisthenic'),
  ('resistance-band',         'Resistance Band',         'Resistance Band',         'accessory'),
  ('tibia-raise-machine',     'Tibia Raise Machine',     'Tibia Raise Machine',     'machine')
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 5: 28 system exercises
-- ──────────────────────────────────────────────────────────────────────
-- slug matches the ExerciseKey union in shared/exercises/splits.ts.
-- is_system_exercise = TRUE; created_by_user_id = NULL (per the
-- system_exercises_have_no_creator CHECK constraint).

INSERT INTO public.exercises
  (slug, name, description, exercise_type, difficulty_level, instructions, tips, is_system_exercise) VALUES
  -- Chest
  ('barbell-press-incline', 'Barbell Press',  'Lie on an incline bench and press the barbell upward, focusing on upper chest activation.',
   'free_weight', 'advanced',
   'Set the incline to 30–45°. Grip slightly wider than shoulder-width. Lower the bar to the upper chest, then press up to full extension.',
   'Keep your lower back slightly arched; lower the bar to the upper part of your chest; ensure your elbows don''t flare too much.',
   TRUE),
  ('dumbbell-press-incline', 'Dumbbell Press', 'Perform a pressing movement with dumbbells while lying on an incline bench to target the upper chest.',
   'free_weight', 'advanced',
   'Set the incline to 30–45°. Press the dumbbells from shoulder-level to overhead in a controlled arc.',
   'Allow for a deeper stretch at the bottom compared to barbell; control the dumbbells throughout; keep elbows at a 45-degree angle from your torso.',
   TRUE),
  ('dumbbell-fly-incline', 'Dumbbell Fly', 'Perform a fly movement with arms slightly bent while lying on an incline bench.',
   'free_weight', 'intermediate',
   'With a slight elbow bend, lower the dumbbells in a wide arc until you feel a chest stretch, then squeeze back up.',
   'Keep a slight bend in your elbows throughout; focus on the stretch in your chest at the bottom; imagine you''re hugging a barrel on the way up.',
   TRUE),
  ('chest-fly-machine', 'Chest Fly', 'Use the chest fly machine to perform a controlled fly movement that isolates the chest muscles.',
   'machine', 'beginner',
   'Adjust the seat so handles align with chest height. Bring the pads together in a wide arc and squeeze, then return under control.',
   'Adjust the seat height so handles align with chest; focus on squeezing your chest at the peak of contraction; control the eccentric phase.',
   TRUE),
  -- Arms
  ('overhead-tricep-extension-cable', 'Tricep Extension', 'Using a rope attachment on a cable machine, extend your arms overhead to work the triceps.',
   'cable', 'intermediate',
   'Attach a rope to a low pulley. Facing away, press the rope overhead to full tricep extension.',
   'Keep your upper arms stationary and close to your head; fully extend your elbows at the end of the movement; control the weight on the way back.',
   TRUE),
  ('tricep-kickback-cable', 'Tricep Kickback', 'Using a cable machine with a single handle, extend your arm backward while keeping the upper arm parallel to the floor.',
   'cable', 'intermediate',
   'With a single-handle attachment, hinge at the hips and extend the elbow back to full straightening.',
   'Keep your upper arm stationary and parallel to the floor; fully extend the elbow at the end of the movement; maintain a neutral spine position.',
   TRUE),
  ('tricep-dip-machine', 'Tricep Dip', 'Using a machine, perform dips to primarily target the triceps muscles.',
   'machine', 'intermediate',
   'Sit upright on the assisted dip machine. Press the handles down to full arm extension.',
   'Keep your elbows tucked in to target triceps; control the descent without bouncing at the bottom; don''t lock out the elbows at the top.',
   TRUE),
  ('reverse-plus-hammer-curl-superset', 'Reverse + Hammer', 'Superset of reverse-grip curls and hammer curls for bicep and forearm development.',
   'free_weight', 'intermediate',
   'Perform reverse curls to failure, immediately followed by hammer curls with the same dumbbells.',
   'Keep wrists neutral; avoid swinging; superset means no rest between the two movements.',
   TRUE),
  ('dumbbell-curl-seated-incline', 'Dumbbell Curl', 'Seated incline dumbbell curl with arms hanging behind the torso for a deep bicep stretch.',
   'free_weight', 'intermediate',
   'Set incline to 30–45°. With dumbbells at arm''s length behind you, curl up without swinging.',
   'Let the arms hang fully at the bottom; squeeze at the top; avoid leaning forward to lift heavier.',
   TRUE),
  -- Shoulders
  ('lateral-raise-cable', 'Lateral Raise', 'Using a cable machine with a single handle attachment, raise your arm out to the side to target the lateral deltoid.',
   'cable', 'intermediate',
   'Stand side-on to a low pulley. Raise the handle out to the side to shoulder height.',
   'Keep a slight bend in the elbow; lead with the elbow, not the hand; maintain an upright posture throughout.',
   TRUE),
  ('dumbbell-lateral-raise-standing', 'Lateral Raise', 'Standing dumbbell lateral raise to target the side deltoid.',
   'free_weight', 'beginner',
   'With dumbbells at your sides, raise them out to shoulder height with a slight elbow bend.',
   'Avoid shrugging; lead with elbows; lower slowly.',
   TRUE),
  ('reverse-flyes-cable', 'Reverse Flyes', 'Cable reverse fly to target the rear deltoids and upper back.',
   'cable', 'intermediate',
   'Using two crossed cables at shoulder height, pull the handles backward in a hugging-reverse motion.',
   'Squeeze the shoulder blades together; keep a slight elbow bend; avoid using the lower back.',
   TRUE),
  ('face-pull-cable-rope-grip', 'Face Pull', 'Cable face pull with a rope attachment for rear delts and rotator cuff health.',
   'cable', 'intermediate',
   'Set the pulley to face height. Pull the rope toward your face, splitting the ends outward.',
   'Keep the upper arms parallel to the floor; externally rotate at the top; use a moderate weight.',
   TRUE),
  -- Back
  ('lower-back-extension-calisthenic', 'Back Extension', 'Bodyweight back extension on a Roman chair to target the lower back.',
   'calisthenic', 'beginner',
   'Mount the back-extension station. Hinge at the hips, lower the torso, then raise back to neutral.',
   'Avoid hyperextension; move with control, not momentum; engage the glutes mildly at the top.',
   TRUE),
  ('seated-cable-row-v-grip', 'Seated Cable Row', 'Seated cable row with a V-grip attachment targeting the lats and upper back.',
   'cable', 'intermediate',
   'Sit upright at the cable row station. Pull the V-grip to your lower chest, squeezing the shoulder blades.',
   'Keep the torso upright; lead with the elbows; full stretch at the bottom without rounding the spine.',
   TRUE),
  ('lat-pulldown-reverse-grip', 'Lat Pulldown', 'Lat pulldown with a shoulder-width reverse (underhand) grip to bias the lats and biceps.',
   'cable', 'intermediate',
   'Grip the bar shoulder-width with palms facing you. Pull to the upper chest, then control back up.',
   'Lead with the elbows; avoid leaning back excessively; full overhead stretch at the top.',
   TRUE),
  ('dumbbell-pullover-bridge-position', 'Dumbbell Pullover', 'Dumbbell pullover performed across a flat bench in a bridge position to target the lats.',
   'free_weight', 'intermediate',
   'Lie upper-back across a flat bench, hips up in a bridge. Lower a single dumbbell overhead, then pull back over the chest.',
   'Keep a slight elbow bend; focus on the lat stretch at the bottom; avoid letting the hips sag.',
   TRUE),
  ('lever-row-chest-supported', 'Lever Row', 'Chest-supported lever row machine targeting the lats and upper back without lower-back load.',
   'machine', 'advanced',
   'Lie chest-down on the support pad. Pull both handles to your sides, squeezing the shoulder blades.',
   'Lead with the elbows; keep the chest against the pad; pause at the peak for a one-count.',
   TRUE),
  -- Upper leg
  ('leg-press-machine', 'Leg Press', 'Push weight away from your body using your legs on a leg press machine.',
   'machine', 'advanced',
   'Sit in the leg press with feet shoulder-width on the platform. Lower to ~90°, then press back up.',
   'Don''t lock out your knees at the top; place feet shoulder-width apart for balanced development; lower until your knees reach about 90 degrees.',
   TRUE),
  ('bulgarian-split-squat-dumbbell', 'Bulgarian Split Squat', 'Dumbbell split squat with the rear foot elevated on a bench, targeting the quads and glutes.',
   'free_weight', 'advanced',
   'Hold dumbbells. Place rear foot on a bench behind you. Lower the front thigh to parallel, then drive up.',
   'Track the front knee over the toe; keep the torso upright; control the descent.',
   TRUE),
  ('machine-leg-curl-seated', 'Machine Leg Curl', 'Seated leg curl machine targeting the hamstrings.',
   'machine', 'beginner',
   'Sit on the leg curl. Hook the lower pad above the heels. Curl backward by bending the knees.',
   'Squeeze the hamstrings at peak contraction; avoid jerking; control the negative.',
   TRUE),
  ('leg-extension-machine', 'Leg Extension', 'Leg extension machine isolating the quadriceps.',
   'machine', 'beginner',
   'Sit in the leg extension. Hook the pad at the shins. Extend the knees to full straightening.',
   'Pause at the top; avoid kicking the weight up; control the descent.',
   TRUE),
  ('hip-adduction-machine', 'Hip Adduction', 'Seated hip adduction machine targeting the inner thigh (adductors).',
   'machine', 'beginner',
   'Sit on the adduction machine. Press the pads inward by squeezing the inner thighs.',
   'Keep the spine neutral; pause at peak contraction; control the return.',
   TRUE),
  -- Lower leg
  ('tibia-raise-machine-or-band', 'Tibia Raise', 'Raise your foot upward against resistance to target the tibialis anterior.',
   'calisthenic', 'beginner',
   'Anchor a band or use a tib-raise machine. Dorsiflex the foot against resistance.',
   'Focus on the pulling motion from your foot, not your leg; control both phases; can be performed seated or standing.',
   TRUE),
  ('calf-raise-leg-press-machine', 'Calf Raise', 'Calf raise performed on the leg press platform.',
   'machine', 'beginner',
   'Sit in the leg press. Place the balls of the feet on the lower edge of the platform. Press away via ankle plantarflexion.',
   'Full range of motion at the ankle; pause at peak contraction; avoid bouncing.',
   TRUE),
  ('machine-calf-raise-standing', 'Machine Calf Raise', 'Standing calf raise machine targeting the gastrocnemius.',
   'machine', 'beginner',
   'Stand in the calf raise machine. Lower the heels fully, then press up to the toes.',
   'Full stretch at the bottom; pause at peak; avoid bouncing.',
   TRUE),
  -- Abs
  ('leg-raise-captains-chair', 'Leg Raise', 'Support yourself on a captain''s chair and raise your legs upward to target the lower abdominals.',
   'calisthenic', 'advanced',
   'Support the forearms on the captain''s chair pads. Raise the legs to hip height, then lower under control.',
   'Avoid swinging or using momentum; try to curl your pelvis upward at the top; control the descent rather than dropping your legs.',
   TRUE),
  ('machine-ab-crunch-eccentric-emphasized', 'Machine Ab Crunch', 'Ab crunch machine with a slow eccentric phase to bias the rectus abdominis.',
   'machine', 'intermediate',
   'Sit in the ab crunch machine. Crunch forward with a 3-second negative.',
   'Squeeze at peak contraction; control the negative for 3 seconds; avoid using the hip flexors.',
   TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 6: exercise_muscles junctions (primary + secondary)
-- ──────────────────────────────────────────────────────────────────────
-- Joins by slug so re-runs are deterministic regardless of UUID.

INSERT INTO public.exercise_muscles (exercise_id, muscle_id, is_primary)
SELECT e.id, m.id, j.is_primary
FROM (VALUES
  -- barbell-press-incline
  ('barbell-press-incline', 'upper-chest',   TRUE),
  ('barbell-press-incline', 'front-delts',   TRUE),
  ('barbell-press-incline', 'triceps',       FALSE),
  ('barbell-press-incline', 'chest',         FALSE),
  -- dumbbell-press-incline
  ('dumbbell-press-incline', 'upper-chest',  TRUE),
  ('dumbbell-press-incline', 'front-delts',  TRUE),
  ('dumbbell-press-incline', 'triceps',      FALSE),
  ('dumbbell-press-incline', 'chest',        FALSE),
  -- dumbbell-fly-incline
  ('dumbbell-fly-incline', 'upper-chest',    TRUE),
  ('dumbbell-fly-incline', 'chest',          TRUE),
  ('dumbbell-fly-incline', 'front-delts',    FALSE),
  -- chest-fly-machine
  ('chest-fly-machine', 'chest',             TRUE),
  ('chest-fly-machine', 'front-delts',       FALSE),
  -- overhead-tricep-extension-cable
  ('overhead-tricep-extension-cable', 'triceps', TRUE),
  -- tricep-kickback-cable
  ('tricep-kickback-cable', 'triceps',       TRUE),
  -- tricep-dip-machine
  ('tricep-dip-machine', 'triceps',          TRUE),
  ('tricep-dip-machine', 'chest',            FALSE),
  ('tricep-dip-machine', 'front-delts',      FALSE),
  -- reverse-plus-hammer-curl-superset
  ('reverse-plus-hammer-curl-superset', 'biceps',   TRUE),
  ('reverse-plus-hammer-curl-superset', 'forearms', TRUE),
  -- dumbbell-curl-seated-incline
  ('dumbbell-curl-seated-incline', 'biceps',  TRUE),
  ('dumbbell-curl-seated-incline', 'forearms', FALSE),
  -- lateral-raise-cable
  ('lateral-raise-cable', 'side-delts',      TRUE),
  ('lateral-raise-cable', 'front-delts',     FALSE),
  ('lateral-raise-cable', 'traps',           FALSE),
  -- dumbbell-lateral-raise-standing
  ('dumbbell-lateral-raise-standing', 'side-delts',  TRUE),
  ('dumbbell-lateral-raise-standing', 'front-delts', FALSE),
  -- reverse-flyes-cable
  ('reverse-flyes-cable', 'rear-delts',      TRUE),
  ('reverse-flyes-cable', 'upper-back',      FALSE),
  ('reverse-flyes-cable', 'rhomboids',       FALSE),
  -- face-pull-cable-rope-grip
  ('face-pull-cable-rope-grip', 'rear-delts', TRUE),
  ('face-pull-cable-rope-grip', 'traps',     FALSE),
  ('face-pull-cable-rope-grip', 'rhomboids', FALSE),
  -- lower-back-extension-calisthenic
  ('lower-back-extension-calisthenic', 'lower-back', TRUE),
  ('lower-back-extension-calisthenic', 'glutes',     FALSE),
  ('lower-back-extension-calisthenic', 'hamstrings', FALSE),
  -- seated-cable-row-v-grip
  ('seated-cable-row-v-grip', 'lats',        TRUE),
  ('seated-cable-row-v-grip', 'upper-back',  TRUE),
  ('seated-cable-row-v-grip', 'biceps',      FALSE),
  ('seated-cable-row-v-grip', 'rhomboids',   FALSE),
  -- lat-pulldown-reverse-grip
  ('lat-pulldown-reverse-grip', 'lats',       TRUE),
  ('lat-pulldown-reverse-grip', 'biceps',     FALSE),
  ('lat-pulldown-reverse-grip', 'upper-back', FALSE),
  -- dumbbell-pullover-bridge-position
  ('dumbbell-pullover-bridge-position', 'lats',   TRUE),
  ('dumbbell-pullover-bridge-position', 'chest',  FALSE),
  ('dumbbell-pullover-bridge-position', 'triceps', FALSE),
  -- lever-row-chest-supported
  ('lever-row-chest-supported', 'lats',       TRUE),
  ('lever-row-chest-supported', 'upper-back', TRUE),
  ('lever-row-chest-supported', 'biceps',     FALSE),
  -- leg-press-machine
  ('leg-press-machine', 'quads',     TRUE),
  ('leg-press-machine', 'glutes',    TRUE),
  ('leg-press-machine', 'hamstrings', FALSE),
  ('leg-press-machine', 'calves',    FALSE),
  -- bulgarian-split-squat-dumbbell
  ('bulgarian-split-squat-dumbbell', 'quads',     TRUE),
  ('bulgarian-split-squat-dumbbell', 'glutes',    TRUE),
  ('bulgarian-split-squat-dumbbell', 'hamstrings', FALSE),
  -- machine-leg-curl-seated
  ('machine-leg-curl-seated', 'hamstrings', TRUE),
  -- leg-extension-machine
  ('leg-extension-machine', 'quads', TRUE),
  -- hip-adduction-machine
  ('hip-adduction-machine', 'glutes', TRUE),
  -- tibia-raise-machine-or-band
  ('tibia-raise-machine-or-band', 'tibialis', TRUE),
  -- calf-raise-leg-press-machine
  ('calf-raise-leg-press-machine', 'calves', TRUE),
  -- machine-calf-raise-standing
  ('machine-calf-raise-standing', 'calves', TRUE),
  -- leg-raise-captains-chair
  ('leg-raise-captains-chair', 'lower-abs', TRUE),
  ('leg-raise-captains-chair', 'abs',       TRUE),
  ('leg-raise-captains-chair', 'obliques',  FALSE),
  ('leg-raise-captains-chair', 'quads',     FALSE),
  -- machine-ab-crunch-eccentric-emphasized
  ('machine-ab-crunch-eccentric-emphasized', 'abs', TRUE)
) AS j(exercise_slug, muscle_slug, is_primary)
JOIN public.exercises e ON e.slug = j.exercise_slug
JOIN public.muscles   m ON m.slug = j.muscle_slug
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Step 7: exercise_equipment junctions
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercise_equipment (exercise_id, equipment_type_id, is_required)
SELECT e.id, et.id, j.is_required
FROM (VALUES
  ('barbell-press-incline',                 'barbell',                 TRUE),
  ('barbell-press-incline',                 'incline-bench',           TRUE),
  ('dumbbell-press-incline',                'dumbbell',                TRUE),
  ('dumbbell-press-incline',                'incline-bench',           TRUE),
  ('dumbbell-fly-incline',                  'dumbbell',                TRUE),
  ('dumbbell-fly-incline',                  'incline-bench',           TRUE),
  ('chest-fly-machine',                     'chest-fly-machine',       TRUE),
  ('overhead-tricep-extension-cable',       'cable-rope',              TRUE),
  ('tricep-kickback-cable',                 'cable-handle',            TRUE),
  ('tricep-dip-machine',                    'tricep-extension-machine', TRUE),
  ('reverse-plus-hammer-curl-superset',     'dumbbell',                TRUE),
  ('dumbbell-curl-seated-incline',          'dumbbell',                TRUE),
  ('dumbbell-curl-seated-incline',          'incline-bench',           TRUE),
  ('lateral-raise-cable',                   'cable-handle',            TRUE),
  ('dumbbell-lateral-raise-standing',       'dumbbell',                TRUE),
  ('reverse-flyes-cable',                   'cable-handle',            TRUE),
  ('face-pull-cable-rope-grip',             'cable-rope',              TRUE),
  ('lower-back-extension-calisthenic',      'back-extension-station',  TRUE),
  ('seated-cable-row-v-grip',               'cable-v-bar',             TRUE),
  ('lat-pulldown-reverse-grip',             'cable-lat-bar',           TRUE),
  ('dumbbell-pullover-bridge-position',     'dumbbell',                TRUE),
  ('dumbbell-pullover-bridge-position',     'flat-bench',              TRUE),
  ('lever-row-chest-supported',             'seated-row-machine',      TRUE),
  ('leg-press-machine',                     'leg-press-machine',       TRUE),
  ('bulgarian-split-squat-dumbbell',        'dumbbell',                TRUE),
  ('bulgarian-split-squat-dumbbell',        'flat-bench',              TRUE),
  ('machine-leg-curl-seated',               'leg-curl-machine',        TRUE),
  ('leg-extension-machine',                 'leg-extension-machine',   TRUE),
  ('hip-adduction-machine',                 'hip-adduction-machine',   TRUE),
  ('tibia-raise-machine-or-band',           'tibia-raise-machine',     FALSE),
  ('tibia-raise-machine-or-band',           'resistance-band',         FALSE),
  ('calf-raise-leg-press-machine',          'leg-press-machine',       TRUE),
  ('machine-calf-raise-standing',           'calf-raise-machine',      TRUE),
  ('leg-raise-captains-chair',              'captains-chair',          TRUE),
  ('machine-ab-crunch-eccentric-emphasized','abdominal-machine',       TRUE)
) AS j(exercise_slug, equipment_slug, is_required)
JOIN public.exercises      e  ON e.slug = j.exercise_slug
JOIN public.equipment_types et ON et.slug = j.equipment_slug
ON CONFLICT (exercise_id, equipment_type_id) DO NOTHING;
