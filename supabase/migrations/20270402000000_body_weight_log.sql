-- 20270402000000_body_weight_log.sql
--
-- THE NINTH TABLE: body_weight_log — the owner's body-weight tracking
-- request. One row per weigh-in: weight_kg + recorded_at. History
-- derives at read (the trend line, the delta); no aggregates stored.
-- RLS owner-only (nobody reads your weight but you).

CREATE TABLE public.body_weight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(6,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE INDEX body_weight_log_user_time ON public.body_weight_log
  (user_id, recorded_at DESC);

ALTER TABLE public.body_weight_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_weight_log FORCE ROW LEVEL SECURITY;

CREATE POLICY body_weight_log_owner_all ON public.body_weight_log
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
