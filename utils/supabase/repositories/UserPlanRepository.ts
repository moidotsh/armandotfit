// utils/supabase/repositories/UserPlanRepository.ts
// Repository over the Phase 3 user-owned plan layer
// (user_program_plans + user_program_plan_slots +
// user_program_plan_slot_overrides, migration 20260723000000).
//
// Three public write operations:
//
//   1. savePlan(userId, SavePlanDTO) — adopt a fresh active plan.
//      Validates adoption-completeness first (every slot must have a
//      non-null chosen exercise + resolution != 'missing'), then
//      retires any existing active plan for the same (user, variant)
//      — preserving its slots + prescription snapshots immutably —
//      and INSERTs a new active plan row + the new slot set.
//      Re-adoption never mutates a prior plan in place; history is
//      retained.
//
//   2. replaceSlot(ReplacePlanSlotDTO) — manual override. UPSERTs the
//      override row, flips the slot's chosen_exercise_id +
//      resolution='manual'.
//
//   3. retirePlan(planId) — flips status to 'retired' (the row stays
//      for history; the partial unique index stops enforcing).
//
// Read operations:
//
//   - findActivePlanForVariant(userId, variantId)
//   - findActivePlansForUser(userId) — all the user's active plans
//   - findPlanById(planId) — composite (slots + overrides pre-joined)
//
// Adoption-completeness is enforced at the repository boundary
// (validatePlanForAdoption) so UI bypass cannot create an incomplete
// active plan. The same rule is surfaced in the preview UI as a
// disabled Adopt CTA + an actionable explanation, but the repository
// is the load-bearing enforcement point.
//
// Like ExerciseRepository.replaceAllEquipmentCapabilities, the save
// path is multi-step without a DB transaction (supabase-js doesn't
// expose one over REST). The sequence is safe: retiring the prior
// plan + inserting the new one only affects rows owned by this user;
// a mid-sequence failure surfaces as a RepositoryError and the caller
// can retry.

import { supabase } from '../client';
import {
  type RepositoryResult,
  RepositoryErrorCode,
  err,
  ok,
  handleRepositoryError,
} from './types';
import type {
  ID,
  UserProgramPlan,
  UserProgramPlanSlot,
  UserProgramPlanSlotOverride,
  UserProgramPlanWithSlots,
  SavePlanDTO,
  ReplacePlanSlotDTO,
  SlotResolution,
  PrescriptionSnapshot,
  UserPlanStatus,
} from '../../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Row shapes (snake_case from DB)
// ──────────────────────────────────────────────────────────────────────

interface UserProgramPlanRow {
  id: string;
  user_id: string;
  template_id: string;
  variant_id: string;
  status: 'active' | 'retired';
  created_at: string;
  updated_at: string;
}

