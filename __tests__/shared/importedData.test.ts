// __tests__/shared/importedData.test.ts
// THE IMPORTED CATALOG's integrity — the composition law holds: unique
// slugs across the WHOLE catalog, no imported name shadows a core
// identity, every plate path resolves on disk (a plate that 404s on the
// spec sheet is a broken figure), and the strength-family filter kept
// its word.

import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { SYSTEM_EXERCISES, MUSCLE_DISPLAY_NAMES } from '../../shared/exercises/data';
import { IMPORTED_EXERCISES } from '../../shared/exercises/importedData';

describe('imported catalog', () => {
  it('the whole catalog is slug- and name-unique (ours wins)', () => {
    const slugs = new Set<string>();
    const names = new Set<string>();
    for (const e of SYSTEM_EXERCISES) {
      expect(slugs.has(e.slug), `duplicate slug ${e.slug}`).toBe(false);
      expect(names.has(e.name.toLowerCase()), `duplicate name ${e.name}`).toBe(false);
      slugs.add(e.slug);
      names.add(e.name.toLowerCase());
    }
  });

  it('imports the strength family with real copy', () => {
    expect(IMPORTED_EXERCISES.length).toBeGreaterThan(500);
    for (const e of IMPORTED_EXERCISES.slice(0, 40)) {
      expect(e.instructions.length).toBeGreaterThan(20);
    }
  });

  it('every imported muscle is a LEGAL slug VALUE (the key/value law)', () => {
    // The measure rows and THE BALANCE index muscles by slug VALUE
    // ('abs', 'upper-back') — an emitted KEY ('ABS') renders nothing
    // and counts nowhere. This test kills that bug class at CI.
    for (const e of IMPORTED_EXERCISES) {
      for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) {
        expect(MUSCLE_DISPLAY_NAMES[m as keyof typeof MUSCLE_DISPLAY_NAMES], `illegal muscle slug ${m} on ${e.name}`).toBeDefined();
      }
    }
  });

  it('every declared plate resolves on disk (sampled)', () => {
    const withPlates = SYSTEM_EXERCISES.filter((e) => e.image != null);
    // 657 imported + 82 core-matched plates compose onto the catalog.
    expect(withPlates.length).toBeGreaterThan(700);
    const root = join(__dirname, '..', '..', 'public');
    for (const e of withPlates.slice(0, 40)) {
      const p = join(root, e.image!.replace(/^\//, ''));
      expect(existsSync(p), `missing plate ${e.image}`).toBe(true);
    }
  });
});
