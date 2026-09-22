-- 20270402000001_body_weight_log_grants.sql
-- Role-grant companion for body_weight_log.

GRANT SELECT, INSERT, DELETE ON public.body_weight_log TO authenticated;
