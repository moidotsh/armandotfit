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

  it('uses armandotfit orange as the brand color in light mode', () => {
    expect(theme.colors.light.brand).toBe('#FF9500');
  });

  it('exports typography tokens', () => {
    expect(theme.typography.mobileTitle.fontSize).toBe(22);
    expect(theme.typography.mobileAction.fontWeight).toBe('600');
  });
});
