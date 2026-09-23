// shared/exercises/movementRole.ts
// THE MOVEMENT ROLE — every catalog exercise classified for the
// program-type axis the muscles alone can't derive: PUSH or PULL.
// LEGS and CORE are muscle-derived (the catalog's primary muscles
// say so); push/pull is a MOVEMENT judgment (a fly and a row work
// overlapping muscles in opposite directions), so it gets a rule
// book of its own — the same construction the split laws use:
// derive what the data can carry, name-rule what it can't, and pin
// the whole table with tests so a catalog regeneration re-reviews
// instead of silently drifting.
//
// Judgment calls this book encodes (see the golden test for the
// pinned evidence):
//   - SIDE DELTS ride PUSH (the accessory convention: lateral work
//     joins pressing); REAR DELTS ride PULL (face pulls, rear flies).
//   - TRAPS + BICEPS + FOREARMS ride PULL (grip and scapular work
//     join pulling).
//   - The DEADLIFT HINGES (lower-back primary, no leg primary) ride
//     PULL — the PPL convention; the back EXTENSIONS/HYPEREXTENSIONS
//     ride LEGS — the authored program's own placement (back
//     extension sits in the lower AM session).
//   - PULLOVERS ride PULL (the straight-arm pull family).
//   - PULL-APARTS / REAR-DELT / BACK-FLY names ride PULL whatever
//     their side-delt primary claims.
//   - The empty-muscle ADDUCTOR machines ride LEGS by name (the
//     catalog carries no adductor muscle yet — the machine is still
//     a leg station).
//
// Cardio stations and the neck/isometric holdouts (no primary
// muscles, no carve-out) stay UNCLASSIFIED — they never join a
// program; they join sessions as cardio/machine stations.
//
// Derived at composition (the bodyweightLoadFactor precedent) onto
// every catalog entry; vocabulary lives in TS, never the DB.

import type { SystemExerciseData } from './data';

export type MovementRole = 'push' | 'pull' | 'legs' | 'core';

/** Furniture word for a role ('PUSH', 'PULL', 'LEGS', 'CORE'). */
export const MOVEMENT_ROLE_DISPLAY: Record<MovementRole, string> = {
  push: 'PUSH',
  pull: 'PULL',
  legs: 'LEGS',
  core: 'CORE',
};

// ── The muscle sets (slug values, the catalog's own vocabulary) ────────

const LEG_MUSCLES = new Set(['quads', 'hamstrings', 'glutes', 'calves', 'tibialis']);
const CORE_MUSCLES = new Set(['abs', 'lower-abs', 'obliques']);
const PULL_MUSCLES = new Set([
  'lats', 'upper-back', 'traps', 'biceps', 'rear-delts', 'forearms', 'lower-back',
]);
const PUSH_MUSCLES = new Set([
  'chest', 'upper-chest', 'lower-chest', 'front-delts', 'side-delts', 'triceps',
]);

// ── The name carve-outs (checked before the muscle rules) ─────────────

/** Name-only verdicts the muscle data cannot carry. Ordered. */
const NAME_RULES: ReadonlyArray<{ re: RegExp; role: MovementRole }> = [
  // The empty-muscle inner-thigh machines — leg stations by any name.
  { re: /adduct(or|ions)/, role: 'legs' },
  // Back extensions / hypers train the posterior chain with the lower
  // session (the authored program's own placement).
  { re: /hyperext|back.?extension/, role: 'legs' },
  // Rear-delt work rides pull whatever the primary claims.
  { re: /pull.?apart|rear.?delt|rear.?lateral|reverse[\w\s-]*fly|back.?fly/, role: 'pull' },
  // The straight-arm pull family.
  { re: /pullover/, role: 'pull' },
  // A row is a row — even the upright ones the side-delts claim.
  { re: /\brows?\b/, role: 'pull' },
];

/** Mixed push+pull primaries resolve by name; pull patterns first
 *  (a pullover row is a pull; a press row is a press). */
const MIXED_PULL_RE = /row|pulldown|pull-?up|pullover|curl|shrug|high.?pull|muscle.?up/;
const MIXED_PUSH_RE = /press|push|dip|fly|extension|pushdown|raise|kickback/;

// ── The classifier ─────────────────────────────────────────────────────

/**
 * The movement role for a catalog entry, derived from its name +
 * primary muscles. Returns undefined for stations with no primary
 * muscles and no carve-out (cardio, neck isometrics) — they are
 * never programmable.
 */
export function movementRoleFor(
  name: string,
  primaryMuscles: readonly string[],
): MovementRole | undefined {
  const lower = name.toLowerCase();

  for (const rule of NAME_RULES) {
    if (rule.re.test(lower)) return rule.role;
  }

  if (primaryMuscles.length === 0) return undefined;

  const hits = (set: Set<string>) => primaryMuscles.some((m) => set.has(m));
  const leg = hits(LEG_MUSCLES);
  const core = hits(CORE_MUSCLES);
  const pull = hits(PULL_MUSCLES);
  const push = hits(PUSH_MUSCLES);

  // LEGS and CORE are muscle-derived (leg beats core when both claim).
  if (leg) return 'legs';
  if (core) return 'core';

  if (pull && !push) return 'pull';
  if (push && !pull) return 'push';

  // Mixed primaries — the name breaks the tie.
  if (MIXED_PULL_RE.test(lower)) return 'pull';
  if (MIXED_PUSH_RE.test(lower)) return 'push';

  // No signal left: press by default (deterministic above all else;
  // the golden test pins every entry this rule catches).
  return 'push';
}

/** Role for a catalog entry (the composed-field source of truth). */
export function movementRoleOf(entry: Pick<SystemExerciseData, 'name' | 'primaryMuscles'>): MovementRole | undefined {
  return movementRoleFor(entry.name, entry.primaryMuscles);
}
