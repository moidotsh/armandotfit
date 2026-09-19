import { describe, it, expect } from 'vitest';
import { theme } from '../constants';

// THE SCOREBOARD theme law (docs/architecture/scoreboard-thesis.md).
// Assertions rewritten for the eighth upending: THE HARMONIC RAMP
// {12, 18, 36, 72} (every size divides the counter, LH = size + 6),
// RED INK as the brand slot, the ink verb, the mode-independent wire.

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

  it('uses the scoreboard red ink + the ink verb in light mode', () => {
    // THE SCOREBOARD palette (docs/architecture/scoreboard-thesis.md
    // §4) — brand is RED INK (marks records, links, the live pulse;
    // 5.29:1 with its on-fill text), brandText is the AA small-text
    // companion, and THE VERB IS INK: buttonBackground is the
    // ground's text color with the ground as its label (15.7:1).
    expect(theme.colors.light.brand).toBe('#BE2B20');
    expect(theme.colors.light.brandText).toBe('#A8241B');
    expect(theme.colors.light.buttonBackground).toBe(theme.colors.light.text);
    expect(theme.colors.light.textOnBrand).toBe('#F4F2EE');
  });

  it('ships the mode-independent wire in both palettes', () => {
    // The wire register: identical in light and dark — the chit and
    // the curtain render the near-black wire in both modes.
    expect(theme.colors.light.focus).toEqual(theme.colors.dark.focus);
    expect(theme.colors.light.focus.text).toBe('#ECF0F2');
    expect(theme.colors.light.focus.background).toBe('#0B0D0F');
  });

  it('ships the zone ramp as the meter ramp', () => {
    // Six steps + the rim, structurally identical in both palettes
    // (arqavellum keeps its own values — only the structure syncs).
    expect(Object.keys(theme.colors.light.meter)).toEqual(
      Object.keys(theme.colors.dark.meter),
    );
    // The zone ramp's anchors: barbell oxide, cable blue (light).
    expect(theme.colors.light.meter.step1).toBe('#B02A1C');
    expect(theme.colors.light.meter.step3).toBe('#2559B7');
  });

  it('runs the square cut — every shape radius is 0', () => {
    for (const r of Object.values(theme.shapes)) {
      expect(r).toBe(0);
    }
  });

  it('retires the instrument lift — no shadow in the kit tokens', () => {
    expect(theme.colors.light.mobilePremium.instrumentShadow).toBe('none');
    expect(theme.colors.dark.mobilePremium.instrumentShadow).toBe('none');
  });

  it('exports typography tokens on THE HARMONIC RAMP', () => {
    // THE SCOREBOARD ramp (docs/architecture/
    // scoreboard-thesis.md §3.2): FOUR sizes — 72 (the armed
    // expression, the streak) · 36 (the statement) · 18 (the second
    // voice, rows, body) · 12 (furniture caps, whisper figures).
    // Every size divides the counter; every lineHeight = size + 6;
    // statements in Space Grotesk (no condensed second family), every
    // working figure in Martian Mono (tabular by construction),
    // reading in the platform sans.
    expect(theme.typography.mobileTitle.fontSize).toBe(18);
    expect(theme.typography.mobileTitle.fontFamily).toBe(theme.fonts.display);
    expect(theme.typography.mobileDisplay.fontSize).toBe(36);
    expect(theme.typography.mobileDisplay.fontFamily).toBe(theme.fonts.display);
    // No condensed second family: the slot resolves to the display face.
    expect(theme.fonts.displayCondensed).toBe(theme.fonts.display);
    // The hero rank is retired — no size of its own, just the statement.
    expect(theme.typography.mobileHero.fontSize).toBe(36);
    expect(theme.typography.mobileAction.fontWeight).toBe('700');
    expect(theme.typography.mobileCounter.fontSize).toBe(72);
    // The counter rides the mono face's CONDENSED cut (the sight
    // amendment): the regular cut at 72 truncated the expression
    // inside its own boxes.
    expect(theme.typography.mobileCounter.fontFamily).toBe(theme.fonts.monoCondensed);
    expect(theme.fonts.monoCondensed).not.toBe(theme.fonts.mono);
    expect(theme.typography.mobileCounter.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontSize).toBe(18);
    expect(theme.typography.mobileFigure.fontVariant).toEqual(['tabular-nums']);
    expect(theme.typography.mobileFigure.fontFamily).toBe(theme.fonts.mono);
    expect(theme.typography.mobileLedger.fontSize).toBe(12);
    expect(theme.typography.mobileLedger.fontVariant).toEqual(['tabular-nums']);
  });

  it('holds the harmonic-ramp arithmetic on every token', () => {
    // The ramp law as a system invariant: every named style's size is
    // one of {12, 18, 36, 72} (each an exact divisor of the counter)
    // and every lineHeight = size + 6.
    for (const [name, token] of Object.entries(theme.typography)) {
      expect([12, 18, 36, 72]).toContain(token.fontSize);
      expect(72 % token.fontSize).toBe(0);
      expect(token.lineHeight).toBe(token.fontSize + 6);
      expect(name).toBeTruthy();
    }
    // The second voice is 2.0x quieter than the statement (≥1.4 law).
    expect(
      theme.typography.mobileTitleCondensed.fontSize /
        theme.typography.mobileTitle.fontSize,
    ).toBeGreaterThanOrEqual(1.4);
  });
});
