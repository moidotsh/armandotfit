// shared/types/program.ts
// THE LIVE PROGRAM IDENTITY — which program the user is actually
// running. Three kinds share one shape-of-use (a rotation of days, each
// day one or two session windows of slots):
//
//   edition    the two authored full-body editions (oneADay / twoADay)
//   starter    the authored archetype rotations (PPL / Upper-Lower /
//              Bro / Fully Equal — shared/exercises/splits.ts)
//   generated  a Split Lab board, persisted BY SEED — the generator is
//              deterministic (same seed + program + edition rebuilds
//              the same board), so the program stays nameable and
//              never stored (invariants 5 + 8)
//
// Resolution lives in services/programService.ts (resolveLiveSlots and
// friends); this file is the vocabulary only. Type-only imports — no
// runtime edge to the exercise data.

import type { PreferredSplit } from './profile';
import type { ProgramEdition, ProgramType, StarterProgram } from '../exercises';

export type LiveProgram =
  | { kind: 'edition'; split: PreferredSplit }
  | { kind: 'starter'; program: StarterProgram }
  | {
      kind: 'generated';
      program: ProgramType;
      /** The board's name — the deterministic rebuild input. */
      seed: number;
      edition: ProgramEdition;
    };

/**
 * One slot's standing edit — the user's divergence from the authored
 * program. Fields are optional and independent: a swap carries
 * {slug, name}; a prescription edit carries {sets} and/or {reps}; a
 * removal carries {removed}. The authored slot is the default, and it
 * is never stored — it is a pure function of (program, day, window,
 * position), so clearing the key always restores the original
 * exercise AND prescription (the "↺ DEFAULT" row in the swap bench).
 */
export interface ProgramSlotOverride {
  /** The replacement exercise (catalog slug) + its display name. */
  slug?: string;
  name?: string;
  /** The slot's programmed set range [min, max]. */
  sets?: [number, number];
  /** The slot's programmed rep range [min, max]. */
  reps?: [number, number];
  /** The slot's standing realization tags (grip, attachment, SIDES…),
   * REPLACING the authored suggestedTags wholesale — an empty array is
   * meaningful (the slot logs bare) and an absent field leaves the
   * authored tags standing. A swap still drops the old identity's
   * tags unless the edit carries its own. */
  tags?: string[];
  /** The slot is dropped from the rotation (reversible — clearing the
   * key or the page's RESTORE TO DEFAULTS brings it back). */
  removed?: boolean;
}
