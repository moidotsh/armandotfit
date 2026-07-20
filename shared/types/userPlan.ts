// shared/types/userPlan.ts
// Domain types for the user-owned program plan layer (Phase 3).
// Mirrors the three tables landed in
// supabase/migrations/20260723000000_user_program_plans.sql:
//
//   user_program_plans                → UserProgramPlan
//   user_program_plan_slots           → UserProgramPlanSlot
//   user_program_plan_slot_overrides  → UserProgramPlanSlotOverride
//
// Plus the slot resolution union (the resolution CHECK constraint) and
// the in-memory plan-tree read shape returned by the plan generation
// service + UserPlanRepository.
//
// Owned by UserPlanRepository (persistence) + planGenerationService
// (the in-memory GeneratedPlan tree that snapshots into the persisted
// shape on save).

import type { ID, Timestamps } from './api';
import type { ProgramSlot } from './program';

// ──────────────────────────────────────────────────────────────────────
// Resolution union (mirrors user_program_plan_slots.resolution CHECK)
// ──────────────────────────────────────────────────────────────────────

/**
 * How a slot's chosen_exercise_id was picked.
 *
 *   template  — the slot's own template exercise was eligible.
 *   direct    — first eligible alternative with alt_type='direct'.
 *   close     — first eligible alternative with alt_type='close'.
 *   fallback  — first eligible alternative with alt_type='fallback'.
 *   manual    — user-initiated override via UserProgramPlanSlotOverride.
 *   missing   — no eligible exercise found; chosen_exercise_id is null.
 */
export type SlotResolution =
  | 'template'
  | 'direct'
  | 'close'
  | 'fallback'
  | 'manual'
  | 'missing';

/**
 * Frozen prescription copied from program_slots at adoption time. Lives
 * as JSONB in user_program_plan_slots.prescription_snapshot. The fields
 * match program_slots' columns (camelCased); the snapshot lets later
 * template edits leave saved plans intact.
 */
export interface PrescriptionSnapshot {
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  perSide: boolean;
  slotNotes: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Persisted row shapes
// ──────────────────────────────────────────────────────────────────────

/** Mirrors user_program_plans.status CHECK. */
export type UserPlanStatus = 'active' | 'retired';

export interface UserProgramPlan extends Timestamps {
  id: ID;
  userId: ID;
  templateId: ID;
  variantId: ID;
  status: UserPlanStatus;
}

/**
 * One slot row in a user plan. chosenExerciseId is nullable because
 * resolution='missing' slots have no eligible exercise. prescriptionSnapshot
 * freezes the slot prescription at adoption time so template edits can't
 * silently mutate a saved plan.
 */
export interface UserProgramPlanSlot extends Timestamps {
  id: ID;
  planId: ID;
  templateSlotId: ID;
  chosenExerciseId: ID | null;
  resolution: SlotResolution;
  prescriptionSnapshot: PrescriptionSnapshot;
}

/**
 * Optional manual-replacement record per plan slot. UNIQUE per slot —
 * at most one. altEdgeId is nullable: populated when the override came
 * from a known exercise_alternatives edge, null when the user picked
 * an exercise outside the seeded alternatives graph.
 */
export interface UserProgramPlanSlotOverride {
  id: ID;
  planSlotId: ID;
  chosenExerciseId: ID;
  altEdgeId: ID | null;
  intentNote: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// Composite read shape (returned by UserPlanRepository.findPlanById)
// ──────────────────────────────────────────────────────────────────────

/**
 * Composite read shape: a plan with its slots and per-slot overrides
 * pre-joined, ready for the plan-preview UI. Slot order matches the
 * program_slots.order_index of the underlying template slot.
 */
export interface UserProgramPlanWithSlots extends UserProgramPlan {
  slots: Array<{
    slot: UserProgramPlanSlot;
    override: UserProgramPlanSlotOverride | null;
  }>;
}

// ──────────────────────────────────────────────────────────────────────
// In-memory generated-plan tree (returned by planGenerationService)
// ──────────────────────────────────────────────────────────────────────

/**
 * One resolved slot in the in-memory generated plan. Carries the
 * template slot + the chosen exercise slug + the resolution metadata.
 * Snapshots into a UserProgramPlanSlot on save.
 */
export interface GeneratedPlanSlot {
  /** Template slot reference. */
  templateSlot: ProgramSlot;
  /** Resolved chosen exercise slug; null when resolution='missing'. */
  chosenExerciseSlug: string | null;
  /** Resolved chosen exercise id; null when resolution='missing'. */
  chosenExerciseId: ID | null;
  resolution: SlotResolution;
  /**
   * Human-readable rationale for the resolution (e.g. "Template exercise
   * eligible via path 1" or "Direct alternative for barbell-press-incline").
   * Surfaced as an eyebrow on the preview UI.
   */
  rationale: string;
}

/**
 * In-memory plan tree: variant + per-day/session/slot resolved choices.
 * Returned by planGenerationService.generatePlanForVariant. The preview
 * UI walks this shape directly; the save mutation snapshots it into
 * the persisted row set.
 */
export interface GeneratedPlan {
  templateId: ID;
  variantId: ID;
  variantSlug: string;
  variantName: string;
  days: Array<{
    dayId: ID;
    dayIndex: number;
    dayTitle: string;
    sessions: Array<{
      sessionId: ID;
      sessionWindow: 'am' | 'pm' | 'single';
      sessionLabel: string;
      slots: GeneratedPlanSlot[];
    }>;
  }>;
}

// ──────────────────────────────────────────────────────────────────────
// DTOs (create / replace)
// ──────────────────────────────────────────────────────────────────────

/**
 * Payload for creating or replacing a plan. The repository accepts the
 * generated-plan tree directly (rather than asking the caller to flatten
 * it) so the snapshot logic lives in one place.
 */
export interface SavePlanDTO {
  templateId: ID;
  variantId: ID;
  slots: Array<{
    templateSlotId: ID;
    chosenExerciseId: ID | null;
    resolution: SlotResolution;
    prescriptionSnapshot: PrescriptionSnapshot;
  }>;
}

/**
 * Payload for manually replacing a slot's chosen exercise. The
 * repository upserts a UserProgramPlanSlotOverride + flips the slot's
 * chosen_exercise_id and resolution='manual' atomically.
 */
export interface ReplacePlanSlotDTO {
  planSlotId: ID;
  chosenExerciseId: ID;
  altEdgeId?: ID | null;
  intentNote?: string | null;
}
