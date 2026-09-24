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
import { TAG_AXES, tagsWithAxisRespected } from '../../shared/exercises';

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
