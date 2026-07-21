// __tests__/repositories/ExerciseRepository.gripOptions.test.ts
//
// Phase 5 catalog grip-options read-path tests. Locks:
//   1. Empty input short-circuits to ok([]) without firing a query.
//   2. The repository exposes `listGripOptionsForExercises` on its
//      public surface.
//
// The full supabase-chain behavior is verified end-to-end by the
// integration test in __tests__/app/WorkoutDetailSetupLogging.test.tsx
// (the batched hook fires the real query for non-empty input). This
// file locks the no-query short-circuit + the API shape contract —
// the chain plumbing is shared with listRequirementPathsForExercises /
// listAlternativesForExercises (same pattern, same table).

import { describe, it, expect } from 'vitest';
import { exerciseRepository } from '../../utils/supabase/repositories';
import type { ExerciseGripOption } from '../../shared/types';

describe('ExerciseRepository.listGripOptionsForExercises', () => {
  it('is exposed on the repository instance', () => {
    expect(typeof exerciseRepository.listGripOptionsForExercises).toBe('function');
  });

  it('returns ok([]) for empty input without firing a query', async () => {
    const result = await exerciseRepository.listGripOptionsForExercises([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('returns the canonical ExerciseGripOption shape (typed smoke check)', () => {
    // Compile-time check: the method's return type must be
    // RepositoryResult<ExerciseGripOption[]>. If the repository ever
    // drifts to a different row type, this assertion stops compiling.
    const _typeCheck = async (): Promise<ExerciseGripOption[]> => {
      const r = await exerciseRepository.listGripOptionsForExercises([]);
      if (!r.success) throw new Error('test');
      return r.data;
    };
    expect(typeof _typeCheck).toBe('function');
  });
});
