// __tests__/constants/workoutSplits.test.ts
// Goldens for the day-suggestion arithmetic — the wrap bug (4 → 5) and
// the same-day AM/PM rule are funnel-critical: a bad suggestion renders
// an empty picker and an empty active session.

import { describe, expect, it } from 'vitest';
import {
  getNextSplitDay,
  suggestNextSplitDay,
  suggestSessionWindow,
} from '../../constants';
import { TAG_AXES, TAG_VOCABULARY_SEED, tagsWithAxisRespected, isPerSideInstance } from '../../shared/exercises';
import { nextDefaultSessionMode } from '../../constants';

describe('getNextSplitDay', () => {
  it('wraps 4 → 1 (the historical off-by-one produced day 5 — empty slots)', () => {
    expect(getNextSplitDay(4)).toBe(1);
  });
  it('walks the cycle and defaults cold starts to day 1', () => {
    expect(getNextSplitDay(null)).toBe(1);
    expect(getNextSplitDay(0)).toBe(1);
    expect(getNextSplitDay(9)).toBe(1);
    expect(getNextSplitDay(1)).toBe(2);
    expect(getNextSplitDay(2)).toBe(3);
    expect(getNextSplitDay(3)).toBe(4);
  });
  it('walks longer rotations when told (PPL runs six days)', () => {
    expect(getNextSplitDay(4, 6)).toBe(5);
    expect(getNextSplitDay(5, 6)).toBe(6);
    expect(getNextSplitDay(6, 6)).toBe(1);
  });
  it('a lastDay outside the CURRENT rotation restarts at day 1 (a program switch)', () => {
    expect(getNextSplitDay(6, 4)).toBe(1);
    expect(getNextSplitDay(5, 4)).toBe(1);
  });
});

describe('suggestNextSplitDay', () => {
  const day = (iso: string, splitDay: number | null) => ({ startedAt: iso, splitDay });
  it('sticks to today\'s logged day — the PM launch after the morning session', () => {
    const today = new Date();
    const iso = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8).toISOString();
    expect(suggestNextSplitDay([day(iso, 3)])).toBe(3);
  });
  it('advances the day after yesterday\'s session', () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const iso = y.toISOString();
    expect(suggestNextSplitDay([day(iso, 2)])).toBe(3);
    expect(suggestNextSplitDay([day(iso, 4)])).toBe(1);
  });
  it('skips null-split-day rows (ad-hoc sessions)', () => {
    const today = new Date();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    expect(
      suggestNextSplitDay([
        { startedAt: today.toISOString(), splitDay: null },
        day(y.toISOString(), 1),
      ]),
    ).toBe(2);
  });
  it('cold start → day 1', () => {
    expect(suggestNextSplitDay([])).toBe(1);
  });
  it('a longer rotation keeps walking past the editions\' day 4', () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    expect(suggestNextSplitDay([day(y.toISOString(), 4)], 6)).toBe(5);
    expect(suggestNextSplitDay([day(y.toISOString(), 6)], 6)).toBe(1);
  });
  it('a stale today beyond the current rotation falls through to the walk', () => {
    const today = new Date();
    const iso = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8).toISOString();
    // Logged day 6 under PPL, but the live program is now an edition.
    expect(suggestNextSplitDay([day(iso, 6)], 4)).toBe(1);
  });
});

describe('suggestSessionWindow', () => {
  it('mornings are AM, afternoons PM', () => {
    expect(suggestSessionWindow(new Date(2026, 0, 1, 8))).toBe('am');
    expect(suggestSessionWindow(new Date(2026, 0, 1, 17))).toBe('pm');
    expect(suggestSessionWindow(new Date(2026, 0, 1, 23))).toBe('pm');
  });
});


// ── TAG AXES — single choice per qualifier axis ───────────────────────

