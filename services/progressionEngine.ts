// services/progressionEngine.ts
// THE PROGRESSION ENGINE — the owner's notebook system, executable.
//
// Every station, for its weight, is rated after the work: LIGHT (the
// weight is too low — "+" in the notebook), RIGHT (just right — "✓"),
// HEAVY (too high — "−"). The rating rides the logged exercise row as
// raw fact; the NEXT Rx derives at read by REPLAYING the rated
// history for that exercise + exact tag set (invariant 5: computed,
// never stored — no progression table, no drift).
//
// THE RULES (the owner's example, encoded):
//   LIGHT  → next rung up the rep ladder, same weight — but a weight
//            serves only TWO climbs: the third LIGHT at the same
//            weight bumps the weight one step and resets the range to
//            the progression's origin rung.
//            30×6-8 → 30×8-10 → 30×10-12 → 35×6-8.
//   RIGHT  → hold. Same Rx next time.
//   HEAVY  → one rung down; at the origin rung already, the weight
//            drops one step (range stays at origin).
//
// The engine never invents weight — the first rated instance's logged
// weight is the base; every subsequent bump is ± one step from the
// last RATED instance's weight (the replay follows what was actually
// lifted, not a simulation of it).

import type { ResolvedSlot } from '../shared/exercises';
import type { EffortRating } from '../shared/types';

// ── The ladder ─────────────────────────────────────────────────────────

/** The rep-range rungs, bottom to top. [low, high] pairs. */
export const REP_LADDER: readonly (readonly [number, number])[] = [
  [4, 6],
  [6, 8],
  [8, 10],
  [10, 12],
  [12, 15],
  [15, 20],
];

/** A weight serves at most this many range climbs before the bump. */
export const MAX_CLIMBS_PER_WEIGHT = 2;

export type Rung = readonly [number, number];

/** The rung a range belongs to; unmatched ranges snap to the nearest
 *  rung by low bound (programs may author ranges off-ladder). */
export function rungOf(range: readonly [number, number]): number {
  let best = 0;
  let bestDist = Infinity;
  REP_LADDER.forEach((rung, i) => {
    const dist = Math.abs(rung[0] - range[0]);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

// ── The rating ─────────────────────────────────────────────────────────

/** The station's verdict on the weight — the shared raw-fact shape. */
export type { EffortRating };

/** The glyph the notebook would carry. */
export const RATING_GLYPH: Record<EffortRating, string> = {
  light: '+',
  right: '✓',
  heavy: '−',
};

/** One rated instance from history, in order (oldest first). */
export interface RatedInstance {
  /** The weight actually lifted that session (display units at the
   *  caller's boundary — the engine is unit-agnostic). */
  weight: number | null;
  rating: EffortRating;
}

/** What the engine says the next session should run. */
export interface ProgressionRx {
  /** The weight to load; null until a rated instance establishes one. */
  weight: number | null;
  /** The range rung to target, as [low, high]. */
  range: Rung;
  /** The feedback line's verb: which overload axis is moving. */
  mode: 'reps' | 'weight' | 'hold';
}

/**
 * Replay the rated history for one exercise + tag set. `originRange`
 * is the programmed Rx the progression started from (the authored
 * slot's reps, or the first instance's Rx when there is no slot).
 * `weightStep` is the unit-aware increment (2.5 kg / 5 lb).
 */
export function deriveProgression(
  originRange: readonly [number, number],
  instances: readonly RatedInstance[],
  weightStep: number,
): ProgressionRx {
  const origin = rungOf(originRange);
  let rung = origin;
  let climbs = 0;
  let weight: number | null = null;
  let mode: ProgressionRx['mode'] = 'hold';

  for (const instance of instances) {
    if (instance.weight != null) weight = instance.weight;
    if (instance.rating === 'light') {
      if (climbs < MAX_CLIMBS_PER_WEIGHT && rung < REP_LADDER.length - 1) {
        rung += 1;
        climbs += 1;
        mode = 'reps';
      } else {
        // The weight has served its two climbs (or the ladder is
        // topped): bump the weight, reset to the origin rung.
        weight = (weight ?? 0) + weightStep;
        rung = origin;
        climbs = 0;
        mode = 'weight';
      }
    } else if (instance.rating === 'heavy') {
      if (rung > origin) {
        rung -= 1;
        climbs = Math.max(0, climbs - 1);
      } else {
        weight = Math.max(0, (weight ?? 0) - weightStep);
        rung = origin;
        climbs = 0;
      }
      mode = 'reps';
    } else {
      mode = 'hold';
    }
  }

  return { weight, range: REP_LADDER[rung], mode };
}

/** The Rx label the surfaces print ("8–10", "6–8"). */
export function rangeLabel(range: Rung): string {
  return `${range[0]}–${range[1]}`;
}

// ── The matching key — exercise + exact tag set ────────────────────────

/**
 * The progression key: exercise name + the normalized tag set. The
 * owner's rule — "same tags" is a different progression: incline
 * seated curls and plain curls climb their own ladders. Order-free.
 */
export function progressionKey(exerciseName: string, tags: readonly string[]): string {
  return `${exerciseName.toLowerCase()}|[${[...tags].sort().join(',')}]`;
}

/** True when a slot's tag set matches a logged instance's (the key). */
export function sameProgression(
  exerciseName: string,
  a: readonly string[],
  b: readonly string[],
): boolean {
  return progressionKey(exerciseName, a) === progressionKey(exerciseName, b);
}

/** Convenience: the origin range for a slot (its programmed reps). */
export function originRangeOf(slot: ResolvedSlot | undefined): readonly [number, number] {
  return slot?.reps ?? [8, 10];
}
