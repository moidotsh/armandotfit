// constants/quiet.ts
// COMPAT SHIM — the retired quiet-page names now alias THE BOARD's
// carriers (docs/architecture/board-thesis.md; the live declaration
// point is constants/board.ts). Screens migrate to `BOARD` as they
// rebuild; this file dies with the last QUIET import.

export { BOARD as QUIET, PAGE_GUTTER, BLOCK_GAP, ROW_GAP, HALO } from './board';

/** The halo margin a fact line carries beneath a statement. */
export { HALO as FACT_GAP } from './board';
