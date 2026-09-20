-- Cardio logging: the owner-sanctioned seventh table.
--
-- WHY (multi-line, per migration-header convention):
--   The owner asked to log cardio — bike, treadmill, a 100 m walking
--   loop, stairmaster — "values from the machine and outcomes so that
--   we can chart progress over time." Cardio's unit of work is
--   DURATION AT AN INTENSITY, with machine-reported outcomes; forcing
--   it through logged_sets (reps × weight) would corrupt every
--   strength read (bests rank by weight, trajectories compare top
--   sets, the number-to-beat derives from weight × reps). The
--   invariant-4 gate (seventh table = owner design decision) is
--   satisfied by that request; the sanctioned design is one table,
--   six nullable columns, one FK.
--
--   Columns are what the machine told you, nothing more: TIME is the
--   one required quantity; `level` is the machine's intensity dial
--   (treadmill incline % / bike resistance / stair level — one coarse
--   dial, the station's TS vocabulary decides what it means); speed
--   and distance are metric (m, km/h — display converts, storage never
--   does); kcal is the machine's report (a claim, not a measurement —
--   stored raw, never required). Pace, weekly minutes, floors, and
--   every trend are computed at read, never stored.
--
--   Applying to the live project remains approval-gated; this file is
--   the apply path.

CREATE TABLE public.logged_cardio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  -- Station key: 'treadmill' | 'bike' | 'stairmaster' | 'walk-loop'.
  -- Vocabulary lives in TS (shared/exercises/cardio.ts), never in
  -- CHECK constraints — the station list extends without migrations.
  station text NOT NULL,
  duration_sec integer NOT NULL CHECK (duration_sec > 0),
  -- The machine's intensity dial (meaning per station).
  level numeric NULL,
  speed_kmh numeric NULL,
  distance_m integer NULL,
  kcal integer NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX logged_cardio_session_idx
  ON public.logged_cardio (session_id);

ALTER TABLE public.logged_cardio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_cardio FORCE ROW LEVEL SECURITY;
CREATE POLICY logged_cardio_owner ON public.logged_cardio
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = logged_cardio.session_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = logged_cardio.session_id AND s.user_id = auth.uid()
  ));