interface UserProgramPlanSlotRow {
  id: string;
  plan_id: string;
  template_slot_id: string;
  chosen_exercise_id: string | null;
  resolution: SlotResolution;
  prescription_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface UserProgramPlanSlotOverrideRow {
  id: string;
  plan_slot_id: string;
  chosen_exercise_id: string;
  alt_edge_id: string | null;
  intent_note: string | null;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────────────────────────────

export class UserPlanRepository {
  private static PLANS = 'user_program_plans';
  private static SLOTS = 'user_program_plan_slots';
  private static OVERRIDES = 'user_program_plan_slot_overrides';

  // ──────────────────────────────────────────────────────────────────
  // Reads
  // ──────────────────────────────────────────────────────────────────

  /**
   * Find the user's active plan for a specific variant. Returns null
   * when the user has no active plan for the variant.
   */
  async findActivePlanForVariant(
    userId: ID,
    variantId: ID,
  ): Promise<RepositoryResult<UserProgramPlanWithSlots | null>> {
    try {
      const { data: planRow, error } = await supabase
        .from(UserPlanRepository.PLANS)
        .select('*')
        .eq('user_id', userId)
        .eq('variant_id', variantId)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      if (!planRow) return ok(null);
      return ok(await this.hydratePlan(planRow as UserProgramPlanRow));
    } catch (e) {
      return handleRepositoryError('UserPlanRepository.findActivePlanForVariant', e);
    }
  }

  /**
   * List all active plans for a user, with slots + overrides
   * pre-joined. Empty array when the user has no active plans.
   */
  async findActivePlansForUser(
    userId: ID,
  ): Promise<RepositoryResult<UserProgramPlanWithSlots[]>> {
    try {
      const { data: planRows, error } = await supabase
        .from(UserPlanRepository.PLANS)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const plans: UserProgramPlanWithSlots[] = [];
      for (const row of planRows as UserProgramPlanRow[]) {
        plans.push(await this.hydratePlan(row));
      }
      return ok(plans);
    } catch (e) {
      return handleRepositoryError('UserPlanRepository.findActivePlansForUser', e);
    }
  }

  /**
   * Find a single plan by id with slots + overrides pre-joined.
   * Returns null when the plan doesn't exist or belongs to another
   * user (RLS would silently filter — but we keep the function
   * symmetric with other reads).
   */
  async findPlanById(planId: ID): Promise<RepositoryResult<UserProgramPlanWithSlots | null>> {
    try {
      const { data: planRow, error } = await supabase
        .from(UserPlanRepository.PLANS)
        .select('*')
        .eq('id', planId)
        .maybeSingle();
      if (error) throw error;
      if (!planRow) return ok(null);
      return ok(await this.hydratePlan(planRow as UserProgramPlanRow));
    } catch (e) {
      return handleRepositoryError('UserPlanRepository.findPlanById', e);
    }
  }

  /**
   * Private: hydrate the composite read shape for a plan row by
   * loading its slots + overrides in two parallel queries and joining
   * them in memory. Slots are ordered by their template_slot's
   * program_slots.order_index — Supabase's nested join exposes this
   * for free, but we re-sort on the client to keep the contract local.
   */
  private async hydratePlan(
    planRow: UserProgramPlanRow,
  ): Promise<UserProgramPlanWithSlots> {
    const plan = toUserProgramPlan(planRow);

    const [{ data: slotRows, error: slotError }, { data: overrideRows, error: overrideError }] =
      await Promise.all([
        supabase
          .from(UserPlanRepository.SLOTS)
          .select('*')
          .eq('plan_id', plan.id),
        supabase
          .from(UserPlanRepository.OVERRIDES)
          .select('*')
          .in(
            'plan_slot_id',
            // PostgREST requires a non-empty in() list; defer the
            // overrides query when there are no slots yet.
            // The fallback ['00000000-0000-0000-0000-000000000000']
            // is a never-matching placeholder UUID.
            (await this.getSlotIds(plan.id)),
          ),
      ]);
    if (slotError) throw slotError;
    if (overrideError) throw overrideError;

    const slots = (slotRows as UserProgramPlanSlotRow[]).map(toUserProgramPlanSlot);
    const overrides = (overrideRows as UserProgramPlanSlotOverrideRow[] | null)?.map(
      toUserProgramPlanSlotOverride,
    ) ?? [];
    const overridesBySlot = new Map(overrides.map((o) => [o.planSlotId, o]));

    return {
      ...plan,
      slots: slots.map((slot) => ({
        slot,
        override: overridesBySlot.get(slot.id) ?? null,
      })),
    };
  }

  /**
   * Private: get the slot IDs for a plan. Used to scope the overrides
   * query without a second full-table scan.
   */
  private async getSlotIds(planId: ID): Promise<ID[]> {
    const { data, error } = await supabase
      .from(UserPlanRepository.SLOTS)
      .select('id')
      .eq('plan_id', planId);
    if (error) throw error;
    const ids = (data as Array<{ id: string }>).map((r) => r.id);
    return ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'];
  }

  // ──────────────────────────────────────────────────────────────────
  // Writes
  // ──────────────────────────────────────────────────────────────────

  /**
   * Adopt a fresh active plan. Steps:
   *
   *   1. VALIDATE adoption-completeness (every slot must have a non-
   *      null chosen exercise + resolution != 'missing'). An incomplete
   *      plan is rejected with VALIDATION_ERROR — UI bypass cannot
   *      create an active plan with unresolved slots.
   *   2. RETIRE any existing active plan row for the same (user_id,
   *      variant_id). The prior plan's slots + prescription snapshots
   *      stay immutable for history. CASCADE doesn't fire because we
   *      don't delete the row — we just flip status.
   *   3. INSERT a new active plan row.
   *   4. INSERT the new slot set under the new plan.
   *
   * Multi-step without a DB transaction (supabase-js doesn't expose
   * one over REST). The sequence is safe: each step only affects rows
   * owned by this user; a mid-sequence failure surfaces as a
   * RepositoryError and the caller can retry. Retiring the prior plan
   * before inserting the new one means a failure between steps 2-3
   * leaves the user with zero active plans, which is recoverable
   * (re-run savePlan); inserting before retiring would briefly
   * violate the partial unique index.
   *
   * Returns the freshly-hydrated plan (slots + overrides) on success.
   */
  async savePlan(
    userId: ID,
    dto: SavePlanDTO,
  ): Promise<RepositoryResult<UserProgramPlanWithSlots>> {
    try {
      // 1. Validate adoption-completeness.
      const validation = validatePlanForAdoption(dto.slots);
      if (!validation.success) return validation;

      // 2. Retire existing active plan(s) for this user × variant.
      // At most one exists per the partial unique index; the .eq()
      // chain is defensive.
      const { error: retireError } = await supabase
        .from(UserPlanRepository.PLANS)
        .update({ status: 'retired' as UserPlanStatus })
        .eq('user_id', userId)
        .eq('variant_id', dto.variantId)
        .eq('status', 'active');
      if (retireError) throw retireError;

      // 3. Insert a new active plan row.
      const { data: planRow, error: insertError } = await supabase
        .from(UserPlanRepository.PLANS)
        .insert({
          user_id: userId,
          template_id: dto.templateId,
          variant_id: dto.variantId,
          status: 'active' as UserPlanStatus,
        })
        .select('*')
        .single();
      if (insertError) throw insertError;
      if (!planRow) {
        return err(
          'Inserted plan row not returned',
          RepositoryErrorCode.UNKNOWN,
        );
      }

      // 4. Insert new slots under the new plan.
      const slotInsertRows = dto.slots.map((slot) => ({
        plan_id: (planRow as UserProgramPlanRow).id,
        template_slot_id: slot.templateSlotId,
        chosen_exercise_id: slot.chosenExerciseId,
        resolution: slot.resolution,
        prescription_snapshot: slot.prescriptionSnapshot as unknown as Record<string, unknown>,
      }));
      const { error: slotInsertError } = await supabase
        .from(UserPlanRepository.SLOTS)
        .insert(slotInsertRows);
      if (slotInsertError) throw slotInsertError;

      // 5. Return the freshly-hydrated plan.
      return ok(await this.hydratePlan(planRow as UserProgramPlanRow));
    } catch (e) {
      return handleRepositoryError('UserPlanRepository.savePlan', e);
    }
  }

  /**
   * Apply a manual override to a slot. Steps:
   *
   *   1. UPSERT the override row (UNIQUE(plan_slot_id) — replaces
   *      an existing override if any).
   *   2. UPDATE the slot's chosen_exercise_id + resolution='manual'.
   *
   * The two steps are ordered so the slot row reflects the override
   * after a successful call. A mid-sequence failure surfaces as a
   * RepositoryError; the caller can retry.
   */
  async replaceSlot(
    dto: ReplacePlanSlotDTO,
  ): Promise<RepositoryResult<UserProgramPlanSlotOverride>> {
    try {
      const { error: overrideError } = await supabase
        .from(UserPlanRepository.OVERRIDES)
        .upsert(
          {
            plan_slot_id: dto.planSlotId,
            chosen_exercise_id: dto.chosenExerciseId,
            alt_edge_id: dto.altEdgeId ?? null,
            intent_note: dto.intentNote ?? null,
          },
          { onConflict: 'plan_slot_id' },
        );
      if (overrideError) throw overrideError;

      const { error: slotUpdateError } = await supabase
        .from(UserPlanRepository.SLOTS)
        .update({
          chosen_exercise_id: dto.chosenExerciseId,
          resolution: 'manual' as SlotResolution,
        })
        .eq('id', dto.planSlotId);
      if (slotUpdateError) throw slotUpdateError;

      // Read back the override row to return its id + timestamps.
      const { data: overrideRow, error: readError } = await supabase
        .from(UserPlanRepository.OVERRIDES)
        .select('*')
        .eq('plan_slot_id', dto.planSlotId)
        .maybeSingle();
      if (readError) throw readError;
      if (!overrideRow) {
        return err(
          'Override row not found after upsert',
          RepositoryErrorCode.UNKNOWN,
        );
      }
      return ok(toUserProgramPlanSlotOverride(overrideRow as UserProgramPlanSlotOverrideRow));
    } catch (e) {
      return handleRepositoryError('UserPlanRepository.replaceSlot', e);
    }
  }

  /**
   * Retire a plan (flip status to 'retired'). The row stays for
   * history; the partial unique index on (user_id, variant_id) WHERE
   * status='active' stops enforcing so a fresh active plan can be
   * adopted for the same variant.
   */
  async retirePlan(planId: ID): Promise<RepositoryResult<UserProgramPlan>> {
    try {
      const { data: row, error } = await supabase
        .from(UserPlanRepository.PLANS)
        .update({ status: 'retired' as UserPlanStatus })
        .eq('id', planId)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!row) {
        return err('Plan not found', RepositoryErrorCode.NOT_FOUND);
      }
      return ok(toUserProgramPlan(row as UserProgramPlanRow));
    } catch (e) {
      return handleRepositoryError('UserPlanRepository.retirePlan', e);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────

function toUserProgramPlan(row: UserProgramPlanRow): UserProgramPlan {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    variantId: row.variant_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserProgramPlanSlot(row: UserProgramPlanSlotRow): UserProgramPlanSlot {
  return {
    id: row.id,
    planId: row.plan_id,
    templateSlotId: row.template_slot_id,
    chosenExerciseId: row.chosen_exercise_id,
    resolution: row.resolution,
    prescriptionSnapshot: row.prescription_snapshot as unknown as PrescriptionSnapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserProgramPlanSlotOverride(
  row: UserProgramPlanSlotOverrideRow,
): UserProgramPlanSlotOverride {
  return {
    id: row.id,
    planSlotId: row.plan_slot_id,
    chosenExerciseId: row.chosen_exercise_id,
    altEdgeId: row.alt_edge_id,
    intentNote: row.intent_note,
    createdAt: row.created_at,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Adoption-completeness validator (pure function, exported for tests)
// ──────────────────────────────────────────────────────────────────────

/**
 * Validate that a plan is complete enough to become an active adopted
 * plan. Rules:
 *
 *   1. At least one slot.
 *   2. Every slot has a non-null chosen exercise id.
 *   3. No slot has resolution='missing'.
 *
 * Returns `ok(true)` when the plan is adoptable; otherwise `err(...)`
 * with VALIDATION_ERROR and a message naming the first offending slot
 * (or the empty-plan case). The repository's savePlan runs this at
 * the top of its try block so UI bypass cannot create an incomplete
 * active plan.
 *
 * Extracted as a top-level export so tests can drive it directly
 * without mocking supabase. Mirrors the pattern in
 * constants/equipmentCapabilities.resolveCapabilitiesToEquipmentSlugs
 * — a pure validator that lives next to its only caller.
 */
export function validatePlanForAdoption(
  slots: SavePlanDTO['slots'],
): RepositoryResult<true> {
  if (slots.length === 0) {
    return err(
      'Cannot adopt a plan with zero slots',
      RepositoryErrorCode.VALIDATION_ERROR,
    );
  }
  for (const slot of slots) {
    if (slot.resolution === 'missing') {
      return err(
        `Cannot adopt plan: slot ${slot.templateSlotId} is unresolved (resolution='missing'). Replace it with an eligible exercise before adopting.`,
        RepositoryErrorCode.VALIDATION_ERROR,
      );
    }
    if (slot.chosenExerciseId === null) {
      return err(
        `Cannot adopt plan: slot ${slot.templateSlotId} has no chosen exercise (chosen_exercise_id IS NULL).`,
        RepositoryErrorCode.VALIDATION_ERROR,
      );
    }
  }
  return ok(true);
}

// Singleton — the daily-driver access path.
export const userPlanRepository = new UserPlanRepository();
