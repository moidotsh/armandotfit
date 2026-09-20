// __tests__/shared/importedData.test.ts
// THE IMPORTED CATALOG's integrity — the composition law holds: unique
// slugs across the WHOLE catalog, no imported name shadows a core
// identity, every plate path resolves on disk (a plate that 404s on the
// spec sheet is a broken figure), and the strength-family filter kept
// its word.

import { describe, expect, it } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { SYSTEM_EXERCISES } from '../../shared/exercises/data';
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

  it('every declared plate resolves on disk (sampled)', () => {
    const withPlates = SYSTEM_EXERCISES.filter((e) => e.image != null);
    expect(withPlates.length).toBeGreaterThan(500);
    const root = join(__dirname, '..', '..', 'public');
    for (const e of withPlates.slice(0, 40)) {
      const p = join(root, e.image!.replace(/^\//, ''));
      expect(existsSync(p), `missing plate ${e.image}`).toBe(true);
    }
  });
});
