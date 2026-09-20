// scripts/verify-design.ts
// THE DESIGN LAW AS A GATE — THE INTERVAL's token arithmetic, rank
// grammar, and contrast matrix, checked pure (no browser, no
// rendering): the ramp (every size divides 72, LH = size + 6), the
// authored tracking per rank, the mono figure tokens, the
// second-voice ratio, the square cut, the retired lift, the wire's
// mode-independence, every text×surface pair in both modes against
// its WCAG bar, AND the call-site law — no ad-hoc fontSize or
// letterSpacing literal anywhere in the consumer-authored layer
// (app/, components/composed/, components/primitives/), plus the
// kit primitives this app renders (they read the consumer's tokens,
// never literals). Chained into `lint:structure` so a drifted token
// fails the commit like any structural audit. The thesis
// (docs/architecture/interval-thesis.md §3, §4, §10) is the spec;
// this is its arithmetic.

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
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

// ── THE HARMONIC RAMP (thesis §3.2) ───────────────────────────────────
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

// ── TRACKING IS AUTHORED PER RANK AND EXACT (thesis §3.2) ────────────
// counter −1.5 · statement −0.5 · row/second-voice 0 · caps furniture
// +0.8 · lowercase mono whispers/tags 0 · body 0. The set is closed:
// no other tracking value may exist in a token or a call site.
const TRACKING_SET = new Set([-1.5, -0.5, 0, 0.8]);
check(
  theme.typography.mobileCounter.letterSpacing === -1.5,
  'tracking: counter −1.5',
);
check(
  theme.typography.mobileTitleCondensed.letterSpacing === -0.5,
  'tracking: statement −0.5',
);
check(theme.typography.mobileTitle.letterSpacing === 0, 'tracking: row 0');
check(
  theme.typography.mobileEyebrow.letterSpacing === 0.8,
  'tracking: furniture caps +0.8',
);
check(theme.typography.mobileAction.letterSpacing === 0.8, 'tracking: verb caps +0.8');
check(theme.typography.mobileTag.letterSpacing === 0, 'tracking: tags 0');
for (const [name, token] of Object.entries(theme.typography)) {
  if (token.letterSpacing === undefined) continue;
  check(
    TRACKING_SET.has(token.letterSpacing),
    `tracking: ${name} letterSpacing ${token.letterSpacing} ∈ {−1.5, −0.5, 0, +0.8}`,
  );
}

// ── THE FIGURE TOKENS ARE MONO (thesis §3.3) ──────────────────────────
// Every figure rides the mono face — tabular by construction. The
// three figure tokens assert it at gate time; long reading text
// (mobileBody/mobileMeta/mobileFieldLabel) stays on the system sans.
// The counter rides the mono face's CONDENSED cut (the sight
// amendment, thesis §3.2: the regular cut at 72 truncated the armed
// expression inside its own boxes); the working figure tokens keep
// the regular cut.
check(
  theme.fonts.monoCondensed != null && theme.fonts.monoCondensed !== theme.fonts.mono,
  'figures: the counter’s condensed cut is declared and distinct',
);
check(
  theme.typography.mobileCounter.fontFamily === theme.fonts.monoCondensed,
  'figures: the counter rides the condensed cut',
);
for (const name of ['mobileFigure', 'mobileLedger']) {
  check(
    theme.typography[name as keyof typeof theme.typography].fontFamily === theme.fonts.mono,
    `figures: ${name} rides the mono face`,
  );
}
check(
  theme.typography.mobileCounter.fontVariant?.includes('tabular-nums') === true,
  'figures: the counter is tabular',
);

// ── THE SQUARE CUT + the retired lift (thesis §5) ─────────────────────
for (const [name, r] of Object.entries(theme.shapes)) {
  check(r === 0, `square cut: shapes.${name} = 0`);
}
check(theme.colors.light.mobilePremium.instrumentShadow === 'none', 'light: instrumentShadow retired');
check(theme.colors.dark.mobilePremium.instrumentShadow === 'none', 'dark: instrumentShadow retired');

// ── THE WIRE is mode-independent (thesis §4.1) ────────────────────────
check(
  JSON.stringify(theme.colors.light.focus) === JSON.stringify(theme.colors.dark.focus),
  'the wire is identical in both modes',
);

// ── THE CONTRAST MATRIX (both modes, thesis §4.3) ─────────────────────
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

