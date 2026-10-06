// __tests__/services/programService.test.ts
// The standing-substitution contract: overrides swap identity, keep the
// programmed Rx and position, and clear the slot's suggested tags (they
// belonged to the programmed exercise).

import { describe, expect, it } from 'vitest';
import { resolveSlots, slotKey } from '../../services/programService';

const NO_OVERRIDES: Record<string, { slug: string; name: string }> = {};

describe('slotKey', () => {
  it('is stable per split × day × window × position', () => {
    expect(slotKey('twoADay', 2, 'pm', 1)).toBe('twoADay:2:pm:1');
    expect(slotKey('oneADay', 2, 'am', 1)).toBe('oneADay:2:single:1');
  });
});

describe('resolveSlots', () => {
  it('passes programmed slots through untouched with no overrides', () => {
    const slots = resolveSlots('twoADay', 1, 'am', NO_OVERRIDES);
    expect(slots[0].exercise).toBe('leg-press');
  });

  it('an override swaps identity, keeps Rx + position, clears tags', () => {
    const key = slotKey('twoADay', 1, 'am', 1); // Leg Press slot
    const slots = resolveSlots('twoADay', 1, 'am', {
      [key]: { slug: 'barbell-back-squat', name: 'Barbell Back Squat' },
    });
    expect(slots[0].exercise).toBe('barbell-back-squat');
    expect(slots[0].sets).toEqual([3, 3]);
    expect(slots[0].reps).toEqual([8, 10]);
    expect(slots[0].suggestedTags).toEqual([]);
    // Position 2 unaffected.
    expect(slots[1].exercise).toBe('leg-press-calf-raise');
  });

  it('suggested tags survive on non-overridden slots', () => {
    const slots = resolveSlots('twoADay', 2, 'pm', NO_OVERRIDES);
    expect(slots[0].exercise).toBe('lat-pulldown');
    expect(slots[0].suggestedTags).toEqual(['underhand', 'lat-bar']);
  });

  // ── THE TAGS BENCH — a slot's standing realization tags ────────────

  it('a tags edit REPLACES the authored tags; absent field leaves them', () => {
    const key = slotKey('twoADay', 2, 'pm', 1); // lat-pulldown, ['underhand', 'lat-bar']
    const slots = resolveSlots('twoADay', 2, 'pm', {
      [key]: { tags: ['overhand', 'v-grip', 'per-side'] },
    });
    expect(slots[0].suggestedTags).toEqual(['overhand', 'v-grip', 'per-side']);
    expect(slots[0].exercise).toBe('lat-pulldown'); // identity untouched
    // The neighbor without a tags edit keeps its authored tags.
    expect(slots[1].suggestedTags).not.toEqual([]);
  });

  it('an EMPTY tags array logs bare — explicit, not a miss', () => {
    const key = slotKey('twoADay', 2, 'pm', 1);
    const slots = resolveSlots('twoADay', 2, 'pm', { [key]: { tags: [] } });
    expect(slots[0].suggestedTags).toEqual([]);
  });

  it('a tags edit rides a swap — the new identity carries the new tags', () => {
    const key = slotKey('twoADay', 1, 'am', 1); // Leg Press slot
    const slots = resolveSlots('twoADay', 1, 'am', {
      [key]: { slug: 'leg-press', name: 'Leg Press', tags: ['per-leg'] },
    });
    expect(slots[0].exercise).toBe('leg-press');
    expect(slots[0].suggestedTags).toEqual(['per-leg']);
  });

  it('a swap WITHOUT a tags edit still logs bare (the old law holds)', () => {
    const key = slotKey('twoADay', 1, 'am', 1);
    const slots = resolveSlots('twoADay', 1, 'am', {
      [key]: { slug: 'barbell-back-squat', name: 'Barbell Back Squat' },
    });
    expect(slots[0].suggestedTags).toEqual([]);
  });

  it('clearing the override restores the authored tags in full', () => {
    const key = slotKey('twoADay', 2, 'pm', 1);
    const edited = resolveSlots('twoADay', 2, 'pm', { [key]: { tags: ['neutral'] } });
    expect(edited[0].suggestedTags).toEqual(['neutral']);
    const cleared = resolveSlots('twoADay', 2, 'pm', NO_OVERRIDES);
    expect(cleared[0].suggestedTags).toEqual(['underhand', 'lat-bar']);
  });
});
