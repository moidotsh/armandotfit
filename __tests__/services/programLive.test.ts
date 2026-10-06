// __tests__/services/programLive.test.ts
// The live-program resolver: ONE contract for all three kinds
// (shared/types/program.ts). Editions keep their legacy override keys
// (persisted overrides survive); starters resolve from the authored
// rotations; generated boards rebuild deterministically from the seed
// (invariant 5 — computed, never stored).

import { describe, expect, it } from 'vitest';
import {
  resolveLiveSlots,
  liveSlotKey,
  liveDayTitle,
  liveRotationLength,
  liveProgramKey,
  liveProgramLabel,
  programWindows,
  isSameLiveProgram,
  generatedBoard,
} from '../../services/programService';
import { generateProgram } from '../../services/splitGenerator';
import { getStarterDays } from '../../shared/exercises';
import type { LiveProgram } from '../../shared/types';

const NO_OVERRIDES: Record<string, { slug: string; name: string }> = {};

const TWO_A_DAY: LiveProgram = { kind: 'edition', split: 'twoADay' };
const ONE_A_DAY: LiveProgram = { kind: 'edition', split: 'oneADay' };
const PPL: LiveProgram = { kind: 'starter', program: 'ppl' };
const BRO: LiveProgram = { kind: 'starter', program: 'broSplit' };
const GEN_PPL: LiveProgram = {
  kind: 'generated',
  program: 'pushPullLegs',
  seed: 4271,
  edition: 'upper',
};

describe('resolveLiveSlots — editions (the legacy path, untouched)', () => {
  it('matches resolveSlots goldens', () => {
    const slots = resolveLiveSlots(TWO_A_DAY, 1, 'am', NO_OVERRIDES);
    expect(slots[0].exercise).toBe('leg-press');
  });

  it('legacy override keys still apply (persisted overrides survive)', () => {
    const slots = resolveLiveSlots(TWO_A_DAY, 1, 'am', {
      'twoADay:1:am:1': { slug: 'barbell-back-squat', name: 'Barbell Back Squat' },
    });
    expect(slots[0].exercise).toBe('barbell-back-squat');
    expect(slots[0].suggestedTags).toEqual([]);
  });

  it('one-a-day resolves the single session', () => {
    const slots = resolveLiveSlots(ONE_A_DAY, 1, 'am', NO_OVERRIDES);
    expect(slots.length).toBe(7);
  });
});

describe('resolveLiveSlots — starters (the authored rotations)', () => {
  it('resolves a starter day straight from the authored asset', () => {
    const slots = resolveLiveSlots(PPL, 1, 'am', NO_OVERRIDES);
    expect(slots).toHaveLength(getStarterDays('ppl')[0].session.length);
    expect(slots[0].exercise).toBe(getStarterDays('ppl')[0].session[0].exercise);
    // Rx carries through untouched.
    expect(slots[0].sets).toEqual(getStarterDays('ppl')[0].session[0].sets);
  });

  it('resolves days beyond the editions\' 4-day wall (PPL runs six)', () => {
    const slots = resolveLiveSlots(PPL, 5, 'am', NO_OVERRIDES);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].exercise).toBe('t-bar-row');
  });

  it('out-of-range days resolve empty (the picker falls back)', () => {
    expect(resolveLiveSlots(PPL, 7, 'am', NO_OVERRIDES)).toEqual([]);
    expect(resolveLiveSlots(BRO, 6, 'am', NO_OVERRIDES)).toEqual([]);
  });

  it('the starter override namespace never collides with the editions\'', () => {
    expect(liveSlotKey(PPL, 3, 'am', 2)).toBe('starter:ppl:3:single:2');
    const slots = resolveLiveSlots(PPL, 1, 'am', {
      'starter:ppl:1:single:1': { slug: 'machine-chest-press', name: 'Machine Chest Press' },
    });
    expect(slots[0].exercise).toBe('machine-chest-press');
    expect(slots[0].sets).toEqual([4, 4]); // the programmed Rx keeps
    // The editions' map is untouched by a starter override.
    expect(resolveLiveSlots(TWO_A_DAY, 1, 'am', {
      'starter:ppl:1:single:1': { slug: 'x', name: 'X' },
    })[0].exercise).toBe('leg-press');
  });
});

