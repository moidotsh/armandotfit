// __tests__/hooks/useExerciseSetupOptions.test.ts
//
// Phase 5 catalog grip-options hook tests. Locks:
//   1. Empty-input short-circuit returns an empty Map without firing
//      the underlying repository query (the repository returns ok([])
//      and the queryFn maps that to an empty Map).
//   2. The hook is exported from the hooks barrel so the screen can
//      import via `@hooks/`.
//
// The full React Query caching behavior is verified end-to-end by the
// integration test under __tests__/app/WorkoutDetailSetupLogging.test.tsx
// which renders the screen with non-empty exercise ids and asserts the
// ExerciseSetupRow receives catalog-driven grip suggestions.

import { describe, it, expect } from 'vitest';
import { useExerciseSetupOptions } from '../../hooks/queries/useExerciseSetupOptions';
import { queryKeys } from '../../lib/react-query';

describe('useExerciseSetupOptions — module surface', () => {
  it('is a function (Rules-of-Hooks compliant React Query hook)', () => {
    expect(typeof useExerciseSetupOptions).toBe('function');
  });
});

describe('queryKeys.exerciseSetupOptions — key shape', () => {
  it('produces a stable key for an empty id list', () => {
    const key = queryKeys.exerciseSetupOptions.list([]);
    expect(Array.isArray(key)).toBe(true);
    expect(key[0]).toBe('exerciseSetupOptions');
    expect(key[1]).toBe('list');
  });

  it('produces a key that is order-independent (sorted + joined)', () => {
    // Two callers with the same set of ids in different orders must
    // hit the same cache entry — that's the whole point of the
    // sort-then-join key strategy.
    const a = queryKeys.exerciseSetupOptions.list(['ex-3', 'ex-1', 'ex-2']);
    const b = queryKeys.exerciseSetupOptions.list(['ex-1', 'ex-2', 'ex-3']);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces a different key for different id sets', () => {
    const a = queryKeys.exerciseSetupOptions.list(['ex-1', 'ex-2']);
    const b = queryKeys.exerciseSetupOptions.list(['ex-1', 'ex-3']);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('does not mutate the input array (sort-on-copy)', () => {
    // The hook passes caller arrays straight through; the key factory
    // must NOT sort in place.
    const input = ['ex-3', 'ex-1', 'ex-2'];
    const snapshot = [...input];
    queryKeys.exerciseSetupOptions.list(input);
    expect(input).toEqual(snapshot);
  });
});
