-- armandotfit initial schema (squashed baseline)
--
-- Consolidates v1's archive-v1/database/{schema,phase4-schema,migration-
-- enhanced-schema,schema-fix,community-tables}.sql into a single baseline
-- file. The five v1 files accumulated incrementally during v1 development
-- and contain overlapping / divergent table definitions (e.g. workout_sessions
-- appears in two incompatible shapes across schema.sql and phase4-schema.sql).
-- This baseline picks the canonical shape per the v2 port plan and drops the
-- rest.
--
-- Scope decisions (see armandotfit plan a-Phase 1):
--
--   • Core fitness domain only — profiles, exercise library (system + custom),
--     workout logging (relational: sessions → exercises → sets), analytics,
--     streaks. Community / social features (friend_requests, friendships,
--     community_challenges, user_activity_log, workout_shares) are deferred
--     to v2 per the port plan's deferred-items list.
--
--   • workout_sessions: phase4 shape (date / split_type CHECK / day CHECK /
--     duration CHECK) wins over the simpler schema.sql shape because the
--     analytics trigger and streak function depend on those columns.
--     exercises JSONB column dropped in favor of the normalized relational
--     tables (workout_session_exercises + exercise_sets) for set-level
--     tracking. Sharing columns (is_shared, shared_with) dropped (v2).
--     synced_at dropped — arqavellum's offline queue pattern is service-level
--     (services/offlineQueueService.ts), not table-based.
--
--   • Schema-only, no seed data — mirrors qep-tracker's 2026-06-21 squash
--     discipline. Reference data for muscle_categories / muscles /
--     equipment_types lives in a separate seed file (supabase/seed.sql is
--     intentionally empty by default) or app-level first-run.
--
--   • RLS enabled on every table. User-owned tables: owner-only CRUD via
--     auth.uid() = user_id. Reference tables: public read to authenticated,
--     no writes. Exercises: system exercises public read; custom exercises
--     owner-only CRUD.
--
--   • profiles handle_new_user trigger fixes the v1 bug where profile
--     insertion was permissive (WITH CHECK (true), see archive-v1/database/
--     schema-fix.sql line 20). The baseline scopes profile INSERT to
--     auth.uid() = id, which is the shape that should have shipped.
--
--   • gen_random_uuid() (built-in pgcrypto, Supabase default) replaces v1's
--     uuid_generate_v4() (uuid-ossp extension). One less extension dep.
--
-- Project: mfeyywnwbjejzzbqzmop (created 2026-07-18).
-- Created during a-Phase 1 of the arqavellum → armandotfit port.

-- ──────────────────────────────────────────────────────────────────────
-- Profiles (user account extension on auth.users)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  preferred_split TEXT NOT NULL DEFAULT 'oneADay'
    CHECK (preferred_split IN ('oneADay', 'twoADay')),
  weekly_goal INTEGER NOT NULL DEFAULT 4 CHECK (weekly_goal >= 1 AND weekly_goal <= 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS
  'User profile extension on auth.users. One row per auth user, created by handle_new_user trigger on signup.';

-- ──────────────────────────────────────────────────────────────────────
-- Reference: muscle categories, muscles, equipment types
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.muscle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  muscle_category_id UUID REFERENCES public.muscle_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('free_weight', 'machine', 'cable', 'accessory', 'calisthenic')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────
-- Exercises (system library + user custom)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('calisthenic', 'free_weight', 'cable', 'machine')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  instructions TEXT,
  tips TEXT,
  is_system_exercise BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT system_exercises_have_no_creator CHECK (
    (is_system_exercise = true AND created_by_user_id IS NULL) OR
    (is_system_exercise = false AND created_by_user_id IS NOT NULL)
  )
);

CREATE TABLE public.exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_id UUID NOT NULL REFERENCES public.muscles(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, muscle_id)
);

CREATE TABLE public.exercise_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, equipment_type_id)
);

