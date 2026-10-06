// services/programService.ts
// Plan-time program resolution: the programmed slots with the user's
// per-slot overrides applied. Pure — no DB, no React; the overrides
// themselves live in the client-side programOverrideStore (persisted).
// The program in splits.ts stays the authored asset; an override is a
// standing substitution ("this gym has no leg press"), never an edit.
//
// THE LIVE PROGRAM LAYER: one resolver for all three program kinds
// (shared/types/program.ts) — the authored editions, the authored
// starters, and a Split Lab board rebuilt from its seed. The editions
// keep their legacy slotKey namespace (persisted overrides survive);
// starters and generated boards key `starter:<id>:…` /
// `generated:<type>:<seed>:…`.

import {
  getSlotsForDay,
  getDayTitle,
  getStarterDays,
  type ResolvedSlot,
  type SessionWindow,
  type ProgramEdition,
  type ProgramType,
  type StarterProgram,
} from '../shared/exercises';
import type { LiveProgram } from '../shared/types';
import { generateProgram, type GeneratedSplit } from './splitGenerator';

/** Stable per-slot key: split × day × window × position. */
export function slotKey(
  split: 'oneADay' | 'twoADay',
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
  split: 'oneADay' | 'twoADay',
  day: number,
  window: SessionWindow,
  overrides: Readonly<Record<string, { slug: string; name: string }>>,
  edition: 'upper' | 'lower' = 'upper',
): ResolvedSlot[] {
  return getSlotsForDay(split, day, window, edition).map((slot, i) => {
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

// ──────────────────────────────────────────────────────────────────────
// THE LIVE PROGRAM — identity helpers + the generalized resolver
// ──────────────────────────────────────────────────────────────────────

/** The authored editions' rotation length (the historical 4-day cycle). */
export const EDITION_ROTATION_DAYS = 4;

/** Display names for the authored starters (the program page's cards). */
export const STARTER_PROGRAM_LABELS: Record<StarterProgram, string> = {
  ppl: 'Push/Pull/Leg',
  upperLower: 'Upper/Lower',
  broSplit: 'Bro Split',
  fullyEqual: 'Fully Equal',
};

/** Display names for the generator's program types (the lab's cards). */
export const GENERATED_PROGRAM_LABELS: Record<ProgramType, string> = {
  fullBodyOneADay: 'Full Body — one-a-day',
  fullBodyHighFrequency: 'HF Full Body — AM/PM',
  pushPullLegs: 'Push / Pull / Leg',
  upperLower: 'Upper / Lower',
  broSplit: 'Bro Split',
  fullyEqual: 'Fully Equal',
  anythingGoes: 'Anything Goes',
};

/** The generated board for (program, seed, edition) — memoized. The
 * generator is pure and deterministic, but a board can cost hundreds
 * of law-checked attempts, and the live surfaces rebuild every render. */
const boardCache = new Map<string, GeneratedSplit>();

export function generatedBoard(
  program: ProgramType,
  seed: number,
  edition: ProgramEdition,
): GeneratedSplit {
  const key = `${program}:${seed}:${edition}`;
  const hit = boardCache.get(key);
  if (hit) return hit;
  const board = generateProgram({ seed, program, edition });
  boardCache.set(key, board);
  return board;
}

/** The windows a live program trains: two only for the AM/PM shapes. */
export function programWindows(program: LiveProgram): SessionWindow[] {
  if (program.kind === 'edition') {
    return program.split === 'twoADay' ? ['am', 'pm'] : ['single'];
  }
  if (program.kind === 'generated') {
    return program.program === 'fullBodyHighFrequency' ? ['am', 'pm'] : ['single'];
  }
  return ['single'];
}

/** Stable per-program key (labels + testIDs):
 *  'edition:twoADay' | 'starter:ppl' | 'generated:pushPullLegs:4271'. */
export function liveProgramKey(program: LiveProgram): string {
  switch (program.kind) {
    case 'edition':
      return `edition:${program.split}`;
    case 'starter':
      return `starter:${program.program}`;
    case 'generated':
      return `generated:${program.program}:${program.seed}`;
  }
}

/** The live program's display name. */
export function liveProgramLabel(program: LiveProgram): string {
  switch (program.kind) {
    case 'edition':
      return program.split === 'twoADay' ? 'Two-a-day' : 'One-a-day';
    case 'starter':
      return STARTER_PROGRAM_LABELS[program.program];
    case 'generated':
      return `${GENERATED_PROGRAM_LABELS[program.program]} · seed ${program.seed}`;
  }
}

/** LIVE-badge equality: same kind and identity (seed counts). */
export function isSameLiveProgram(a: LiveProgram, b: LiveProgram): boolean {
  return liveProgramKey(a) === liveProgramKey(b);
}

/** Stable per-slot key for any live program. Editions keep the legacy
 * namespace (persisted overrides survive); single-window programs
 * collapse the window to 'single' like oneADay always did. */
export function liveSlotKey(
  program: LiveProgram,
  day: number,
  window: SessionWindow,
  position: number,
): string {
  if (program.kind === 'edition') return slotKey(program.split, day, window, position);
  const w = programWindows(program).length === 2 ? window : 'single';
  return `${liveProgramKey(program)}:${day}:${w}:${position}`;
}

/** A starter day's slots as resolved slots (no overrides yet applied). */
function starterSlots(program: StarterProgram, day: number): ResolvedSlot[] {
  const found = getStarterDays(program).find((d) => d.day === day);
  return found ? found.session.map((slot) => ({ ...slot })) : [];
}

/** A generated board day's slots for the window (single-window boards
 * keep everything in `am`; `pm` is empty by construction). */
function generatedDaySlots(
  program: ProgramType,
  seed: number,
  edition: ProgramEdition,
  day: number,
  window: SessionWindow,
): ResolvedSlot[] {
  const found = generatedBoard(program, seed, edition).days.find((d) => d.day === day);
  if (!found) return [];
  return window === 'pm' && found.pm.length > 0 ? found.pm : found.am;
}

/**
 * Resolve any live program's day against the override map — the one
 * resolver the funnel, the Floor, and the receipt ask. Editions
 * delegate to resolveSlots (legacy override keys); starters and
 * generated boards resolve from their authored/generated data with
 * `starter:*` / `generated:*` override keys. Out-of-range days
 * resolve empty (the picker falls back; the Floor renders bare).
 */
export function resolveLiveSlots(
  program: LiveProgram,
  day: number,
  window: SessionWindow,
  overrides: Readonly<Record<string, { slug: string; name: string }>>,
  edition: ProgramEdition = 'upper',
): ResolvedSlot[] {
  const raw = program.kind === 'edition'
    ? resolveSlots(program.split, day, window, overrides, edition)
    : (program.kind === 'starter'
        ? starterSlots(program.program, day)
        : generatedDaySlots(program.program, program.seed, program.edition, day, window)
      ).map((slot, i) => {
        const ov = overrides[liveSlotKey(program, day, window, i + 1)];
        if (ov) {
          return { exercise: ov.slug, suggestedTags: [], sets: slot.sets, reps: slot.reps };
        }
        return { ...slot };
      });
  return raw;
}

/** The day's title for any live program ("Workout Day 1" / "Push A" /
 * the generated board's own titles). Empty outside the rotation. */
export function liveDayTitle(
  program: LiveProgram,
  day: number,
  edition: ProgramEdition = 'upper',
): string {
  if (program.kind === 'edition') return getDayTitle(program.split, day, edition);
  if (program.kind === 'starter') {
    return getStarterDays(program.program).find((d) => d.day === day)?.title ?? '';
  }
  return (
    generatedBoard(program.program, program.seed, program.edition).days.find(
      (d) => d.day === day,
    )?.title ?? ''
  );
}

/** The rotation's length for any live program (the cycle walks mod N). */
export function liveRotationLength(
  program: LiveProgram,
  edition: ProgramEdition = 'upper',
): number {
  if (program.kind === 'edition') return EDITION_ROTATION_DAYS;
  if (program.kind === 'starter') return getStarterDays(program.program).length;
  return generatedBoard(program.program, program.seed, program.edition).days.length;
}
