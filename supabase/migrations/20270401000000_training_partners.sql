-- 20270401000000_training_partners.sql
--
-- THE EIGHTH TABLE: training_partners — the couples/friends link.
-- One row per directed partnership (A→B); the reciprocal row (B→A)
-- is written by the same connect action, making the link mutual.
-- A user has at most one active partner at a time (ENFORCED by a
-- unique partial index) — this is a couples trainer, not a social
-- network. Partner visibility is read-only through RLS: you can see
-- your partner's sessions/sets/cardio, never write them.
--
-- THE PARTNER CODE: users.partner_code (a short readable token like
-- "fir-moss-42") is the connection mechanism — enter each other's
-- code in Settings, no email search, no requests, no social graph.

-- 1) The partner code column on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS partner_code TEXT
  GENERATED ALWAYS AS (
    'pc_' || substr(md5(id::text || 'armandotfit-partner'), 1, 12)
  ) STORED;

-- Unique (deterministic per user, so the constraint holds trivially)
CREATE UNIQUE INDEX IF NOT EXISTS users_partner_code_key
  ON public.users (partner_code);

-- 2) The partnership table
CREATE TABLE public.training_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- The display name snapshot at connect time (stable label even if
  -- the partner later renames; refreshed on reconnect).
  partner_display_name TEXT NOT NULL DEFAULT '',
  CONSTRAINT training_partners_no_self CHECK (user_id <> partner_id)
);

-- One active partnership per user (each direction)
CREATE UNIQUE INDEX training_partners_user_unique
  ON public.training_partners (user_id)
  WHERE partner_id IS NOT NULL;

-- Partner can read the partnership row
ALTER TABLE public.training_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_partners FORCE ROW LEVEL SECURITY;

CREATE POLICY training_partners_owner_all ON public.training_partners
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY training_partners_partner_read ON public.training_partners
  FOR SELECT USING (auth.uid() = partner_id);

-- 3) Partner read-through: your partner can SELECT your sessions,
--    logged_exercises, logged_sets, and logged_cardio (read-only).
CREATE POLICY sessions_partner_read ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.training_partners tp
      WHERE tp.partner_id = user_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY logged_exercises_partner_read ON public.logged_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.training_partners tp ON tp.partner_id = s.user_id
      WHERE s.id = logged_exercises.session_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY logged_sets_partner_read ON public.logged_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.logged_exercises le
      JOIN public.sessions s ON s.id = le.session_id
      JOIN public.training_partners tp ON tp.partner_id = s.user_id
      WHERE le.id = logged_sets.logged_exercise_id AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY logged_cardio_partner_read ON public.logged_cardio
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.training_partners tp ON tp.partner_id = s.user_id
      WHERE s.id = logged_cardio.session_id AND tp.user_id = auth.uid()
    )
  );

-- 4) The user's own rows stay readable (these policies are ADDITIVE
--    — the greenslate baseline's owner policies remain in force;
--    these only widen SELECT for the linked partner).