CREATE TABLE public.exercise_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  variation_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  variation_type TEXT,
  difficulty_progression INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_exercise_id, variation_exercise_id),
  CONSTRAINT variation_not_self CHECK (base_exercise_id <> variation_exercise_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- User-owned: favorites, available equipment
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.user_favorite_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

CREATE TABLE public.user_available_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, equipment_type_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- Workout logging (relational: sessions → exercises → sets)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('oneADay', 'twoADay')),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
  duration INTEGER NOT NULL CHECK (duration > 0), -- minutes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  order_in_workout INTEGER NOT NULL CHECK (order_in_workout >= 1),
  user_grip TEXT,
  user_equipment_notes TEXT,
  target_rep_range TEXT,
  rest_timer_seconds INTEGER DEFAULT 60 CHECK (rest_timer_seconds >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_exercise_id UUID NOT NULL REFERENCES public.workout_session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number >= 1),
  target_reps INTEGER CHECK (target_reps IS NULL OR target_reps >= 0),
  actual_reps INTEGER CHECK (actual_reps IS NULL OR actual_reps >= 0),
  weight DECIMAL(7,2) CHECK (weight IS NULL OR weight >= 0),
  rep_range TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  rest_duration_seconds INTEGER CHECK (rest_duration_seconds IS NULL OR rest_duration_seconds >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────────────
-- Analytics (daily aggregates, maintained by trigger)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_workouts INTEGER NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0, -- minutes
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  weekly_goal_progress JSONB NOT NULL DEFAULT '{"completed": 0, "target": 4}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ──────────────────────────────────────────────────────────────────────
-- Indexes (hot paths: user-scanned queries first)
-- ──────────────────────────────────────────────────────────────────────

CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, date DESC);
CREATE INDEX idx_workout_sessions_created_at ON public.workout_sessions(created_at DESC);
CREATE INDEX idx_user_analytics_user_date ON public.user_analytics(user_id, date DESC);
CREATE INDEX idx_muscles_category ON public.muscles(muscle_category_id);
CREATE INDEX idx_exercise_muscles_exercise ON public.exercise_muscles(exercise_id);
CREATE INDEX idx_exercise_muscles_muscle ON public.exercise_muscles(muscle_id);
CREATE INDEX idx_exercise_equipment_exercise ON public.exercise_equipment(exercise_id);
CREATE INDEX idx_exercise_equipment_equipment ON public.exercise_equipment(equipment_type_id);
CREATE INDEX idx_exercises_type ON public.exercises(exercise_type);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty_level);
CREATE INDEX idx_exercises_user ON public.exercises(created_by_user_id);
CREATE INDEX idx_exercises_system ON public.exercises(is_system_exercise) WHERE is_system_exercise = true;
CREATE INDEX idx_workout_session_exercises_session ON public.workout_session_exercises(workout_session_id);
CREATE INDEX idx_exercise_sets_session_exercise ON public.exercise_sets(workout_session_exercise_id);
CREATE INDEX idx_user_favorites_user ON public.user_favorite_exercises(user_id);
CREATE INDEX idx_user_equipment_user ON public.user_available_equipment(user_id);
CREATE INDEX idx_exercise_variations_base ON public.exercise_variations(base_exercise_id);

-- ──────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_available_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Reference tables: read-only for authenticated users (writes go through
-- the service role / migrations, never client-side).
CREATE POLICY "Authenticated can read muscle_categories"
  ON public.muscle_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read muscles"
  ON public.muscles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read equipment_types"
  ON public.equipment_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read exercise_muscles"
  ON public.exercise_muscles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read exercise_equipment"
  ON public.exercise_equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read exercise_variations"
  ON public.exercise_variations FOR SELECT TO authenticated USING (true);

-- Exercises: system exercises public read; custom exercises owner-only CRUD.
CREATE POLICY "System exercises are publicly readable"
  ON public.exercises FOR SELECT TO authenticated
  USING (is_system_exercise = true);

CREATE POLICY "Users can read own custom exercises"
  ON public.exercises FOR SELECT TO authenticated
  USING (is_system_exercise = false AND created_by_user_id = auth.uid());

CREATE POLICY "Users can create custom exercises"
  ON public.exercises FOR INSERT TO authenticated
  WITH CHECK (is_system_exercise = false AND created_by_user_id = auth.uid());

CREATE POLICY "Users can update own custom exercises"
  ON public.exercises FOR UPDATE TO authenticated
  USING (is_system_exercise = false AND created_by_user_id = auth.uid())
  WITH CHECK (is_system_exercise = false AND created_by_user_id = auth.uid());

CREATE POLICY "Users can delete own custom exercises"
  ON public.exercises FOR DELETE TO authenticated
  USING (is_system_exercise = false AND created_by_user_id = auth.uid());

