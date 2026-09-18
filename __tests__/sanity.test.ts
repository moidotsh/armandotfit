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

  it('uses the armandotfit strike brand in light mode', () => {
    // THE COUNT palette (docs/architecture/count-thesis.md §3) — brand
    // is the strike fill (4.47:1 on page), brandText is the AA
    // small-text companion, textOnBrand is chalk on the burnt strike.
    expect(theme.colors.light.brand).toBe('#C64100');
    expect(theme.colors.light.brandText).toBe('#A83E00');
    expect(theme.colors.light.textOnBrand).toBe('#FFF6EF');
  });

  it('ships the mode-independent iron interrupt in both palettes', () => {
    // The interrupt register: identical in light and dark — the chit,
    // the curtain, and the session strip render iron in both modes.
    expect(theme.colors.light.focus).toEqual(theme.colors.dark.focus);
    expect(theme.colors.light.focus.text).toBe('#ECECEA');
    expect(theme.colors.light.focus.background).toBe('#0C0D0D');
  });

  it('exports typography tokens', () => {
    // THE COUNT scale (docs/architecture/count-thesis.md §2.2):
    // statements in the display face (30 · 44 · 76), mono WORKING
    // figures always tabular by construction (14 · 26 · 56), words in
    // the platform sans. The counter is the mono face's one display
    // size.
    expect(theme.typography.mobileTitle.fontSize).toBe(30);
    expect(theme.typography.mobileTitle.fontFamily).toBe(theme.fonts.display);
    expect(theme.typography.mobileHero.fontSize).toBe(76);
    expect(theme.typography.mobileHero.fontFamily).toBe(theme.fonts.display);
    expect(theme.typography.mobileDisplay.fontSize).toBe(44);
    expect(theme.typography.mobileAction.fontWeight).toBe('700');
    expect(theme.typography.mobileCounter.fontSize).toBe(56);
    expect(theme.typography.mobileCounter.fontFamily).toBe(theme.fonts.mono);
    expect(theme.typography.mobileCounter.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileLedger.fontVariant).toEqual(['tabular-nums']);
  });
});
