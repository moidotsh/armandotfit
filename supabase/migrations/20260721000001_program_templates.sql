-- armandotfit: program-template hierarchy (template → variant → day → session → slot)
--
-- Context:
--   Today the day→exercise assignments live entirely in TS:
--   shared/exercises/splits.ts (hand-authored ONE_A_DAY_SPLITS and
--   TWO_A_DAY_SPLITS arrays). The one-a-day and two-a-day schedules are
--   intentionally different — one-a-day omits several exercises that exist
--   in the two-a-day AM/PM split, and those omissions are deliberate
--   template data, not a merge of AM+PM. See the design rationale in the
--   Phase 1 editor instructions.
--
--   Phase 1 lands the durable relational model for these templates so future
--   phases can replace the TS-side runtime source without losing the
--   hand-authored structure. The static splits.ts arrays remain the active
--   runtime source until Phase 4 switches every caller to plan-backed
--   session hydration.
--
--   The hierarchy is:
--     ProgramTemplate
--       -> ProgramScheduleVariant
--         -> ProgramDay
--           -> ProgramSession
--             -> ProgramSlot
--               -> exercises.id (real FK, RESTRICT)
--
-- Direction:
--   Adds five new tables. Program slots carry structured prescription
--   (sets_min/sets_max, reps_min/reps_max, per_side, slot_notes). No
--   press_block_id, superset_group_id, or speculative grouping field —
--   slot order_index is sufficient for the current programming.
--
--   User adoption/plan tables are NOT in this migration. Those belong to
--   the later equipment-aware generation phase (Phase 2/3) and need to
--   snapshot this template's version when materializing a user plan.
--
-- Failure mode:
--   All additions are additive. CREATE TABLE IF NOT EXISTS guards. No
--   existing table is touched. RLS enable is idempotent. The DO $$ block
--   guards each policy with pg_policies so re-running is safe even after
--   partial application.
--
-- Idempotency:
--   Every CREATE / policy / grant is wrapped in IF NOT EXISTS or checked
--   in the DO block. The companion seed migration (20260721000002) uses
--   ON CONFLICT DO NOTHING.
--
-- Triangulation:
--   Companion catalog-extensions migration: 20260721000000. Companion seed:
--   20260721000002. TS-side types: shared/types/program.ts (new). Repository
--   read surface: utils/supabase/repositories/ProgramRepository.ts (new).
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: program_templates
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  default_variant_slug TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'retired')),
  display_order INTEGER CHECK (display_order IS NULL OR display_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_templates_status_order
  ON public.program_templates(status, display_order);

COMMENT ON TABLE public.program_templates IS
  'System-owned workout program (e.g. Arman Fit Commercial Gym v1). Has one or more schedule variants. Versioned for non-destructive revisions.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: program_schedule_variants
-- ──────────────────────────────────────────────────────────────────────
-- slug is globally unique so a variant can be looked up by slug alone
-- (e.g. "arman-fit-commercial-gym-v1/one-a-day" can be replaced by the
-- single slug "arman-fit-commercial-gym-v1__one-a-day" if needed; for now
-- we keep variants slug-namespaced by convention, not by composite key).

CREATE TABLE IF NOT EXISTS public.program_schedule_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_template_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  session_window_pattern TEXT NOT NULL CHECK (session_window_pattern IN ('single', 'am-pm')),
  cycle_length_days INTEGER NOT NULL CHECK (cycle_length_days >= 1 AND cycle_length_days <= 14),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'retired')),
  display_order INTEGER CHECK (display_order IS NULL OR display_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_variants_template
  ON public.program_schedule_variants(program_template_id, display_order);

COMMENT ON TABLE public.program_schedule_variants IS
  'Schedule shape under a program (e.g. one-a-day, two-a-day). Each variant owns its own day/session/slot tree — variants are independently authored, not derived.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 3: program_days
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_variant_id UUID NOT NULL REFERENCES public.program_schedule_variants(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL CHECK (day_index >= 1),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_variant_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_program_days_variant
  ON public.program_days(program_variant_id, day_index);

COMMENT ON TABLE public.program_days IS
  'Numbered day within a variant. day_index uniqueness within variant is enforced.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 4: program_sessions
-- ──────────────────────────────────────────────────────────────────────
-- session_window is a planning/display label only — never a clock time.
-- 'single' is the one-a-day case; 'am' and 'pm' are the two-a-day case.
-- A day has either one 'single' session (one-a-day) or one 'am' + one 'pm'
-- session (two-a-day); other combinations are rejected by the
-- single_window_singleton CHECK constraint.

CREATE TABLE IF NOT EXISTS public.program_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id UUID NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
  session_window TEXT NOT NULL CHECK (session_window IN ('am', 'pm', 'single')),
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL CHECK (order_index >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_day_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_program_sessions_day
  ON public.program_sessions(program_day_id, order_index);

-- A 'single'-window day has exactly one session with order_index = 1. AM/PM
-- days have two sessions: order_index 1 = AM, 2 = PM. Enforced by partial
-- uniqueness on (program_day_id) WHERE session_window = 'single'.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'program_sessions_single_window_singleton'
  ) THEN
    ALTER TABLE public.program_sessions
      ADD CONSTRAINT program_sessions_single_window_singleton
      UNIQUE (program_day_id);
  END IF;
END $$;

-- Drop the over-broad singleton if it was just added and replace it with a
-- partial unique index that only fires when a 'single'-window session is
-- present. (AM/PM days legitimately have two rows.) The partial index is
-- created after the constraint so the table is never without a guard.
DROP INDEX IF EXISTS public.idx_program_sessions_single_window;

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_sessions_single_window
  ON public.program_sessions(program_day_id)
  WHERE session_window = 'single';

COMMENT ON TABLE public.program_sessions IS
  'Ordered session within a day. session_window (am | pm | single) is a planning/display label, not a clock time. The actual clock time comes from workout_sessions.started_at / completed_at.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 5: program_slots
-- ──────────────────────────────────────────────────────────────────────
-- The real FK on exercise_id is the live relation. Catalog slugs are used
-- at seed time for lookup; runtime reads the UUID. ON DELETE RESTRICT
-- preserves program templates against accidental catalog deletes (matches
-- the workout_session_exercises precedent).

CREATE TABLE IF NOT EXISTS public.program_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_session_id UUID NOT NULL REFERENCES public.program_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL CHECK (order_index >= 1),
  sets_min INTEGER NOT NULL CHECK (sets_min >= 1),
  sets_max INTEGER NOT NULL CHECK (sets_max >= sets_min),
  reps_min INTEGER NOT NULL CHECK (reps_min >= 0),
  reps_max INTEGER NOT NULL CHECK (reps_max >= reps_min),
  per_side BOOLEAN NOT NULL DEFAULT FALSE,
  slot_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_session_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_program_slots_session
  ON public.program_slots(program_session_id, order_index);

CREATE INDEX IF NOT EXISTS idx_program_slots_exercise
  ON public.program_slots(exercise_id);

COMMENT ON TABLE public.program_slots IS
  'One exercise entry within a session, carrying structured prescription. exercise_id is a real FK to exercises.id (RESTRICT). Catalog slug is the seed-time lookup key, not the runtime relation.';

COMMENT ON COLUMN public.program_slots.sets_min IS
  'Floor of the prescribed set range. The session UI seeds this many sets.';
COMMENT ON COLUMN public.program_slots.sets_max IS
  'Ceiling of the prescribed set range. sets_max >= sets_min is enforced; equal values mean a fixed set count.';
COMMENT ON COLUMN public.program_slots.reps_min IS
  'Floor of the prescribed rep range.';
COMMENT ON COLUMN public.program_slots.reps_max IS
  'Ceiling of the prescribed rep range. reps_max >= reps_min is enforced.';
COMMENT ON COLUMN public.program_slots.per_side IS
  'TRUE when the prescription is per-side (e.g. Bulgarian split squat "2 x 8-10 per leg"). UI doubles the displayed volume; the underlying sets remain flat.';
COMMENT ON COLUMN public.program_slots.slot_notes IS
  'Free-text slot-specific cue or note shown in plan review and session header. Catalog-level cues live in exercise_cues; slot_notes augment, never override.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 6: RLS + grants on program tables
-- ──────────────────────────────────────────────────────────────────────
-- System templates are seed-owned; authenticated users get read-only
-- access. Writes go through the service role / migrations only. Mirrors
-- the existing reference-table policy.

ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_schedule_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_slots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'program_templates' AND policyname = 'Authenticated can read program_templates'
  ) THEN
    CREATE POLICY "Authenticated can read program_templates"
      ON public.program_templates FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'program_schedule_variants' AND policyname = 'Authenticated can read program_schedule_variants'
  ) THEN
    CREATE POLICY "Authenticated can read program_schedule_variants"
      ON public.program_schedule_variants FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'program_days' AND policyname = 'Authenticated can read program_days'
  ) THEN
    CREATE POLICY "Authenticated can read program_days"
      ON public.program_days FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'program_sessions' AND policyname = 'Authenticated can read program_sessions'
  ) THEN
    CREATE POLICY "Authenticated can read program_sessions"
      ON public.program_sessions FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'program_slots' AND policyname = 'Authenticated can read program_slots'
  ) THEN
    CREATE POLICY "Authenticated can read program_slots"
      ON public.program_slots FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

GRANT SELECT ON public.program_templates TO authenticated;
GRANT SELECT ON public.program_schedule_variants TO authenticated;
GRANT SELECT ON public.program_days TO authenticated;
GRANT SELECT ON public.program_sessions TO authenticated;
GRANT SELECT ON public.program_slots TO authenticated;
