-- 20261006000000_sick_days.sql
-- THE SICK MARK — declared days off that aren't a weekly cadence.
--
-- WHY: the streak read the calendar as if every day off were a lapse.
-- users.rest_days covers the ROUTINE pause (a day-of-week cadence);
-- sick days are singular — flu Tuesday doesn't repeat weekly. The
-- profile carries the marked local dates; the streak reads them as
-- neutral at compute time (services/progressionService.ts). Declared
-- facts, not derived ones — the computed-never-stored law governs
-- realization, and a sick mark is an INPUT like a rest day.
--
-- DATE[] (not TEXT[]): the column states its domain. No CHECK — the
-- greenslate law keeps vocabulary in TS; the client writes local
-- 'YYYY-MM-DD' (the same shape the streak's date math reads).
--
-- No grants change: a column on an already-granted table rides the
-- table's existing privileges (the exercise_rating precedent).
-- verify-live-schema.ts pins the column on the live side.

alter table public.users
  add column if not exists sick_days date[] not null default '{}';
