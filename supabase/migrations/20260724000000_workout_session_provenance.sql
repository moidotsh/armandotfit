-- Migration: 20260724000000_workout_session_provenance.sql
-- Why: Phase 4 closes the plan-backed workout-launch loop. An adopted
-- complete active plan becomes the preferred source for starting a
-- workout; the completed session now carries prospective provenance
-- that survives even if the plan / template / slot rows are later
-- deleted or rewritten.
--
-- Phase 1 (20260721000001 + 20260721000002) shipped the catalog
-- hierarchy. Phase 2 (20260722000000) shipped the user capability
-- inventory. Phase 3 (20260723000000) shipped user_program_plans +
-- slots + prescription snapshots + the adoption-completeness rule.
-- Phase 4 wires the saved plan into workout launch + persistence
-- without disturbing the static-split fallback or the existing
-- workout logging pipeline.
--
-- Two ALTER TABLEs, every new column nullable + IF NOT EXISTS:
--
--   workout_sessions
--     session_window TEXT CHECK ('am','pm','single') OR NULL
--       The plan/session label for the session. NULL on every
--       pre-Phase-4 row; new sessions set it from the draft
--       (single for oneADay, am/pm for twoADay). NOT a wall-clock
--       claim — actual timestamps remain started_at / completed_at.
--     started_at TIMESTAMPTZ
--       When the user entered the active-session screen. Pulled from
--       workoutStore.sessionStartedAt. Nullable so static-fallback
--       saves that don't care about provenance can leave it NULL.
--     completed_at TIMESTAMPTZ
--       When the user tapped "Save workout". setAt-save-time.
--     plan_id UUID (no FK)
--       The user_program_plan row that drove this session, when
--       launchSource='plan'. NO foreign key constraint: deleting a
--       plan must never delete or invalidate historical workout
--       rows. The JSONB snapshots below carry the immutable
--       identity context if the plan/template/variant rows are
--       later removed.
--     plan_template_snapshot JSONB
--       {slug, name, version} from program_templates at launch time.
--     plan_variant_snapshot JSONB
--       {slug, name, sessionWindowPattern, cycleLengthDays, version}
--       from program_schedule_variants at launch time.
--
--   workout_session_exercises
--     plan_slot_id UUID (no FK)
--       The user_program_plan_slots row this entry came from, when
--       source='plan'. NO FK — same reason as plan_id.
--     template_slot_id UUID (no FK)
--       The program_slots row the plan slot itself references.
--       Redundant with plan_slot_id but durable independently:
--       preserves the template-position context if the plan_slot
--       is later removed but the template slot still exists.
--     per_side BOOLEAN
--       From the plan slot's prescription_snapshot. Surfaces the
--       "per leg" / "per arm" UI hint on the historical row.
--     slot_notes TEXT
--       From the plan slot's prescription_snapshot. The template
--       author's notes for this slot, frozen at adoption time.
--     source TEXT CHECK ('plan','static') OR NULL
--       Discriminator: 'plan' for hydrated-from-plan exercises,
--       'static' for the legacy suggested-split path, NULL for
--       pre-Phase-4 rows + manually-added in-session exercises
--       (no plan/static provenance to record).
--
-- RLS is unchanged: workout_sessions + workout_session_exercises
-- already gate every read/write by user_id = auth.uid() through the
-- ownership chain (baseline 00000000000000 lines 341-373). The new
-- columns inherit that scoping automatically — no policy edits.
--
-- Idempotency: every statement uses ADD COLUMN IF NOT EXISTS /
-- CREATE INDEX IF NOT EXISTS / DROP policy-if-exists guards so re-
-- running is a no-op.
--
-- Triangulation:
--   Companion types: shared/types/workout.ts (DTO + row extensions).
--   Companion store: stores/workoutStore.ts (DraftSession /
--   DraftExercise extensions + hydrateFromPlan action). Companion
--   repository: utils/supabase/repositories/WorkoutRepository.ts
--   (create() inserts the new columns; mappers read them back).
--   Companion selectors: services/planLaunchService.ts (pure
--   plan-completeness + session-slot-selection logic). Verified by
--   __tests__/supabase/workout-provenance-migration.test.ts and
--   __tests__/services/planLaunchService.test.ts.
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: workout_sessions provenance columns
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS session_window TEXT
    CHECK (session_window IS NULL OR session_window IN ('am', 'pm', 'single')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS plan_template_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS plan_variant_snapshot JSONB;

-- Partial index: only plan-backed sessions. Small footprint + lets
-- the future "workouts-for-this-plan" history query skip the static
-- rows entirely.
CREATE INDEX IF NOT EXISTS idx_workout_sessions_plan_id
  ON public.workout_sessions(plan_id)
  WHERE plan_id IS NOT NULL;

COMMENT ON COLUMN public.workout_sessions.session_window IS
  'Plan/session label (Phase 4). am | pm | single. NULL on pre-Phase-4 rows. NOT a wall-clock claim — actual timestamps remain started_at / completed_at. oneADay sessions set single; twoADay sessions set am or pm based on the draft sessionMode.';

COMMENT ON COLUMN public.workout_sessions.started_at IS
  'When the user entered the active-session screen (Phase 4). Pulled from the in-memory sessionStartedAt on save. Nullable: static-fallback saves that don''t track session start leave it NULL.';

COMMENT ON COLUMN public.workout_sessions.completed_at IS
  'When the user tapped "Save workout" (Phase 4). Set by WorkoutRepository.create() at insert time. Nullable for compatibility with pre-Phase-4 rows.';

COMMENT ON COLUMN public.workout_sessions.plan_id IS
  'The user_program_plan row that drove this session, when launchSource = plan (Phase 4). NO foreign key constraint by design: deleting a plan must never delete or invalidate historical workout rows. The plan_template_snapshot + plan_variant_snapshot JSONB columns carry the immutable identity context if the plan/template/variant rows are later removed.';

COMMENT ON COLUMN public.workout_sessions.plan_template_snapshot IS
  'Immutable snapshot of the program_templates row at launch time (Phase 4). Shape: {slug, name, version}. Frozen so a later template edit or deletion can''t strip provenance from a historical workout.';

COMMENT ON COLUMN public.workout_sessions.plan_variant_snapshot IS
  'Immutable snapshot of the program_schedule_variants row at launch time (Phase 4). Shape: {slug, name, sessionWindowPattern, cycleLengthDays, version}. Frozen for the same reason as plan_template_snapshot.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: workout_session_exercises provenance columns
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.workout_session_exercises
  ADD COLUMN IF NOT EXISTS plan_slot_id UUID,
  ADD COLUMN IF NOT EXISTS template_slot_id UUID,
  ADD COLUMN IF NOT EXISTS per_side BOOLEAN,
  ADD COLUMN IF NOT EXISTS slot_notes TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT
    CHECK (source IS NULL OR source IN ('plan', 'static'));

CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_plan_slot
  ON public.workout_session_exercises(plan_slot_id)
  WHERE plan_slot_id IS NOT NULL;

COMMENT ON COLUMN public.workout_session_exercises.plan_slot_id IS
  'The user_program_plan_slots row this entry came from, when source = plan (Phase 4). NO FK by design — preserves history if the plan slot is deleted. The per_side + slot_notes columns below carry the immutable prescription context independently.';

COMMENT ON COLUMN public.workout_session_exercises.template_slot_id IS
  'The program_slots row the plan slot itself references (Phase 4). Redundant with plan_slot_id but durable independently: preserves the template-position context if the plan_slot is later removed but the template slot still exists. NO FK for the same reason.';

COMMENT ON COLUMN public.workout_session_exercises.per_side IS
  'Per-leg / per-arm UI hint from the plan slot prescription snapshot (Phase 4). NULL when the exercise was added outside a plan-backed launch.';

COMMENT ON COLUMN public.workout_session_exercises.slot_notes IS
  'Template-author notes for this slot, frozen into the plan slot prescription snapshot at adoption time (Phase 4). NULL for static-fallback + ad-hoc exercises.';

COMMENT ON COLUMN public.workout_session_exercises.source IS
  'Discriminator (Phase 4). plan = hydrated from a saved user_program_plan; static = hydrated from the legacy suggested-split path; NULL = pre-Phase-4 row or manually added in-session. CHECK enforces the two non-null values; NULL is always allowed.';
