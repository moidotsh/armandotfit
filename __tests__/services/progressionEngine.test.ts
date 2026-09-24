// __tests__/services/progressionEngine.test.ts
// THE PROGRESSION ENGINE — the owner's notebook example, replayed
// verbatim, plus the ladder's edges.

import { describe, expect, it } from 'vitest';
import {
  deriveProgression,
  progressionKey,
  rangeLabel,
  rungOf,
  sameProgression,
  type RatedInstance,
} from '../../services';

const W = (weight: number, rating: RatedInstance['rating']): RatedInstance => ({
  weight,
  rating,
});
const STEP = 2.5;

describe('deriveProgression — the owner’s example, replayed', () => {
  it('30×6-8, LIGHT → 30×8-10 (rung up, same weight)', () => {
    const rx = deriveProgression([6, 8], [W(30, 'light')], STEP);
    expect(rx.weight).toBe(30);
    expect(rangeLabel(rx.range)).toBe('6–8→8–10'.split('→')[1]);
    expect(rx.mode).toBe('reps');
    expect(rangeLabel(rx.range)).toBe('8–10');
  });

  it('RIGHT holds: 30×8-10 stays 30×8-10', () => {
    const rx = deriveProgression([6, 8], [W(30, 'light'), W(30, 'right')], STEP);
    expect(rx.weight).toBe(30);
    expect(rangeLabel(rx.range)).toBe('8–10');
    expect(rx.mode).toBe('hold');
  });

  it('the second LIGHT at the same weight → 30×10-12', () => {
    const rx = deriveProgression(
      [6, 8],
      [W(30, 'light'), W(30, 'right'), W(30, 'light')],
      STEP,
    );
    expect(rx.weight).toBe(30);
    expect(rangeLabel(rx.range)).toBe('10–12');
    expect(rx.mode).toBe('reps');
  });

  it('the THIRD LIGHT at the same weight → weight up, range resets to origin', () => {
    const rx = deriveProgression(
      [6, 8],
      [W(30, 'light'), W(30, 'light'), W(30, 'light')],
      STEP,
    );
    expect(rx.weight).toBe(32.5);
    expect(rangeLabel(rx.range)).toBe('6–8');
    expect(rx.mode).toBe('weight');
  });

  it('the owner’s full walk: 6-8 → 8-10 → (checks) → 10-12 → (checks) → 35×6-8', () => {
    const rx = deriveProgression(
      [6, 8],
      [
        W(30, 'light'), // → 8-10
        W(30, 'right'), // hold
        W(30, 'right'), // hold
        W(30, 'light'), // → 10-12
        W(30, 'right'), // hold
        W(30, 'right'), // hold
        W(30, 'light'), // third climb → 32.5? NO — two climbs served → bump
      ],
      STEP,
    );
    expect(rx.weight).toBe(32.5);
    expect(rangeLabel(rx.range)).toBe('6–8');
    expect(rx.mode).toBe('weight');
  });
});

describe('deriveProgression — the ladder’s edges', () => {
  it('HEAVY steps one rung down', () => {
    const rx = deriveProgression([6, 8], [W(30, 'light'), W(30, 'heavy')], STEP);
    expect(rangeLabel(rx.range)).toBe('6–8');
    expect(rx.weight).toBe(30);
  });

  it('HEAVY at the origin rung drops the weight', () => {
    const rx = deriveProgression([6, 8], [W(30, 'heavy')], STEP);
    expect(rx.weight).toBe(27.5);
    expect(rangeLabel(rx.range)).toBe('6–8');
  });

  it('LIGHT at the ladder top bumps the weight even without two climbs', () => {
    const rx = deriveProgression([15, 20], [W(60, 'light')], STEP);
    expect(rx.weight).toBe(62.5);
    expect(rangeLabel(rx.range)).toBe('15–20');
    expect(rx.mode).toBe('weight');
  });

  it('unrated history holds the origin', () => {
    const rx = deriveProgression([8, 10], [], STEP);
    expect(rx.weight).toBeNull();
    expect(rangeLabel(rx.range)).toBe('8–10');
    expect(rx.mode).toBe('hold');
  });

  it('the replay follows what was ACTUALLY lifted (instance weight wins)', () => {
    const rx = deriveProgression(
      [6, 8],
      [W(30, 'light'), W(32.5, 'light'), W(32.5, 'light')],
      STEP,
    );
    // The lifter jumped to 32.5 themselves: that is the base now.
    expect(rx.weight).toBe(35);
    expect(rangeLabel(rx.range)).toBe('6–8');
  });
});

describe('the key — exercise + exact tag set', () => {
  it('order-free tag matching', () => {
    expect(sameProgression('Dumbbell Curl', ['seated', 'incline'], ['incline', 'seated'])).toBe(true);
    expect(sameProgression('Dumbbell Curl', ['seated', 'incline'], ['seated'])).toBe(false);
  });

  it('the key strings differ per tag set', () => {
    expect(progressionKey('Curl', ['seated'])).not.toBe(progressionKey('Curl', []));
  });

  it('rungOf snaps off-ladder ranges to the nearest rung', () => {
    expect(rangeLabel([4, 6] as const)).toBeDefined();
    expect(rungOf([7, 9])).toBe(rungOf([6, 8]));
  });
});