-- Profiles: owner-only CRUD.
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User-owned tables: owner-only FOR ALL.
CREATE POLICY "Users can manage own favorites"
  ON public.user_favorite_exercises FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own available equipment"
  ON public.user_available_equipment FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own workout sessions"
  ON public.workout_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own session exercises"
  ON public.workout_session_exercises FOR ALL TO authenticated
  USING (
    workout_session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own exercise sets"
  ON public.exercise_sets FOR ALL TO authenticated
  USING (
    workout_session_exercise_id IN (
      SELECT wse.id FROM public.workout_session_exercises wse
      JOIN public.workout_sessions ws ON wse.workout_session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workout_session_exercise_id IN (
      SELECT wse.id FROM public.workout_session_exercises wse
      JOIN public.workout_sessions ws ON wse.workout_session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own analytics"
  ON public.user_analytics FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────
-- Functions
-- ──────────────────────────────────────────────────────────────────────

-- Auto-create a profile row when a new auth.user signs up. SECURITY DEFINER
-- so it runs with the service role's privileges (the auth.users INSERT does
-- not have a profile row yet; the trigger must seed it).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.email
    )
  );
  RETURN NEW;
END;
$$;

-- Maintain user_analytics row per user-day whenever a workout session is
-- inserted. ON CONFLICT upserts the count + duration. Streaks are computed
-- on demand by calculate_user_streaks() rather than maintained here, since
-- streak logic is non-trivial and a trigger-based maintenance path would
-- need to handle deletions / backdated inserts.
CREATE OR REPLACE FUNCTION public.update_user_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_analytics (user_id, date, total_workouts, total_duration)
  VALUES (
    NEW.user_id,
    NEW.date::date,
    1,
    NEW.duration
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_workouts = public.user_analytics.total_workouts + 1,
    total_duration = public.user_analytics.total_duration + NEW.duration,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Compute current and best streaks for a user. Current streak counts
-- consecutive days back from today with at least one workout. Best streak
-- scans the last 365 days for the longest such run. Read-only, no writes.
CREATE OR REPLACE FUNCTION public.calculate_user_streaks(target_user_id UUID)
RETURNS TABLE(current_streak INTEGER, best_streak INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_count INTEGER := 0;
  max_streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  workout_count INTEGER;
BEGIN
  -- Current streak: walk back from today, stop at the first empty day.
  LOOP
    SELECT COUNT(*) INTO workout_count
    FROM public.workout_sessions
    WHERE user_id = target_user_id
      AND date::date = check_date;

    EXIT WHEN workout_count = 0;

    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  -- Best streak: longest consecutive-day run within the last 365 days.
  -- Classic gaps-and-islands: workout_date - row_number() days is constant
  -- for consecutive days, so grouping by it yields streak lengths.
  WITH daily_workouts AS (
    SELECT date::date AS workout_date
    FROM public.workout_sessions
    WHERE user_id = target_user_id
      AND date >= CURRENT_DATE - INTERVAL '365 days'
    GROUP BY date::date
  ),
  streak_groups AS (
    SELECT
      workout_date,
      workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date))::integer AS grp
    FROM daily_workouts
  )
  SELECT COALESCE(MAX(streak_len), 0) INTO max_streak
  FROM (
    SELECT COUNT(*) AS streak_len
    FROM streak_groups
    GROUP BY grp
  ) s;

  -- The current streak wins if it's the longest (covers the case where the
  -- user is on their best run right now and the 365-day window doesn't
  -- include the full extent yet).
  IF streak_count > max_streak THEN
    max_streak := streak_count;
  END IF;

  RETURN QUERY SELECT streak_count, max_streak;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- Triggers
-- ──────────────────────────────────────────────────────────────────────

-- Auto-create profile on auth.users INSERT (signup).
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Maintain user_analytics on workout_sessions INSERT.
CREATE TRIGGER update_analytics_on_workout
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_analytics();

-- ──────────────────────────────────────────────────────────────────────
-- Grants
-- ──────────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated;

-- User-owned tables: full CRUD for authenticated.
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_favorite_exercises TO authenticated;
GRANT ALL ON public.user_available_equipment TO authenticated;
GRANT ALL ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_session_exercises TO authenticated;
GRANT ALL ON public.exercise_sets TO authenticated;
GRANT ALL ON public.user_analytics TO authenticated;

-- Exercises: authenticated can read all + insert/update/delete custom (RLS
-- enforces the system-vs-custom split; service role bypasses RLS for
-- seeding system exercises via migrations).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

-- Reference tables: read-only for authenticated.
GRANT SELECT ON public.muscle_categories TO authenticated;
GRANT SELECT ON public.muscles TO authenticated;
GRANT SELECT ON public.equipment_types TO authenticated;
GRANT SELECT ON public.exercise_muscles TO authenticated;
GRANT SELECT ON public.exercise_equipment TO authenticated;
GRANT SELECT ON public.exercise_variations TO authenticated;

-- Functions: execute for authenticated.
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_user_streaks(UUID) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────
-- Table comments
-- ──────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.muscle_categories IS 'Reference: body regions (arms, back, chest, …). Seeded separately from the schema baseline.';
COMMENT ON TABLE public.muscles IS 'Reference: individual muscles within a category (biceps, lats, …). Seeded separately from the schema baseline.';
COMMENT ON TABLE public.equipment_types IS 'Reference: equipment (barbell, dumbbell, machines, …). Seeded separately from the schema baseline.';
COMMENT ON TABLE public.exercises IS 'System library + user-custom exercises. system exercises ship with the app; custom exercises are per-user.';
COMMENT ON TABLE public.exercise_muscles IS 'Junction: exercises ↔ muscles with primary/secondary flag.';
COMMENT ON TABLE public.exercise_equipment IS 'Junction: exercises ↔ equipment_types with required/optional flag.';
COMMENT ON TABLE public.exercise_variations IS 'Junction: base exercise ↔ variation exercise with progression ordering.';
COMMENT ON TABLE public.user_favorite_exercises IS 'User bookmarks on exercises.';
COMMENT ON TABLE public.user_available_equipment IS 'User inventory: which equipment_types the user owns (drives exercise filtering).';
COMMENT ON TABLE public.workout_sessions IS 'Completed workout session: one row per workout, with date / split / day / duration.';
COMMENT ON TABLE public.workout_session_exercises IS 'Exercise entries within a workout session, with per-workout overrides (grip, rest timer, …).';
COMMENT ON TABLE public.exercise_sets IS 'Individual sets within a session exercise: target vs actual reps / weight / completion state.';
COMMENT ON TABLE public.user_analytics IS 'Daily aggregated analytics per user. Maintained by update_user_analytics trigger on workout_sessions INSERT.';
