-- Greenslate rebuild: exercise/logging core.
--
-- WHY (multi-line, per migration-header convention):
--   The owner confirmed zero production history (no real users, no logged
--   workouts worth preserving). The prior 34-table schema (Phase 1-6:
--   program templates, user plans, eligibility, capabilities, presets,
--   trigger-maintained analytics) is replaced by the blank-slate logging
--   design: five tables, coarse exercise identity, tag-based context,
--   progression computed at read time — never stored.
--
--   The one surviving asset is the AM/PM training program, which lives in
--   TypeScript (shared/exercises/splits.ts) and is reshaped onto coarse
--   identities with suggested tags. It is NOT modeled in the database.
--
--   This file is both (a) the apply-path migration for the existing
--   Supabase project and (b) the content of the collapsed single baseline
--   that replaces all prior migrations once approved.
--
-- Design rules enforced here:
--   1. Five tables only: users, exercises, sessions, logged_exercises,
--      logged_sets. Nothing else.
--   2. History stores raw facts. No derived values, no aggregates, no
--      analytics triggers — streaks, PRs, and progression are computed
--      at read time from these rows.
--   3. Realization context (grip, attachment, machine, stance, execution
--      style) is captured as free-form tags on logged_exercises — never
--      as catalog dimensions or per-dimension columns.
--   4. No CHECK constraints on vocabulary anywhere. Tag values and
--      exercise names extend without migrations.
--   5. RLS is owner-only throughout; system exercise rows (user_id NULL)
--      are readable by all authenticated users, writable by no one.

-- ──────────────────────────────────────────────────────────────────────
-- Drop the prior schema entirely (all 34 tables, all helper functions)
-- ──────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS
  public.user_equipment_setup_presets,
  public.user_program_plan_slot_overrides,
  public.user_program_plan_slots,
  public.user_program_plans,
  public.program_slots,
  public.program_sessions,
  public.program_days,
  public.program_schedule_variants,
  public.program_templates,
  public.user_equipment_capabilities,
  public.user_available_equipment,
  public.exercise_grip_options,
  public.exercise_cues,
  public.exercise_alternatives,
  public.exercise_equipment_requirement_paths,
  public.exercise_equipment_requirements,
  public.exercise_families,
  public.exercise_variations,
  public.user_analytics,
  public.exercise_sets,
  public.workout_session_exercises,
  public.workout_sessions,
  public.user_favorite_exercises,
  public.exercise_equipment,
  public.exercise_muscles,
  public.muscles,
  public.muscle_categories,
  public.equipment_types,
  public.exercises,
  public.profiles,
  public.user_stations
CASCADE;

-- The old schema's signup trigger on auth.users references
-- handle_new_user — drop it first or the function drop fails.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_analytics();
DROP FUNCTION IF EXISTS public.calculate_user_streaks(UUID);
DROP FUNCTION IF EXISTS public.set_user_program_plan_updated_at();
DROP FUNCTION IF EXISTS public.set_user_equipment_setup_preset_updated_at();

-- ──────────────────────────────────────────────────────────────────────
-- users — one row per authenticated lifter
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  weight_unit TEXT NOT NULL DEFAULT 'kg',
  -- Day-of-week rest days (0=Sun..6=Sat, matching JS Date.getDay()).
  -- Carried over from the prior schema: drives the rest-day deactivation
  -- in the split picker. UI-only preference, never queried by analytics.
  rest_days INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rest_days_valid CHECK (rest_days <@ ARRAY[0,1,2,3,4,5,6]::integer[])
);

-- Auto-create the users row on signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────
-- exercises — coarse identities only
--   Equipment class and body angle live in the NAME when the lifter would
--   name them without thinking ("incline barbell press", "machine chest
--   fly"). Grip, attachment, machine instance, stance, and execution style
--   are tags at log time, never identity. user_id NULL = system seed row.
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (user_id, name)
);

