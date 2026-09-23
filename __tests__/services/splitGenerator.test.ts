// __tests__/services/splitGenerator.test.ts
// THE SPLIT GENERATOR — the read-only dial on the constraint suite.
// Determinism, law-passing by construction, and the read-only shape
// (pure output; no store, no override, no persistence surface).

import { describe, expect, it } from 'vitest';
import { generateSplit, nameForSlug } from '../../services';
import { checkEditionLaws, lawsPass } from '../../shared/exercises';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';
import type { ProgramEdition } from '../../shared/exercises';
import type { PreferredSplit } from '../../shared/types';

const EDITIONS: ProgramEdition[] = ['upper', 'lower'];
const SHAPES: PreferredSplit[] = ['twoADay', 'oneADay'];

describe('generateSplit — determinism', () => {
  it('the same seed rebuilds the same edition, byte for byte', () => {
    for (const edition of EDITIONS) {
      for (const shape of SHAPES) {
        const a = generateSplit({ seed: 4271, shape, edition });
        const b = generateSplit({ seed: 4271, shape, edition });
        expect(a.days).toEqual(b.days);
        expect(a.attempts).toBe(b.attempts);
      }
    }
  });

  it('different seeds (almost surely) produce different editions', () => {
    const a = generateSplit({ seed: 1, shape: 'twoADay', edition: 'upper' });
    const b = generateSplit({ seed: 2, shape: 'twoADay', edition: 'upper' });
    expect(JSON.stringify(a.days)).not.toEqual(JSON.stringify(b.days));
  });
});

describe('generateSplit — the laws hold by construction', () => {
  for (const edition of EDITIONS) {
    for (const shape of SHAPES) {
      it(`${edition} / ${shape}: every law passes across 25 seeds`, () => {
        for (let seed = 1; seed <= 25; seed++) {
          const result = generateSplit({ seed, shape, edition });
          expect(
            result.ok,
            `seed ${seed} failed: ${result.rules.filter((r) => !r.ok).map((r) => `${r.id}: ${r.detail}`).join('; ')}`,
          ).toBe(true);
          // The verdict is recomputed against the shared law book —
          // the generator never grades its own homework.
          expect(lawsPass(checkEditionLaws(result.days, edition))).toBe(true);
        }
      });
    }
  }

  it('two-a-day: 4 days × AM 4 + PM 4; one-a-day: 4 days × 7 lifts', () => {
    const two = generateSplit({ seed: 9, shape: 'twoADay', edition: 'upper' });
    expect(two.days).toHaveLength(4);
    for (const day of two.days) {
      expect(day.am).toHaveLength(4);
      expect(day.pm).toHaveLength(4);
    }
    const one = generateSplit({ seed: 9, shape: 'oneADay', edition: 'lower' });
    for (const day of one.days) {
      expect(day.am).toHaveLength(7);
      expect(day.pm).toHaveLength(0);
    }
  });

  it('every slot resolves in the catalog and carries an Rx', () => {
    const result = generateSplit({ seed: 33, shape: 'twoADay', edition: 'lower' });
    for (const day of result.days) {
      for (const slot of [...day.am, ...day.pm]) {
        expect(SYSTEM_EXERCISES_BY_SLUG[slot.exercise], slot.exercise).toBeDefined();
        expect(slot.sets[1]).toBeGreaterThanOrEqual(slot.sets[0]);
        expect(slot.reps[1]).toBeGreaterThanOrEqual(slot.reps[0]);
      }
    }
  });

  it('respects the edition register: no identity stapled to all 4 days', () => {
    const result = generateSplit({ seed: 77, shape: 'twoADay', edition: 'upper' });
    const counts = new Map<string, number>();
    for (const day of result.days) {
      for (const slot of [...day.am, ...day.pm]) {
        counts.set(slot.exercise, (counts.get(slot.exercise) ?? 0) + 1);
      }
    }
    for (const [slug, n] of counts) {
      expect(n, `${slug} appears ${n}×`).toBeLessThanOrEqual(2);
    }
  });
});

describe('generateSplit — read-only shape', () => {
  it('carries no persistence or override surface — pure data out', () => {
    const result = generateSplit({ seed: 5, shape: 'oneADay', edition: 'upper' });
    // The returned object is plain data: seed/shape/edition/days/rules/
    // ok/attempts. Nothing references stores, overrides, or the DB.
    expect(Object.keys(result).sort()).toEqual(
      ['attempts', 'days', 'edition', 'ok', 'rules', 'seed', 'shape'].sort(),
    );
    expect(result.rules.every((r) => typeof r.ok === 'boolean')).toBe(true);
  });

  it('an exhausted budget still reports the truth (failing rules, ok=false)', () => {
    // A budget of zero attempts cannot find a passing edition — the
    // generator must say so rather than pretend.
    const result = generateSplit({ seed: 5, shape: 'twoADay', edition: 'upper', maxAttempts: 0 });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(0);
  });
});

describe('nameForSlug', () => {
  it('returns the catalog display name', () => {
    expect(nameForSlug('leg-press')).toBe(SYSTEM_EXERCISES_BY_SLUG['leg-press'].name);
  });
});
