import { describe, it, expect } from 'vitest';
import {
  deriveTrajectory,
  deriveMuscleShare,
  deriveExerciseVolumeByWeek,
  derivePrTimeline,
  deriveWeeklyGroupVolume,
  estOneRm,
  MUSCLE_GROUPS,
} from '../../services';
import type { SessionWithDetails } from '../../shared/types';

// Fixture builder: one session, one exercise, its sets + tags.
function session(
  iso: string,
  name: string,
  tags: string[],
  sets: Array<{ weight: number; reps: number }>,
): SessionWithDetails {
  return {
    id: `s-${iso}-${tags.join()}`,
    startedAt: iso,
    splitDay: 1,
    note: null,
    exercises: [
      {
        id: `e-${iso}-${name}`,
        exerciseName: name,
        tags,
        sets: sets.map((s, i) => ({
          id: `set-${i}`,
          position: i + 1,
          weight: s.weight,
          reps: s.reps,
          note: null,
        })),
      },
    ],
  } as unknown as SessionWithDetails;
}

describe('deriveTrajectory', () => {
  it('collects the top set per session, chronologically', () => {
    const t = deriveTrajectory(
      [
        session('2027-01-03T10:00:00Z', 'Cable Row', ['machine 2'], [
          { weight: 50, reps: 10 },
          { weight: 60, reps: 8 },
        ]),
        session('2027-01-01T10:00:00Z', 'Cable Row', ['machine 2'], [
          { weight: 40, reps: 10 },
        ]),
      ],
      'cable row',
    );
    expect(t.points.map((p) => p.weight)).toEqual([40, 60]);
    expect(t.points[0].at).toBeLessThan(t.points[1].at);
  });

  it('groups points by tag signature — variants never merge silently', () => {
    const t = deriveTrajectory(
      [
        session('2027-01-01T10:00:00Z', 'Cable Row', ['machine 1'], [{ weight: 50, reps: 8 }]),
        session('2027-01-02T10:00:00Z', 'Cable Row', ['machine 2'], [{ weight: 60, reps: 8 }]),
        session('2027-01-03T10:00:00Z', 'Cable Row', ['machine 2'], [{ weight: 62, reps: 8 }]),
        session('2027-01-04T10:00:00Z', 'Cable Row', [], [{ weight: 40, reps: 8 }]),
      ],
      'Cable Row',
    );
    expect(t.points).toHaveLength(4);
    expect(t.groups).toHaveLength(3);
    // Groups rank by point count; the empty tag set reads 'no tags'.
    const labels = t.groups.map((g) => g.label);
    expect(labels).toContain('machine 2');
    expect(labels).toContain('no tags');
    expect(t.groups[0].points).toHaveLength(2);
  });

  it('ignores sessions without the exercise and untags stably', () => {
    const t = deriveTrajectory(
      [session('2027-01-01T10:00:00Z', 'Squat', [], [{ weight: 100, reps: 5 }])],
      'Cable Row',
    );
    expect(t.points).toHaveLength(0);
    expect(t.groups).toHaveLength(0);
  });
});

describe('deriveMuscleShare', () => {
  it('credits primaries full, secondaries half, and shares sum to 1', () => {
    // Lat Pulldown: primaries lats; secondaries biceps (per catalog).
    const rows = deriveMuscleShare(
      [session('2027-01-01T10:00:00Z', 'Lat Pulldown', [], [{ weight: 100, reps: 10 }])],
      90,
    );
    expect(rows.length).toBeGreaterThan(0);
    const total = rows.reduce((a, r) => a + r.share, 0);
    expect(total).toBeCloseTo(1, 5);
    const sorted = rows.map((r) => r.volume);
    expect([...sorted].sort((a, b) => b - a)).toEqual(sorted);
  });

  it('respects the range window', () => {
    const old = session('2020-01-01T10:00:00Z', 'Lat Pulldown', [], [{ weight: 100, reps: 10 }]);
    expect(deriveMuscleShare([old], 90)).toHaveLength(0);
  });

  it('skips custom lifts the catalog does not know', () => {
    const rows = deriveMuscleShare(
      [session('2027-01-01T10:00:00Z', 'My Mystery Contraption', [], [{ weight: 50, reps: 8 }])],
      90,
    );
    expect(rows).toHaveLength(0);
  });
});

describe('estOneRm (Epley)', () => {
  it('estimates the classical formula', () => {
    expect(estOneRm(100, 10)).toBeCloseTo(133.33, 1);
    expect(estOneRm(100, 1)).toBeCloseTo(103.33, 1);
  });
  it('zeroes on empty sets', () => {
    expect(estOneRm(0, 10)).toBe(0);
    expect(estOneRm(100, 0)).toBe(0);
  });
});

describe('deriveExerciseVolumeByWeek', () => {
  it('buckets tonnage by Monday-start week, honoring the variant filter', () => {
    const rows = deriveExerciseVolumeByWeek(
      [
        session('2027-01-04T10:00:00Z', 'Cable Row', ['machine 1'], [
          { weight: 50, reps: 10 },
        ]),
        session('2027-01-05T10:00:00Z', 'Cable Row', ['machine 2'], [
          { weight: 60, reps: 10 },
        ]),
        session('2027-01-11T10:00:00Z', 'Cable Row', ['machine 1'], [
          { weight: 55, reps: 10 },
        ]),
      ],
      'Cable Row',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].volume).toBe(1100);
    expect(rows[1].volume).toBe(550);
    const filtered = deriveExerciseVolumeByWeek(
      [
        session('2027-01-04T10:00:00Z', 'Cable Row', ['machine 1'], [{ weight: 50, reps: 10 }]),
        session('2027-01-04T10:00:00Z', 'Cable Row', ['machine 2'], [{ weight: 60, reps: 10 }]),
      ],
      'Cable Row',
      new Set(['machine 2']),
    );
    expect(filtered[0].volume).toBe(500);
  });
});

describe('derivePrTimeline', () => {
  it('records only the sessions that raised a best, latest first', () => {
    const events = derivePrTimeline([
      session('2027-01-01T10:00:00Z', 'Row', [], [{ weight: 50, reps: 8 }]),
      session('2027-01-02T10:00:00Z', 'Row', [], [{ weight: 50, reps: 9 }]), // no PR (weight equal)
      session('2027-01-03T10:00:00Z', 'Row', [], [{ weight: 60, reps: 6 }]), // PR
      session('2027-01-04T10:00:00Z', 'Row', [], [{ weight: 55, reps: 8 }]), // no PR
    ]);
    expect(events).toHaveLength(2);
    expect(events[0].weight).toBe(60); // latest first
  });
});

describe('deriveWeeklyGroupVolume', () => {
  it('splits credited volume into the six groups and caps weeks', () => {
    const weeks = deriveWeeklyGroupVolume(
      [
        session('2027-01-04T10:00:00Z', 'Lat Pulldown', [], [{ weight: 100, reps: 10 }]),
        session('2027-01-04T10:00:00Z', 'Leg Press', [], [{ weight: 140, reps: 5 }]),
      ],
      4,
    );
    expect(weeks).toHaveLength(1);
    const w = weeks[0];
    expect(w.total).toBeGreaterThan(0);
    const sum = MUSCLE_GROUPS.reduce((n, g) => n + w.byGroup[g], 0);
    expect(sum).toBeCloseTo(w.total, 6);
    expect(w.byGroup.back).toBeGreaterThan(0);
    expect(w.byGroup.legs).toBeGreaterThan(0);
  });
});
