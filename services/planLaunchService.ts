// services/planLaunchService.ts
// Pure helpers that drive Phase 4 plan-backed workout launch. No DB, no
// React, no supabase. Every function here is deterministic + testable.
//
// The two responsibilities:
//
//   1. Decide whether an adopted plan can drive the current launch
//      (isPlanComplete) — every slot must have a non-null chosen
//      exercise and no slot may be resolution='missing'. Mirrors the
//      adoption-completeness validator in UserPlanRepository but
//      operates on the in-memory UserProgramPlanWithSlots read shape
//      (no DB round-trip at launch time).
//
//   2. Resolve which plan slots belong to the requested day + session
//      window, in the order the template defines (selectPlanSlotsForSession).
//      The plan stores slots by template_slot_id; the variant tree maps
//      (dayIndex, sessionWindow) → session → ordered slot ids. The
//      selector joins those to filter + order the plan slots without
//      mutating either input.
//
// Hydration payload mapping (buildPlanHydrationPayload) is also here so
// the workout-detail screen can convert a filtered plan-slot list into
// the DraftExercise[] shape via one call. The mapping freezes the
// prescription snapshot into the draft (setsMin rows, perSide,
// slotNotes, planSlotId, templateSlotId, source='plan').

import type {
  ID,
  PreferredSplit,
  ProgramSlot,
  ProgramVariantTree,
  UserProgramPlanWithSlots,
  WorkoutVariantSnapshot,
  WorkoutTemplateSnapshot,
} from '../shared/types';
import type { ProgramTemplate, ProgramScheduleVariant } from '../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Split ↔ variant slug maps
// ──────────────────────────────────────────────────────────────────────

/**
 * PreferredSplit (UI) ↔ variant slug (DB) mapping. The split values come
 * from workout_sessions.split_type CHECK constraint; the slugs come from
 * the seeded program_schedule_variants. Kept here so the launch path
 * has a single source of truth for the conversion.
 */
export const SPLIT_TO_VARIANT_SLUG: Record<PreferredSplit, string> = {
  oneADay: 'one-a-day',
  twoADay: 'two-a-day',
};

export const VARIANT_SLUG_TO_SPLIT: Record<string, PreferredSplit> = {
  'one-a-day': 'oneADay',
  'two-a-day': 'twoADay',
};

/**
 * Map a SessionMode (UI, 'am' | 'pm') to a SessionWindow (DB, 'am' | 'pm'
 * | 'single'). One-a-day sessions always resolve to 'single' regardless
 * of the planning-time sessionMode.
 */
export function sessionWindowForLaunch(
  split: PreferredSplit,
  sessionMode: 'am' | 'pm',
): 'am' | 'pm' | 'single' {
  return split === 'oneADay' ? 'single' : sessionMode;
}

// ──────────────────────────────────────────────────────────────────────
// Plan completeness
// ──────────────────────────────────────────────────────────────────────

/**
 * Deterministic adoption-completeness check at launch time. Returns true
 * iff the plan is non-null AND every slot has a non-null chosen exercise
 * AND no slot has resolution='missing'. Mirrors the adoption validator
 * in UserPlanRepository.ts but operates on the in-memory read shape.
 *
 * The launch path uses this to decide plan vs static fallback. A user
 * who somehow ends up with an incomplete active plan (e.g. adoption
 * raced a manual slot-clear) gets the static path rather than a
 * session with holes.
 */
export function isPlanComplete(plan: UserProgramPlanWithSlots | null | undefined): boolean {
  if (!plan) return false;
  if (plan.status !== 'active') return false;
  if (plan.slots.length === 0) return false;
  return plan.slots.every(({ slot }) => {
    return slot.resolution !== 'missing' && slot.chosenExerciseId !== null;
  });
}

// ──────────────────────────────────────────────────────────────────────
// Session-slot selection
// ──────────────────────────────────────────────────────────────────────

/**
 * Resolve the ordered program_slot ids that belong to a (dayIndex,
 * sessionWindow) pair on the given variant tree. Returns the empty array
 * when the day or window is unknown — the launch path falls through to
 * static in that case.
 *
 * Order matches program_slots.order_index, which the variant tree
 * already preserves (loaded via .order('order_index', ascending)).
 */
export function selectTemplateSlotsForSession(
  tree: ProgramVariantTree,
  dayIndex: number,
  window: 'am' | 'pm' | 'single',
): ProgramSlot[] {
  const day = tree.days.find((d) => d.day.dayIndex === dayIndex);
  if (!day) return [];
  const session = day.sessions.find((s) => s.session.sessionWindow === window);
  if (!session) return [];
  return session.slots.map((s) => s);
}

