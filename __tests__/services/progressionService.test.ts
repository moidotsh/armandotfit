// __tests__/services/progressionService.test.ts
// The streak's law (scoreboard: computed, never stored). Two rules
// under test: the strict consecutive-day run — unchanged when no rest
// days are declared — and REST-DAY NEUTRALITY: a declared rest day
// neither extends nor breaks a run, so a Tue/Thu/Sat rest cadence can
// no longer shred an otherwise perfect one.

import { describe, expect, it } from 'vitest';
import { computeStreaks } from '../../services/progressionService';

/** Local 'YYYY-MM-DD' of N days ago (noon anchors the date). */
function keyDaysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local noon ISO for N days ago (noon anchors the date against DST). */
function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Day-of-week (JS getDay) of N days ago. */
function dowDaysAgo(n: number): number {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.getDay();
}

/** Offset (days ago) of the most recent `dow` at least `minBack` back. */
function lastDowBefore(minBack: number, dow: number): number {
  for (let n = minBack; n < minBack + 7; n++) {
    if (dowDaysAgo(n) === dow) return n;
  }
  return minBack;
}

describe('computeStreaks — the strict rule (no rest days declared)', () => {
  it('counts today and yesterday; an unexcused gap ends the walk', () => {
    const s = computeStreaks([isoDaysAgo(0), isoDaysAgo(1), isoDaysAgo(3)]);
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it('keeps the grace day: trained yesterday only reads current 1', () => {
    const s = computeStreaks([isoDaysAgo(1)]);
    expect(s.current).toBe(1);
  });
});

describe('computeStreaks — a marked sick day is neutral, like a rest dow', () => {
  it('a sick day inside a gap keeps the best run alive', () => {
    // Tuesday → (Wednesday, marked sick) → Thursday.
    const wed = lastDowBefore(10, 3);
    const sessions = [isoDaysAgo(wed + 1), isoDaysAgo(wed - 1)];
    expect(computeStreaks(sessions).best).toBe(1); // strict: two runs of one
    expect(computeStreaks(sessions, [], [keyDaysAgo(wed)]).best).toBe(2);
  });

  it('the current-streak walk reads through a marked sick day', () => {
    // Trained two and three days ago; today untrained, yesterday
    // marked sick — the walk steps over it and lands on the run.
    const sessions = [isoDaysAgo(2), isoDaysAgo(3)];
    expect(computeStreaks(sessions).current).toBe(0);
    expect(computeStreaks(sessions, [], [keyDaysAgo(1)]).current).toBe(2);
  });

  it('a trained sick day still counts — the mark only excuses absence', () => {
    const sessions = [isoDaysAgo(0), isoDaysAgo(1)];
    const s = computeStreaks(sessions, [], [keyDaysAgo(1)]);
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it('half a gap excused (one sick date, one hostile day) still breaks', () => {
    // Two training days three apart; the gap holds two days. Marking
    // one sick leaves the other hostile.
    const wed = lastDowBefore(10, 3);
    const sessions = [isoDaysAgo(wed + 2), isoDaysAgo(wed - 1)];
    expect(computeStreaks(sessions, [], [keyDaysAgo(wed)]).best).toBe(1);
    expect(computeStreaks(sessions, [], [keyDaysAgo(wed), keyDaysAgo(wed + 1)]).best).toBe(2);
  });

  it('rest dows and sick dates excuse a gap together', () => {
    // A three-day gap: the outer two days are rest dows, the middle
    // one is marked sick — the whole bridge is declared off.
    const sessions = [isoDaysAgo(6), isoDaysAgo(2)];
    const rest = [dowDaysAgo(5), dowDaysAgo(3)];
    expect(computeStreaks(sessions, rest).best).toBe(1);
    expect(computeStreaks(sessions, rest, [keyDaysAgo(4)]).best).toBe(2);
  });
});

describe('computeStreaks — declared rest days are neutral', () => {
  it('a rest day inside a gap keeps the best run alive', () => {
    // Tuesday → (Wednesday, declared rest) → Thursday.
    const wed = lastDowBefore(10, 3);
    const sessions = [isoDaysAgo(wed + 1), isoDaysAgo(wed - 1)];
    expect(computeStreaks(sessions).best).toBe(1); // strict: two runs of one
    expect(computeStreaks(sessions, [3]).best).toBe(2); // Wednesday excused
  });

  it('the current-streak walk reads through declared rest days', () => {
    // Trained two and three days ago; today untrained (its own rest
    // day) and yesterday untrained but declared rest — the walk skips
    // both and lands on the run.
    const restDays = [dowDaysAgo(0), dowDaysAgo(1)];
    const sessions = [isoDaysAgo(2), isoDaysAgo(3)];
    expect(computeStreaks(sessions).current).toBe(0);
    expect(computeStreaks(sessions, restDays).current).toBe(2);
    expect(computeStreaks(sessions, restDays).best).toBe(2);
  });

  it('a trained rest day still counts — rest only excuses the absence', () => {
    const restDays = [dowDaysAgo(1)];
    const sessions = [isoDaysAgo(0), isoDaysAgo(1)];
    const s = computeStreaks(sessions, restDays);
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it('an unexcused gap still breaks the run even with rest days declared', () => {
    // Two training days three apart; the gap holds Tuesday and
    // Wednesday. Excusing only one still leaves the other hostile.
    const wed = lastDowBefore(10, 3);
    const sessions = [isoDaysAgo(wed + 2), isoDaysAgo(wed - 1)];
    expect(computeStreaks(sessions, [3]).best).toBe(1);
    expect(computeStreaks(sessions, [2, 3]).best).toBe(2);
  });
});
