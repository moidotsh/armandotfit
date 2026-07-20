// __tests__/shared/exercises-catalog.test.ts
// TS-side catalog integrity for the 43-exercise system library.
// Locks the four-way contract documented in CLAUDE.md invariant #9:
// seed SQL, splits.ts ExerciseKey union, data.ts SYSTEM_EXERCISES, and
// the display-name maps must all stay in sync. A regression here is
// the single biggest source of "why doesn't this exercise hydrate" bugs.

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
  EquipmentSlug,
  EQUIPMENT_DISPLAY_NAMES,
  MuscleSlug,
  MUSCLE_DISPLAY_NAMES,
} from '../../shared/exercises/data';
import {
  ONE_A_DAY_SPLITS,
  TWO_A_DAY_SPLITS,
} from '../../shared/exercises/splits';

// The 43 catalog slugs. This list is closed: a Phase-1 catalog change
// adds/removes here AND in the seed migration AND in the ExerciseKey
// union in the same change.
const EXPECTED_SLUGS = new Set<string>([
  // 26 original
  'barbell-press-incline',
  'dumbbell-fly-incline',
  'chest-fly-machine',
  'incline-machine-press',
  'overhead-tricep-extension-cable',
  'tricep-dip-machine',
  'dumbbell-curl-seated-incline',
  'cable-rope-curl',
  'egyptian-cable-lateral-raise',
  'face-pull-cable-rope-grip',
  'shoulder-press-machine-or-dumbbell',
  'dumbbell-overhead-press',
  'lower-back-extension-calisthenic',
  'seated-cable-row-v-grip',
  'lat-pulldown-reverse-grip',
  'straight-arm-cable-pulldown',
  'machine-shrug-plate-loaded',
  'dumbbell-shrug',
  'leg-press-machine',
  'bulgarian-split-squat-dumbbell',
  'machine-leg-curl-seated',
  'tibia-raise-machine-or-band',
  'calf-raise-leg-press-machine',
  'machine-calf-raise-standing',
  'leg-raise-captains-chair',
  'machine-ab-crunch-eccentric-emphasized',
  // 17 substitution pool (catalog extension migration 20260721000002)
  'hack-squat-machine',
  'seated-calf-raise-machine',
  'romanian-deadlift-barbell',
  'floor-leg-raise',
  'incline-dumbbell-press',
  'overhead-dumbbell-tricep-extension',
  'barbell-overhead-press',
  'dumbbell-lateral-raise',
  'lying-leg-curl-machine',
  'pull-up-bar',
  'cable-rope-crunch',
  'dumbbell-curl-standing',
  'reverse-pec-deck',
  'walking-lunge-dumbbell',
  'dumbbell-pullover',
  'bench-dip',
  'barbell-row',
]);