// ── THE CALL-SITE LAW (thesis §10.2) ──────────────────────────────────
// No ad-hoc type in the consumer-authored layer: every numeric
// fontSize ∈ {12,18,36,72} and every numeric letterSpacing ∈
// {−1.5, −0.5, 0, +0.8}. The kit primitives THIS app renders are
// held to the same law (they read the consumer's tokens) — the
// states amendment widened the list from ten hand-named files to
// every kit file the shell layout or a route actually mounts
// (OfflineBanner, RouteCurtain's stamp, the form trio, the
// atmosphere); a literal above mark scale needs the mark's own
// `mark-exempt:` excuse on its line. The shell's unrendered
// primitives and the showcase (the shell's gallery) stay exempt —
// they are the shell's own surfaces.
const SCRIPT_DIR = new URL('.', import.meta.url).pathname;
const REPO_ROOT = join(SCRIPT_DIR, '..');
function* tsxFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      yield* tsxFiles(full);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      yield full;
    }
  }
}
const SCAN_DIRS = ['app', 'components/composed', 'components/primitives'];
const CLEAN_KIT_FILES = [
  'components/MobilePremium/EmptyState.tsx',
  'components/MobilePremium/FilterChip.tsx',
  'components/MobilePremium/MobileActionFooter.tsx',
  'components/MobilePremium/MobileAlert.tsx',
  'components/MobilePremium/MobileAtmosphere.tsx',
  'components/MobilePremium/MobileHeader.tsx',
  'components/MobilePremium/MobileInput.tsx',
  'components/MobilePremium/MobilePrimaryButton.tsx',
  'components/MobilePremium/MobileSelect.tsx',
  'components/MobilePremium/MobileSheet.tsx',
  'components/MobilePremium/DatePickerField.tsx',
  'components/MobilePremium/OfflineBanner.tsx',
  'components/MobilePremium/RouteCurtain.tsx',
  'components/MobilePremium/SearchField.tsx',
  'components/MobilePremium/SegmentedControl.tsx',
  // The focus-ring primitive — the ring rides the host's shape law
  // (revision 2027-03: a magic 14 once rounded the square cut).
  'components/premium/shared/Motion.tsx',
];
const FONT_SIZE_RE = /fontSize:\s*(-?\d+(?:\.\d+)?)/g;
const LETTER_SPACING_RE = /letterSpacing:\s*(-?\d+(?:\.\d+)?)/g;
// THE SQUARE CUT AT THE SOURCE (revision 2027-03): theme.shapes is
// gated to 0, but a literal radius could still draw a corner the law
// never spent. Plates are square — any literal above mark-scale (a
// status dot, a 4px progress track, a 3px hue tick stay marks) fails.
const BORDER_RADIUS_RE = /borderRadius:\s*(-?\d+(?:\.\d+)?)/g;
const MARK_SCALE_RADIUS = 4;
let scanned = 0;
for (const rel of [...SCAN_DIRS, ...CLEAN_KIT_FILES]) {
  const full = join(REPO_ROOT, rel);
  const files = statSync(full).isDirectory() ? [...tsxFiles(full)] : [full];
  for (const file of files) {
    scanned += 1;
    const src = readFileSync(file, 'utf8');
    const relName = file.slice(REPO_ROOT.length + 1);
    for (const m of src.matchAll(FONT_SIZE_RE)) {
      const size = Number(m[1]);
      check(
        RAMP.has(size),
        `call-site: ${relName} fontSize ${size} ∈ {12,18,36,72}`,
      );
    }
    for (const m of src.matchAll(LETTER_SPACING_RE)) {
      const ls = Number(m[1]);
      check(
        [...TRACKING_SET].some((t) => Math.abs(t - ls) < 1e-9),
        `call-site: ${relName} letterSpacing ${ls} ∈ {−1.5, −0.5, 0, +0.8}`,
      );
    }
    for (const m of src.matchAll(BORDER_RADIUS_RE)) {
      const r = Number(m[1]);
      if (r <= MARK_SCALE_RADIUS) continue;
      // A literal above mark scale needs the mark's own excuse: a
      // trailing `mark-exempt:` comment on its line.
      const at = m.index ?? 0;
      const lineStart = src.lastIndexOf('\n', at) + 1;
      const lineEnd = src.indexOf('\n', at);
      const line = src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (line.includes('mark-exempt:')) continue;
      check(
        false,
        `square cut: ${relName} borderRadius ${r} ≤ mark scale (${MARK_SCALE_RADIUS})`,
      );
    }
  }
}
check(scanned > 20, `call-site scan covered the authored layer (${scanned} files)`);

if (failures.length > 0) {
  console.error(`\nverify-design: ${failures.length} FAILURES`);
  process.exit(1);
}
console.log('\nverify-design: the law holds.');
