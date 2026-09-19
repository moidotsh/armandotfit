// services/substitutionService.ts
// Smart substitution ranking — "the lat pulldown is taken, what else
// works my lats?" Every candidate is scored on muscle overlap and
// modality distance, not just family membership. The result: barbell
// bench → machine press ranks above push-up; lat pulldown → cable row
// ranks above glute bridge. Floor options aren't excluded — they rank
// honestly low for gym-context substitutions.

import { SYSTEM_EXERCISES, type SystemExerciseData } from '../shared/exercises';

export interface RankedAlternative {
  exercise: SystemExerciseData;
  /** Composite substitution score — higher = better match. */
  score: number;
}

/**
 * Modality distance: how "far apart" two equipment contexts are.
 *   0 = same loading world (machine↔cable, barbell↔dumbbell)
 *   1 = adjacent (machine↔free-weight)
 *   2 = different context (anything↔floor)
 */
const MODALITY_DISTANCE: Record<string, Record<string, number>> = {
  machine:  { machine: 0, cable: 0, dumbbell: 1, barbell: 1, floor: 2 },
  cable:    { machine: 0, cable: 0, dumbbell: 1, barbell: 1, floor: 2 },
  dumbbell: { machine: 1, cable: 1, dumbbell: 0, barbell: 0, floor: 2 },
  barbell:  { machine: 1, cable: 1, dumbbell: 0, barbell: 0, floor: 2 },
  floor:    { machine: 2, cable: 2, dumbbell: 1, barbell: 1, floor: 0 },
};

/**
 * Rank substitution alternatives for an exercise. Composite score:
 *   +5  same movement family (same pattern, different equipment)
 *   +3  per shared primary muscle
 *   +2  per shared equipment, up to +4 — THE BOARD's zone law: the
 *       gym is geography, and an alternative you can walk to in five
 *       seconds beats a marginally better match across the room
 *   +1  per shared secondary↔any muscle
 *   −2  × modality distance (floor options rank low from gym equipment)
 *
 * Returns the top candidates above a minimum relevance threshold,
 * best-first. Pure — no React, no DB.
 */
export function rankAlternatives(
  current: SystemExerciseData,
  limit = 7,
): RankedAlternative[] {
  const scored = SYSTEM_EXERCISES.filter((e) => e.slug !== current.slug)
    .map((e) => {
      let score = 0;

      // Same movement family: the pattern is the same, just a different
      // implement. (Bench ↔ machine press, pulldown ↔ pull-up.)
      if (e.family && e.family === current.family) score += 5;

      // Primary muscle overlap: "works the same muscle" is the user's
      // substitution criterion.
      const primOverlap = e.primaryMuscles.filter((m) =>
        current.primaryMuscles.includes(m),
      ).length;
      score += primOverlap * 3;

      // Equipment-zone overlap: the gym is geography — an alternative
      // at the same station (shared equipment) is the one you can walk
      // to without leaving the aisle.
      const zoneOverlap = e.equipment.filter((eq) => {
        const slug = typeof eq === 'string' ? eq : eq.slug;
        return current.equipment.some((ce) => (typeof ce === 'string' ? ce : ce.slug) === slug);
      }).length;
      score += Math.min(zoneOverlap, 2) * 2;

      // Secondary overlap: supporting cast matters less.
      const secOverlap = e.secondaryMuscles.filter((m) =>
        current.primaryMuscles.includes(m) ||
        current.secondaryMuscles.includes(m),
      ).length;
      score += secOverlap;

      // Modality distance: a machine lifter wants machine/cable options
      // first; bodyweight options rank last from a gym context.
      const dist =
        MODALITY_DISTANCE[current.modality ?? 'machine']?.[e.modality ?? 'machine'] ?? 2;
      score -= dist * 2;

      return { exercise: e, score };
    })
    .filter((s) => s.score >= 3) // minimum relevance
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