-- ──────────────────────────────────────────────────────────────────────
-- sessions — one row per training session (AM and PM are two sessions)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  -- Day-of-split (1..4) this session realized. Carried over from the prior
  -- schema: drives the rolling day-of-split picker. Nullable — ad-hoc
  -- sessions (rest-day extras) legitimately have none.
  split_day INTEGER CHECK (split_day BETWEEN 1 AND 4)
);

-- ──────────────────────────────────────────────────────────────────────
-- logged_exercises — one row per exercise within a session.
--   tags: normalized free-form strings (autocomplete from the user's own
--   history). The ONLY context mechanism — no per-dimension columns.
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.logged_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 1),
  tags TEXT[] NOT NULL DEFAULT '{}',
  note TEXT
);

-- ──────────────────────────────────────────────────────────────────────
-- logged_sets — one row per completed set. A row existing means the set
--   was done. No completed flag, no target reps, no rest columns.
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.logged_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_exercise_id UUID NOT NULL REFERENCES public.logged_exercises(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1),
  reps INTEGER NOT NULL CHECK (reps >= 0),
  weight NUMERIC(7,2) NOT NULL CHECK (weight >= 0),
  note TEXT
);

-- ──────────────────────────────────────────────────────────────────────
-- Row-Level Security — owner-only everywhere
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_owner ON public.users
  FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises FORCE ROW LEVEL SECURITY;
CREATE POLICY exercises_read ON public.exercises
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY exercises_owner_write ON public.exercises
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY sessions_owner ON public.sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.logged_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_exercises FORCE ROW LEVEL SECURITY;
CREATE POLICY logged_exercises_owner ON public.logged_exercises
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = logged_exercises.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = logged_exercises.session_id AND s.user_id = auth.uid()
  ));

ALTER TABLE public.logged_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_sets FORCE ROW LEVEL SECURITY;
CREATE POLICY logged_sets_owner ON public.logged_sets
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.logged_exercises le
    JOIN public.sessions s ON s.id = le.session_id
    WHERE le.id = logged_sets.logged_exercise_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.logged_exercises le
    JOIN public.sessions s ON s.id = le.session_id
    WHERE le.id = logged_sets.logged_exercise_id AND s.user_id = auth.uid()
  ));

-- Backfill: one users row per EXISTING auth user. The trigger below
-- covers future signups only — accounts created under the old schema
-- have no users row, and UserProfileRepository has no create surface.
INSERT INTO public.users (id, display_name)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────
-- Seed: the 26 coarse identities used by the AM/PM program (user_id NULL)
-- ──────────────────────────────────────────────────────────────────────

INSERT INTO public.exercises (user_id, name) VALUES
  (NULL, 'Leg Press'),
  (NULL, 'Leg Press Calf Raise'),
  (NULL, 'Standing Machine Calf Raise'),
  (NULL, 'Back Extension'),
  (NULL, 'Leg Raise'),
  (NULL, 'Incline Barbell Press'),
  (NULL, 'Cable Overhead Tricep Extension'),
  (NULL, 'Shoulder Press'),
  (NULL, 'Cable Lateral Raise'),
  (NULL, 'Machine Shrug'),
  (NULL, 'Machine Chest Fly'),
  (NULL, 'Tibia Raise'),
  (NULL, 'Machine Leg Curl'),
  (NULL, 'Lat Pulldown'),
  (NULL, 'Machine Ab Crunch'),
  (NULL, 'Dumbbell Curl'),
  (NULL, 'Face Pull'),
  (NULL, 'Bulgarian Split Squat'),
  (NULL, 'Straight-Arm Pulldown'),
  (NULL, 'Machine Incline Press'),
  (NULL, 'Machine Dip'),
  (NULL, 'Dumbbell Overhead Press'),
  (NULL, 'Dumbbell Shrug'),
  (NULL, 'Incline Dumbbell Fly'),
  (NULL, 'Cable Row'),
  (NULL, 'Cable Curl');
