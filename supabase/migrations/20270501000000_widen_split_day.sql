-- 20270501000000_widen_split_day.sql
-- THE DAY AXIS WIDENS — split_day 1..4 becomes 1..7.
--
-- WHY: programs are TypeScript (invariant 8 — the DB stores only the
-- day a session realized), but the day axis was hardcoded to the
-- editions' four-day rotation at the storage boundary. Making every
-- program runnable — the authored starters (PPL 6, bro split 5) and
-- the Split Lab boards (3..6 days) — needs the column to carry any
-- legal rotation day. The rotation itself lives in TS
-- (constants/workoutSplits.ts MAX_SPLIT_DAY = 7); the CHECK only
-- guards the numeric floor. History is untouched: existing rows sit
-- at 1..4, inside the new bound.
--
-- No grants change (no new tables/columns); verify-live-schema.ts
-- checks column existence only.

alter table public.sessions
  drop constraint sessions_split_day_check;

alter table public.sessions
  add constraint sessions_split_day_check check (split_day between 1 and 7);
