-- armandotfit: catalog extensions for movement families, cues, grip options,
-- equipment requirement paths, and directional exercise alternatives.
--
-- Context:
--   The catalog seed (20260718000002 + 20260720000000) ships the exercises,
--   muscles, and equipment_types needed by the static split programming, plus
--   exercise_muscles / exercise_equipment junctions. Phase 1 of the
--   program-template work adds three new structural concepts the existing
--   tables can't represent:
--
--     1. Movement families — a substitution-intent grouping that's distinct
--        from anatomical muscle categories. Two exercises that share a
--        movement family (e.g. "chest-press-incline") are reasonable
--        substitutes even when their equipment differs.
--
--     2. Equipment requirement paths — explicit AND-within-path /
--        OR-across-path semantics. The existing exercise_equipment.isRequired
--        is a flat AND; it can't say "shoulder-press-machine OR dumbbell,"
--        which the catalog needs for the two ambiguous slot names
--        ("Machine or Dumbbell Shoulder Press," "Tibialis Raise").
--
--     3. Directional alternatives — a typed, prioritized substitute list per
--        exercise with tier labels (direct | close | fallback) that the future
--        deterministic substitution algorithm walks in priority order.
--
--   The existing exercise_equipment junction stays as-is (additive); the new
--   path-based tables are the canonical eligibility model for Phase 2+
--   equipment-aware plan generation.
--
-- Direction:
--   Adds six new tables: exercise_families, exercise_cues,
--   exercise_grip_options, exercise_equipment_requirement_paths,
--   exercise_equipment_requirements, exercise_alternatives. Extends the
--   exercises table with display_name, movement_pattern_id, laterality, and
--   catalog_version columns.
--
--   exercise_variations is NOT touched. It still has real consumers
--   (ExerciseRepository.fetchVariationsForExercise, ExerciseWithRelations,
--   app/exercise-detail.tsx). exercise_alternatives is an additive sibling,
--   not a replacement. The two coexist until a later phase migrates callers.
--
-- Failure mode:
--   All additions are additive. ALTER TABLE ... ADD COLUMN IF NOT EXISTS on
--   exercises is safe to re-run. CREATE TABLE IF NOT EXISTS guards the new
--   tables. No data is rewritten, no constraints are dropped, no RLS policy
--   is replaced. Re-running against an already-migrated DB is a no-op.
--
-- Idempotency:
--   IF NOT EXISTS on every CREATE / ALTER / CREATE INDEX / policy / grant.
--   The companion seed migration (20260721000002) uses ON CONFLICT DO
--   NOTHING for its inserts.
--
-- Triangulation:
--   Companion program-templates migration: 20260721000001. Companion seed:
--   20260721000002. TS-side mirror: shared/exercises/data.ts + the
--   ExerciseKey union in shared/exercises/splits.ts (both extended in this
--   change window). Type contracts: shared/types/exercise.ts (extended) and
--   shared/types/program.ts (new). Repository read surface:
--   utils/supabase/repositories/ProgramRepository.ts (new).
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: exercise_families (movement patterns, distinct from anatomical categories)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exercise_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.exercise_families IS
  'Reference: movement-pattern families that drive substitution intent. Distinct from muscle_categories (anatomical). Seeded by 20260721000002.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: extend exercises with display_name, movement pattern, laterality, version
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS movement_pattern_id UUID REFERENCES public.exercise_families(id) ON DELETE SET NULL;
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS laterality TEXT
    CHECK (laterality IS NULL OR laterality IN ('bilateral', 'unilateral', 'either'));
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS catalog_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern
  ON public.exercises(movement_pattern_id);

COMMENT ON COLUMN public.exercises.display_name IS
  'User-facing full label (e.g. "Incline Barbell Press"). Falls back to name when NULL.';
COMMENT ON COLUMN public.exercises.movement_pattern_id IS
  'FK to exercise_families — the substitution-intent movement pattern.';
COMMENT ON COLUMN public.exercises.laterality IS
  'bilateral (both sides together) | unilateral (one side at a time) | either (user choice). NULL on legacy rows until backfilled.';
COMMENT ON COLUMN public.exercises.catalog_version IS
  'Monotonically-increasing version for this catalog row. Bumps when display_name, instructions, tips, or movement_pattern_id change. Lets future plan snapshots record "what the catalog said at the time".';

-- ──────────────────────────────────────────────────────────────────────
-- Step 3: exercise_cues (catalog-level coaching cues)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exercise_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  cue_text TEXT NOT NULL,
  cue_type TEXT NOT NULL CHECK (cue_type IN ('setup', 'execution', 'common-mistake')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_cues_exercise
  ON public.exercise_cues(exercise_id);

COMMENT ON TABLE public.exercise_cues IS
  'Catalog-level coaching cues (setup, execution, common-mistake). Program-slot overrides live in program_slots.slot_notes.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 4: exercise_grip_options (grip + attachment applicability)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exercise_grip_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  grip_slug TEXT NOT NULL,
  attachment_slug TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, grip_slug, attachment_slug)
);

CREATE INDEX IF NOT EXISTS idx_exercise_grip_options_exercise
  ON public.exercise_grip_options(exercise_id);

