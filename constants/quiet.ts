// constants/quiet.ts
// THE QUIET PAGE's ONE declaration point (docs/architecture/
// quiet-page-thesis.md) — the same discipline as the dialect layer
// (`DIALECT = 'ink'` presets orb/toast/curtain in theme.ts): every
// quiet-page pattern lives HERE, and screens spread the named styles
// the way they spread `theme.typography.*`. Retune this table and the
// whole app follows; a screen hand-rolling a statement or block gap
// is a drift, not a choice.
//
//   PAGE_GUTTER  20  the column's left/right rule, consistent ±2
//   BLOCK_GAP    40  vertical air between top-level sibling blocks
//   ROW_GAP      16  vertical air between rows inside a block
//   HALO         24  the statement's bounding-box moat — no other
//                    content element may enter
//
// Air is spent above the fold, never by pushing the verb below it
// (the SE law, repo CLAUDE.md invariant 10, still governs).

import type { TextStyle, ViewStyle } from 'react-native';
import { theme } from './theme';

export const PAGE_GUTTER = 20;
export const BLOCK_GAP = 40;
export const ROW_GAP = 16;
export const HALO = 24;

// Named style fragments. Text entries stay TextStyle-shaped (typed
// picks avoid RN's string-widening on fontWeight) so they spread
// cleanly into any StyleSheet entry.
type TextToken = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'fontFamily' | 'fontVariant' | 'marginTop'>;
type ViewToken = Pick<ViewStyle, 'marginTop'>;

/** THE STATEMENT — exactly one per screen; the content itself, in
 *  sentence case. Never a page name. */
const statement: TextToken = { ...theme.typography.mobileDisplay };

/** The fact line — ONE quiet line of facts beneath a statement; it
 *  waits outside the halo (the marginTop IS the halo). */
const fact: TextToken = { ...theme.typography.mobileLedger, marginTop: HALO };

/** The row lead — working text at row scale. */
const row: TextToken = { ...theme.typography.mobileItemTitle };

/** The whisper — tracked caps for section marks and folios. */
const whisper: TextToken = { ...theme.typography.mobileEyebrow };

/** The whisper line — quiet ledger facts (dates, tags, meta). */
const whisperLine: TextToken = { ...theme.typography.mobileLedger };

/** The working figure — every number that changes or aligns. */
const figure: TextToken = { ...theme.typography.mobileFigure };

/** A top-level block — carries the air law's BLOCK_GAP above it. */
const block: ViewToken = { marginTop: BLOCK_GAP };

/** The page's first block — the statement leads with almost none. */
const blockFirst: ViewToken = { marginTop: 4 };

export const QUIET = {
  statement,
  fact,
  row,
  whisper,
  whisperLine,
  figure,
  block,
  blockFirst,
} as const;

/** The halo margin a fact line carries beneath a statement. */
export const FACT_GAP = HALO;
