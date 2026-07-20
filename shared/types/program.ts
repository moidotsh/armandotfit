// shared/types/program.ts
// Domain types for the program-template hierarchy (migration
// 20260721000001) and the catalog-extension tables (migration
// 20260721000000). Owned by ProgramRepository (program hierarchy) +
// ExerciseRepository (catalog extension, read surface added in a later
// phase). Read-only for authenticated users — writes go through the
// service role / migrations only.

import type { ID, Timestamps } from './api';

// ──────────────────────────────────────────────────────────────────────
// Program-template hierarchy (5 tables)
// ──────────────────────────────────────────────────────────────────────

/** Mirrors program_templates.status CHECK constraint. */
export type ProgramTemplateStatus = 'draft' | 'active' | 'retired';

export interface ProgramTemplate extends Timestamps {
  id: ID;
  slug: string;
  name: string;
  description: string | null;
  goal: string | null;
  /** Slug of the variant the template recommends for new adopters. */
  defaultVariantSlug: string | null;
  version: number;
  status: ProgramTemplateStatus;
  displayOrder: number | null;
}

/** Mirrors program_schedule_variants.session_window_pattern CHECK. */
export type SessionWindowPattern = 'single' | 'am-pm';

/** Mirrors program_schedule_variants.status CHECK. */
export type ProgramVariantStatus = 'draft' | 'active' | 'retired';

export interface ProgramScheduleVariant extends Timestamps {
  id: ID;
  programTemplateId: ID;
  slug: string;
  name: string;
  description: string | null;
  sessionWindowPattern: SessionWindowPattern;
  cycleLengthDays: number;
  version: number;
  status: ProgramVariantStatus;
  displayOrder: number | null;
}

export interface ProgramDay {
  id: ID;
  programVariantId: ID;
  dayIndex: number;
  title: string;
  createdAt: string;
}

/** Mirrors program_sessions.session_window CHECK. */
export type SessionWindow = 'am' | 'pm' | 'single';

export interface ProgramSession {
  id: ID;
  programDayId: ID;
  sessionWindow: SessionWindow;
  label: string;
  orderIndex: number;
  createdAt: string;
}

/**
 * One exercise entry in a session, carrying structured prescription.
 * exerciseId is a real FK to exercises.id (RESTRICT on delete). Slot
 * prescriptions seed the active-session draft's set rows.
 */
export interface ProgramSlot {
  id: ID;
  programSessionId: ID;
  exerciseId: ID;
  /** Stable catalog slug resolved from exerciseId. Joined on read. */
  exerciseSlug: string | null;
  orderIndex: number;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  perSide: boolean;
  slotNotes: string | null;
  createdAt: string;
}

/**
 * Composite read shape: a session with its ordered slots and resolved
 * exercise slugs, ready for the active-session hydration path.
 */
export interface ProgramSessionWithSlots {
  session: ProgramSession;
  slots: ProgramSlot[];
}

/**
 * Composite read shape: a variant with its full day/session/slot tree.
 * The repository's findVariant method returns this when callers need
 * the whole structure (e.g. split-preview surface).
 */
export interface ProgramVariantTree {
  variant: ProgramScheduleVariant;
  days: Array<{
    day: ProgramDay;
    sessions: ProgramSessionWithSlots[];
  }>;
}

// ──────────────────────────────────────────────────────────────────────
// Catalog extension tables (migration 20260721000000)
// ──────────────────────────────────────────────────────────────────────
// Type definitions for the six catalog-extension tables. The read
// surface (repository methods + ExerciseWithRelations extensions) is
// Phase 2 work; these types land now so the seed file is typed and the
// substitution algorithm has a target shape.

/** Mirrors exercises.laterality CHECK. */
export type ExerciseLaterality = 'bilateral' | 'unilateral' | 'either';

/** Movement-pattern family (substitution intent, not anatomical). */
export interface ExerciseFamily {
  id: ID;
  slug: string;
  name: string;
  displayName: string;
  createdAt: string;
}

/** Mirrors exercise_cues.cue_type CHECK. */
export type ExerciseCueType = 'setup' | 'execution' | 'common-mistake';

export interface ExerciseCue {
  id: ID;
  exerciseId: ID;
  cueText: string;
  cueType: ExerciseCueType;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ExerciseGripOption {
  id: ID;
  exerciseId: ID;
  gripSlug: string;
  attachmentSlug: string | null;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

/**
 * One complete way to perform an exercise. Paths are OR-across —
 * satisfying any complete path makes the exercise eligible.
 */
export interface ExerciseEquipmentRequirementPath {
  id: ID;
  exerciseId: ID;
  pathIndex: number;
  rationale: string | null;
  createdAt: string;
}

/**
 * One AND-within-path node. All requirements in a path must be
 * satisfied for the path to be eligible.
 */
export interface ExerciseEquipmentRequirement {
  id: ID;
  requirementPathId: ID;
  equipmentTypeId: ID;
  minQuantity: number;
  createdAt: string;
}

/** Mirrors exercise_alternatives.alt_type CHECK. */
export type AlternativeType = 'direct' | 'close' | 'fallback';

/**
 * Directional substitution edge. source → alt with a tier label and
 * priority. Symmetric relationships require two rows.
 */
export interface ExerciseAlternative {
  id: ID;
  sourceExerciseId: ID;
  altExerciseId: ID;
  altType: AlternativeType;
  priority: number;
  intentNote: string | null;
  createdAt: string;
}
