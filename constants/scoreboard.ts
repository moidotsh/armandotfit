// constants/scoreboard.ts
//
// THE SCOREBOARD's presentation law (docs/architecture/
// scoreboard-thesis.md): the air rhythm, the statement/whisper style
// carriers, the register line's leader, and THE REST INSTRUMENT's
// constants. Colors live in theme.colors.*; this file owns the
// geometry. THE STILL SYSTEM needs no duration constants — content
// never animates (the shell's curtain/sheet own their timings).

import type { TextStyle } from 'react-native';
import { theme } from './theme';

// ── The air law ─────────────────────────────────────────────────────────
// The 20px gutter (350px column at 390), the 32px block rhythm, the
// 24px statement halo, the 8px row gap.
export const PAGE_GUTTER = 20;
export const BLOCK_GAP = 32;
export const ROW_GAP = 8;
export const HALO = 24;

// The style carriers every screen spreads — one statement per screen
// (36 Space Grotesk, sentence case, the content itself — never a page
// nameplate), the fact whisper beneath it, and the block rhythm's
// baseline. `blockFirst` leads the page (no gap above the first
// word); `statement` carries the halo below.
export const SCOREBOARD = {
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
  block: {
    marginTop: BLOCK_GAP,
  } as TextStyle,
  blockFirst: {
    marginTop: 0,
  } as TextStyle,
} as const;

/** The register line's leader — the typographic dotted rule that
 * runs from a name to its right-aligned figure (thesis §5). Mono
 * middle dots, muted ink, whisper scale. */
export const LEADER_CHAR = '·';

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
