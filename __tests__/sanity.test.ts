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

  it('uses the armandotfit record red in light mode', () => {
    // THE BROADSHEET palette (docs/architecture/broadsheet-thesis.md
    // §3) — brand is the record fill (4.48:1 on page), brandText is the
    // AA small-text companion, textOnBrand is paper on the record red.
    expect(theme.colors.light.brand).toBe('#C24100');
    expect(theme.colors.light.brandText).toBe('#9A3300');
    expect(theme.colors.light.textOnBrand).toBe('#FFF5EC');
  });

  it('ships the mode-independent wire in both palettes', () => {
    // The wire register: identical in light and dark — the chit, the
    // curtain, and the ticker render the warm-black wire in both modes.
    expect(theme.colors.light.focus).toEqual(theme.colors.dark.focus);
    expect(theme.colors.light.focus.text).toBe('#EDE9DE');
    expect(theme.colors.light.focus.background).toBe('#0E0C08');
  });

  it('exports typography tokens', () => {
    // THE QUIET PAGE ramp (docs/architecture/quiet-page-thesis.md
    // §3.2): five sizes total — 48 (the call) · 34 (the statement) ·
    // 22 (the subhead) · 15 (the row/verb/reading) · 12 (the
    // whisper). Statements in Rokkitt, every working figure in Azeret
    // Mono (tabular by construction), reading in the platform sans.
    // The counter is the agate face's one display size.
    expect(theme.typography.mobileTitle.fontSize).toBe(22);
    expect(theme.typography.mobileTitle.fontFamily).toBe(theme.fonts.display);
    expect(theme.typography.mobileDisplay.fontSize).toBe(34);
    expect(theme.typography.mobileDisplay.fontFamily).toBe(theme.fonts.display);
    // The hero rank is retired — no size of its own, just the statement.
    expect(theme.typography.mobileHero.fontSize).toBe(34);
    expect(theme.typography.mobileAction.fontWeight).toBe('700');
    expect(theme.typography.mobileCounter.fontSize).toBe(48);
    expect(theme.typography.mobileCounter.fontFamily).toBe(theme.fonts.mono);
    expect(theme.typography.mobileCounter.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontSize).toBe(15);
    expect(theme.typography.mobileFigure.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontFamily).toBe(theme.fonts.mono);
    expect(theme.typography.mobileLedger.fontSize).toBe(12);
    expect(theme.typography.mobileLedger.fontVariant).toEqual(['tabular-nums']);
  });
});
