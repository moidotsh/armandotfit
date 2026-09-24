-- 20270410000000_exercise_rating.sql
-- THE PROGRESSION RATING — the owner's notebook system, persisted.
--
-- Why: every station's weight gets a verdict after the work (LIGHT /
-- RIGHT / HEAVY — the notebook's + / ✓ / −). The rating is a
-- first-class progression INPUT, not realization context: it drives
-- the rep-range ladder and weight bumps the progression engine
-- derives at read (services/progressionEngine.ts). It rides the
-- logged exercise row beside its tags, because the progression key
-- IS exercise + exact tag set (incline-seated curls climb their own
-- ladder).
--
-- Vocabulary lives in TS (EffortRating: 'light' | 'right' | 'heavy'),
-- never a CHECK — the greenslate law. Nullable: unrated history is
-- simply pre-engine fact; the derivation skips unrated instances.

alter table public.logged_exercises
  add column if not exists rating text;
