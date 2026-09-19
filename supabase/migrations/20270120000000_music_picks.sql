-- Music picks: the owner-sanctioned sixth table.
--
-- WHY (multi-line, per migration-header convention):
--   The owner asked for the music surface to remember their selections
--   in the database ("allow the database to remember their music
--   selection(s)") — the invariant-4 gate (sixth table = owner design
--   decision) is satisfied by that request. Rows are raw picks: the
--   video identity + display title/artist at pick time + when. Recent
--   picks replay on tap and continue down the recency list (the list
--   itself is the implicit playlist); nothing here is derived or
--   aggregated — recents are read raw, latest first.
--
--   Applying to the live project remains approval-gated; this file is
--   the apply path.

CREATE TABLE public.music_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  video_id text NOT NULL,
  title text NOT NULL,
  artist text,
  picked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX music_picks_user_recent
  ON public.music_picks (user_id, picked_at DESC);

ALTER TABLE public.music_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_picks FORCE ROW LEVEL SECURITY;
CREATE POLICY music_picks_owner ON public.music_picks
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
