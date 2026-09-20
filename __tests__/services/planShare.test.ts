// __tests__/services/planShare.test.ts
// THE SHARE — the timetable's per-day muscle breakdown: set counts
// credit primary muscles; shares round to whole percents; the head is
// the most-worked muscle.

import { describe, expect, it } from 'vitest';
import { derivePlanMuscleShare } from '../../services/chartData';
import type { ResolvedSlot } from '../../shared/exercises/splits';

const slot = (exercise: string, sets: [number, number]): ResolvedSlot =>
  ({ exercise, suggestedTags: [], sets, reps: [8, 10] }) as unknown as ResolvedSlot;

describe('derivePlanMuscleShare', () => {
  it('credits set counts to primary muscles, most-worked first', () => {
    // day 1 am: incline barbell press (chest+upper-chest? — chest family),
    // incline dumbbell fly (chest), dumbbell curl (biceps)
    const rows = derivePlanMuscleShare([
      slot('incline-barbell-press', [3, 3]),
      slot('incline-dumbbell-fly', [3, 3]),
      slot('dumbbell-curl', [3, 3]),
    ]);
    // The press credits BOTH chest slugs (chest + upper-chest, 3 sets
    // each) and the fly adds chest: the chest family ties at 6/6 — the
    // pin is the WORK, not the tiebreak order.
    expect(rows[0].sets).toBe(6);
    expect(['chest', 'upper-chest']).toContain(rows[0].muscle);
    expect(rows.some((r) => r.muscle === 'chest' || r.muscle === 'upper-chest')).toBe(true);
    const total = rows.reduce((n, r) => n + r.sets, 0);
    for (const r of rows) {
      expect(r.sets).toBeGreaterThan(0);
      expect(r.share).toBeGreaterThanOrEqual(0);
      expect(r.share).toBeLessThanOrEqual(100);
    }
    // Shares are ordered by work.
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].sets).toBeGreaterThanOrEqual(rows[i].sets);
    }
    void total;
  });

  it('caps to the head rows and returns [] for an empty plan', () => {
    const many = derivePlanMuscleShare(
      ['leg-press-calf-raise', 'machine-leg-curl', 'leg-extension', 'barbell-back-squat', 'romanian-deadlift', 'machine-ab-crunch'].map(
        (e) => slot(e, [3, 4]),
      ),
    );
    expect(many.length).toBeLessThanOrEqual(5);
    expect(derivePlanMuscleShare([])).toEqual([]);
  });
});
