-- Grants for logged_cardio (companion to 20270326000000).
--
-- WHY (multi-line, per migration-header convention):
--   On this project, postgres-created tables do not inherit
--   anon/authenticated privileges, so every client request would hit
--   "permission denied for table logged_cardio" before RLS is even
--   consulted (the greenslate companion restored this contract for the
--   five-table core; this extends it to the seventh table).
--
--   RLS remains the real gate: privileges let requests REACH the
--   policies; the owner-only policy decides.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON public.logged_cardio TO authenticated;
