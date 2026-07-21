-- Phase 6 — user-owned equipment-setup presets.
--
-- Adds a single new table: user_equipment_setup_presets. Each row is a
-- named, capability-scoped bundle of equipment-setup values that a user
-- can apply to a compatible exercise during a workout session.
--
-- Why this table exists (product context):
--
--   Phase 5 closed the "what did I use last time" loop by capturing
--   per-session setup values (grip, attachment, equipment notes) on
--   workout_session_exercises. Phase 6 closes the "I want to re-apply
--   my usual cable-column-3 setup" loop by letting users save those
--   values as a reusable, named preset.
--
-- Schema invariants enforced here (and verified by the migration test):
--
--   1. Additive only. No changes to any existing table; no FK from any
--      existing table to this one. Selecting a preset at session time
--      copies values into the existing Phase 5 columns (user_grip,
--      attachment_slug, user_equipment_notes) on workout_session_exercises.
--      History is denormalized through the existing snapshot path and
--      never depends on a live preset row.
--
--   2. Owner-only through direct user_id matching. RLS policy uses
--      user_id = auth.uid() directly (no ownership chain — the table
--      owns its own user_id column). Mirrors the user_program_plans
--      RLS pattern (migration 20260723000000).
--
--   3. No FK from history to preset. workout_session_exercises has no
--      preset_id column. A retired or deleted preset must never make
--      historical workout setup data unreadable.
--
--   4. capability_slug is TEXT with no CHECK. Mirrors invariant #13
--      (capability layer stores TEXT so vocabulary extends without a
--      migration). TS-side EquipmentCapabilitySlug union is canonical;
--      the repository boundary validates + casts.
--
--   5. Setup-value columns (grip_text, attachment_slug, equipment_notes)
--      are nullable TEXT. A preset captures "preferred values" — null in
--      any column means "no preference in this dimension, leave the
--      exercise's existing value alone when applied". No DEFAULT on any
--      of these columns.
--
--   6. is_retired + retired_at track soft retirement. Retired presets
--      stay visible to the user (historical intelligibility comes for
--      free because history has no FK to presets, but a user may still
--      want to see retired presets in their management list to un-retire
--      or to remember what they used to do). Retired presets do NOT
--      appear in the active-session preset picker.
--
-- Cross-cutting references:
--
--   - Phase 5 invariant (CLAUDE.md #16) — passive historical metadata,
--     no FK, no CHECK, no RLS / trigger / RPC. The new table inherits
--     the same philosophy but does carry RLS + an index + an updated_at
--     trigger because it is a user-owned CRUD surface (not passive
--     history).
--   - Catalog governance doc (docs/architecture/exercise-catalog-
--     governance.md) — presets are capability-scoped and filtered by
--     the exercise's catalog-declared equipment. The DB stores
--     capability_slug; compatibility filtering happens client-side via
--     the inverse of constants/equipmentCapabilities.ts resolvers.
--   - user_program_plans (migration 20260723000000) — closest analog
--     for RLS + index + updated_at-trigger conventions.
--
-- No data is seeded. Users create their own presets via the management
-- UI (app/setup-presets.tsx).

-- ──────────────────────────────────────────────────────────────────────
-- Table
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_equipment_setup_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  capability_slug TEXT NOT NULL,
  grip_text TEXT,
  attachment_slug TEXT,
  equipment_notes TEXT,
  is_retired BOOLEAN NOT NULL DEFAULT FALSE,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_equipment_setup_presets
  OWNER TO postgres;

COMMENT ON TABLE public.user_equipment_setup_presets IS
  'User-owned reusable equipment-setup presets (Phase 6). Each row is a named, '
  'capability-scoped bundle of setup values (grip + attachment + equipment notes) '
  'that the user can apply to a compatible exercise during a workout session. '
  'History is denormalized through the existing workout_session_exercises Phase 5 '
  'columns; no FK from history to preset. RLS owner-only; see policy below.';

COMMENT ON COLUMN public.user_equipment_setup_presets.user_id IS
  'Owner. RLS enforces user_id = auth.uid() for all reads and writes. '
  'ON DELETE CASCADE from auth.users — deleting the user account removes '
  'their presets.';

COMMENT ON COLUMN public.user_equipment_setup_presets.label IS
  'User-supplied label (e.g. "Cable column 3 — neutral rope"). Free text; the '
  'repository boundary enforces 1..60 chars. Not unique per user — duplicates '
  'are allowed because the user may want several "column 3" presets with '
  'different grips.';

COMMENT ON COLUMN public.user_equipment_setup_presets.capability_slug IS
  'Equipment capability slug (constants/equipmentCapabilities.ts → EquipmentCapabilitySlug). '
  'Scope key for compatibility filtering: a preset is only offered for exercises '
  'whose equipment requirements resolve to this capability. TEXT with no CHECK so '
  'vocabulary extends without a migration (mirrors invariant #13); TS-side union '
  'is canonical, repository boundary validates + casts.';

COMMENT ON COLUMN public.user_equipment_setup_presets.grip_text IS
  'Optional grip text to apply when the preset is selected. Null = "no grip '
  'preference in this preset". Copied verbatim into workout_session_exercises.'
  'user_grip at session-save time. Preserves the catalog seed vocabulary — no '
  'normalization.';

COMMENT ON COLUMN public.user_equipment_setup_presets.attachment_slug IS
  'Optional cable attachment slug to apply when the preset is selected. Null = '
  '"no attachment preference in this preset". Copied verbatim into workout_session_'
  'exercises.attachment_slug at session-save time. The catalog seed uses prefixed '
  'values (cable-rope, cable-v-bar, etc.) and the TS union uses unprefixed values '
  '(rope, v-bar, etc.); Phase 5 display fallback handles both. Preserves any '
  'legacy value the user enters.';

COMMENT ON COLUMN public.user_equipment_setup_presets.equipment_notes IS
  'Optional free-text equipment/station notes to apply when the preset is '
  'selected (e.g. "cable column 3", "window-side machine"). Null = "no equipment '
  'notes preference". Copied verbatim into workout_session_exercises.user_equipment_'
  'notes at session-save time.';

COMMENT ON COLUMN public.user_equipment_setup_presets.is_retired IS
  'Soft-retirement flag. TRUE = preset is excluded from the active-session picker '
  'but remains visible in the management UI for review or un-retirement. Defaults '
  'FALSE. Retirement does NOT affect any historical workout row — history is '
  'denormalized and has no FK to this table.';

COMMENT ON COLUMN public.user_equipment_setup_presets.retired_at IS
  'Timestamp the user retired the preset. Null when is_retired = FALSE. Set by '
  'the repository retire() method; cleared on un-retire. Pure display metadata; '
  'does not drive any gating beyond is_retired itself.';

-- ──────────────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────────────

-- Picker query is "all active presets for this user". Partial index on
-- (user_id) WHERE is_retired = FALSE covers the hot path with minimal
-- index size (retired rows accumulate in the table but not in this
-- index). The management UI uses a separate unfiltered scan against
-- the same column.
CREATE INDEX IF NOT EXISTS idx_user_equipment_setup_presets_user_active
  ON public.user_equipment_setup_presets(user_id)
  WHERE is_retired = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_equipment_setup_presets_user
  ON public.user_equipment_setup_presets(user_id);

-- ──────────────────────────────────────────────────────────────────────
-- Row-Level Security (owner-only, direct user_id match)
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_equipment_setup_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipment_setup_presets FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own equipment setup presets"
  ON public.user_equipment_setup_presets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────
-- updated_at trigger (per-table function — mirrors 20260723000000)
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_user_equipment_setup_preset_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_user_equipment_setup_presets_updated_at
  ON public.user_equipment_setup_presets;
CREATE TRIGGER trg_user_equipment_setup_presets_updated_at
  BEFORE UPDATE ON public.user_equipment_setup_presets
  FOR EACH ROW EXECUTE FUNCTION public.set_user_equipment_setup_preset_updated_at();
