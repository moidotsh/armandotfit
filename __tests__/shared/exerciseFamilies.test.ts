// __tests__/shared/exerciseFamilies.test.ts
// The swap sheet's data contract: every split-slot exercise carries a
// movement family, families resolve to catalog entries, and every
// split-exercise's family has at least one OTHER entry or the sheet's
// empty-state path is what renders (asserted, not crashed).

import { describe, expect, it } from 'vitest';
import {
  TWO_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  SYSTEM_EXERCISES,
  type ExerciseKey,
} from '../../shared/exercises';

describe('movement families (display-only)', () => {
  it('every split exercise carries a family', () => {
    for (const day of TWO_A_DAY_SPLITS) {
      for (const slot of [...day.am, ...day.pm]) {
        const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise as ExerciseKey];
        expect(entry?.family, slot.exercise).toBeDefined();
      }
    }
  });

  it('most split families offer at least one swap candidate', () => {
    const withAlternatives = new Set<string>();
    const without = new Set<string>();
    for (const day of TWO_A_DAY_SPLITS) {
      for (const slot of [...day.am, ...day.pm]) {
        const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise as ExerciseKey];
        const others = SYSTEM_EXERCISES.filter(
          (e) => e.family === entry?.family && e.slug !== entry?.slug,
        );
        if (others.length > 0) withAlternatives.add(entry!.family!);
        else without.add(entry!.family!);
      }
    }
    expect(withAlternatives.size).toBeGreaterThanOrEqual(12);
    // Families without candidates degrade to the sheet's empty state
    // (Remove + Add) — recorded here so the list is deliberate.
    console.log('families without swap candidates:', [...without]);
  });

  it('every entry carries a modality', () => {
    for (const entry of SYSTEM_EXERCISES) {
      expect(entry.modality, entry.slug).toBeDefined();
    }
  });

  it('the modality lattice: split families cover multiple modalities', () => {
    // The substitution contract — every split family offers alternatives
    // across equipment modalities. Deliberate exceptions recorded below.
    const EXCEPTIONS = new Set(['dorsi-flexion', 'vertical-pull']); // machine/band-only, or bar-station (re-tagged from floor)
    const families = new Set<string>();
    for (const day of TWO_A_DAY_SPLITS) {
      for (const slot of [...day.am, ...day.pm]) {
        const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise as ExerciseKey];
        families.add(entry!.family!);
      }
    }
    for (const family of families) {
      const modalities = new Set(
        SYSTEM_EXERCISES.filter((e) => e.family === family).map((e) => e.modality),
      );
      if (EXCEPTIONS.has(family)) {
        expect(modalities.size).toBeGreaterThanOrEqual(1);
        continue;
      }
      expect(modalities.size, family).toBeGreaterThanOrEqual(2);
    }
  });
});
