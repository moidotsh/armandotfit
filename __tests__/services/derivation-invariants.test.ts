// __tests__/services/derivation-invariants.test.ts
// Property-style invariant tests: randomized (but SEEDED — fully
// reproducible) histories run through the computed-at-read
// derivations, and the invariants the charts promise must hold for
// EVERY generated case, not just the hand-written ones. A fixed-seed
// LCG keeps failures deterministic.

import { describe, it, expect } from 'vitest';
import {
  deriveMuscleShare,
  deriveTrajectory,
  derivePrTimeline,
  estOneRm,
  MUSCLE_GROUPS,
} from '../../services/chartData';
import { computePersonalBests } from '../../services/progressionService';
import { e1rm } from '../../services/sessionMath';
import type { SessionWithDetails } from '../../shared/types';

// ── seeded generator ────────────────────────────────────────────────
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const CATALOG_NAMES = [
  'Incline Barbell Press',
  'Lat Pulldown',
  'Leg Press',
  'Romanian Deadlift',
  'Dumbbell Curl',
  'Face Pull',
];

const TAG_POOL = ['rope', 'wide-grip', 'machine', 'eccentric', 'column-3'];

function genSession(rand: () => number, dayOffset: number): SessionWithDetails {
  const started = new Date(Date.now() - dayOffset * 86_400_000);
  started.setHours(18, 30, 0, 0);
  const exerciseCount = 1 + Math.floor(rand() * 4);
  const exercises = Array.from({ length: exerciseCount }, (_, i) => {
    const setCount = 1 + Math.floor(rand() * 4);
    const tags = TAG_POOL.filter(() => rand() < 0.25);
    return {
      id: `ex-${dayOffset}-${i}`,
      sessionId: `s-${dayOffset}`,
      exerciseId: `cat-${i}`,
      position: i + 1,
      tags,
      rating: null,
      note: null,
      exerciseName: CATALOG_NAMES[Math.floor(rand() * CATALOG_NAMES.length)]!,
      sets: Array.from({ length: setCount }, (_, j) => ({
        id: `set-${dayOffset}-${i}-${j}`,
        loggedExerciseId: `ex-${dayOffset}-${i}`,
        position: j + 1,
        reps: 1 + Math.floor(rand() * 14),
        weight: Math.round(rand() * 120),
        note: null,
      })),
    };
  });
  return {
    id: `s-${dayOffset}`,
    userId: 'u',
    startedAt: started.toISOString(),
    note: null,
    splitDay: 1,
    exercises,
    cardio: [],
  };
}

function genHistory(seed: number, n: number): SessionWithDetails[] {
  const rand = lcg(seed);
  // The repo convention: history arrays arrive LATEST-FIRST (offset 1
  // = yesterday at index 0) — exactly what findRecentWithDetails and
  // the shared history cache deliver.
  return Array.from({ length: n }, (_, i) => genSession(rand, i + 1));
}

// ── invariants ──────────────────────────────────────────────────────
describe('derived-chart invariants over randomized histories', () => {
  const SEEDS = [7, 42, 1337, 90210, 20260101];

  it('muscle share always partitions exactly 1.0 (within rounding)', () => {
    for (const seed of SEEDS) {
      const rows = deriveMuscleShare(genHistory(seed, 40), 90);
      if (rows.length === 0) continue; // no known-catalog volume
      const total = rows.reduce((n, r) => n + r.share, 0);
      expect(total, `seed ${seed}`).toBeGreaterThan(0.999);
      expect(total, `seed ${seed}`).toBeLessThan(1.001);
      for (const r of rows) {
        expect(r.share, `seed ${seed} ${r.muscle}`).toBeGreaterThanOrEqual(0);
        expect(r.share, `seed ${seed} ${r.muscle}`).toBeLessThanOrEqual(1);
      }
      // Descending by share.
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i - 1].share).toBeGreaterThanOrEqual(rows[i].share);
      }
    }
  });

  it('muscle share rows carry a credited volume and a named muscle', () => {
    for (const seed of SEEDS) {
      const rows = deriveMuscleShare(genHistory(seed, 30), 90);
      for (const r of rows) {
        expect(r.muscle.length, `seed ${seed}`).toBeGreaterThan(0);
        expect(r.volume, `seed ${seed} ${r.muscle}`).toBeGreaterThan(0);
      }
      expect(rows.length).toBeLessThanOrEqual(MUSCLE_GROUPS.length * 8);
    }
  });

  it('trajectory points stay chronological and groups partition them', () => {
    for (const seed of SEEDS) {
      const name = 'Incline Barbell Press';
      const t = deriveTrajectory(genHistory(seed, 40), name);
      for (let i = 1; i < t.points.length; i++) {
        expect(t.points[i].at, `seed ${seed}`).toBeGreaterThan(t.points[i - 1].at);
      }
      const grouped = t.groups.reduce((n, g) => n + g.points.length, 0);
      expect(grouped, `seed ${seed}`).toBe(t.points.length);
    }
  });

  it('PR timeline records strictly rising bests per exercise (oldest→latest)', () => {
    for (const seed of SEEDS) {
      const events = derivePrTimeline(genHistory(seed, 40), 1000);
      // Reversed = chronological; walk per exercise and check rise.
      const chrono = [...events].reverse();
      const lastWeight = new Map<string, number>();
      for (const e of chrono) {
        const key = e.exerciseName.toLowerCase();
        const prev = lastWeight.get(key);
        if (prev != null) {
          expect(e.weight, `seed ${seed} ${key}`).toBeGreaterThan(prev);
        }
        lastWeight.set(key, e.weight);
      }
      // Feed order: latest first.
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].at).toBeGreaterThanOrEqual(events[i].at);
      }
    }
  });

  it('personal bests dominate every set they summarize', () => {
    for (const seed of SEEDS) {
      const history = genHistory(seed, 40);
      const bests = computePersonalBests(history);
      const byName = new Map(bests.map((b) => [b.exerciseName.toLowerCase(), b]));
      for (const s of history) {
        for (const ex of s.exercises) {
          const best = byName.get(ex.exerciseName.toLowerCase());
          if (!best) continue;
          for (const set of ex.sets) {
            expect(best.bestE1rm, `seed ${seed}`).toBeGreaterThanOrEqual(
              e1rm(set.weight, set.reps),
            );
          }
        }
      }
    }
  });

  it('estOneRm is monotone in weight and (from ≥1 rep) in reps', () => {
    for (const seed of SEEDS) {
      const rand = lcg(seed);
      for (let i = 0; i < 50; i++) {
        const reps = 1 + Math.floor(rand() * 12);
        const w = Math.round(rand() * 150);
        expect(estOneRm(w + 5, reps)).toBeGreaterThan(estOneRm(w, reps));
        expect(estOneRm(w, reps + 1)).toBeGreaterThanOrEqual(estOneRm(w, reps));
      }
    }
  });
});
