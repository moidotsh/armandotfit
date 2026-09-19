// constants/gauge.ts
//
// RETIRED PRESENTATION LAW — THE GAUGE (docs/architecture/
// gauge-thesis.md), superseded by constants/scoreboard.ts (THE
// SCOREBOARD). This file survives ONLY while gauge-era screens still
// import the pin-rail/pip/flip/roll machinery; every import dies with
// the screen rebuilds, and then this file is deleted. The air
// constants and the rest instrument now live in scoreboard.ts.

import type { TextStyle } from 'react-native';
import { theme } from './theme';
import { PAGE_GUTTER, BLOCK_GAP, ROW_GAP, HALO } from './scoreboard';

// ── The air law (re-exported from scoreboard.ts for gauge-era
// callers) ──────────────────────────────────────────────────────────
export { PAGE_GUTTER, BLOCK_GAP, ROW_GAP, HALO };

// The style carriers every gauge-era screen spreads.
export const GAUGE = {
  statement: {
    ...theme.typography.mobileTitleCondensed,
  } as TextStyle,
  fact: {
    ...theme.typography.mobileFigure,
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


// ── THE PIN RAIL ────────────────────────────────────────────────────────
// The load figure (thesis §4.3): a vertical tick column with the
// engaged range 0→load filled and THE PIN — a steel bar crossing the
// rail at the load — carrying a mono label at counter scale. Pin
// position is proportional to railMax, so it is monotone in load by
// construction and any magnitude fits the column.

/** Per-scale rail geometry (heights in px). */
export const RAIL_SCALE = {
  counter: { height: 128, width: 14, tickWidth: 6, majorTickWidth: 10, fillWidth: 3, pinWidth: 3, pinHeight: 12 },
  row: { height: 28, width: 8, tickWidth: 4, majorTickWidth: 6, fillWidth: 2, pinWidth: 2, pinHeight: 7 },
  whisper: { height: 20, width: 6, tickWidth: 3, majorTickWidth: 4, fillWidth: 2, pinWidth: 2, pinHeight: 5 },
} as const;

export type RailScale = keyof typeof RAIL_SCALE;

/**
 * The rail's ceiling: the load rounded up to the next 25 kg (min
 * 50). The rail rescales to the day so the pin always travels a
 * readable fraction of the column.
 */
export function railMaxFor(load: number | null | undefined): number {
  const l = typeof load === 'number' && Number.isFinite(load) ? load : 0;
  return Math.max(50, Math.ceil(l / 25) * 25);
}

/**
 * The pin's position along the rail, 0 (bottom) → 1 (top). Clamped;
 * a bodyweight set (≤0) parks the pin at 0.
 */
export function pinRatio(load: number | null | undefined, railMax: number): number {
  const l = typeof load === 'number' && Number.isFinite(load) ? load : 0;
  if (l <= 0) return 0;
  return Math.min(1, l / Math.max(railMax, 1));
}

// ── THE SET PIPS ────────────────────────────────────────────────────────
// The set figure (thesis §8, THE FLOOR): pips in groups of five —
// done pips solid ink, the LIVE pip pulsing signal, unstarted pips
// within the program's ask at 18% ink. Pip count == set count.

export const PIP_SCALE = {
  counter: { width: 6, height: 18, gap: 6, groupGap: 12, radius: 1 },
  row: { width: 4, height: 11, gap: 4, groupGap: 8, radius: 1 },
} as const;

export type PipScale = keyof typeof PIP_SCALE;

// ── THE FLIP / THE ROLL ─────────────────────────────────────────────────
// The mechanical motion family's durations (thesis §6). Post-
// interactive only; reduced motion collapses both to instant.
export const FLIP_DURATION_MS = 110;
export const ROLL_DURATION_MS = 140;
export const PIN_DROP_DURATION_MS = 120;

// ── THE REST INSTRUMENT (moved to scoreboard.ts; re-exported for
// gauge-era callers) ─────────────────────────────────────────────────
export { REST_DEFAULT_SEC, REST_STEP_SEC } from './scoreboard';
