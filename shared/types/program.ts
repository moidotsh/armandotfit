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
