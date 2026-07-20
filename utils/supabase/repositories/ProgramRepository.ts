// utils/supabase/repositories/ProgramRepository.ts
// Read-only repository over the program-template hierarchy
// (program_templates → program_schedule_variants → program_days →
// program_sessions → program_slots). Writes are migration-only — RLS
// grants authenticated users just SELECT on every table in the tree.
//
// Phase 1 read surface: find a template by slug, find a variant (with
// its day/session/slot tree) by slug, find slots for a single session.
// Phase 2+ will add plan-materialization methods that snapshot a
// variant into a user-owned plan; those belong here when they land.

import { supabase } from '../client';
import {
  type RepositoryResult,
  ok,
  handleRepositoryError,
} from './types';
import type {
  ProgramTemplate,
  ProgramScheduleVariant,
  ProgramDay,
  ProgramSession,
  ProgramSlot,
  ProgramVariantTree,
  ProgramSessionWithSlots,
  ID,
} from '../../../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Row shapes (snake_case from Postgres → camelCase in mappers)
// ──────────────────────────────────────────────────────────────────────

interface ProgramTemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  goal: string | null;
  default_variant_slug: string | null;
  version: number;
  status: 'draft' | 'active' | 'retired';
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

interface ProgramVariantRow {
  id: string;
  program_template_id: string;
  slug: string;
  name: string;
  description: string | null;
  session_window_pattern: 'single' | 'am-pm';
  cycle_length_days: number;
  version: number;
  status: 'draft' | 'active' | 'retired';
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

interface ProgramDayRow {
  id: string;
  program_variant_id: string;
  day_index: number;
  title: string;
  created_at: string;
}

interface ProgramSessionRow {
  id: string;
  program_day_id: string;
  session_window: 'am' | 'pm' | 'single';
  label: string;
  order_index: number;
  created_at: string;
}

interface ProgramSlotRow {
  id: string;
  program_session_id: string;
  exercise_id: string;
  order_index: number;
  sets_min: number;
  sets_max: number;
  reps_min: number;
  reps_max: number;
  per_side: boolean;
  slot_notes: string | null;
  created_at: string;
}

/** Slot row joined with exercises.slug for the convenience read path. */
interface ProgramSlotWithSlugRow extends ProgramSlotRow {
  exercise_slug: string | null;
}

// ──────────────────────────────────────────────────────────────────────
// Mappers (snake_case → camelCase)
// ──────────────────────────────────────────────────────────────────────

function mapTemplate(r: ProgramTemplateRow): ProgramTemplate {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    goal: r.goal,
    defaultVariantSlug: r.default_variant_slug,
    version: r.version,
    status: r.status,
    displayOrder: r.display_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapVariant(r: ProgramVariantRow): ProgramScheduleVariant {
  return {
    id: r.id,
    programTemplateId: r.program_template_id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    sessionWindowPattern: r.session_window_pattern,
    cycleLengthDays: r.cycle_length_days,
    version: r.version,
    status: r.status,
    displayOrder: r.display_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapDay(r: ProgramDayRow): ProgramDay {
  return {
    id: r.id,
    programVariantId: r.program_variant_id,
    dayIndex: r.day_index,
    title: r.title,
    createdAt: r.created_at,
  };
}

function mapSession(r: ProgramSessionRow): ProgramSession {
  return {
    id: r.id,
    programDayId: r.program_day_id,
    sessionWindow: r.session_window,
    label: r.label,
    orderIndex: r.order_index,
    createdAt: r.created_at,
  };
}

function mapSlot(r: ProgramSlotWithSlugRow): ProgramSlot {
  return {
    id: r.id,
    programSessionId: r.program_session_id,
    exerciseId: r.exercise_id,
    exerciseSlug: r.exercise_slug,
    orderIndex: r.order_index,
    setsMin: r.sets_min,
    setsMax: r.sets_max,
    repsMin: r.reps_min,
    repsMax: r.reps_max,
    perSide: r.per_side,
    slotNotes: r.slot_notes,
    createdAt: r.created_at,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────────────────────────────

/**
 * ProgramRepository — read-only accessor for the program-template
 * hierarchy. Doesn't extend BaseRepository because writes are
 * migration-only (RLS denies authenticated writes).
 */
export class ProgramRepository {
  /**
   * Find a template by its unique slug (e.g.
   * 'arman-fit-commercial-gym-v1'). Returns null when the slug matches
   * no row — callers decide whether that's an error.
   */
  async findTemplateBySlug(slug: string): Promise<RepositoryResult<ProgramTemplate | null>> {
    try {
      const { data, error } = await supabase
        .from('program_templates')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? mapTemplate(data as ProgramTemplateRow) : null);
    } catch (e) {
      return handleRepositoryError('ProgramRepository.findTemplateBySlug', e);
    }
  }

  /**
   * Find a variant by its globally-unique slug (e.g.
   * 'arman-fit-commercial-gym-v1__one-a-day') and return its full
   * day/session/slot tree. Slots carry the resolved exercise slug so
   * the hydration path doesn't need a second lookup.
   */
  async findVariantTree(slug: string): Promise<RepositoryResult<ProgramVariantTree | null>> {
    try {
      const { data: variantRow, error: variantError } = await supabase
        .from('program_schedule_variants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (variantError) throw variantError;
      if (!variantRow) return ok(null);
      const variant = mapVariant(variantRow as ProgramVariantRow);

      const { data: dayRows, error: dayError } = await supabase
        .from('program_days')
        .select('*')
        .eq('program_variant_id', variant.id)
        .order('day_index', { ascending: true });
      if (dayError) throw dayError;
      const days = (dayRows as ProgramDayRow[]).map(mapDay);

      const { data: sessionRows, error: sessionError } = await supabase
        .from('program_sessions')
        .select('*')
        .in('program_day_id', days.map((d) => d.id))
        .order('order_index', { ascending: true });
      if (sessionError) throw sessionError;
      const sessions = (sessionRows as ProgramSessionRow[]).map(mapSession);

      const { data: slotRows, error: slotError } = await supabase
        .from('program_slots')
        .select('*, exercise_slug:exercises(slug)')
        .in('program_session_id', sessions.map((s) => s.id))
        .order('order_index', { ascending: true });
      if (slotError) throw slotError;

      // PostgREST returns the joined exercises.slug as an object on
      // each row — flatten it to a top-level exercise_slug string so
      // the mapper sees the shape it expects.
      const flatSlotRows = (slotRows as unknown as Array<ProgramSlotRow & { exercise_slug: { slug: string } | null }>).map(
        (r) => ({
          ...r,
          exercise_slug: r.exercise_slug?.slug ?? null,
        }),
      ) as ProgramSlotWithSlugRow[];
      const slotsBySession = new Map<ID, ProgramSlot[]>();
      for (const slot of flatSlotRows.map(mapSlot)) {
        const list = slotsBySession.get(slot.programSessionId) ?? [];
        list.push(slot);
        slotsBySession.set(slot.programSessionId, list);
      }

      const sessionsByDay = new Map<ID, ProgramSession[]>();
      for (const session of sessions) {
        const list = sessionsByDay.get(session.programDayId) ?? [];
        list.push(session);
        sessionsByDay.set(session.programDayId, list);
      }

      const tree: ProgramVariantTree = {
        variant,
        days: days.map((day) => ({
          day,
          sessions: (sessionsByDay.get(day.id) ?? []).map((session) => ({
            session,
            slots: slotsBySession.get(session.id) ?? [],
          })),
        })),
      };
      return ok(tree);
    } catch (e) {
      return handleRepositoryError('ProgramRepository.findVariantTree', e);
    }
  }

  /**
   * Find all slots for a single session, ordered by slot order_index.
   * Used by the active-session hydration path when the user starts a
   * specific day/window. Each slot carries the resolved exercise slug.
   */
  async findSlotsForSession(sessionId: ID): Promise<RepositoryResult<ProgramSessionWithSlots | null>> {
    try {
      const { data: sessionRow, error: sessionError } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
      if (sessionError) throw sessionError;
      if (!sessionRow) return ok(null);
      const session = mapSession(sessionRow as ProgramSessionRow);

      const { data: slotRows, error: slotError } = await supabase
        .from('program_slots')
        .select('*, exercise_slug:exercises(slug)')
        .eq('program_session_id', sessionId)
        .order('order_index', { ascending: true });
      if (slotError) throw slotError;

      const flatSlotRows = (slotRows as unknown as Array<ProgramSlotRow & { exercise_slug: { slug: string } | null }>).map(
        (r) => ({
          ...r,
          exercise_slug: r.exercise_slug?.slug ?? null,
        }),
      ) as ProgramSlotWithSlugRow[];

      return ok({ session, slots: flatSlotRows.map(mapSlot) });
    } catch (e) {
      return handleRepositoryError('ProgramRepository.findSlotsForSession', e);
    }
  }
}

// Singleton — the daily-driver access path.
export const programRepository = new ProgramRepository();
