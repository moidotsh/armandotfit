// constants/quiet.ts
// THE QUIET PAGE air law (docs/architecture/quiet-page-thesis.md
// §3.4) — whitespace as a first-class material with numbers. These
// are the app's own design constants (consumer-owned; the shell's
// layout policy lives in styles.ts), probe-enforced by P-AIR-1:
//
//   PAGE_GUTTER  20  the column's left/right rule, consistent ±2
//   BLOCK_GAP    40  vertical air between top-level sibling blocks
//   ROW_GAP      16  vertical air between rows inside a block
//   HALO         24  the statement's bounding-box moat — no other
//                    content element may enter
//
// Air is spent above the fold, never by pushing the verb below it
// (the SE law, repo CLAUDE.md invariant 10, still governs).

export const PAGE_GUTTER = 20;
export const BLOCK_GAP = 40;
export const ROW_GAP = 16;
export const HALO = 24;