COMMENT ON TABLE public.exercise_grip_options IS
  'Applicable grip/attachment combinations per exercise. grip_slug and attachment_slug are free-form kebab strings (overhand, underhand, neutral, cable-rope, cable-lat-bar, …).';

-- ──────────────────────────────────────────────────────────────────────
-- Step 5: equipment requirement paths (AND-within-path / OR-across-path)
-- ──────────────────────────────────────────────────────────────────────
-- One exercise → one or more paths. One path → one or more requirements.
-- All requirements within a path must be satisfied together (AND). Satisfying
-- any complete path makes the exercise eligible (OR).
--
-- Example: shoulder-press-machine-or-dumbbell has two paths.
--   Path 1: shoulder-press-machine (1 requirement).
--   Path 2: dumbbell (1 requirement).
-- Either path is sufficient.

CREATE TABLE IF NOT EXISTS public.exercise_equipment_requirement_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  path_index INTEGER NOT NULL CHECK (path_index >= 1),
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, path_index)
);

CREATE INDEX IF NOT EXISTS idx_exercise_requirement_paths_exercise
  ON public.exercise_equipment_requirement_paths(exercise_id);

CREATE TABLE IF NOT EXISTS public.exercise_equipment_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_path_id UUID NOT NULL REFERENCES public.exercise_equipment_requirement_paths(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_path_id, equipment_type_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_requirements_path
  ON public.exercise_equipment_requirements(requirement_path_id);

CREATE INDEX IF NOT EXISTS idx_exercise_requirements_equipment
  ON public.exercise_equipment_requirements(equipment_type_id);

COMMENT ON TABLE public.exercise_equipment_requirement_paths IS
  'OR-across-path grouping of equipment requirements. Each path is one complete way to perform the exercise. Path N+1 is tried only if path N is unsatisfiable for the user.';
COMMENT ON TABLE public.exercise_equipment_requirements IS
  'AND-within-path equipment nodes. All requirements in a path must be satisfied for the path to be eligible.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 6: exercise_alternatives (directional substitution relationships)
-- ──────────────────────────────────────────────────────────────────────
-- Distinct from exercise_variations (which stays). exercise_variations is
-- untyped (variation_type free text) and is consumed by the existing detail
-- page. exercise_alternatives carries typed tiers and a deterministic
-- priority that the substitution algorithm walks.

CREATE TABLE IF NOT EXISTS public.exercise_alternatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alt_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alt_type TEXT NOT NULL CHECK (alt_type IN ('direct', 'close', 'fallback')),
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
  intent_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_exercise_id, alt_exercise_id),
  CONSTRAINT alternative_not_self CHECK (source_exercise_id <> alt_exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_alternatives_source
  ON public.exercise_alternatives(source_exercise_id, alt_type, priority);

CREATE INDEX IF NOT EXISTS idx_exercise_alternatives_alt
  ON public.exercise_alternatives(alt_exercise_id);

COMMENT ON TABLE public.exercise_alternatives IS
  'Directional substitution graph. Walked in (alt_type, priority) order: direct before close before fallback, lower priority first within each tier. Symmetric relationships require two rows.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 7: RLS + grants on new tables
-- ──────────────────────────────────────────────────────────────────────
-- Reference tables: read-only for authenticated. Writes go through the
-- service role / migrations, never client-side. Mirrors the existing
-- muscle_categories / muscles / equipment_types / exercise_variations policy.

ALTER TABLE public.exercise_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_grip_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_equipment_requirement_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_equipment_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_alternatives ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercise_families' AND policyname = 'Authenticated can read exercise_families'
  ) THEN
    CREATE POLICY "Authenticated can read exercise_families"
      ON public.exercise_families FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercise_cues' AND policyname = 'Authenticated can read exercise_cues'
  ) THEN
    CREATE POLICY "Authenticated can read exercise_cues"
      ON public.exercise_cues FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercise_grip_options' AND policyname = 'Authenticated can read exercise_grip_options'
  ) THEN
    CREATE POLICY "Authenticated can read exercise_grip_options"
      ON public.exercise_grip_options FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercise_equipment_requirement_paths' AND policyname = 'Authenticated can read exercise_equipment_requirement_paths'
  ) THEN
    CREATE POLICY "Authenticated can read exercise_equipment_requirement_paths"
      ON public.exercise_equipment_requirement_paths FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercise_equipment_requirements' AND policyname = 'Authenticated can read exercise_equipment_requirements'
  ) THEN
    CREATE POLICY "Authenticated can read exercise_equipment_requirements"
      ON public.exercise_equipment_requirements FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercise_alternatives' AND policyname = 'Authenticated can read exercise_alternatives'
  ) THEN
    CREATE POLICY "Authenticated can read exercise_alternatives"
      ON public.exercise_alternatives FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT ON public.exercise_families TO authenticated;
GRANT SELECT ON public.exercise_cues TO authenticated;
GRANT SELECT ON public.exercise_grip_options TO authenticated;
GRANT SELECT ON public.exercise_equipment_requirement_paths TO authenticated;
GRANT SELECT ON public.exercise_equipment_requirements TO authenticated;
GRANT SELECT ON public.exercise_alternatives TO authenticated;
