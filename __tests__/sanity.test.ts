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

  it('uses the armandotfit signal brand in light mode', () => {
    // SIGNAL palette (docs/architecture/signal-thesis.md §3) — brand is
    // the fill slot (3.74:1 on card), brandText is the AA small-text
    // companion, textOnBrand is ink on the signal fill (road-sign law).
    expect(theme.colors.light.brand).toBe('#E8510A');
    expect(theme.colors.light.brandText).toBe('#993A05');
    expect(theme.colors.light.textOnBrand).toBe('#0B0E13');
  });

  it('ships the mode-independent focus register in both palettes', () => {
    // The Floor: identical in light and dark — the live-session stage
    // does not follow the Desk's mode.
    expect(theme.colors.light.focus).toEqual(theme.colors.dark.focus);
    expect(theme.colors.light.focus.text).toBe('#F2F5FA');
    expect(theme.colors.light.focus.background).toBe('#0A0C10');
  });

  it('exports typography tokens', () => {
    // The SIGNAL scale (docs/architecture/signal-thesis.md §2.2):
    // titles 30 in the display face, the hero figure at 80 in the
    // CONDENSED display position, action labels 16/700, every figure
    // token tabular by construction.
    expect(theme.typography.mobileTitle.fontSize).toBe(30);
    expect(theme.typography.mobileTitle.fontFamily).toBe(theme.fonts.display);
    expect(theme.typography.mobileHero.fontSize).toBe(80);
    expect(theme.typography.mobileHero.fontFamily).toBe(theme.fonts.displayCondensed);
    expect(theme.typography.mobileAction.fontWeight).toBe('700');
    expect(theme.typography.mobileHero.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileLedger.fontVariant).toEqual(['tabular-nums']);
  });
});
