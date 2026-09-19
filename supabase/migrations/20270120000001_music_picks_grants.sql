-- Grants for the music_picks table (the greenslate grants convention:
-- privileges let requests REACH the policies; the owner-only RLS
-- decides).

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON public.music_picks TO authenticated;
