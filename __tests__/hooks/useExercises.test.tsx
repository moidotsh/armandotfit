// __tests__/hooks/useExercises.test.tsx
// The catalog filter's search: names, categories, and the MUSCLE
// vocabulary ('calves' finds calf lifts, singulars ride inside plurals).

import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExercises } from '../../hooks/queries/useExercises';
import { useExerciseStore } from '../../stores/exerciseStore';
import { MUSCLE_DISPLAY_NAMES } from '../../shared/exercises';

describe('useExercises search', () => {
  it("finds calf lifts by muscle group — 'calves'", () => {
    const { result } = renderHook(() => useExercises({ search: 'calves' }));
    const rows = result.current.data!;
    expect(rows.length).toBeGreaterThan(5);
    for (const e of rows) {
      const hitsMuscle = [...e.primaryMuscles, ...e.secondaryMuscles].some(
        (m) =>
          m === 'calves' ||
          MUSCLE_DISPLAY_NAMES[m].toLowerCase().includes('calves') ||
          e.name.toLowerCase().includes('calves'),
      );
      expect(hitsMuscle, e.name).toBe(true);
    }
  });

  it("singular rides inside the plural — 'calf' and 'quad' still hit", () => {
    const calf = renderHook(() => useExercises({ search: 'calf' })).result.current.data!;
    expect(calf.length).toBeGreaterThan(5);
    const quad = renderHook(() => useExercises({ search: 'quad' })).result.current.data!;
    expect(quad.some((e) => e.primaryMuscles.includes('quads'))).toBe(true);
  });

  it('the store filter round-trips raw text with spaces', () => {
    useExerciseStore.getState().setFilter({ search: 'leg press' });
    const { result } = renderHook(() => useExercises(useExerciseStore.getState().filter));
    expect(result.current.data!.some((e) => e.name === 'Leg Press')).toBe(true);
    useExerciseStore.getState().resetFilters();
  });
});
