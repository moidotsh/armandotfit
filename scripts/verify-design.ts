// scripts/verify-design.ts
// THE DESIGN LAW AS A GATE — the scoreboard's token arithmetic and
// contrast matrix, checked pure (no browser, no rendering): the ramp
// (every size divides 72, LH = size + 6), the second-voice ratio, the
// square cut, the retired lift, the wire's mode-independence, and
// every text×surface pair in both modes against its WCAG bar. Chained
// into `lint:structure` so a drifted token fails the commit like any
// structural audit. The thesis (docs/architecture/
// scoreboard-thesis.md §4.3, §3.2) is the spec; this is its
// arithmetic.

import { theme } from '../constants/theme';

const failures: string[] = [];
function check(ok: boolean, label: string) {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    failures.push(label);
    console.log(`✗ ${label}`);
  }
}

// ── WCAG 2.1 contrast (pure) ─────────────────────────────────────────
function channelLin(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * channelLin(rgb[0]) + 0.7152 * channelLin(rgb[1]) + 0.0722 * channelLin(rgb[2]);
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── THE HARMONIC RAMP ────────────────────────────────────────────────
const RAMP = new Set([12, 18, 36, 72]);
for (const [name, token] of Object.entries(theme.typography)) {
  check(RAMP.has(token.fontSize), `ramp: ${name} size ${token.fontSize} ∈ {12,18,36,72}`);
  check(72 % token.fontSize === 0, `ramp: ${name} size divides 72`);
  check(token.lineHeight === token.fontSize + 6, `ramp: ${name} LH = size + 6 (${token.lineHeight})`);
}
const ratio =
  theme.typography.mobileTitleCondensed.fontSize / theme.typography.mobileTitle.fontSize;
check(ratio >= 1.4, `second voice ≥1.4× quieter (${ratio.toFixed(2)})`);
check(theme.fonts.displayCondensed === theme.fonts.display, 'no condensed second family');

// ── THE SQUARE CUT + the retired lift ────────────────────────────────
for (const [name, r] of Object.entries(theme.shapes)) {
  check(r === 0, `square cut: shapes.${name} = 0`);
}
check(theme.colors.light.mobilePremium.instrumentShadow === 'none', 'light: instrumentShadow retired');
check(theme.colors.dark.mobilePremium.instrumentShadow === 'none', 'dark: instrumentShadow retired');

// ── THE WIRE is mode-independent ─────────────────────────────────────
check(
  JSON.stringify(theme.colors.light.focus) === JSON.stringify(theme.colors.dark.focus),
  'the wire is identical in both modes',
);

// ── THE CONTRAST MATRIX (both modes) ─────────────────────────────────
for (const mode of ['light', 'dark'] as const) {
  const p = theme.colors[mode];
  const surfaces: Array<[string, string]> = [
    ['ground', p.background],
    ['cardAlt', p.cardAlt],
  ];
  for (const [sName, sHex] of surfaces) {
    check(contrast(p.text, sHex) >= 4.5, `${mode}: text/${sName} ≥4.5 (${contrast(p.text, sHex).toFixed(2)})`);
    check(contrast(p.textSecondary, sHex) >= 4.5, `${mode}: secondary/${sName} ≥4.5 (${contrast(p.textSecondary, sHex).toFixed(2)})`);
    check(contrast(p.textMuted, sHex) >= 4.5, `${mode}: muted/${sName} ≥4.5 (${contrast(p.textMuted, sHex).toFixed(2)})`);
    check(contrast(p.brandText, sHex) >= 4.5, `${mode}: redText/${sName} ≥4.5 (${contrast(p.brandText, sHex).toFixed(2)})`);
  }
  check(contrast(p.textOnBrand, p.brand) >= 4.5, `${mode}: onRed/red-fill ≥4.5 (${contrast(p.textOnBrand, p.brand).toFixed(2)})`);
  check(contrast(p.textOnBrand, p.buttonBackground) >= 4.5, `${mode}: verb label/ink ≥4.5`);
  for (const [k, v] of Object.entries(p.status)) {
    check(contrast(v, p.background) >= 4.5, `${mode}: status.${k}/ground ≥4.5 (${contrast(v, p.background).toFixed(2)})`);
  }
  for (const [k, v] of Object.entries(p.meter)) {
    if (k === 'rim') continue;
    check(contrast(v, p.background) >= 3, `${mode}: zone.${k}/ground ≥3:1 (${contrast(v, p.background).toFixed(2)})`);
  }
}

if (failures.length > 0) {
  console.error(`\nverify-design: ${failures.length} FAILURES`);
  process.exit(1);
}
console.log('\nverify-design: the law holds.');
