-- Migration: 20260718000003_user_rest_days.sql
-- Why: the cycle (which split-day you're on) is derived from the user's
-- last completed workout, but the user also picks which day-of-week slots
-- are their rest days. Storing rest_days on the profile lets the picker
-- visually deactivate those slots and lets "your next workout is on <X>"
-- surface the right day when today is a rest day.
--
-- The default is an empty array — no rest days picked yet. New users
-- see all seven days as selectable until they configure rest days in
-- settings. The CHECK constraint guards against out-of-range values
-- (JS Date.getDay() returns 0..6 where Sun=0).
--
-- The cycle counter (getNextSplitDay in constants/workoutSplits.ts)
-- doesn't read this column — rest days are a UI concern only. Past
-- workouts store their split-day in workout_sessions.day (1..4) and
-- don't care what the user's rest days were at the time.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rest_days INTEGER[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rest_days_range
  CHECK (rest_days IS NOT NULL AND array_length(rest_days, 1) IS NULL
    OR (SELECT bool_and(d BETWEEN 0 AND 6) FROM unnest(rest_days) AS d));

COMMENT ON COLUMN public.profiles.rest_days IS
  'JS getDay integers (Sun=0..Sat=6) the user has marked as rest days. Empty array = no rest days picked. UI-only — does not affect the cycle counter or historical sessions.';
