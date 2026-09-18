// constants/board.ts
//
// THE BOARD's presentation law (docs/architecture/board-thesis.md):
// the air rhythm, the statement/whisper style carriers, and THE PLATE
// CODE — the vocabulary that turns a load in kilograms into drawn
// slabs. Colors live in theme.colors.*.meter (S7); this file owns the
// arithmetic: denominations, per-scale slab geometry, and the greedy
// decomposition. The drawing rounds to the nearest 1.25 kg; the digit
// never lies (tolerance ±0.63).

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
// (36 Archivo Cond, sentence case, the content itself — never a page
// nameplate), the fact whisper beneath it, and the block rhythm's
// baseline. `blockFirst` leads the page (no gap above the first
// word); `statement` carries the halo below.
export const BOARD = {
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
};

// ── THE PLATE CODE ──────────────────────────────────────────────────────
// The categorical meter ramp (theme.colors.*.meter) mapped to the
// plate denominations every lifter reads: red 25 · blue 20 ·
// yellow 15 · green 10 · white 5 · red chip 2.5 · steel 1.25.

export type MeterStep =
  | 'step1'
  | 'step2'
  | 'step3'
  | 'step4'
  | 'step5'
  | 'step6';

/** One slab of the drawn stack: which ramp step + how wide it draws. */
export interface PlateSegment {
  kg: number;
  step: MeterStep;
}

/** Denomination → ramp step + thickness (px) at the three scales. */
export const PLATE_DENOMINATIONS: ReadonlyArray<{
  kg: number;
  step: MeterStep;
  thickness: { counter: number; row: number; whisper: number };
}> = [
  { kg: 25, step: 'step1', thickness: { counter: 26, row: 9, whisper: 5 } },
  { kg: 20, step: 'step2', thickness: { counter: 22, row: 7.5, whisper: 4.5 } },
  { kg: 15, step: 'step3', thickness: { counter: 18, row: 6.5, whisper: 4 } },
  { kg: 10, step: 'step4', thickness: { counter: 14, row: 5, whisper: 3 } },
  { kg: 5, step: 'step5', thickness: { counter: 10, row: 3.5, whisper: 2 } },
  { kg: 2.5, step: 'step1', thickness: { counter: 6, row: 2, whisper: 1.5 } },
  { kg: 1.25, step: 'step6', thickness: { counter: 4, row: 1.5, whisper: 1 } },
];

/** Stack heights + inter-slab gaps at the three scales. */
export const PLATE_SCALE = {
  counter: { height: 40, gap: 2 },
  row: { height: 14, gap: 1 },
  whisper: { height: 8, gap: 1 },
} as const;

export type PlateScale = keyof typeof PLATE_SCALE;

/** The drawing's quantum — loads round to the nearest 1.25 kg. */
export const PLATE_QUANTUM = 1.25;

/**
 * Greedy decomposition of a load into plate segments, total-load
 * basis, rounded to the plate quantum first. 62.5 → [25, 25, 10,
 * 2.5]; 14 → [10, 2.5, 1.25] (13.75 — the digit never lies, the
 * drawing rounds). A bodyweight set (≤0) draws the empty sleeve.
 */
export function decomposeLoad(kg: number): PlateSegment[] {
  if (!Number.isFinite(kg) || kg <= 0) return [];
  let remaining = Math.round(kg / PLATE_QUANTUM) * PLATE_QUANTUM;
  // Floating-point residue guard (e.g. 61.25 % 1.25).
  remaining = Math.round(remaining * 100) / 100;
  const out: PlateSegment[] = [];
  for (const d of PLATE_DENOMINATIONS) {
    while (remaining >= d.kg - 1e-9) {
      out.push({ kg: d.kg, step: d.step });
      remaining = Math.round((remaining - d.kg) * 100) / 100;
    }
  }
  return out;
}

/** Total drawn width of a stack at a scale (slabs + gaps), for probes. */
export function stackWidthFor(kg: number, scale: PlateScale): number {
  const segments = decomposeLoad(kg);
  if (segments.length === 0) return 0;
  const gap = PLATE_SCALE[scale].gap;
  return segments.reduce((w, s) => {
    const d = PLATE_DENOMINATIONS.find((x) => x.kg === s.kg);
    return w + (d ? d.thickness[scale] : 0);
  }, 0) + gap * (segments.length - 1);
}

// ── The tally gates ─────────────────────────────────────────────────────
// Sets render as tally marks: verticals, the fifth crossing the prior
// four (the whiteboard gate). Counter scale 20px tall / 2px wide;
// row scale 12/1.5. The LIVE gate breathes record-orange (static
// under reduced motion); unstarted gates sit at 18% ink.

export const TALLY_SCALE = {
  counter: { height: 20, barWidth: 2, gap: 5 },
  row: { height: 12, barWidth: 1.5, gap: 4 },
} as const;

export type TallyScale = keyof typeof TALLY_SCALE;
