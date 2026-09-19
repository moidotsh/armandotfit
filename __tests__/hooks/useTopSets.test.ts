// __tests__/hooks/useTopSets.test.ts
// The shared top-set derivation — the rule every prefill surface reads.
import { describe, it, expect } from 'vitest';
import { deriveTopSets } from '../../hooks/queries/useTopSets';

const session = (
  startedAt: string,
  exercises: Array<{ exerciseName: string; sets: Array<{ weight: number | null; reps: number | null }> }>,
) => ({ startedAt, exercises });

describe('deriveTopSets', () => {
  it('keeps the TOP set of the most recent session per name', () => {
    const map = deriveTopSets([
      session('2026-12-10T10:00:00Z', [
        { exerciseName: 'Bench Press', sets: [{ weight: 80, reps: 8 }, { weight: 90, reps: 6 }] },
      ]),
      session('2026-12-09T10:00:00Z', [
        { exerciseName: 'Bench Press', sets: [{ weight: 100, reps: 3 }] },
      ]),
    ]);
    // Most recent session wins, not the lifetime max (that's PBs).
    expect(map.get('bench press')).toEqual({
      weight: 90, reps: 6, sets: 2, startedAt: '2026-12-10T10:00:00Z',
    });
  });

  it('resolves weight ties to the LATER set in the session', () => {
    const map = deriveTopSets([
      session('2026-12-10T10:00:00Z', [
        { exerciseName: 'Row', sets: [{ weight: 70, reps: 10 }, { weight: 70, reps: 12 }] },
      ]),
    ]);
    expect(map.get('row')?.reps).toBe(12);
  });

  it('treats null weight as bodyweight 0 and still derives', () => {
    const map = deriveTopSets([
      session('2026-12-10T10:00:00Z', [
        { exerciseName: 'Hanging Leg Raise', sets: [{ weight: null, reps: 12 }] },
      ]),
    ]);
    expect(map.get('hanging leg raise')).toMatchObject({ weight: 0, reps: 12, sets: 1 });
  });

  it('joins identity case-insensitively by NAME', () => {
    const map = deriveTopSets([
      session('2026-12-10T10:00:00Z', [{ exerciseName: 'Lat Pulldown', sets: [{ weight: 55, reps: 10 }] }]),
    ]);
    expect(map.has('lat pulldown')).toBe(true);
  });
});
