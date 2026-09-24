// __tests__/services/splitGenerator.test.ts
// THE SPLIT GENERATOR — the read-only dial on the constraint suite.
// Determinism, law-passing by construction, and the read-only shape
// (pure output; no store, no override, no persistence surface).

import { describe, expect, it } from 'vitest';
import {
  generateSplit,
  generateProgram,
  nameForSlug,
  authoredProgramSlots,
  muscleShareDeltas,
} from '../../services';
import { checkEditionLaws, checkProgramLaws, lawsPass, SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises';
import type { ProgramEdition, ProgramType } from '../../shared/exercises';
import type { PreferredSplit } from '../../shared/types';

const EDITIONS: ProgramEdition[] = ['upper', 'lower'];
const SHAPES: PreferredSplit[] = ['twoADay', 'oneADay'];

describe('generateSplit — determinism', () => {
  it('the same seed rebuilds the same edition, byte for byte', () => {
    for (const edition of EDITIONS) {
      for (const shape of SHAPES) {
        const a = generateSplit({ seed: 4271, shape, edition });
        const b = generateSplit({ seed: 4271, shape, edition });
        expect(a.days).toEqual(b.days);
        expect(a.attempts).toBe(b.attempts);
      }
    }
  });

  it('different seeds (almost surely) produce different editions', () => {
    const a = generateSplit({ seed: 1, shape: 'twoADay', edition: 'upper' });
    const b = generateSplit({ seed: 2, shape: 'twoADay', edition: 'upper' });
    expect(JSON.stringify(a.days)).not.toEqual(JSON.stringify(b.days));
  });
});

describe('generateSplit — the laws hold by construction', () => {
  for (const edition of EDITIONS) {
    for (const shape of SHAPES) {
      it(`${edition} / ${shape}: every law passes across 25 seeds`, () => {
        for (let seed = 1; seed <= 25; seed++) {
          const result = generateSplit({ seed, shape, edition });
          expect(
            result.ok,
            `seed ${seed} failed: ${result.rules.filter((r) => !r.ok).map((r) => `${r.id}: ${r.detail}`).join('; ')}`,
          ).toBe(true);
          // The verdict is recomputed against the shared law book —
          // the generator never grades its own homework.
          expect(lawsPass(checkEditionLaws(result.days, edition))).toBe(true);
        }
      });
    }
  }

  it('two-a-day: 4 days × AM 4 + PM 4; one-a-day: 4 days × 7 lifts', () => {
    const two = generateSplit({ seed: 9, shape: 'twoADay', edition: 'upper' });
    expect(two.days).toHaveLength(4);
    for (const day of two.days) {
      expect(day.am).toHaveLength(4);
      expect(day.pm).toHaveLength(4);
    }
    const one = generateSplit({ seed: 9, shape: 'oneADay', edition: 'lower' });
    for (const day of one.days) {
      expect(day.am).toHaveLength(7);
      expect(day.pm).toHaveLength(0);
    }
  });

  it('every slot resolves in the catalog and carries an Rx', () => {
    const result = generateSplit({ seed: 33, shape: 'twoADay', edition: 'lower' });
    for (const day of result.days) {
      for (const slot of [...day.am, ...day.pm]) {
        expect(SYSTEM_EXERCISES_BY_SLUG[slot.exercise], slot.exercise).toBeDefined();
        expect(slot.sets[1]).toBeGreaterThanOrEqual(slot.sets[0]);
        expect(slot.reps[1]).toBeGreaterThanOrEqual(slot.reps[0]);
      }
    }
  });

  it('respects the edition register: no identity stapled to all 4 days', () => {
    const result = generateSplit({ seed: 77, shape: 'twoADay', edition: 'upper' });
    const counts = new Map<string, number>();
    for (const day of result.days) {
      for (const slot of [...day.am, ...day.pm]) {
        counts.set(slot.exercise, (counts.get(slot.exercise) ?? 0) + 1);
      }
    }
    for (const [slug, n] of counts) {
      expect(n, `${slug} appears ${n}×`).toBeLessThanOrEqual(2);
    }
  });
});

describe('generateSplit — read-only shape', () => {
  it('carries no persistence or override surface — pure data out', () => {
    const result = generateSplit({ seed: 5, shape: 'oneADay', edition: 'upper' });
    // The returned object is plain data: seed/program/shape/edition/
    // days/rules/ok/attempts. Nothing references stores, overrides,
    // or the DB.
    expect(Object.keys(result).sort()).toEqual(
      ['attempts', 'days', 'edition', 'ok', 'program', 'rules', 'seed', 'shape'].sort(),
    );
    expect(result.rules.every((r) => typeof r.ok === 'boolean')).toBe(true);
  });

  it('an exhausted budget still reports the truth (failing rules, ok=false)', () => {
    // A budget of zero attempts cannot find a passing edition — the
    // generator must say so rather than pretend.
    const result = generateSplit({ seed: 5, shape: 'twoADay', edition: 'upper', maxAttempts: 0 });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(0);
  });
});

describe('nameForSlug', () => {
  it('returns the catalog display name', () => {
    expect(nameForSlug('leg-press')).toBe(SYSTEM_EXERCISES_BY_SLUG['leg-press'].name);
  });
});

// ── generateProgram — the six program types ────────────────────────────

const ALL_PROGRAMS: ProgramType[] = [
  'fullBodyOneADay',
  'fullBodyHighFrequency',
  'pushPullLegs',
  'upperLower',
  'broSplit',
  'fullyEqual',
  'anythingGoes',
];

describe('generateProgram — every type passes its own laws', () => {
  for (const program of ALL_PROGRAMS) {
    it(`${program}: laws pass across 15 seeds (recomputed, not self-graded)`, () => {
      for (let seed = 1; seed <= 15; seed++) {
        const result = generateProgram({ seed, program });
        expect(
          result.ok,
          `seed ${seed}: ${result.rules.filter((r) => !r.ok).map((r) => `${r.id}: ${r.detail}`).join('; ')}`,
        ).toBe(true);
        expect(lawsPass(checkProgramLaws(result.days, program))).toBe(true);
      }
    });

    it(`${program}: deterministic (same seed → same board)`, () => {
      const a = generateProgram({ seed: 777, program });
      const b = generateProgram({ seed: 777, program });
      expect(a.days).toEqual(b.days);
    });
  }

  it('carries the program tag; full-body keeps its shape, others null', () => {
    expect(generateProgram({ seed: 1, program: 'fullBodyOneADay' }).shape).toBe('oneADay');
    expect(generateProgram({ seed: 1, program: 'fullBodyHighFrequency' }).shape).toBe('twoADay');
    expect(generateProgram({ seed: 1, program: 'pushPullLegs' }).shape).toBeNull();
  });
});

describe('generateProgram — archetype structures', () => {
  it('PPL: the 6-day double pass — on-theme AND A/B disjoint', () => {
    const r = generateProgram({ seed: 42, program: 'pushPullLegs' });
    expect(r.days.map((d) => d.title)).toEqual([
      'Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B',
    ]);
    for (const day of r.days) {
      expect(day.am).toHaveLength(7);
      expect(day.pm).toHaveLength(0);
    }
    const roles = r.days.map((d) => new Set(d.am.map((s) => SYSTEM_EXERCISES_BY_SLUG[s.exercise]?.movementRole)));
    for (const role of [...roles[0], ...roles[3]]) expect(['push', 'core']).toContain(role);
    for (const role of [...roles[1], ...roles[4]]) expect(['pull', 'core']).toContain(role);
    for (const role of [...roles[2], ...roles[5]]) expect(['legs', 'core']).toContain(role);
    // A/B VARIETY: the paired days share no identity.
    const slugsOf = (i: number) => new Set(r.days[i].am.map((s) => s.exercise));
    for (const [a, b] of [[0, 3], [1, 4], [2, 5]] as const) {
      expect([...slugsOf(a)].filter((s) => slugsOf(b).has(s))).toEqual([]);
    }
  });

  it('Upper/Lower: the A/B alternation, upper days push+pull only', () => {
    const r = generateProgram({ seed: 42, program: 'upperLower' });
    expect(r.days.map((d) => d.title)).toEqual(['Upper A', 'Lower A', 'Upper B', 'Lower B']);
    for (const [i, day] of r.days.entries()) {
      expect(day.am).toHaveLength(7);
      for (const slot of day.am) {
        const role = SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.movementRole;
        if (i % 2 === 0) expect(['push', 'pull']).toContain(role);
        else expect(['legs', 'core']).toContain(role);
      }
    }
  });

  it('Bro: five themed days × 6, every slot hits the day muscle set', () => {
    const r = generateProgram({ seed: 42, program: 'broSplit' });
    expect(r.days.map((d) => d.title)).toEqual(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms']);
    const themeMuscles: Record<string, string[]> = {
      Chest: ['chest', 'upper-chest', 'lower-chest'],
      Back: ['lats', 'traps', 'upper-back', 'lower-back'],
      Legs: ['quads', 'hamstrings', 'glutes', 'calves', 'tibialis'],
      Shoulders: ['front-delts', 'side-delts', 'rear-delts', 'traps'],
      Arms: ['biceps', 'triceps', 'forearms'],
    };
    for (const day of r.days) {
      expect(day.am).toHaveLength(6);
      for (const slot of day.am) {
        const muscles = SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.primaryMuscles ?? [];
        expect(
          muscles.some((m) => themeMuscles[day.title].includes(m as never)),
          `${day.title}: '${slot.exercise}' [${muscles}] off theme`,
        ).toBe(true);
      }
    }
  });

  it('Fully Equal: 4 days, every muscle at identical volume', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const r = generateProgram({ seed, program: 'fullyEqual' });
      expect(r.days).toHaveLength(4);
      const tally = new Map<string, number>();
      for (const day of r.days) {
        for (const slot of day.am) {
          for (const m of SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.primaryMuscles ?? []) {
            tally.set(m, (tally.get(m) ?? 0) + slot.sets[1]);
          }
        }
      }
      const volumes = new Set(tally.values());
      expect(volumes.size, `seed ${seed}: volumes ${[...tally.entries()].map(([m, v]) => `${m}=${v}`).join(' ')}`).toBe(1);
      expect(tally.size).toBe(20);
    }
  });

  it('Anything Goes: 3–6 days × 5–8 slots, the whole week covered', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const r = generateProgram({ seed, program: 'anythingGoes' });
      expect(r.days.length).toBeGreaterThanOrEqual(3);
      expect(r.days.length).toBeLessThanOrEqual(6);
      for (const day of r.days) {
        expect(day.am.length).toBeGreaterThanOrEqual(5);
        expect(day.am.length).toBeLessThanOrEqual(8);
      }
      expect(r.ok).toBe(true);
    }
  });
});

