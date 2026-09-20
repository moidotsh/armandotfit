import { describe, it, expect } from 'vitest';
import { INTERVAL, PAGE_GUTTER, BLOCK_GAP, REST_DEFAULT_SEC, REST_STEP_SEC } from '../../constants';

// THE INTERVAL's presentation-law arithmetic (docs/architecture/
// interval-thesis.md §3, §5, §7). Rewritten for the tenth upending:
// the leader is deleted (the air is the leader), the tracking set
// closes at {−1.5, −0.5, 0, +0.8}, and the rank carriers gain THE
// LIVE FIGURE (the counter, state-dependent on the Floor) and its
// demoted partner.

describe('the air law carries over (taste-independent)', () => {
  it('keeps the gutter, block gap, and halo', () => {
    expect(PAGE_GUTTER).toBe(20);
    expect(BLOCK_GAP).toBe(32);
  });

  it('spreads the statement from the shell token', () => {
    expect(INTERVAL.statement.fontSize).toBe(36);
    // THE EDITORIAL PASS: the statement speaks the serif.
    expect(INTERVAL.statement.fontFamily).toBe('Instrument Serif');
    expect(INTERVAL.row.fontSize).toBe(18);
  });

  it('rides the harmonic ramp on every carrier', () => {
    const tokens = [INTERVAL.statement, INTERVAL.row, INTERVAL.whisper, INTERVAL.figure] as const;
    for (const token of tokens) {
      expect(token.fontSize).toBeDefined();
      expect(72 % (token.fontSize ?? 72)).toBe(0);
      expect(token.lineHeight).toBe((token.fontSize ?? 72) + 6);
    }
  });
});

describe('the rank carriers (interval-thesis §3.2)', () => {
  it('carries THE LIVE FIGURE at the counter rank', () => {
    expect(INTERVAL.liveFigure.fontSize).toBe(72);
    // The counter's condensed cut of the mono face (the sight
    // amendment) — the rank keeps its size, the face gives back width.
    expect(INTERVAL.liveFigure.fontFamily).toBe('Martian Mono Condensed');
    expect(INTERVAL.liveFigure.fontWeight).toBe('700');
    expect(INTERVAL.liveFigure.letterSpacing).toBe(-1.5);
    expect(INTERVAL.liveFigure.fontVariant).toEqual(['tabular-nums']);
  });

  it('carries the demoted figure at the statement rank, mono, tabular', () => {
    // The figure that yields the counter while the rest clock runs:
    // 36 mono — the armed expression demotes by REPAINT, never moves.
    // Same family as the counter (the condensed cut), so the exchange
    // stays a pure repaint — same glyphs, new rank.
    expect(INTERVAL.demotedFigure.fontSize).toBe(36);
    expect(INTERVAL.demotedFigure.fontFamily).toBe('Martian Mono Condensed');
    expect(INTERVAL.demotedFigure.fontVariant).toEqual(['tabular-nums']);
  });
});

describe('the rest instrument constants', () => {
  it('defaults to 90s with ±15 steppers', () => {
    expect(REST_DEFAULT_SEC).toBe(90);
    expect(REST_STEP_SEC).toBe(15);
  });
});
