-- Grants for the greenslate tables.
--
-- WHY (multi-line, per migration-header convention):
--   The greenslate rebuild (20261001000000) created its tables without
--   role grants — on this project, postgres-created tables do not
--   inherit anon/authenticated privileges, so every client request hit
--   "permission denied for table <t>" before RLS was even consulted.
--   The pre-rebuild baseline granted explicitly (18 statements); this
--   companion restores that contract for the five-table schema.
--
--   RLS remains the real gate: anon holds table privileges but every
--   policy is `TO authenticated` + owner-only, so anon reads see zero
--   rows and anon writes are refused. Privileges let requests REACH the
--   policies; the policies decide.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.exercises TO anon, authenticated;
GRANT ALL ON public.sessions TO authenticated;
GRANT ALL ON public.logged_exercises TO authenticated;
GRANT ALL ON public.logged_sets TO authenticated;
