// __tests__/shared/split-constraints.test.ts
// THE SPLIT CONSTRAINT SUITE — the executable proof behind the laws.
// The laws themselves now live in shared/exercises/splitRules.ts so
// the runtime (the Split Lab's generator) and these tests read ONE
// law book; this file keeps the authored editions under oath and adds
// the cross-edition (couples) laws that bind two editions together.
// If these tests are green, any future split (or generated split) that
// passes the shared checker is structurally sound: asynchronous,
// covered, isolation-dominant, and couples-aligned.

import { describe, expect, it } from 'vitest';
import {
  TWO_A_DAY_SPLITS,
  FEMALE_TWO_A_DAY_SPLITS,
  type ProgramEdition,
} from '../../shared/exercises';
import {
  REGION_MUSCLES,
  ALL_REGIONS,
  checkEditionLaws,
  dayRegions,
  primaryMusclesOf,
  primaryRegionsOf,
  type LawDay,
  type RuleResult,
} from '../../shared/exercises';

// ── Helpers ────────────────────────────────────────────────────────────

const rule = (rules: RuleResult[], id: string): RuleResult => {
  const found = rules.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown law id: ${id}`);
  return found;
};

const editionName = (splits: LawDay[]): string =>
  splits === TWO_A_DAY_SPLITS ? 'UPPER (male)' : 'LOWER (female)';

const editionOf = (splits: LawDay[]): ProgramEdition =>
  splits === TWO_A_DAY_SPLITS ? 'upper' : 'lower';

// ── The suite ───────────────────────────────────────────────────────────

for (const splits of [TWO_A_DAY_SPLITS, FEMALE_TWO_A_DAY_SPLITS] as LawDay[][]) {
  const name = editionName(splits);
  const laws = () => checkEditionLaws(splits, editionOf(splits));

  describe(`${name} — split constraints`, () => {
    it('ASYNCHRONOUS: no primary muscle appears in both AM and PM on any day', () => {
      const r = rule(laws(), 'async');
      expect(r.ok, r.detail).toBe(true);
    });

    it('REGION COVERAGE: all 7 body regions covered every day (AM + PM combined)', () => {
      const r = rule(laws(), 'coverage');
      expect(r.ok, r.detail).toBe(true);
    });

    it('MOSTLY ISOLATION: at most 2 compound exercises (multi-primary-muscle) across the edition', () => {
      const r = rule(laws(), 'isolation');
      expect(r.ok, r.detail).toBe(true);
    });

    it('NO SLUG ERRORS: every exercise resolves in the catalog with at least one primary muscle', () => {
      const r = rule(laws(), 'slugs');
      expect(r.ok, r.detail).toBe(true);
    });

    it('VARIETY: Arm — both biceps and triceps appear across the 4 days', () => {
      const r = rule(laws(), 'variety-arm');
      expect(r.ok, r.detail).toBe(true);
    });

    it('VARIETY: Back — at least 3 different back muscles across the 4 days', () => {
      const r = rule(laws(), 'variety-back');
      expect(r.ok, r.detail).toBe(true);
    });

    it('VARIETY: Upper Leg — quads, hamstrings, AND glutes all appear', () => {
      const r = rule(laws(), 'variety-legs');
      expect(r.ok, r.detail).toBe(true);
    });
  });
}

// ── 6. COUPLES ALIGNMENT (cross-edition) ───────────────────────────────

describe('COUPLES — cross-edition alignment', () => {
  it('SHARED CALF: both editions use the same calf exercise on days where both need lower leg', () => {
    for (let d = 0; d < 4; d++) {
      const male = TWO_A_DAY_SPLITS[d];
      const female = FEMALE_TWO_A_DAY_SPLITS[d];
      const maleCalves = [...male.am, ...male.pm]
        .filter((s) => primaryRegionsOf(s.exercise).includes('Lower Leg'))
        .map((s) => s.exercise);
      const femaleCalves = [...female.am, ...female.pm]
        .filter((s) => primaryRegionsOf(s.exercise).includes('Lower Leg'))
        .map((s) => s.exercise);

      if (maleCalves.length > 0 && femaleCalves.length > 0) {
        const shared = maleCalves.filter((c) => femaleCalves.includes(c));
        expect(
          shared.length,
          `Day ${d + 1}: male calves [${maleCalves}] and female calves [${femaleCalves}] share no exercise — they should train together`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('SAME MUSCLE, SAME EXERCISE: when both editions target an overlapping primary muscle at the same position, they must be doing the same exercise', () => {
    for (let d = 0; d < 4; d++) {
      const male = TWO_A_DAY_SPLITS[d];
      const female = FEMALE_TWO_A_DAY_SPLITS[d];
      for (const w of ['am', 'pm'] as const) {
        for (let i = 0; i < Math.min(male[w].length, female[w].length); i++) {
          const mEx = male[w][i].exercise;
          const fEx = female[w][i].exercise;
          if (mEx === fEx) continue; // already shared — fine
          const mMuscles = new Set(primaryMusclesOf(mEx));
          const overlap = primaryMusclesOf(fEx).filter((m) => mMuscles.has(m));
          expect(
            overlap,
            `Day ${d + 1} ${w.toUpperCase()} pos ${i + 1}: male '${mEx}' [${[...mMuscles]}] and female '${fEx}' [${primaryMusclesOf(fEx)}] both target [${overlap}] — if they work the same muscle at the same slot, they should train together`,
          ).toHaveLength(0);
        }
      }
    }
  });

  it('SAME EXERCISE, SAME POSITION: any exercise in both editions on the same day+window sits at the same position', () => {
    for (let d = 0; d < 4; d++) {
      const male = TWO_A_DAY_SPLITS[d];
      const female = FEMALE_TWO_A_DAY_SPLITS[d];
      for (const w of ['am', 'pm'] as const) {
        for (let i = 0; i < male[w].length; i++) {
          const ex = male[w][i].exercise;
          const femalePos = female[w].findIndex((s) => s.exercise === ex);
          if (femalePos >= 0 && femalePos !== i) {
            expect(
              femalePos,
              `Day ${d + 1} ${w.toUpperCase()}: '${ex}' is at male pos ${i + 1} but female pos ${femalePos + 1} — same exercise must share the position so the couple trains together`,
            ).toBe(i);
          }
        }
      }
    }
  });

  it('SHARED POSITIONS: at least 3 total positions (AM + PM combined) shared per day', () => {
    for (let d = 0; d < 4; d++) {
      const male = TWO_A_DAY_SPLITS[d];
      const female = FEMALE_TWO_A_DAY_SPLITS[d];
      const amShared = male.am.filter(
        (s, i) => female.am[i]?.exercise === s.exercise,
      ).length;
      const pmShared = male.pm.filter(
        (s, i) => female.pm[i]?.exercise === s.exercise,
      ).length;
      expect(
        amShared + pmShared,
        `Day ${d + 1}: only ${amShared + pmShared} total shared (need ≥3)`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('SHARED UNIVERSAL REGIONS: Lower Leg, Back, and Core share an exercise when both target them the same day', () => {
    const UNIVERSAL = ['Lower Leg', 'Back', 'Core'];
    for (let d = 0; d < 4; d++) {
      const male = TWO_A_DAY_SPLITS[d];
      const female = FEMALE_TWO_A_DAY_SPLITS[d];
      const maleRegions = dayRegions(male);
      const femaleRegions = dayRegions(female);
      const sharedRegions = UNIVERSAL.filter(
        (r) => maleRegions.has(r) && femaleRegions.has(r),
      );

      for (const region of sharedRegions) {
        const maleEx = [...male.am, ...male.pm]
          .filter((s) => primaryRegionsOf(s.exercise).includes(region))
          .map((s) => s.exercise);
        const femaleEx = [...female.am, ...female.pm]
          .filter((s) => primaryRegionsOf(s.exercise).includes(region))
          .map((s) => s.exercise);
        const shared = maleEx.filter((e) => femaleEx.includes(e));

        expect(
          shared.length,
          `Day ${d + 1}, region '${region}': male [${maleEx}] and female [${femaleEx}] share no exercise`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

// ── The law book itself stays honest ────────────────────────────────────

describe('THE LAW BOOK — shared/exercises/splitRules', () => {
  it('carries all 7 regions with non-empty muscle lists', () => {
    expect(ALL_REGIONS.length).toBe(7);
    for (const [region, muscles] of Object.entries(REGION_MUSCLES)) {
      expect(muscles.length, `Region ${region} has no muscles`).toBeGreaterThan(0);
    }
  });

  it('flags a deliberately broken day (async + coverage)', () => {
    const broken: LawDay = {
      day: 1,
      title: 'Broken Day',
      am: [{ exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] }],
      pm: [{ exercise: 'leg-press', suggestedTags: [], sets: [3, 3], reps: [8, 10] }],
    };
    const rules = checkEditionLaws([broken], 'upper');
    expect(rule(rules, 'async').ok).toBe(false); // quads in both windows
    expect(rule(rules, 'coverage').ok).toBe(false); // 6 regions missing
    expect(rule(rules, 'slugs').ok).toBe(true); // the slug itself is real
  });

  it('flags an unknown slug', () => {
    const broken: LawDay = {
      day: 1,
      title: 'Ghost Day',
      am: [{ exercise: 'not-a-real-slug', suggestedTags: [], sets: [3, 3], reps: [8, 10] }],
      pm: [],
    };
    expect(rule(checkEditionLaws([broken], 'upper'), 'slugs').ok).toBe(false);
  });
});