describe('TAG_AXES — the qualifier axes', () => {
  it('every axis member is single-choice: the sibling leaves on add', () => {
    expect(tagsWithAxisRespected(['single-pulley'], 'dual-pulley')).toEqual(['dual-pulley']);
    expect(tagsWithAxisRespected(['dual-pulley', 'underhand'], 'single-pulley')).toEqual([
      'underhand',
      'single-pulley',
    ]);
    expect(tagsWithAxisRespected(['overhand'], 'underhand')).toEqual(['underhand']);
    expect(tagsWithAxisRespected(['machine'], 'dumbbell')).toEqual(['dumbbell']);
    expect(tagsWithAxisRespected(['seated'], 'standing')).toEqual(['standing']);
  });

  it('free tags append untouched and co-exist with axis members', () => {
    expect(tagsWithAxisRespected(['single-pulley', 'rope'], 'paused')).toEqual([
      'single-pulley',
      'rope',
      'paused',
    ]);
    // Different axes co-exist: grip + attachment + pulley.
    expect(tagsWithAxisRespected(['underhand', 'single-pulley'], 'rope')).toEqual([
      'underhand',
      'single-pulley',
      'rope',
    ]);
  });

  it('a tag outside every axis never displaces anything', () => {
    expect(tagsWithAxisRespected(['eccentric', 'per-leg'], 'captains-chair')).toEqual([
      'eccentric',
      'per-leg',
      'captains-chair',
    ]);
  });

  it('the axes are disjoint — no token claims two axes', () => {
    const seen = new Map<string, string>();
    for (const axis of TAG_AXES) {
      for (const member of axis.members) {
        const prior = seen.get(member);
        expect(prior, `'${member}' claimed by both ${prior} and ${axis.id}`).toBeUndefined();
        seen.set(member, axis.id);
      }
    }
  });
});


// ── The rotation default — the picker hands you the session you
// haven't just done (8pm AM still flips to PM; never the clock). The
// verb takes the WINDOW COUNT now — any two-window program rotates,
// not just the authored two-a-day. ────

describe('nextDefaultSessionMode', () => {
  it('two-window programs rotate: AM begets PM, PM begets AM', () => {
    expect(nextDefaultSessionMode(true, 'am')).toBe('pm');
    expect(nextDefaultSessionMode(true, 'pm')).toBe('am');
  });

  it('single-window programs keep the picked mode', () => {
    expect(nextDefaultSessionMode(false, 'am')).toBe('am');
    expect(nextDefaultSessionMode(false, 'pm')).toBe('pm');
  });
});


// ── THE STATION AXIS — pattern-matched instances ──────────────────────

describe('the station axis', () => {
  it('any station-N is on the axis — station-3 (a third cable stack) evicts station-1', () => {
    expect(tagsWithAxisRespected(['station-1', 'underhand'], 'station-3')).toEqual([
      'underhand',
      'station-3',
    ]);
    // Open-ended: station-7 (typed free-form) is on the axis too.
    expect(tagsWithAxisRespected(['station-1'], 'station-7')).toEqual(['station-7']);
  });

  it('the vocabulary suggests three stations and stations do not evict grip', () => {
    expect(TAG_VOCABULARY_SEED).toEqual(expect.arrayContaining(['station-1', 'station-2', 'station-3']));
    expect(tagsWithAxisRespected(['station-1'], 'underhand')).toEqual(['station-1', 'underhand']);
  });
});

// ── THE SIDES AXIS — per-side entry grammar ───────────────────────────

describe('the sides axis', () => {
  it('per-arm / per-leg / per-side are one axis — picking one evicts the others', () => {
    const sides = TAG_AXES.find((a) => a.id === 'sides');
    expect(sides?.members).toEqual(['per-side', 'per-arm', 'per-leg']);
    expect(tagsWithAxisRespected(['per-leg', 'dumbbell'], 'per-side')).toEqual([
      'dumbbell',
      'per-side',
    ]);
    // The vocabulary suggests all three (per-leg rode the authored
    // boards first; the other two are its siblings).
    expect(TAG_VOCABULARY_SEED).toEqual(
      expect.arrayContaining(['per-side', 'per-arm', 'per-leg']),
    );
  });

  it('isPerSideInstance — any SIDES member marks the figure; nothing else does', () => {
    expect(isPerSideInstance(['per-side'])).toBe(true);
    expect(isPerSideInstance(['dumbbell', 'per-leg'])).toBe(true);
    expect(isPerSideInstance(['dumbbell', 'seated'])).toBe(false);
    expect(isPerSideInstance([])).toBe(false);
    expect(isPerSideInstance(null)).toBe(false);
  });
});