/**
 * Filter the plan's slots down to those belonging to the requested
 * session, in the template-defined order. Returns the slot entries
 * (with their override context) ready for hydration.
 *
 * The join key is templateSlotId ↔ program_slot.id. Slots that appear
 * in the plan but not the variant tree (e.g. a template edit dropped
 * the parent slot after adoption) are silently dropped — the snapshot
 * already froze the prescription; the slot just doesn't belong to the
 * requested session anymore.
 */
export function selectPlanSlotsForSession(
  plan: UserProgramPlanWithSlots,
  tree: ProgramVariantTree,
  dayIndex: number,
  window: 'am' | 'pm' | 'single',
): UserProgramPlanWithSlots['slots'] {
  const templateSlots = selectTemplateSlotsForSession(tree, dayIndex, window);
  if (templateSlots.length === 0) return [];
  const byTemplateId = new Map<ID, UserProgramPlanWithSlots['slots'][number]>();
  for (const entry of plan.slots) {
    byTemplateId.set(entry.slot.templateSlotId, entry);
  }
  const result: UserProgramPlanWithSlots['slots'] = [];
  for (const templateSlot of templateSlots) {
    const entry = byTemplateId.get(templateSlot.id);
    if (!entry) continue;
    // Defensive: completeness is enforced at launch, but a slot that
    // became missing between adoption + launch (shouldn't happen —
    // snapshot is immutable) is skipped rather than crashing the
    // hydration.
    if (entry.slot.chosenExerciseId === null) continue;
    if (entry.slot.resolution === 'missing') continue;
    result.push(entry);
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────
// Hydration payload (DraftExercise shape)
// ──────────────────────────────────────────────────────────────────────

/**
 * One row in the hydration payload. Mirrors what the workout-detail
 * screen passes into store.hydrateFromPlan. Carries everything the
 * draft needs to populate a plan-backed exercise entry: identity +
 * prescription snapshot + provenance pointers.
 */
export interface PlanHydrationSlot {
  exerciseId: ID;
  exerciseSlug: string;
  /** Display name; caller can suffix with variation. */
  exerciseName: string;
  variation: string | null;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  perSide: boolean;
  slotNotes: string | null;
  planSlotId: ID;
  templateSlotId: ID;
}

/**
 * Resolved plan slot — the chosen-exercise display data has been looked
 * up by the caller (typically via SYSTEM_EXERCISES_BY_SLUG for system
 * exercises, or a DB row read for custom exercises). Pairing the plan
 * slot entry with its resolved display data is required because the
 * plan slot stores only the chosen exercise id; the slug + name +
 * variation live on the exercises row.
 */
export interface ResolvedPlanSlot {
  entry: UserProgramPlanWithSlots['slots'][number];
  chosenExerciseSlug: string;
  chosenExerciseName: string;
  chosenExerciseVariation: string | null;
}

/**
 * Build the hydration payload from plan slots whose chosen-exercise
 * display data has been resolved by the caller. Freezes the
 * prescription snapshot fields (setsMin/Max, repsMin/Max, perSide,
 * slotNotes) into the payload — the workout draft uses these verbatim
 * at hydration time.
 */
export function buildHydrationPayloadFromResolved(
  resolved: ResolvedPlanSlot[],
): PlanHydrationSlot[] {
  return resolved.map((r) => {
    const snap = r.entry.slot.prescriptionSnapshot;
    return {
      exerciseId: r.entry.slot.chosenExerciseId as unknown as ID,
      exerciseSlug: r.chosenExerciseSlug,
      exerciseName: r.chosenExerciseName,
      variation: r.chosenExerciseVariation,
      setsMin: snap.setsMin,
      setsMax: snap.setsMax,
      repsMin: snap.repsMin,
      repsMax: snap.repsMax,
      perSide: snap.perSide,
      slotNotes: snap.slotNotes,
      planSlotId: r.entry.slot.id,
      templateSlotId: r.entry.slot.templateSlotId,
    };
  });
}

// ──────────────────────────────────────────────────────────────────────
// Identity snapshots (frozen at launch time)
// ──────────────────────────────────────────────────────────────────────

/** Build the immutable template snapshot stored on workout_sessions. */
export function buildTemplateSnapshot(
  template: ProgramTemplate,
): WorkoutTemplateSnapshot {
  return {
    slug: template.slug,
    name: template.name,
    version: template.version,
  };
}

/** Build the immutable variant snapshot stored on workout_sessions. */
export function buildVariantSnapshot(
  variant: ProgramScheduleVariant,
): WorkoutVariantSnapshot {
  return {
    slug: variant.slug,
    name: variant.name,
    sessionWindowPattern: variant.sessionWindowPattern,
    cycleLengthDays: variant.cycleLengthDays,
    version: variant.version,
  };
}
