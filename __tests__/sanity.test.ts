import { describe, it, expect } from 'vitest';
import { theme } from '../constants';

describe('theme', () => {
  it('exports both light and dark palettes', () => {
    expect(theme.colors.light).toBeDefined();
    expect(theme.colors.dark).toBeDefined();
  });

  it('has matching structural keys between light and dark', () => {
    const lightKeys = Object.keys(theme.colors.light).sort();
    const darkKeys = Object.keys(theme.colors.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it('uses the armandotfit record orange + the ink verb in light mode', () => {
    // THE BOARD palette (docs/architecture/board-thesis.md §4) —
    // brand is the RECORD ORANGE (marks PRs, links, the living
    // pulse; 4.82:1 with its on-fill text), brandText is the AA
    // small-text companion, and THE VERB IS INK: buttonBackground is
    // the board's text color with the ground as its label (17:1).
    expect(theme.colors.light.brand).toBe('#C24100');
    expect(theme.colors.light.brandText).toBe('#9A3300');
    expect(theme.colors.light.buttonBackground).toBe(theme.colors.light.text);
    expect(theme.colors.light.textOnBrand).toBe('#FAFAF7');
  });

  it('ships the mode-independent wire in both palettes', () => {
    // The wire register: identical in light and dark — the chit and
    // the curtain render the near-black wire in both modes.
    expect(theme.colors.light.focus).toEqual(theme.colors.dark.focus);
    expect(theme.colors.light.focus.text).toBe('#EDE9DE');
    expect(theme.colors.light.focus.background).toBe('#0A0B0C');
  });

  it('ships the plate code as the meter ramp', () => {
    // Six steps + the rim, structurally identical in both palettes
    // (arqavellum keeps its own values — only the structure syncs).
    expect(Object.keys(theme.colors.light.meter)).toEqual(
      Object.keys(theme.colors.dark.meter),
    );
    // The plate code's anchors: red 25, blue 20 (light values).
    expect(theme.colors.light.meter.step1).toBe('#C0281C');
    expect(theme.colors.light.meter.step2).toBe('#1E4FB8');
  });

  it('exports typography tokens', () => {
    // THE BOARD ramp (docs/architecture/board-thesis.md §3.2): six
    // sizes — 56 (the armed figures) · 36 (the statement) · 22 (the
    // subhead) · 17 (the row) · 15 (reading + row figures) · 12 (the
    // whisper). Statements in Archivo Cond (the width axis pinned at
    // 75%), every working figure in Spline Sans Mono (tabular by
    // construction), reading in the platform sans.
    expect(theme.typography.mobileTitle.fontSize).toBe(22);
    expect(theme.typography.mobileTitle.fontFamily).toBe(theme.fonts.display);
    expect(theme.typography.mobileDisplay.fontSize).toBe(36);
    expect(theme.typography.mobileDisplay.fontFamily).toBe(theme.fonts.displayCondensed);
    // The hero rank is retired — no size of its own, just the statement.
    expect(theme.typography.mobileHero.fontSize).toBe(36);
    expect(theme.typography.mobileAction.fontWeight).toBe('800');
    expect(theme.typography.mobileCounter.fontSize).toBe(56);
    expect(theme.typography.mobileCounter.fontFamily).toBe(theme.fonts.mono);
    expect(theme.typography.mobileCounter.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontSize).toBe(15);
    expect(theme.typography.mobileFigure.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontFamily).toBe(theme.fonts.mono);
    expect(theme.typography.mobileLedger.fontSize).toBe(12);
    expect(theme.typography.mobileLedger.fontVariant).toEqual(['tabular-nums']);
  });
});
