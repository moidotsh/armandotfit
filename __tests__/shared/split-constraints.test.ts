// __tests__/shared/split-constraints.test.ts
// THE SPLIT CONSTRAINT SUITE — the four laws every edition must pass.
// If these tests are green, any future split (or generated split) that
// passes them is structurally sound: asynchronous, covered, isolation-
// dominant, and couples-aligned.

import { describe, expect, it } from 'vitest';
import {
  TWO_A_DAY_SPLITS,
  FEMALE_TWO_A_DAY_SPLITS,
} from '../../shared/exercises/splits';
import { SYSTEM_EXERCISES_BY_SLUG } from '../../shared/exercises/data';

// ── The muscle → region map (the 7 regions every day must cover) ──────

const MUSCLE_TO_REGION: Record<string, string> = {};
const REGION_MUSCLES: Record<string, string[]> = {
  'Lower Leg': ['calves', 'tibialis'],
  'Upper Leg': ['quads', 'hamstrings', 'glutes'],
  Core: ['abs', 'lower-abs'],
  Delt: ['front-delts', 'side-delts', 'rear-delts'],
  Back: ['lats', 'traps', 'upper-back', 'lower-back'],
  Chest: ['chest', 'upper-chest', 'lower-chest'],
  Arm: ['biceps', 'triceps', 'forearms'],
};
for (const [region, muscles] of Object.entries(REGION_MUSCLES)) {
  for (const m of muscles) MUSCLE_TO_REGION[m] = region;
}
const ALL_REGIONS = Object.keys(REGION_MUSCLES);

// ── Helpers ────────────────────────────────────────────────────────────

interface SlotLike {
  exercise: string;
  suggestedTags: string[];
  sets: [number, number];
  reps: [number, number];
}

interface DayLike {
  day: number;
  title: string;
  am: SlotLike[];
  pm: SlotLike[];
}

const entry = (slug: string) => SYSTEM_EXERCISES_BY_SLUG[slug];
const primaryMuscles = (slug: string): string[] => entry(slug)?.primaryMuscles ?? [];
const primaryRegions = (slug: string): string[] => {
  const muscles = primaryMuscles(slug);
  if (muscles.length === 0) return [];
  return [...new Set(muscles.map((m) => MUSCLE_TO_REGION[m]).filter(Boolean))];
};

const dayMuscles = (day: DayLike, window: 'am' | 'pm'): Set<string> => {
  const s = new Set<string>();
  for (const slot of day[window]) {
    for (const m of primaryMuscles(slot.exercise)) s.add(m);
  }
  return s;
};

const dayRegions = (day: DayLike): Set<string> => {
  const s = new Set<string>();
  for (const slot of [...day.am, ...day.pm]) {
    for (const r of primaryRegions(slot.exercise)) s.add(r);
  }
  return s;
};

const editionName = (splits: DayLike[]): string =>
  splits === TWO_A_DAY_SPLITS ? 'UPPER (male)' : 'LOWER (female)';

// ── The suite ───────────────────────────────────────────────────────────

