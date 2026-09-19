// constants/gauge.ts
//
// THE GAUGE's presentation law (docs/architecture/gauge-thesis.md):
// the air rhythm, the statement/whisper style carriers, and THE PIN
// RAIL + THE SET PIPS — the arithmetic that turns a load in
// kilograms into a printed scale with a pin, and a set count into
// pip groups. Colors live in theme.colors.*; this file owns the
// geometry.

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
// (36 Instrument Cond, sentence case, the content itself — never a
// page nameplate), the fact whisper beneath it, and the block
// rhythm's baseline. `blockFirst` leads the page (no gap above the
// first word); `statement` carries the halo below.
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

// ── THE REST INSTRUMENT ─────────────────────────────────────────────────
// The rest countdown's constants (thesis §7): default 90 s, steppers
// ±15 s. Session UI-state only — nothing joins the data spine.
export const REST_DEFAULT_SEC = 90;
export const REST_STEP_SEC = 15;
