// constants/interval.ts
//
// THE INTERVAL's presentation law (docs/architecture/
// interval-thesis.md): the air rhythm, the rank carriers, and THE
// REST INSTRUMENT's constants. The counter rank belongs to the
// live question — the rest clock while rest runs, the armed
// expression otherwise (§7) — and ink is state: armed/live carries
// the full ink, settled/past/unarmed reads muted (§2). Colors live
// in theme.colors.*; this file owns the geometry and the style
// carriers. THE STILL SYSTEM needs no duration constants — content
// never animates, and the re-weight is a repaint (the shell's
// curtain/sheet own their timings).

import type { TextStyle, ViewStyle } from 'react-native';
import { theme } from './theme';

// ── The air law ─────────────────────────────────────────────────────────
// The 20px gutter (350px column at 390), the 32px block rhythm, the
// 24px statement halo, the 8px row gap.
export const PAGE_GUTTER = 20;
export const BLOCK_GAP = 32;
export const ROW_GAP = 8;
export const HALO = 24;

// ── THE PRESS (thesis §6, S2) ───────────────────────────────────────────
// The one sanctioned touch feedback, now AUTHORED (pass 14A): opacity
// dips instantly in/out — no scale, no color shift, no second value
// invented at a call site. Two depths, two jobs: the standard dip for
// furniture and rows; the plate dip for filled ink plates (the verb,
// the ticker), where the standard dip would strobe the heaviest mark
// on the page.
export const PRESS_DIP = 0.6;
export const PRESS_DIP_PLATE = 0.85;

// The style carriers every screen spreads (docs/architecture/
// interval-thesis.md §3.2): one statement per screen (36 Space
// Grotesk, sentence case, the content itself — never a page
// nameplate), the fact whisper beneath it, and the block rhythm's
// baseline. `liveFigure` is THE LIVE FIGURE — the counter rank the
// screen's current question owns; `demotedFigure` is the figure
// that yields it (the armed expression while the rest clock runs).
// `blockFirst` leads the page (no gap above the first word);
// `statement` carries the halo below.
export const INTERVAL = {
  // Web prints textWrap where it knows it (statements and facts break
  // where a typographer would break them — the atelier pass); the
  // property is a cast because RN's TextStyle does not declare it.
  statement: {
    ...theme.typography.mobileTitleCondensed,
    textWrap: 'balance',
  } as unknown as TextStyle,
  fact: {
    ...theme.typography.mobileLedger,
    marginTop: 4,
    textWrap: 'balance',
  } as unknown as TextStyle,
  row: {
    ...theme.typography.mobileItemTitle,
  } as TextStyle,
  whisper: {
    ...theme.typography.mobileEyebrow,
  } as TextStyle,
  whisperLine: {
    ...theme.typography.mobileLedger,
  } as TextStyle,
  figure: {
    ...theme.typography.mobileFigure,
  } as TextStyle,
  /** THE LIVE FIGURE — the counter rank (Martian 72/700/−1.5),
   * carried by the figure answering the screen's current question
   * (the armed expression in work, the rest clock while it runs,
   * the streak, the count, the tonnage). One per screen, at most. */
  liveFigure: {
    ...theme.typography.mobileCounter,
  } as TextStyle,
  /** The figure that yields the counter — the armed expression
   * while the rest clock runs: the statement rank, muted (ink is
   * state; the armed field keeps its 2px rule). */
  demotedFigure: {
    ...theme.typography.mobileHero,
    fontFamily: theme.typography.mobileCounter.fontFamily,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  block: {
    marginTop: BLOCK_GAP,
  } as TextStyle,
  blockFirst: {
    marginTop: 0,
  } as TextStyle,
} as const;

/** The meter ramp's step keys — the categorical ramp in
 * theme.colors.*.meter (the zone ramp here; the structure is the
 * shell's, the values are the consumer's). */
export type MeterStep =
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5'
  | 'step6';

// ── THE PAPER'S TOOTH (the atelier pass — the stock) ────────────────────
// Premium minimal is never flat: it is STOCK. Two SVG-turbulence
// grains at a whisper — dark tooth for the printed card, chalk tooth
// for the unlit board — laid over the ground by BoardShell + the
// Floor. The ground stops reading as a screen and starts reading as
// paper; the ink plates (the verbs) wear the kit's own grain.
export const PAPER_TOOTH_BACKGROUND =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='t'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23t)' opacity='0.025'/></svg>\")";
export const BOARD_TOOTH_BACKGROUND =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='t'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23t)' opacity='0.05'/></svg>\")";
/** The tooth layer for the active mode (RN's ViewStyle does not know
 * backgroundImage; RN-web renders it — the kit's grain.ts cast). */
export const paperToothStyle = (colorScheme: 'light' | 'dark'): ViewStyle =>
  ({
    backgroundImage:
      colorScheme === 'dark' ? BOARD_TOOTH_BACKGROUND : PAPER_TOOTH_BACKGROUND,
  }) as unknown as ViewStyle;

// ── THE REST INSTRUMENT ─────────────────────────────────────────────────
// The rest countdown's constants (thesis §7): default 90 s, steppers
// ±15 s. Session UI-state only — nothing joins the data spine.
export const REST_DEFAULT_SEC = 90;
export const REST_STEP_SEC = 15;
