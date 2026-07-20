-- Migration: 20260723000000_user_program_plans.sql
-- Why: Phase 3 of the equipment-aware program foundation introduces the
-- user-owned plan layer that snapshots a chosen program_schedule_variant
-- into a per-user training plan, with deterministic equipment-aware
-- resolution per slot.
--
-- Phase 1 (20260721000000 + 20260721000001 + 20260721000002) shipped the
-- read-only catalog: exercises, equipment_requirement_paths
-- (AND-within / OR-across), alternatives graph (direct / close / fallback),
-- and the program_template → variant → day → session → slot hierarchy.
-- Phase 2 (20260722000000) shipped the user capability inventory +
-- reconciliation into user_available_equipment. Phase 3 closes the loop:
-- given a variant + the user's available-equipment set, evaluate each
-- template slot's exercise against the requirement-path/alternative graph
-- and persist the resolved choice.
--
-- Three new tables:
--
--   user_program_plans
--     One row per adopted plan instance. Holds the status (active vs
--     retired). NO global UNIQUE(user_id, variant_id) — instead a
--     partial unique index WHERE status='active' enforces "at most
--     one active plan per (user, variant)". The lifecycle this
--     unlocks: a user can retire an active plan (status flips to
--     'retired', slots + snapshots stay immutable for history) and
--     immediately adopt a fresh active plan for the same variant.
--     Re-adoption with the same equipment is a no-op at the
--     application layer (the engine is deterministic); re-adoption
--     after an equipment change retires the prior plan + creates a
--     new active row so the historical prescription_snapshot is
--     preserved.
--
--   user_program_plan_slots
--     One row per (plan, template slot). Holds the chosen exercise id
--     (nullable when resolution='missing') plus a resolution label
--     (template | direct | close | fallback | manual | missing) and a
--     JSONB prescription snapshot. The snapshot freezes sets_min/max,
--     reps_min/max, per_side, slot_notes from the program_slots row at
--     adoption time — so a later template edit can't silently change a
--     user's saved plan. FK to program_slots is ON DELETE RESTRICT so
--     dropping a template slot doesn't quietly strip user plans.
--     Adoption-completeness rule: the application rejects plans with
--     any resolution='missing' or chosen_exercise_id IS NULL slot —
--     an active plan always resolves every slot to an eligible
--     exercise. Retired plans retain their immutable snapshots even
--     if a later equipment change would resolve the slot differently.
--
--   user_program_plan_slot_overrides
--     Optional manual-replacement record per plan slot. UNIQUE per slot
--     — at most one override. The override exists separately from
--     plan_slots.chosen_exercise_id so the algorithm can re-resolve
--     non-overridden slots when user equipment changes while preserving
--     manual user picks. The chosen_exercise_id column on plan_slots
--     always carries the *current* effective choice (template or
--     override) so single-table reads return the live value.
--
-- RLS mirrors user_available_equipment + user_equipment_capabilities:
-- owner-only CRUD, no service-role access from the client. The
-- program_templates / program_slots FKs are read-only reference rows;
-- users can reference them but never mutate them.
--
-- Idempotency:
--   CREATE TABLE IF NOT EXISTS; CREATE INDEX IF NOT EXISTS; CREATE
--   POLICY guarded by DROP POLICY IF EXISTS so re-running is a no-op.
--   Tables are empty on creation — no seed rows. The application
--   creates rows on demand when a user adopts a plan.
--
-- Triangulation:
--   Companion repository: utils/supabase/repositories/UserPlanRepository.ts.
--   Companion service: services/planGenerationService.ts. Companion
--   eligibility engine: services/eligibilityService.ts. TS-side types:
--   shared/types/userPlan.ts. Read surface over Phase 1 catalog:
--   ExerciseRepository.listRequirementPaths / listAlternativesForExercises
--   (added in the same change window). Verified by
--   __tests__/services/eligibility.test.ts,
--   __tests__/services/planGeneration.test.ts, and
--   __tests__/supabase/user-plan-migration.test.ts.
-- ──────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────
-- Step 1: user_program_plans
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_program_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES public.program_schedule_variants(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No table-level uniqueness constraint here. The lifecycle (one
  -- active + N retired rows per user × variant) is enforced by the
  -- partial unique index below. A global uniqueness constraint would
  -- block the user from retaining a retired plan while adopting a
  -- fresh active plan for the same variant.
);

CREATE INDEX IF NOT EXISTS idx_user_program_plans_user
  ON public.user_program_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_program_plans_user_variant
  ON public.user_program_plans(user_id, variant_id);
-- The load-bearing constraint: at most one ACTIVE plan per
-- (user, variant). Retired plans are unlimited; the partial predicate
-- keeps the index small + lets the lifecycle flip active → retired
-- without conflict.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_program_plans_user_active
  ON public.user_program_plans(user_id, variant_id)
  WHERE status = 'active';

ALTER TABLE public.user_program_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own program plans"
  ON public.user_program_plans;
CREATE POLICY "Users can manage own program plans"
  ON public.user_program_plans FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_program_plans TO authenticated;

COMMENT ON TABLE public.user_program_plans IS
  'User-owned adopted plan (Phase 3). Snapshots a program_schedule_variant as a per-user training plan instance. RLS-enforced owner-only CRUD. NO global UNIQUE(user_id, variant_id) — instead a partial unique index enforces at most one ACTIVE plan per variant per user. Retired plans retain their slots + prescription_snapshot immutably so the user can re-adopt the same variant (typically after an equipment change) without losing history. Adoption-completeness is enforced at the repository layer: an active plan always resolves every slot to an eligible exercise.';

