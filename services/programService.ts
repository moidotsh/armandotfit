// services/programService.ts
// Plan-time program resolution: the programmed slots with the user's
// standing slot edits applied. Pure — no DB, no React; the edits
// themselves live in the client-side programOverrideStore (persisted).
// The program in splits.ts stays the authored asset and the DEFAULT —
// an edit (swap, sets/reps, removal, addition) always names the slot
// it diverges from, so clearing it restores the original in full.
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
import type { LiveProgram, ProgramSlotOverride } from '../shared/types';
import { generateProgram, type GeneratedSplit } from './splitGenerator';

/** An override map — slot key → the slot's standing edit. */
type OverrideMap = Readonly<Record<string, ProgramSlotOverride>>;

/** The prescription an ADDED slot starts with (the starter dose) —
 * editable like any other slot once it exists. */
export const ADDED_SLOT_SETS: [number, number] = [3, 3];
export const ADDED_SLOT_REPS: [number, number] = [8, 10];

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
 * Apply one window's slot edits — the shared post-processing under
 * every resolver: a removed slot drops; a swap takes the override's
 * identity (its suggested tags drop — they belonged to the programmed
 * exercise — unless the edit carries its own); a prescription or TAGS
 * edit rewrites sets, reps, and/or the realization tags (an absent
 * tags field leaves the standing tags; an empty array logs bare); an
 * untouched slot passes through. Added positions append after the
 * authored ones (first key past the length not holding a live add —
 * removing an added slot frees its position again). Every output slot
 * carries its AUTHORED `position` so override keys stay stable no
 * matter how removals shift the output order.
 */
function applySlotEdits(
  raw: ResolvedSlot[],
  overrides: OverrideMap,
  keyAt: (position: number) => string,
): ResolvedSlot[] {
  const out: ResolvedSlot[] = [];
  raw.forEach((slot, i) => {
    const ov = overrides[keyAt(i + 1)];
    if (ov?.removed) return;
    if (ov?.slug) {
      out.push({
        exercise: ov.slug,
        suggestedTags: ov.tags ?? [],
        sets: ov.sets ?? slot.sets,
        reps: ov.reps ?? slot.reps,
        position: i + 1,
      });
      return;
    }
    if (ov?.sets || ov?.reps || ov?.tags) {
      out.push({
        ...slot,
        suggestedTags: ov.tags ?? slot.suggestedTags,
        sets: ov.sets ?? slot.sets,
        reps: ov.reps ?? slot.reps,
        position: i + 1,
      });
      return;
    }
    out.push({ ...slot, position: i + 1 });
  });
  for (let pos = raw.length + 1; ; pos++) {
    const ov = overrides[keyAt(pos)];
    if (!ov?.slug) break; // the added run ended (adds are contiguous)
    if (!ov.removed) {
      out.push({
        exercise: ov.slug,
        suggestedTags: ov.tags ?? [],
        sets: ov.sets ?? ADDED_SLOT_SETS,
        reps: ov.reps ?? ADDED_SLOT_REPS,
        position: pos,
      });
    }
  }
  return out;
}

/**
 * Resolve an edition day's slots against the override map — swaps,
 * prescription edits, removals, and added positions all land here.
 * The authored program stays the default: clearing a key restores the
 * original exercise AND its Rx.
 */
export function resolveSlots(
  split: 'oneADay' | 'twoADay',
  day: number,
  window: SessionWindow,
  overrides: OverrideMap,
  edition: 'upper' | 'lower' = 'upper',
): ResolvedSlot[] {
  const raw = getSlotsForDay(split, day, window, edition);
  return applySlotEdits(raw, overrides, (pos) => slotKey(split, day, window, pos));
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
 * `starter:*` / `generated:*` override keys — swaps, prescription
 * edits, removals, and added positions all land here, for every kind.
 * Out-of-range days resolve empty (the picker falls back; the Floor
 * renders bare).
 */
export function resolveLiveSlots(
  program: LiveProgram,
  day: number,
  window: SessionWindow,
  overrides: OverrideMap,
  edition: ProgramEdition = 'upper',
): ResolvedSlot[] {
  if (program.kind === 'edition') {
    return resolveSlots(program.split, day, window, overrides, edition);
  }
  const raw = program.kind === 'starter'
    ? starterSlots(program.program, day)
    : generatedDaySlots(program.program, program.seed, program.edition, day, window);
  return applySlotEdits(raw, overrides, (pos) => liveSlotKey(program, day, window, pos));
}

/** The authored (pre-edit) slot count for a day's window — where the
 * added positions begin. */
export function authoredSlotCount(
  program: LiveProgram,
  day: number,
  window: SessionWindow,
  edition: ProgramEdition = 'upper',
): number {
  if (program.kind === 'edition') {
    return getSlotsForDay(program.split, day, window, edition).length;
  }
  if (program.kind === 'starter') return starterSlots(program.program, day).length;
  return generatedDaySlots(program.program, program.seed, program.edition, day, window).length;
}

/** The position the next ADD lands on: the first key past the authored
 * length not holding a live (unremoved) add — removing an added slot
 * frees its position for the next one. */
export function nextAddedPosition(
  program: LiveProgram,
  day: number,
  window: SessionWindow,
  overrides: OverrideMap,
  edition: ProgramEdition = 'upper',
): number {
  let pos = authoredSlotCount(program, day, window, edition) + 1;
  while (overrides[liveSlotKey(program, day, window, pos)]?.slug) pos += 1;
  return pos;
}

/** The AUTHORED slot at an authored position — the DEFAULT every edit
 * diverges from (the swap bench's DEFAULT row, the Rx bench's default
 * figure). Added positions have no authored slot. */
export function authoredSlotAt(
  program: LiveProgram,
  day: number,
  window: SessionWindow,
  position: number,
  edition: ProgramEdition = 'upper',
): ResolvedSlot | undefined {
  if (program.kind === 'edition') {
    return getSlotsForDay(program.split, day, window, edition)[position - 1];
  }
  if (program.kind === 'starter') return starterSlots(program.program, day)[position - 1];
  const found = generatedBoard(program.program, program.seed, program.edition).days.find(
    (d) => d.day === day,
  );
  if (!found) return undefined;
  const list = window === 'pm' && found.pm.length > 0 ? found.pm : found.am;
  return list[position - 1];
}

/** The override-map prefix owning a program's slot keys — the scope of
 * the page's RESTORE TO DEFAULTS verb. The trailing separator is part
 * of the prefix (seed 4271 never sweeps seed 42710). */
export function programOverridePrefix(program: LiveProgram): string {
  if (program.kind === 'edition') return `${program.split}:`;
  return `${liveProgramKey(program)}:`;
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
