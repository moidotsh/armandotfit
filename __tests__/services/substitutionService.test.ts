// __tests__/services/substitutionService.test.ts
// The substitution intelligence: muscle-overlap + modality-distance
// ranking. The test cases encode the user's own examples.

import { describe, expect, it } from 'vitest';
import { rankAlternatives } from '../../services/substitutionService';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';

describe('rankAlternatives', () => {
  it('lat pulldown taken → cable/machine rows + pull-up rank high, floor work low', () => {
    const pulldown = SYSTEM_EXERCISES_BY_SLUG['lat-pulldown'];
    const alts = rankAlternatives(pulldown);
    const names = alts.map((a) => a.exercise.name);

    // Same-musle, same-modality alternatives at the top.
    expect(names).toContain('Machine Seated Row');
    expect(names).toContain('Cable Row');
    expect(names).toContain('Pull-up');

    // The pull-up (same family, machine station) beats unrelated floor work.
    const pullUpIdx = names.indexOf('Pull-up');
    expect(pullUpIdx).toBeLessThan(names.indexOf('Barbell Row') === -1 ? 99 : names.indexOf('Barbell Row'));

    // Floor exercises don't make the cut for a machine pulldown.
    expect(names).not.toContain('Glute Bridge');
    expect(names).not.toContain('Floor Crunch');
  });

  it('bench press alternatives → machine/DB press high, push-up ranks low or misses', () => {
    const bench = SYSTEM_EXERCISES_BY_SLUG['flat-barbell-bench-press'];
    const alts = rankAlternatives(bench);
    const names = alts.map((a) => a.exercise.name);

    // Similar loading first.
    expect(names[0]).toBe('Flat Dumbbell Bench Press');
    expect(names).toContain('Machine Chest Press');
    expect(names).toContain('Incline Barbell Press');

    // Push-up (floor, bodyweight) ranks at the bottom or doesn't appear.
    // Push-up (floor, bodyweight) ranks below the similar-loading options.
    const pushUpIdx = names.indexOf('Push-Up');
    if (pushUpIdx >= 0) {
      expect(pushUpIdx).toBeGreaterThanOrEqual(3);
    }
  });

  it('returns ≤7 focused alternatives, all with positive scores', () => {
    const legPress = SYSTEM_EXERCISES_BY_SLUG['leg-press'];
    const alts = rankAlternatives(legPress);
    expect(alts.length).toBeLessThanOrEqual(7);
    expect(alts.length).toBeGreaterThan(3);
    for (const alt of alts) {
      expect(alt.score).toBeGreaterThanOrEqual(3);
    }
  });
});
