// services/programService.ts
// Plan-time program resolution: the programmed slots with the user's
// per-slot overrides applied. Pure — no DB, no React; the overrides
// themselves live in the client-side programOverrideStore (persisted).
// The program in splits.ts stays the authored asset; an override is a
// standing substitution ("this gym has no leg press"), never an edit.

import {
  getSlotsForDay,
  type ResolvedSlot,
  type SessionWindow,
} from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

/** Stable per-slot key: split × day × window × position. */
export function slotKey(
  split: PreferredSplit,
  day: number,
  window: SessionWindow,
  position: number,
): string {
  const w = split === 'oneADay' ? 'single' : window;
  return `${split}:${day}:${w}:${position}`;
}

/**
 * Resolve a day's slots against the override map. An overridden slot
 * keeps its programmed Rx (sets/reps) and position but takes the
 * override's identity; its suggested tags drop (they belonged to the
 * programmed exercise — last-used tags refill from history instead).
 */
export function resolveSlots(
  split: PreferredSplit,
  day: number,
  window: SessionWindow,
  overrides: Readonly<Record<string, { slug: string; name: string }>>,
): ResolvedSlot[] {
  return getSlotsForDay(split, day, window).map((slot, i) => {
    const ov = overrides[slotKey(split, day, window, i + 1)];
    if (ov) {
      return {
        exercise: ov.slug,
        suggestedTags: [],
        sets: slot.sets,
        reps: slot.reps,
      };
    }
    return { ...slot, exercise: slot.exercise };
  });
}
