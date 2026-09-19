import { describe, it, expect } from 'vitest';
import { SCOREBOARD, PAGE_GUTTER, BLOCK_GAP, LEADER_CHAR, REST_DEFAULT_SEC, REST_STEP_SEC } from '../../constants';

// THE SCOREBOARD's presentation-law arithmetic (docs/architecture/
// scoreboard-thesis.md §5, §7).

describe('the air law carries over (taste-independent)', () => {
  it('keeps the gutter, block gap, and halo', () => {
    expect(PAGE_GUTTER).toBe(20);
    expect(BLOCK_GAP).toBe(32);
  });

  it('spreads the statement from the shell token', () => {
    expect(SCOREBOARD.statement.fontSize).toBe(36);
    expect(SCOREBOARD.statement.fontFamily).toBe('Space Grotesk');
    expect(SCOREBOARD.row.fontSize).toBe(18);
  });

  it('rides the harmonic ramp on every carrier', () => {
    const tokens = [SCOREBOARD.statement, SCOREBOARD.row, SCOREBOARD.whisper] as const;
    for (const token of tokens) {
      expect(token.fontSize).toBeDefined();
      expect(72 % (token.fontSize ?? 72)).toBe(0);
      expect(token.lineHeight).toBe((token.fontSize ?? 72) + 6);
    }
  });
});

describe('the register line', () => {
  it('leads with the mono middle dot', () => {
    expect(LEADER_CHAR).toBe('·');
  });
});

describe('the rest instrument constants', () => {
  it('defaults to 90s with ±15 steppers', () => {
    expect(REST_DEFAULT_SEC).toBe(90);
    expect(REST_STEP_SEC).toBe(15);
  });
});