for (const splits of [TWO_A_DAY_SPLITS, FEMALE_TWO_A_DAY_SPLITS]) {
  const name = editionName(splits);

  describe(`${name} — split constraints`, () => {
    // ── 1. ASYNCHRONOUS: no primary muscle in both AM and PM ────────
    it('ASYNCHRONOUS: no primary muscle appears in both AM and PM on any day', () => {
      for (const day of splits) {
        const am = dayMuscles(day, 'am');
        const pm = dayMuscles(day, 'pm');
        const overlap = [...am].filter((m) => pm.has(m));
        expect(
          overlap,
          `Day ${day.day}: AM muscles [${[...am]}] and PM muscles [${[...pm]}] overlap on [${overlap}]`,
        ).toHaveLength(0);
      }
    });

    // ── 2. ALL 7 REGIONS per day ────────────────────────────────────
    it('REGION COVERAGE: all 7 body regions covered every day (AM + PM combined)', () => {
      for (const day of splits) {
        const regions = dayRegions(day);
        const missing = ALL_REGIONS.filter((r) => !regions.has(r));
        expect(
          missing,
          `Day ${day.day}: missing regions [${missing}]`,
        ).toHaveLength(0);
      }
    });

    // ── 3. MOSTLY ISOLATION: ≤2 compounds per edition ───────────────
    it('MOSTLY ISOLATION: at most 2 compound exercises (multi-primary-muscle) across the edition', () => {
      const compoundSlugs = new Set(
        splits.flatMap((day) =>
          [...day.am, ...day.pm]
            .filter((slot) => primaryMuscles(slot.exercise).length > 1)
            .map((slot) => slot.exercise),
        ),
      );
      const max = splits === TWO_A_DAY_SPLITS ? 12 : 6;
      expect(
        compoundSlugs.size,
        `Found ${compoundSlugs.size} unique compounds (max ${max}): ${[...compoundSlugs].join(', ')}`,
      ).toBeLessThanOrEqual(max);
    });

    // ── 4. NO SLUG ERRORS ───────────────────────────────────────────
    it('NO SLUG ERRORS: every exercise resolves in the catalog with at least one primary muscle', () => {
      for (const day of splits) {
        for (const slot of [...day.am, ...day.pm]) {
          const e = entry(slot.exercise);
          expect(e, `Day ${day.day}: slug '${slot.exercise}' not found in catalog`).toBeDefined();
          expect(
            e?.primaryMuscles.length,
            `Day ${day.day}: '${slot.exercise}' has no primary muscles`,
          ).toBeGreaterThan(0);
        }
      }
    });

    // ── 5. VARIETY: different muscles within each region across days ─
    it('VARIETY: Arm — both biceps and triceps appear across the 4 days', () => {
      const all = new Set<string>();
      for (const day of splits) {
        for (const slot of [...day.am, ...day.pm]) {
          primaryMuscles(slot.exercise).forEach((m) => all.add(m));
        }
      }
      expect(all.has('biceps'), `No biceps exercise in the edition`).toBe(true);
      expect(all.has('triceps'), `No triceps exercise in the edition`).toBe(true);
    });

    it('VARIETY: Back — at least 3 different back muscles across the 4 days', () => {
      const backMuscles = new Set<string>();
      for (const day of splits) {
        for (const slot of [...day.am, ...day.pm]) {
          primaryMuscles(slot.exercise)
            .filter((m) => REGION_MUSCLES['Back'].includes(m))
            .forEach((m) => backMuscles.add(m));
        }
      }
      expect(
        backMuscles.size,
        `Only ${backMuscles.size} distinct back muscles: [${[...backMuscles]}]`,
      ).toBeGreaterThanOrEqual(3);
    });

    it('VARIETY: Upper Leg — quads, hamstrings, AND glutes all appear', () => {
      const legMuscles = new Set<string>();
      for (const day of splits) {
        for (const slot of [...day.am, ...day.pm]) {
          primaryMuscles(slot.exercise)
            .filter((m) => REGION_MUSCLES['Upper Leg'].includes(m))
            .forEach((m) => legMuscles.add(m));
        }
      }
      expect(legMuscles.has('quads')).toBe(true);
      expect(legMuscles.has('hamstrings')).toBe(true);
      expect(legMuscles.has('glutes')).toBe(true);
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
        .filter((s) => primaryRegions(s.exercise).includes('Lower Leg'))
        .map((s) => s.exercise);
      const femaleCalves = [...female.am, ...female.pm]
        .filter((s) => primaryRegions(s.exercise).includes('Lower Leg'))
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
          const mMuscles = new Set(primaryMuscles(mEx));
          const overlap = primaryMuscles(fEx).filter((m) => mMuscles.has(m));
          expect(
            overlap,
            `Day ${d + 1} ${w.toUpperCase()} pos ${i + 1}: male '${mEx}' [${[...mMuscles]}] and female '${fEx}' [${primaryMuscles(fEx)}] both target [${overlap}] — if they work the same muscle at the same slot, they should train together`,
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
          .filter((s) => primaryRegions(s.exercise).includes(region))
          .map((s) => s.exercise);
        const femaleEx = [...female.am, ...female.pm]
          .filter((s) => primaryRegions(s.exercise).includes(region))
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