describe('resolveLiveSlots — generated (rebuilt from the seed)', () => {
  it('rebuilds the exact board the seed names (deterministic)', () => {
    const board = generateProgram({ seed: 4271, program: 'pushPullLegs', edition: 'upper' });
    const slots = resolveLiveSlots(GEN_PPL, 1, 'am', NO_OVERRIDES);
    expect(slots).toEqual(board.days[0].am);
  });

  it('generatedBoard memoizes to the same board object', () => {
    expect(generatedBoard('pushPullLegs', 4271, 'upper')).toBe(
      generatedBoard('pushPullLegs', 4271, 'upper'),
    );
  });

  it('generated override keys carry the seed', () => {
    expect(liveSlotKey(GEN_PPL, 1, 'am', 1)).toBe('generated:pushPullLegs:4271:1:single:1');
  });

  it('a two-window generated program serves am AND pm', () => {
    const program: LiveProgram = {
      kind: 'generated',
      program: 'fullBodyHighFrequency',
      seed: 4271,
      edition: 'upper',
    };
    const board = generatedBoard('fullBodyHighFrequency', 4271, 'upper');
    expect(resolveLiveSlots(program, 1, 'am', NO_OVERRIDES)).toEqual(board.days[0].am);
    expect(resolveLiveSlots(program, 1, 'pm', NO_OVERRIDES)).toEqual(board.days[0].pm);
  });
});

describe('programWindows — which shapes train twice', () => {
  it('the AM/PM shapes are two-a-day and HF Full Body only', () => {
    expect(programWindows(TWO_A_DAY)).toEqual(['am', 'pm']);
    expect(programWindows(ONE_A_DAY)).toEqual(['single']);
    expect(programWindows(PPL)).toEqual(['single']);
    expect(programWindows(GEN_PPL)).toEqual(['single']);
    expect(programWindows({ kind: 'generated', program: 'fullBodyHighFrequency', seed: 1, edition: 'upper' })).toEqual([
      'am',
      'pm',
    ]);
  });
});

describe('liveDayTitle / liveRotationLength — per-kind day facts', () => {
  it('editions keep the authored titles', () => {
    expect(liveDayTitle(TWO_A_DAY, 1)).toBe('Workout Day 1');
    expect(liveDayTitle(ONE_A_DAY, 2)).toBe('Full Body Day 2');
  });

  it('starters speak their day titles and their own rotation length', () => {
    expect(liveDayTitle(PPL, 1)).toBe('Push A');
    expect(liveDayTitle(PPL, 5)).toBe('Pull B');
    expect(liveRotationLength(PPL)).toBe(6);
    expect(liveRotationLength(BRO)).toBe(5);
  });

  it('generated boards carry the generator\'s titles', () => {
    const board = generatedBoard('pushPullLegs', 4271, 'upper');
    expect(liveDayTitle(GEN_PPL, 1)).toBe(board.days[0].title);
    expect(liveRotationLength(GEN_PPL)).toBe(board.days.length);
    expect(liveRotationLength(TWO_A_DAY)).toBe(4);
  });
});

describe('liveProgramKey / label / equality — the LIVE badge machinery', () => {
  it('keys are stable and seed-bearing for generated programs', () => {
    expect(liveProgramKey(TWO_A_DAY)).toBe('edition:twoADay');
    expect(liveProgramKey(PPL)).toBe('starter:ppl');
    expect(liveProgramKey(GEN_PPL)).toBe('generated:pushPullLegs:4271');
  });

  it('labels name the program', () => {
    expect(liveProgramLabel(PPL)).toBe('Push/Pull/Leg');
    expect(liveProgramLabel(GEN_PPL)).toBe('Push / Pull / Leg · seed 4271');
  });

  it('equality: same seed matches, a reroll does not', () => {
    expect(isSameLiveProgram(GEN_PPL, { ...GEN_PPL })).toBe(true);
    expect(isSameLiveProgram(GEN_PPL, { ...GEN_PPL, seed: 99 })).toBe(false);
    expect(isSameLiveProgram(TWO_A_DAY, ONE_A_DAY)).toBe(false);
  });
});
