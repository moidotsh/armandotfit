-- Migration: 20260722000000_user_equipment_capabilities.sql
-- Why: Phase 2 of the equipment-aware program foundation introduces a
-- capability-oriented inventory model on top of the existing
-- user_available_equipment relation. A "capability" is a user-facing
-- equipment concept (e.g. "cable station", "bench", "calf raise") that
-- resolves to one or more concrete equipment_type slugs at runtime.
-- Capabilities carry structured details that the existing
-- user_available_equipment schema can't express (cable attachments +
-- heights, bench positions, calf-raise / leg-curl variants), so they
-- land in a sibling table rather than a column on the existing table.
--
--   user_equipment_capabilities  (NEW — Phase 2 source of truth for the
--                                 onboarding UI; stores capability_slug
--                                 + JSONB details per user)
--   user_available_equipment     (UNCHANGED — stays as the canonical
--                                 equipment_type-id relation. Phase 3
--                                 eligibility reads it directly. The
--                                 capability layer's resolver can upsert
--                                 additive rows here, but never deletes
--                                 — preserving user-managed quantity /
--                                 notes is non-negotiable.)
--
-- The two tables coexist without foreign keys between them. The
-- capability layer is *advisory*: it captures intent + detail that the
-- equipment_type relation can't represent; it does not own the
-- eligibility-driving relation. Decoupling the two means a future
-- capability-model change can't invalidate existing user rows.
--
-- RLS mirrors user_available_equipment: users manage only their own
-- rows. No service-role access from the client; no broad policies.
--
-- Idempotency:
--   CREATE TABLE IF NOT EXISTS; CREATE INDEX IF NOT EXISTS; CREATE
--   POLICY uses ON CONFLICT-free idempotent DDL guards. The table is
--   empty on creation — no seed rows. Re-running this migration is a
--   no-op.

CREATE TABLE IF NOT EXISTS public.user_equipment_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Free-form slug matching the EquipmentCapabilitySlug union on the TS
  -- side (constants/equipmentCapabilities.ts). The DB stores TEXT, not
  -- an enum — capability vocabulary is consumer-owned and may extend
  -- without a migration.
  capability_slug TEXT NOT NULL,
  -- Variable-shape details per capability (cable attachments/heights,
  -- bench positions, calf-raise / leg-curl variants). {} for
  -- capabilities without per-variant resolution.
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, capability_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_equipment_capabilities_user
  ON public.user_equipment_capabilities(user_id);

ALTER TABLE public.user_equipment_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own equipment capabilities"
  ON public.user_equipment_capabilities;
CREATE POLICY "Users can manage own equipment capabilities"
  ON public.user_equipment_capabilities FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_equipment_capabilities TO authenticated;

COMMENT ON TABLE public.user_equipment_capabilities IS
  'User-facing capability inventory (Phase 2). Sibling to user_available_equipment; stores capability slugs + JSONB details. RLS-enforced owner-only CRUD. Capability rows are advisory — they do not foreign-key to user_available_equipment.';

COMMENT ON COLUMN public.user_equipment_capabilities.capability_slug IS
  'Capability slug from the TS-side EquipmentCapabilitySlug union (constants/equipmentCapabilities.ts). DB stores TEXT so the vocabulary can extend without a migration.';

COMMENT ON COLUMN public.user_equipment_capabilities.details IS
  'Variable-shape JSONB for detail-bearing capabilities (cable-station attachments/heights, bench positions, calf-raise / leg-curl variants). Empty object for capabilities without per-variant resolution.';
