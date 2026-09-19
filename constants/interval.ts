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

import type { TextStyle } from 'react-native';
import { theme } from './theme';

// ── The air law ─────────────────────────────────────────────────────────
// The 20px gutter (350px column at 390), the 32px block rhythm, the
// 24px statement halo, the 8px row gap.
export const PAGE_GUTTER = 20;
export const BLOCK_GAP = 32;
export const ROW_GAP = 8;
export const HALO = 24;

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
  statement: {
    ...theme.typography.mobileTitleCondensed,
  } as TextStyle,
  fact: {
    ...theme.typography.mobileLedger,
    marginTop: 4,
  } as TextStyle,
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

// ── THE REST INSTRUMENT ─────────────────────────────────────────────────
// The rest countdown's constants (thesis §7): default 90 s, steppers
// ±15 s. Session UI-state only — nothing joins the data spine.
export const REST_DEFAULT_SEC = 90;
export const REST_STEP_SEC = 15;
