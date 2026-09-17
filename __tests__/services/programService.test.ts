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
});
