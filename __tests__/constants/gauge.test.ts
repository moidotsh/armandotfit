import { describe, it, expect } from 'vitest';
import { railMaxFor, pinRatio, GAUGE, PAGE_GUTTER, BLOCK_GAP, REST_DEFAULT_SEC, REST_STEP_SEC } from '../../constants';

// THE GAUGE's arithmetic (docs/architecture/gauge-thesis.md §10.4):
// pin position is strictly monotone in load, proportional to the
// rail's ceiling, and the air law carries over unchanged.

describe('railMaxFor', () => {
  it('floors at 50', () => {
    expect(railMaxFor(0)).toBe(50);
    expect(railMaxFor(null)).toBe(50);
    expect(railMaxFor(12.5)).toBe(50);
  });

  it('rounds up to the next 25', () => {
    expect(railMaxFor(50)).toBe(50);
    expect(railMaxFor(62.5)).toBe(75);
    expect(railMaxFor(100)).toBe(100);
    expect(railMaxFor(102.5)).toBe(125);
  });
});

describe('pinRatio', () => {
  it('parks the pin at 0 for bodyweight (≤0 or null)', () => {
    expect(pinRatio(0, 100)).toBe(0);
    expect(pinRatio(null, 100)).toBe(0);
    expect(pinRatio(-5, 100)).toBe(0);
  });

  it('is strictly monotone in load on a fixed rail', () => {
    let prev = -1;
    for (let kg = 2.5; kg <= 200; kg += 2.5) {
      const r = pinRatio(kg, 200);
      expect(r).toBeGreaterThan(prev);
      prev = r;
    }
  });

  it('is proportional and clamped', () => {
    expect(pinRatio(50, 200)).toBeCloseTo(0.25);
    expect(pinRatio(100, 200)).toBeCloseTo(0.5);
    expect(pinRatio(300, 200)).toBe(1);
  });
});

describe('the air law carries over (taste-independent)', () => {
  it('keeps the gutter, block gap, and halo', () => {
    expect(PAGE_GUTTER).toBe(20);
    expect(BLOCK_GAP).toBe(32);
  });

  it('spreads the statement from the shell token', () => {
    expect(GAUGE.statement.fontSize).toBe(36);
    expect(GAUGE.statement.fontFamily).toBe('Instrument Cond');
    expect(GAUGE.row.fontSize).toBe(17);
  });
});

describe('the rest instrument constants', () => {
  it('defaults to 90s with ±15 steppers', () => {
    expect(REST_DEFAULT_SEC).toBe(90);
    expect(REST_STEP_SEC).toBe(15);
  });
});