COMMENT ON COLUMN public.user_program_plans.status IS
  'active = current plan for this variant; retired = historical, kept for audit. The application reads only active plans. Re-adopting a variant with an existing active plan retires the prior row (preserving its slots + snapshots) and inserts a new active row.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 2: user_program_plan_slots
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_program_plan_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.user_program_plans(id) ON DELETE CASCADE,
  template_slot_id UUID NOT NULL REFERENCES public.program_slots(id) ON DELETE RESTRICT,
  chosen_exercise_id UUID REFERENCES public.exercises(id) ON DELETE RESTRICT,
  resolution TEXT NOT NULL
    CHECK (resolution IN ('template', 'direct', 'close', 'fallback', 'manual', 'missing')),
  -- Frozen snapshot of the program_slots prescription at adoption time:
  -- sets_min/max, reps_min/max, per_side, slot_notes. Stored as JSONB so
  -- a later template edit can't silently change a saved plan; the snapshot
  -- is read at session-hydration time and the live program_slots row is
  -- only consulted on re-resolution.
  prescription_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, template_slot_id)
);

CREATE INDEX IF NOT EXISTS idx_user_program_plan_slots_plan
  ON public.user_program_plan_slots(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_program_plan_slots_chosen
  ON public.user_program_plan_slots(chosen_exercise_id);

ALTER TABLE public.user_program_plan_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own program plan slots"
  ON public.user_program_plan_slots;
CREATE POLICY "Users can manage own program plan slots"
  ON public.user_program_plan_slots FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_program_plans p
      WHERE p.id = user_program_plan_slots.plan_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_program_plans p
      WHERE p.id = user_program_plan_slots.plan_id
        AND p.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_program_plan_slots TO authenticated;

COMMENT ON TABLE public.user_program_plan_slots IS
  'Per-slot resolved choice in a user plan (Phase 3). FK to user_program_plans (CASCADE on plan delete) + FK to program_slots (RESTRICT — template edits can't strip user plans). chosen_exercise_id is NULL when resolution = missing. prescription_snapshot freezes the slot prescription at adoption time.';

COMMENT ON COLUMN public.user_program_plan_slots.resolution IS
  'How chosen_exercise_id was picked: template (the slot exercise is itself eligible), direct / close / fallback (first eligible alternative in that tier), manual (user override via slot_overrides), missing (no eligible exercise found; chosen_exercise_id is NULL).';

COMMENT ON COLUMN public.user_program_plan_slots.prescription_snapshot IS
  'JSONB snapshot of program_slots prescription (sets_min, sets_max, reps_min, reps_max, per_side, slot_notes) at adoption time. Frozen so template edits can't silently change a saved plan.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 3: user_program_plan_slot_overrides
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_program_plan_slot_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_slot_id UUID NOT NULL REFERENCES public.user_program_plan_slots(id) ON DELETE CASCADE,
  chosen_exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  -- The alternative edge that produced this override (nullable — manual
  -- picks that don't appear in the alternatives graph still land here,
  -- they're just unsourced). Stored for surfacing "why this pick?" in
  -- the replacement UI.
  alt_edge_id UUID REFERENCES public.exercise_alternatives(id) ON DELETE SET NULL,
  intent_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_slot_id)
);

CREATE INDEX IF NOT EXISTS idx_user_program_plan_slot_overrides_slot
  ON public.user_program_plan_slot_overrides(plan_slot_id);

ALTER TABLE public.user_program_plan_slot_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own plan slot overrides"
  ON public.user_program_plan_slot_overrides;
CREATE POLICY "Users can manage own plan slot overrides"
  ON public.user_program_plan_slot_overrides FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_program_plan_slots s
      JOIN public.user_program_plans p ON p.id = s.plan_id
      WHERE s.id = user_program_plan_slot_overrides.plan_slot_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_program_plan_slots s
      JOIN public.user_program_plans p ON p.id = s.plan_id
      WHERE s.id = user_program_plan_slot_overrides.plan_slot_id
        AND p.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_program_plan_slot_overrides TO authenticated;

COMMENT ON TABLE public.user_program_plan_slot_overrides IS
  'Optional manual replacement record per plan slot (Phase 3). UNIQUE per slot — at most one override. The application sets plan_slots.chosen_exercise_id to the override''s chosen_exercise_id and plan_slots.resolution to manual so single-table reads return the live value. alt_edge_id is nullable: populated when the override came from a known exercise_alternatives edge, NULL when the user picked an exercise outside the seeded alternatives graph.';

-- ──────────────────────────────────────────────────────────────────────
-- Step 4: updated_at triggers (mirrors user_equipment_capabilities)
-- ──────────────────────────────────────────────────────────────────────
-- Keep updated_at in sync on UPDATE without forcing the application to
-- remember to set it. Idempotent: DROP FUNCTION IF EXISTS guards.

CREATE OR REPLACE FUNCTION public.set_user_program_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_user_program_plans_updated_at
  ON public.user_program_plans;
CREATE TRIGGER trg_user_program_plans_updated_at
  BEFORE UPDATE ON public.user_program_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_user_program_plan_updated_at();

DROP TRIGGER IF EXISTS trg_user_program_plan_slots_updated_at
  ON public.user_program_plan_slots;
CREATE TRIGGER trg_user_program_plan_slots_updated_at
  BEFORE UPDATE ON public.user_program_plan_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_user_program_plan_updated_at();