describe('authoredProgramSlots — the comparison baseline', () => {
  it('two-a-day: 32 authored slots; one-a-day: 28', () => {
    expect(authoredProgramSlots('twoADay')).toHaveLength(32);
    expect(authoredProgramSlots('oneADay')).toHaveLength(28);
  });
});

describe('muscleShareDeltas — the diverging comparison', () => {
  it('identical boards read zero across the board', () => {
    const authored = authoredProgramSlots('twoADay');
    const { rows, maxAbsDelta } = muscleShareDeltas(authored, authored);
    expect(maxAbsDelta).toBe(0);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.delta === 0)).toBe(true);
  });

  it('signs and magnitudes: swapping a muscle flips its delta', () => {
    // Authored two-a-day day 1 AM, slot 1 is a quad lift (leg-press);
    // replace it with a biceps lift and quads must fall, biceps rise.
    const authored = authoredProgramSlots('twoADay');
    const quadsBefore = muscleShareDeltas(authored, authored).rows.find(
      (r) => r.muscle === 'quads',
    );
    const swapped: typeof authored = authored.map((slot, i) =>
      i === 0
        ? {
            exercise: 'dumbbell-curl',
            suggestedTags: [],
            sets: slot.sets,
            reps: slot.reps,
          }
        : slot,
    );
    const { rows } = muscleShareDeltas(swapped, authored);
    const quads = rows.find((r) => r.muscle === 'quads');
    const biceps = rows.find((r) => r.muscle === 'biceps');
    expect(quads?.delta).toBeLessThan(0);
    expect(quads?.generated).toBeLessThan((quadsBefore?.generated ?? 0) - 0.001);
    expect(biceps?.delta).toBeGreaterThan(0);
  });

  it('orders by the authored program (the reference frame stays put)', () => {
    const authored = authoredProgramSlots('twoADay');
    const generated = generateSplit({ seed: 11, shape: 'twoADay', edition: 'upper' });
    const genSlots = generated.days.flatMap((d) => [...d.am, ...d.pm]);
    const { rows, maxAbsDelta } = muscleShareDeltas(genSlots, authored);
    // Non-increasing authored share until the authored program runs
    // out; generated-only muscles (authored = 0) ride the tail.
    const authoredShares = rows.map((r) => r.authored);
    const firstZero = authoredShares.findIndex((s) => s === 0);
    const head = firstZero === -1 ? authoredShares : authoredShares.slice(0, firstZero);
    const tail = firstZero === -1 ? [] : authoredShares.slice(firstZero);
    expect(head.every((s, i) => i === 0 || head[i - 1] >= s)).toBe(true);
    expect(tail.every((s) => s === 0)).toBe(true);
    expect(maxAbsDelta).toBeGreaterThan(0);
    expect(rows.every((r) => Math.abs(r.delta) <= maxAbsDelta + 1e-9)).toBe(true);
  });
});
