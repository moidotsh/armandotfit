// __tests__/navigation/curtainWrappers.test.ts
// Source-shape goldens for the curtain seam's three wrappers. A blanket
// rename once rewrote `router.back()` inside `back`'s own definition,
// making every back-navigation (including save/discard) recurse until
// the stack blew — only under the ink dialect, where the wrapper body
// actually executes. Neither tsc nor the audits catch a self-referencing
// arrow; this does.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = readFileSync(
  resolve(process.cwd(), 'navigation/NavigationHelper.tsx'),
  'utf8',
);

describe('curtain wrappers', () => {
  it('push/replace/back delegate to the router, never to themselves', () => {
    expect(SOURCE).toMatch(/const push = .* withRouteCurtain\(\(\) => router\.push\(/);
    expect(SOURCE).toMatch(/const replace = .* withRouteCurtain\(\(\) => router\.replace\(/);
    expect(SOURCE).toMatch(/const back = \(\) => withRouteCurtain\(\(\) => router\.back\(\), 'down'\);/);
  });

  it('no wrapper callback re-enters a wrapper', () => {
    expect(SOURCE).not.toMatch(/withRouteCurtain\(\(\) => (push|replace|back)\(/);
  });
});
