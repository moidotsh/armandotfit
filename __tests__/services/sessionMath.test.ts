// __tests__/services/sessionMath.test.ts
import { describe, expect, it } from 'vitest';
import {
  e1rm,
  isSetFilled,
  setVolume,
  sumVolume,
  formatVolume,
  formatElapsed,
} from '../../services/sessionMath';

describe('sessionMath', () => {
  it('a set is filled only when reps AND weight are present', () => {
    expect(isSetFilled({ reps: 8, weight: 100 })).toBe(true);
    expect(isSetFilled({ reps: 8, weight: null })).toBe(false);
    expect(isSetFilled({ reps: null, weight: 100 })).toBe(false);
  });

  it('volume counts only filled sets', () => {
    const sets = [
      { reps: 8, weight: 100 },
      { reps: 10, weight: 80 },
      { reps: 8, weight: null },
    ];
    expect(setVolume(sets[0])).toBe(800);
    expect(sumVolume(sets)).toBe(1600);
  });

  it('PER-SIDE — the load doubles, the body does not (the notebook 30s)', () => {
    // 30s × 8: one limb's 30, both limbs moving → 480, not 240.
    expect(setVolume({ reps: 8, weight: 30 }, undefined, true)).toBe(480);
    // Unflagged, the same row reads the plain one-load math.
    expect(setVolume({ reps: 8, weight: 30 })).toBe(240);
    // The bodyweight component stays single: one body lifts, however
    // many limbs carry iron (a weighted lunge: load ×2 + body ×1).
    expect(setVolume({ reps: 10, weight: 20 }, 70, true)).toBe(10 * (40 + 70));
    // The per-side read rides the SIDES axis members — any of them.
    expect(sumVolume([{ reps: 8, weight: 30 }], undefined, true)).toBe(480);
  });

  it('Epley e1RM: 100×5 → 116.7; zero-guarded', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
    expect(e1rm(0, 5)).toBe(0);
    expect(e1rm(100, 0)).toBe(0);
  });

  it('formats volume + elapsed', () => {
    expect(formatVolume(1240.4)).toBe('1,240');
    const t0 = new Date('2026-01-01T10:00:00Z').getTime();
    expect(formatElapsed('2026-01-01T10:00:00Z', t0 + 65_000)).toBe('01:05');
    expect(formatElapsed('2026-01-01T10:00:00Z', t0 + 3_725_000)).toBe('62:05');
  });
});
