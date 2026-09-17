// __tests__/navigation/routeMetadata.test.ts
// armandotfit's consumer registry — the shell ships the map EMPTY and
// tests empty-registry behavior there; this copy asserts the filled
// consumer reality (titles resolve, prefixes inherit, unknown paths
// fall back to the root entry — the wordmark surface).

import { describe, expect, it } from 'vitest';
import { getAiRouteMetadata } from '../../navigation/routeMetadata';

describe('getAiRouteMetadata (armandotfit registry)', () => {
  it('resolves the root index to the Dashboard entry', () => {
    expect(getAiRouteMetadata('/')).toEqual({
      title: 'Dashboard',
      contextLabel: 'Home',
    });
  });

  it('resolves registered routes to their entries', () => {
    expect(getAiRouteMetadata('/split-selection')).toEqual({
      title: 'Start workout',
      contextLabel: 'Plan a session',
    });
    expect(getAiRouteMetadata('/analytics').title).toBe('Analytics');
  });

  it('falls back through path prefixes (dev/premium inherits dev)', () => {
    expect(getAiRouteMetadata('/dev/premium')).toEqual({
      title: 'Dev',
      contextLabel: 'Internal',
    });
  });

  it('unknown routes resolve empty — shell fallbacks apply downstream', () => {
    expect(getAiRouteMetadata('/somewhere-else')).toEqual({});
    expect(getAiRouteMetadata('/login')).toEqual({});
  });
});
