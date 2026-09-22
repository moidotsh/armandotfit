-- 20270401000001_training_partners_grants.sql
--
-- Role-grant companion for training_partners (tables without grants
-- are unreachable past Supabase's schema privileges — see greenslate
-- migration 20261001000001 for the pattern).

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_partners TO authenticated;

-- The partner code on users: readable (needed to look up a code) and
-- updatable only through the partnership flow (the code itself is
-- GENERATED, so no direct writes are possible — only the partner
-- display name column on training_partners is writable).
GRANT SELECT ON public.users TO authenticated;
