// __tests__/services/priorTopSets.test.ts
//
// derivePriorTopSets — THE PRIOR RECORD (the upending pass): the
// record mark's baseline on the Floor and the receipt. The law under
// test: the session being viewed can never inflate its own bar —
// only sessions that started strictly BEFORE the cutoff contribute,
// bodyweight sets contribute nothing, and ties keep the earlier
// value (the mark is strictly `>` at the call site).

import { describe, it, expect } from 'vitest';
import { derivePriorTopSets } from '../../services/progressionService';

const S = (
  startedAt: string,
  exercises: Array<{ exerciseName: string; sets: Array<{ weight: number | null }> }>,
) => ({ startedAt, exercises });

describe('derivePriorTopSets — the prior record baseline', () => {
  const history = [
    S('2026-10-16T17:45:00', [
      { exerciseName: 'Incline Barbell Press', sets: [{ weight: 62.5 }, { weight: 60 }] },
      { exerciseName: 'Pull-up', sets: [{ weight: 0 }, { weight: null }] },
    ]),
    S('2026-10-15T07:15:00', [
      { exerciseName: 'Incline Barbell Press', sets: [{ weight: 60 }] },
      { exerciseName: 'Lat Pulldown', sets: [{ weight: 55 }] },
    ]),
    // The session under view — its sets must NOT raise the baseline.
    S('2026-10-16T18:00:00', [
      { exerciseName: 'Incline Barbell Press', sets: [{ weight: 100 }] },
    ]),
  ];

  it('takes the max loaded weight per name across prior sessions only', () => {
    const m = derivePriorTopSets(history, '2026-10-16T18:00:00');
    expect(m.get('Incline Barbell Press')).toBe(62.5);
    expect(m.get('Lat Pulldown')).toBe(55);
  });

  it('excludes the session being viewed (same start excluded, later start excluded)', () => {
    // The cutoff session itself started AT 18:00 — excluded (>=).
    const m = derivePriorTopSets(history, '2026-10-16T18:00:00');
    expect(m.get('Incline Barbell Press')).toBe(62.5);
    // A cutoff before all history: empty baseline.
    expect(derivePriorTopSets(history, '2026-10-14T00:00:00').size).toBe(0);
  });

  it('bodyweight sets (0 / null) contribute nothing', () => {
    const m = derivePriorTopSets(history, '2026-10-16T18:00:00');
    expect(m.has('Pull-up')).toBe(false);
  });

  it('a first-ever exercise has no baseline (empty history → empty map)', () => {
    expect(derivePriorTopSets([], '2026-10-16T18:00:00').size).toBe(0);
    const m = derivePriorTopSets([S('2026-10-16T10:00:00', [{ exerciseName: 'Cable Row', sets: [{ weight: 50 }] }])], '2026-10-17T10:00:00');
    expect(m.get('Cable Row')).toBe(50);
  });

  it('sessions after the cutoff never contribute', () => {
    const m = derivePriorTopSets(
      [
        S('2026-10-10T10:00:00', [{ exerciseName: 'Cable Row', sets: [{ weight: 50 }] }]),
        S('2026-10-20T10:00:00', [{ exerciseName: 'Cable Row', sets: [{ weight: 90 }] }]),
      ],
      '2026-10-15T00:00:00',
    );
    expect(m.get('Cable Row')).toBe(50);
  });
});
