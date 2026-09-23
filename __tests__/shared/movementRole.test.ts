// __tests__/shared/movementRole.test.ts
// THE MOVEMENT ROLE — the golden table for the program-type axis.
// The counts are PINNED on purpose: a catalog regeneration (or a
// rule tweak) that shifts them fails here, which means the table
// changed and must be re-reviewed — classification drifts never
// silently. The judgment calls each carry their evidence inline.

import { describe, expect, it } from 'vitest';
import {
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  FEMALE_TWO_A_DAY_SPLITS,
  FEMALE_ONE_A_DAY_SPLITS,
  movementRoleFor,
  MOVEMENT_ROLE_DISPLAY,
} from '../../shared/exercises';

const counts = () => {
  const c = { push: 0, pull: 0, legs: 0, core: 0, undefined: 0 };
  for (const e of SYSTEM_EXERCISES) {
    c[e.movementRole ?? 'undefined'] += 1;
  }
  return c;
};

describe('movementRole — coverage', () => {
  it('classifies every muscle-bearing entry; only the cardio + neck holdouts stay undefined', () => {
    const c = counts();
    expect(c).toEqual({ push: 231, pull: 184, legs: 189, core: 84, undefined: 9 });
    expect(SYSTEM_EXERCISES.length).toBe(697);
  });

  it('the undefined nine are exactly the cardio stations + neck isometrics', () => {
    const undefinedSlugs = SYSTEM_EXERCISES.filter((e) => !e.movementRole)
      .map((e) => e.slug)
      .sort();
    expect(undefinedSlugs).toEqual([
      'isometric-neck-exercise-front-and-back',
      'isometric-neck-exercise-sides',
      'lying-face-down-plate-neck-resistance',
      'lying-face-up-plate-neck-resistance',
      'seated-head-harness-neck-resistance',
      'stairmaster',
      'stationary-bike',
      'treadmill',
      'walk-loop',
    ]);
  });

  it('every authored program slot carries a role (the program is programmable)', () => {
    const slots = [
      ...TWO_A_DAY_SPLITS.flatMap((d) => [...d.am, ...d.pm]),
      ...ONE_A_DAY_SPLITS.flatMap((d) => d.session),
      ...FEMALE_TWO_A_DAY_SPLITS.flatMap((d) => [...d.am, ...d.pm]),
      ...FEMALE_ONE_A_DAY_SPLITS.flatMap((d) => d.session),
    ];
    expect(slots.length).toBeGreaterThan(100);
    for (const slot of slots) {
      expect(SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.movementRole, slot.exercise).toBeDefined();
    }
  });

  it('legs and core are muscle-derived when the primaries say so', () => {
    const LEG: ReadonlySet<string> = new Set(['quads', 'hamstrings', 'glutes', 'calves', 'tibialis']);
    for (const e of SYSTEM_EXERCISES) {
      if (e.primaryMuscles.some((m) => LEG.has(m))) {
        expect(e.movementRole, `${e.slug} has a leg primary but reads ${e.movementRole}`).toBe('legs');
      }
    }
  });
});

describe('movementRole — the judgment calls', () => {
  const cases: Array<[slug: string, role: string, why: string]> = [
    // Side delts ride push (the accessory convention); rear delts pull.
    ['cable-lateral-raise', 'push', 'side-delts primary, lateral accessory'],
    ['face-pull', 'pull', 'rear-delts primary'],
    ['band-pull-apart', 'pull', 'name rule: pull-apart despite side-delts primary'],
    ['dumbbell-lying-rear-lateral-raise', 'pull', 'name rule: rear-lateral'],
    ['reverse-machine-flyes', 'pull', 'name rule: reverse fly'],
    // A row is a row — even the upright ones the side-delts claim.
    ['upright-barbell-row', 'pull', 'name rule: row'],
    ['low-pulley-row-to-neck', 'pull', 'name rule: row'],
    // Traps/biceps/forearms ride pull.
    ['machine-shrug', 'pull', 'traps primary'],
    ['farmer-s-walk', 'pull', 'forearms primary (grip rides pull)'],
    // Pullovers are the straight-arm pull family.
    ['dumbbell-pullover', 'pull', 'name rule: pullover (mixed lats+chest primaries)'],
    // The deadlift split: leg primaries → legs; the pure lower-back
    // hinges (no leg primary) ride pull — the PPL convention.
    ['barbell-deadlift', 'legs', 'leg primary present'],
    ['romanian-deadlift-barbell', 'legs', 'hamstrings primary'],
    ['deficit-deadlift', 'pull', 'lower-back primary only'],
    ['seated-good-mornings', 'pull', 'lower-back primary only'],
    // Back extensions/hypers train the posterior chain with the lower
    // session — the authored program's own placement.
    ['back-extension', 'legs', 'name rule: back extension'],
    ['machine-back-extension', 'legs', 'name rule: back extension'],
    ['reverse-hyperextension', 'legs', 'name rule: hyperextension'],
    // Core by muscle.
    ['leg-raise', 'core', 'abs primaries'],
    ['cable-wood-chop', 'core', 'obliques primary'],
    ['pallof-press', 'core', 'abs primary beats the press name'],
    // The empty-muscle adductor machines are leg stations by name.
    ['thigh-adductor', 'legs', 'name rule: adductor (no muscle data)'],
    ['band-hip-adductions', 'legs', 'name rule: adduction'],
    // Hybrids land deterministic.
    ['muscle-up', 'pull', 'lats primary'],
    ['clean-and-jerk', 'push', 'side-delts primary (the jerk finish)'],
    ['snatch', 'legs', 'quads primary'],
    ['handstand-push-ups', 'push', 'press name + delt/triceps primaries'],
  ];

  for (const [slug, role, why] of cases) {
    it(`${slug} → ${role} (${why})`, () => {
      expect(SYSTEM_EXERCISES_BY_SLUG[slug]?.movementRole).toBe(role);
    });
  }
});

describe('movementRoleFor — purity + display', () => {
  it('is deterministic and name+muscle driven', () => {
    expect(movementRoleFor('Lat Pulldown', ['lats'])).toBe('pull');
    expect(movementRoleFor('Lat Pulldown', ['lats'])).toBe('pull');
    expect(movementRoleFor('Leg Press', ['quads'])).toBe('legs');
    expect(movementRoleFor('Mystery Station', [])).toBeUndefined();
    // Mixed primaries resolve by name: a pullover row pulls, a press pushes.
    expect(movementRoleFor('Weird Pullover Thing', ['lats', 'chest'])).toBe('pull');
    expect(movementRoleFor('Weird Press Thing', ['lats', 'chest'])).toBe('push');
    // No name signal at all — deterministic default.
    expect(movementRoleFor('The Mystery Hybrid', ['lats', 'chest'])).toBe('push');
  });

  it('exposes furniture words for every role', () => {
    expect(MOVEMENT_ROLE_DISPLAY.push).toBe('PUSH');
    expect(MOVEMENT_ROLE_DISPLAY.pull).toBe('PULL');
    expect(MOVEMENT_ROLE_DISPLAY.legs).toBe('LEGS');
    expect(MOVEMENT_ROLE_DISPLAY.core).toBe('CORE');
  });
});