describe('system exercises catalog (TS mirror)', () => {
  it('has exactly 43 entries', () => {
    expect(SYSTEM_EXERCISES).toHaveLength(43);
  });

  it('has no duplicate slugs', () => {
    const slugs = SYSTEM_EXERCISES.map((e) => e.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('matches the expected slug set exactly', () => {
    const actual = new Set(SYSTEM_EXERCISES.map((e) => e.slug));
    const missing = [...EXPECTED_SLUGS].filter((s) => !actual.has(s));
    const extra = [...actual].filter((s) => !EXPECTED_SLUGS.has(s));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it('SYSTEM_EXERCISES_BY_SLUG indexes every entry', () => {
    for (const exercise of SYSTEM_EXERCISES) {
      expect(SYSTEM_EXERCISES_BY_SLUG[exercise.slug]).toBe(exercise);
    }
  });

  it('every entry has at least one primary muscle', () => {
    for (const exercise of SYSTEM_EXERCISES) {
      expect(exercise.primaryMuscles.length).toBeGreaterThan(0);
    }
  });

  it('every entry has at least one equipment entry', () => {
    for (const exercise of SYSTEM_EXERCISES) {
      expect(exercise.equipment.length).toBeGreaterThan(0);
    }
  });

  it('every muscle + equipment slug resolves to a display name', () => {
    for (const exercise of SYSTEM_EXERCISES) {
      for (const m of [...exercise.primaryMuscles, ...exercise.secondaryMuscles]) {
        expect(MUSCLE_DISPLAY_NAMES[m], `muscle ${m}`).toBeDefined();
      }
      for (const e of exercise.equipment) {
        const slug = typeof e === 'string' ? e : e.slug;
        expect(EQUIPMENT_DISPLAY_NAMES[slug], `equipment ${slug}`).toBeDefined();
      }
    }
  });
});

describe('equipment slugs (catalog extension)', () => {
  it('includes the 5 new equipment slugs added by migration 20260721000002', () => {
    expect(EquipmentSlug.HACK_SQUAT_MACHINE).toBe('hack-squat-machine');
    expect(EquipmentSlug.SEATED_CALF_RAISE_MACHINE).toBe('seated-calf-raise-machine');
    expect(EquipmentSlug.LYING_LEG_CURL_MACHINE).toBe('lying-leg-curl-machine');
    expect(EquipmentSlug.PEC_DECK_MACHINE).toBe('pec-deck-machine');
    expect(EquipmentSlug.FLOOR_SPACE).toBe('floor-space');
  });

  it('every EquipmentSlug has a display name entry', () => {
    for (const slug of Object.values(EquipmentSlug)) {
      expect(EQUIPMENT_DISPLAY_NAMES[slug], `equipment ${slug}`).toBeDefined();
    }
  });

  it('every MuscleSlug has a display name entry', () => {
    for (const slug of Object.values(MuscleSlug)) {
      expect(MUSCLE_DISPLAY_NAMES[slug], `muscle ${slug}`).toBeDefined();
    }
  });
});

// ──────────────────────────────────────────────────────────────────────
// splits.ts invariants — the four-day schedule shape is the contract
// the runtime depends on. The substitution pool must NOT appear on a
// split day; intentional omissions must be preserved.
// ──────────────────────────────────────────────────────────────────────

describe('splits.ts schedule shape', () => {
  it('one-a-day has exactly 4 days numbered 1..4', () => {
    expect(ONE_A_DAY_SPLITS).toHaveLength(4);
    const indices = ONE_A_DAY_SPLITS.map((d) => d.day).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2, 3, 4]);
  });

  it('two-a-day has exactly 4 days numbered 1..4', () => {
    expect(TWO_A_DAY_SPLITS).toHaveLength(4);
    const indices = TWO_A_DAY_SPLITS.map((d) => d.day).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2, 3, 4]);
  });

  it('every split-day slug is in the catalog', () => {
    const catalogSlugs = new Set(SYSTEM_EXERCISES.map((e) => e.slug));
    const splitSlugs = new Set<string>();
    for (const day of ONE_A_DAY_SPLITS) {
      for (const slug of day.exercises) splitSlugs.add(slug);
    }
    for (const day of TWO_A_DAY_SPLITS) {
      for (const slug of [...day.am, ...day.pm]) splitSlugs.add(slug);
    }
    for (const slug of splitSlugs) {
      expect(catalogSlugs.has(slug), `split slug ${slug} not in catalog`).toBe(true);
    }
  });

  it('substitution pool slugs are NOT on any split day', () => {
    const splitSlugs = new Set<string>();
    for (const day of ONE_A_DAY_SPLITS) {
      for (const slug of day.exercises) splitSlugs.add(slug);
    }
    for (const day of TWO_A_DAY_SPLITS) {
      for (const slug of [...day.am, ...day.pm]) splitSlugs.add(slug);
    }
    const poolSlugs = [
      'hack-squat-machine',
      'seated-calf-raise-machine',
      'romanian-deadlift-barbell',
      'floor-leg-raise',
      'incline-dumbbell-press',
      'overhead-dumbbell-tricep-extension',
      'barbell-overhead-press',
      'dumbbell-lateral-raise',
      'lying-leg-curl-machine',
      'pull-up-bar',
      'cable-rope-crunch',
      'dumbbell-curl-standing',
      'reverse-pec-deck',
      'walking-lunge-dumbbell',
      'dumbbell-pullover',
      'bench-dip',
      'barbell-row',
    ];
    for (const slug of poolSlugs) {
      expect(splitSlugs.has(slug), `pool slug ${slug} should not be on a split day`).toBe(false);
    }
  });

  it('preserves intentional one-a-day omissions', () => {
    // The four deliberate omissions documented in the migration header.
    const oneADayDay1 = ONE_A_DAY_SPLITS.find((d) => d.day === 1)!.exercises;
    const oneADayDay2 = ONE_A_DAY_SPLITS.find((d) => d.day === 2)!.exercises;
    const oneADayDay3 = ONE_A_DAY_SPLITS.find((d) => d.day === 3)!.exercises;
    const oneADayDay4 = ONE_A_DAY_SPLITS.find((d) => d.day === 4)!.exercises;

    expect(oneADayDay1).not.toContain('lower-back-extension-calisthenic');
    expect(oneADayDay2).not.toContain('machine-ab-crunch-eccentric-emphasized');
    expect(oneADayDay3).not.toContain('leg-raise-captains-chair');
    expect(oneADayDay4).not.toContain('dumbbell-shrug');

    // And those omissions ARE present in two-a-day (sanity).
    const twoADayDay1Am = TWO_A_DAY_SPLITS.find((d) => d.day === 1)!.am;
    const twoADayDay2Pm = TWO_A_DAY_SPLITS.find((d) => d.day === 2)!.pm;
    const twoADayDay3Am = TWO_A_DAY_SPLITS.find((d) => d.day === 3)!.am;
    const twoADayDay4Am = TWO_A_DAY_SPLITS.find((d) => d.day === 4)!.am;
    expect(twoADayDay1Am).toContain('lower-back-extension-calisthenic');
    expect(twoADayDay2Pm).toContain('machine-ab-crunch-eccentric-emphasized');
    expect(twoADayDay3Am).toContain('leg-raise-captains-chair');
    expect(twoADayDay4Am).toContain('dumbbell-shrug');
  });
});
