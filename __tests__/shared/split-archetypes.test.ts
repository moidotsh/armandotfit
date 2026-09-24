// __tests__/shared/split-archetypes.test.ts
// THE ARCHETYPE LAWS — the PPL / Upper-Lower / Bro / Anything contracts
// as executable proof: the day themes are well-formed, and each law
// FAILS a deliberately broken edition (a law that cannot fail is a
// law that checks nothing).

import { describe, expect, it } from 'vitest';
import {
  PPL_STARTER,
  UPPER_LOWER_STARTER,
  BRO_STARTER,
  FULLY_EQUAL_STARTER,
  type StarterDay,
} from '../../shared/exercises';
import {
  PPL_DAYS,
  UPPER_LOWER_DAYS,
  BRO_DAYS,
  dayThemesFor,
  checkThemeLaws,
  checkWeeklyLaws,
  checkProgramLaws,
  checkFullyEqualLaws,
  type LawDay,
  type RuleResult,
} from '../../shared/exercises';

const rule = (rules: RuleResult[], id: string): RuleResult => {
  const found = rules.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown law id: ${id} (have: ${rules.map((r) => r.id).join(',')})`);
  return found;
};

/** A day of one exercise repeated into slots — law-breaking on purpose. */
const day = (n: number, title: string, slug: string, slots = 6): LawDay => ({
  day: n,
  title,
  am: Array.from({ length: slots }, () => ({
    exercise: slug,
    suggestedTags: [],
    sets: [3, 3] as [number, number],
    reps: [8, 10] as [number, number],
  })),
  pm: [],
});

describe('the day themes are well-formed', () => {
  it('PPL: the six-day double pass, 7 slots each, required groups present', () => {
    expect(PPL_DAYS.map((d) => d.title)).toEqual([
      'Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B',
    ]);
    for (const d of PPL_DAYS) {
      expect(d.slots).toBe(7);
      expect(d.require.length).toBeGreaterThanOrEqual(3);
      expect(d.roles ?? d.muscles).toBeDefined();
    }
  });

  it('Upper/Lower: the A/B alternation, lower days carry core', () => {
    expect(UPPER_LOWER_DAYS.map((d) => d.title)).toEqual(['Upper A', 'Lower A', 'Upper B', 'Lower B']);
    for (const d of UPPER_LOWER_DAYS) {
      expect(d.roles).toContain(d.title.startsWith('Upper') ? 'pull' : 'core');
    }
  });

  it('Bro: the five muscle-themed days, each with a distinctness bar', () => {
    expect(BRO_DAYS.map((d) => d.title)).toEqual(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms']);
    for (const d of BRO_DAYS) {
      expect(d.muscles?.length ?? 0).toBeGreaterThan(0);
      expect(d.distinctMuscles).toBeGreaterThanOrEqual(2);
    }
  });

  it('dayThemesFor dispatches; full-body and anything carry no themes', () => {
    expect(dayThemesFor('pushPullLegs')).toBe(PPL_DAYS);
    expect(dayThemesFor('upperLower')).toBe(UPPER_LOWER_DAYS);
    expect(dayThemesFor('broSplit')).toBe(BRO_DAYS);
    expect(dayThemesFor('fullBodyOneADay')).toBeNull();
    expect(dayThemesFor('anythingGoes')).toBeNull();
  });
});

describe('theme laws fail what they should', () => {
  it('OFF THEME: a squat on Push day fails purity', () => {
    const days = PPL_DAYS.map((t, i) =>
      t.title === 'Push A' ? day(i + 1, t.title, 'barbell-back-squat', 7) : day(i + 1, t.title, 'push-up', 7),
    );
    const r = rule(checkThemeLaws(days, PPL_DAYS), 'theme-purity');
    expect(r.ok).toBe(false);
    expect(r.detail).toContain('barbell-back-squat');
  });

  it("A/B VARIETY: Push B repeating Push A's station fails", () => {
    const days = PPL_DAYS.map((t, i) => day(i + 1, t.title, 'push-up', 7));
    const r = rule(checkThemeLaws(days, PPL_DAYS), 'ab-variety');
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("Push B repeats Push A's");
  });

  it('A/B VARIETY: disjoint paired days pass', () => {
    const PICKS: Record<string, string> = {
      'Push A': 'push-up',
      'Push B': 'machine-dip',
      'Pull A': 'dumbbell-curl',
      'Pull B': 'face-pull',
      'Legs A': 'leg-extension',
      'Legs B': 'glute-bridge',
    };
    const days: LawDay[] = PPL_DAYS.map((t, i) => ({
      day: i + 1,
      title: t.title,
      am: [{ exercise: PICKS[t.title], suggestedTags: [], sets: [3, 3], reps: [8, 10] }],
      pm: [],
    }));
    const r = rule(checkThemeLaws(days, PPL_DAYS), 'ab-variety');
    expect(r.ok).toBe(true);
  });

  it('MISSING COVERAGE: a Pull day of curls misses WIDTH and REAR', () => {
    const days = PPL_DAYS.map((t, i) =>
      t.title === 'Pull' ? day(i + 1, t.title, 'dumbbell-curl', 7) : day(i + 1, t.title, 'dumbbell-curl', 7),
    );
    const r = rule(checkThemeLaws(days, PPL_DAYS), 'theme-coverage');
    expect(r.ok).toBe(false);
    expect(r.detail).toContain('WIDTH');
    expect(r.detail).toContain('REAR DELT / TRAPS');
  });

  it('CORE BALANCE: a Legs day of three ab lifts fails', () => {
    const days = PPL_DAYS.map((t, i) => day(i + 1, t.title, 'floor-crunch', 7));
    const r = rule(checkThemeLaws(days, PPL_DAYS), 'theme-core');
    expect(r.ok).toBe(false);
  });

  it('DAY REPEATS: the same identity twice on one day fails', () => {
    // Two different but on-theme exercises would pass; build a day
    // with one exercise repeated by hand.
    const repeated: LawDay = {
      day: 1,
      title: 'Push',
      am: [
        { exercise: 'push-up', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
        { exercise: 'push-up', suggestedTags: [], sets: [3, 3], reps: [8, 10] },
      ],
      pm: [],
    };
    const r = rule(checkThemeLaws([repeated], PPL_DAYS.slice(0, 1)), 'theme-repeats');
    expect(r.ok).toBe(false);
  });

  it('BRO DISTINCT: a chest day of flat-only work misses UPPER CHEST', () => {
    const chestDay = day(1, 'Chest', 'push-up', 6); // push-up: chest, no upper-chest
    const r = rule(checkThemeLaws([chestDay], BRO_DAYS.slice(0, 1)), 'theme-coverage');
    expect(r.ok).toBe(false);
    expect(r.detail).toContain('UPPER CHEST');
  });
});

describe('weekly laws fail what they should', () => {
  it('a one-muscle week misses six regions and staples one lift', () => {
    const days = [day(1, 'Day 1', 'push-up', 7), day(2, 'Day 2', 'push-up', 7)];
    const rules = checkWeeklyLaws(days);
    expect(rule(rules, 'weekly-coverage').ok).toBe(false);
    expect(rule(rules, 'frequency').ok).toBe(false);
    expect(rule(rules, 'slugs').ok).toBe(true);
  });

  it('an unknown slug fails slugs', () => {
    const rules = checkWeeklyLaws([day(1, 'Day 1', 'not-real', 5)]);
    expect(rule(rules, 'slugs').ok).toBe(false);
  });
});

describe('checkProgramLaws dispatch', () => {
  it('anything goes → weekly laws; themed types → theme laws', () => {
    const days = [day(1, 'Day 1', 'push-up', 6)];
    expect(checkProgramLaws(days, 'anythingGoes').some((r) => r.id === 'weekly-coverage')).toBe(true);
    expect(checkProgramLaws(days, 'pushPullLegs').some((r) => r.id === 'theme-purity')).toBe(true);
  });
});


// ── The authored starters obey their own laws ──────────────────────────

describe('the starters pass their archetype laws', () => {
  const toLawDays = (days: StarterDay[]): LawDay[] =>
    days.map((d) => ({ day: d.day, title: d.title, am: d.session, pm: [] }));

  it('PPL_STARTER (6-day, abs aboard) passes every PPL law', () => {
    const rules = checkThemeLaws(toLawDays(PPL_STARTER), PPL_DAYS);
    const bad = rules.filter((r) => !r.ok);
    expect(bad, bad.map((r) => `${r.label}: ${r.detail}`).join('; ')).toHaveLength(0);
    expect(PPL_STARTER).toHaveLength(6);
    expect(PPL_STARTER.every((d) => d.session.length === 7)).toBe(true);
    // Abs ride the rotation (the owner's ask).
    const coreSlots = PPL_STARTER.flatMap((d) =>
      d.session.filter((s) => ['machine-ab-crunch', 'leg-raise', 'cable-rope-crunch', 'cable-wood-chop', 'hanging-knee-raise'].includes(s.exercise)),
    );
    expect(coreSlots.length).toBeGreaterThanOrEqual(4);
  });

  it('UPPER_LOWER_STARTER passes every Upper/Lower law', () => {
    const rules = checkThemeLaws(toLawDays(UPPER_LOWER_STARTER), UPPER_LOWER_DAYS);
    expect(rules.filter((r) => !r.ok)).toHaveLength(0);
  });

  it('BRO_STARTER passes every Bro law', () => {
    const rules = checkThemeLaws(toLawDays(BRO_STARTER), BRO_DAYS);
    expect(rules.filter((r) => !r.ok)).toHaveLength(0);
  });

  it('FULLY_EQUAL_STARTER trains all 20 muscles at identical volume', () => {
    const rules = checkFullyEqualLaws(toLawDays(FULLY_EQUAL_STARTER));
    const bad = rules.filter((r) => !r.ok);
    expect(bad, bad.map((r) => `${r.label}: ${r.detail}`).join('; ')).toHaveLength(0);
  });
});

describe('the fully-equal laws fail what they should', () => {
  const eqDay = (n: number, slug: string, sets: [number, number] = [3, 3]): LawDay => ({
    day: n,
    title: `Equal Day ${n}`,
    am: [{ exercise: slug, suggestedTags: [], sets, reps: [10, 12] }],
    pm: [],
  });

  it('one over-fed muscle breaks EQUAL VOLUME', () => {
    const days = [...FULLY_EQUAL_STARTER.map((d, i) => ({
      day: i + 1, title: d.title,
      am: d.session.map((s) => ({ ...s })),
      pm: [],
    }))];
    // Double chest's volume: a second chest slot.
    days[0].am.push({ exercise: 'incline-dumbbell-fly', suggestedTags: [], sets: [3, 3], reps: [12, 15] });
    const r = rule(checkFullyEqualLaws(days), 'equal-volume');
    expect(r.ok).toBe(false);
    expect(r.detail).toContain('(max 6)');
  });

  it('a missing muscle breaks EVERY MUSCLE TRAINED', () => {
    const days = FULLY_EQUAL_STARTER.map((d, i) => ({
      day: i + 1,
      title: d.title,
      am: d.session.filter((s) => s.exercise !== 'tibia-raise'),
      pm: [],
    }));
    const r = rule(checkFullyEqualLaws(days), 'equal-coverage');
    expect(r.ok).toBe(false);
    expect(r.detail).toContain('tibialis');
  });
});
