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

  it('uses the armandotfit ember brand in light mode', () => {
    // Ember ink palette — brand is the fill slot (3:1 on paper),
    // brandText is the AA small-text companion, textOnBrand is warm ink.
    expect(theme.colors.light.brand).toBe('#E8590C');
    expect(theme.colors.light.brandText).toBe('#A03A08');
    expect(theme.colors.light.textOnBrand).toBe('#231B15');
  });

  it('exports typography tokens', () => {
    expect(theme.typography.mobileTitle.fontSize).toBe(22);
    expect(theme.typography.mobileAction.fontWeight).toBe('600');
  });
});
