// stores/workoutStore.ts
// Active workout-session state. Ephemeral — NOT persisted. The draft
// lives in memory while the user is logging; on completion, the
// useLogWorkout mutation flushes it to the DB. The 5 SECTION markers
// below are load-bearing: audit-state (D10) flags any Zustand store
// missing them.

// =============================================================================
// SECTION: Loading
// isSaving — true while the logWorkout mutation is in flight. UI uses
// this to disable the save button + show a spinner.
// =============================================================================

// =============================================================================
// SECTION: Error
// sessionError — last in-session error (save failure, set-add failure).
// Cleared on the next attempt.
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — workout-session UI doesn't use modals.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// selectedExerciseLocalId — which exercise the user is currently logging.
// Null when no exercise is selected (rare — usually the first exercise is
// auto-selected on add).
// =============================================================================

// =============================================================================
// SECTION: UI
// draft — the in-progress session (header + exercises + sets). Reset to
// null after a successful save.
// sessionStartedAt — ISO timestamp; drives the live duration counter.
// isSessionActive — convenience boolean (=== draft !== null).
// =============================================================================

import { create } from 'zustand';
import type {
  ExerciseSetInputDTO,
  ID,
  LogWorkoutDTO,
  PreferredSplit,
  WorkoutSessionExerciseInputDTO,
} from '../shared/types';

/** Client-only draft set (no server id yet). */
export interface DraftSet {
  localId: string;
  setNumber: number;
  targetReps: number | null;
  actualReps: number | null;
  weight: number | null;
  repRange: string | null;
  restDurationSeconds: number | null;
  notes: string | null;
  completed: boolean;
}

/** Client-only draft exercise (no server id yet). */
export interface DraftExercise {
  localId: string;
  exerciseId: ID;
  exerciseName: string; // denormalized for UI display without a join
  orderInWorkout: number;
  userGrip: string | null;
  userEquipmentNotes: string | null;
  targetRepRange: string | null;
  restTimerSeconds: number;
  notes: string | null;
  sets: DraftSet[];
}

/** Client-only draft session (no server id yet). */
export interface DraftSession {
  date: string;
  splitType: PreferredSplit;
  day: number;
  duration: number;
  notes: string | null;
  exercises: DraftExercise[];
}

interface WorkoutState {
  // SECTION: Loading
  isSaving: boolean;
  setSaving: (saving: boolean) => void;

  // SECTION: Error
  sessionError: string | null;
  setSessionError: (error: string | null) => void;

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedExerciseLocalId: string | null;
  selectExercise: (localId: string | null) => void;

  // SECTION: UI
  draft: DraftSession | null;
  sessionStartedAt: string | null;
  isSessionActive: boolean;
  startSession: (init: {
    date?: string;
    splitType: PreferredSplit;
    day: number;
  }) => void;
  addExerciseToDraft: (exercise: {
    exerciseId: ID;
    exerciseName: string;
    targetRepRange?: string | null;
    restTimerSeconds?: number;
  }) => string; // returns the new draft's localId
  /**
   * Bulk-populate the draft from the suggested-exercises source. Creates
   * each exercise with its default sets pre-populated at the exercise's
   * default rep range. The caller MUST guard with `draft.exercises.length
   * === 0` — this method overwrites draft.exercises unconditionally so
   * that re-runs after a partial manual edit don't double-add. Idempotency
   * lives at the call site, not here.
   */
  hydrateSuggestedExercises: (suggested: Array<{
    exerciseId: ID;
    exerciseName: string;
    variation?: string | null;
    defaultSets: number;
    defaultReps: [number, number];
    restTimerSeconds?: number;
  }>) => void;
  removeExerciseFromDraft: (localId: string) => void;
  addSetToDraft: (
    exerciseLocalId: string,
    partial?: Partial<DraftSet>,
  ) => string; // returns the new set's localId
  updateSetInDraft: (
    exerciseLocalId: string,
    setLocalId: string,
    patch: Partial<DraftSet>,
  ) => void;
  removeSetFromDraft: (exerciseLocalId: string, setLocalId: string) => void;
  setDraftNotes: (notes: string | null) => void;
  setDraftDuration: (durationMinutes: number) => void;
  toLogWorkoutDTO: () => LogWorkoutDTO | null;
  resetSession: () => void;
}

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // SECTION: Loading
  isSaving: false,
  setSaving: (saving) => set({ isSaving: saving }),

  // SECTION: Error
  sessionError: null,
  setSessionError: (error) => set({ sessionError: error }),

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedExerciseLocalId: null,
  selectExercise: (localId) => set({ selectedExerciseLocalId: localId }),

  // SECTION: UI
  draft: null,
  sessionStartedAt: null,
  isSessionActive: false,

  startSession: ({ date, splitType, day }) => {
    const draft: DraftSession = {
      date: date ?? new Date().toISOString(),
      splitType,
      day,
      duration: 0,
      notes: null,
      exercises: [],
    };
    set({
      draft,
      sessionStartedAt: new Date().toISOString(),
      isSessionActive: true,
      selectedExerciseLocalId: null,
      sessionError: null,
    });
  },

  addExerciseToDraft: (exercise) => {
    const draft = get().draft;
    if (!draft) return '';
    const localId = newLocalId();
    const next: DraftExercise = {
      localId,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      orderInWorkout: draft.exercises.length + 1,
      userGrip: null,
      userEquipmentNotes: null,
      targetRepRange: exercise.targetRepRange ?? null,
      restTimerSeconds: exercise.restTimerSeconds ?? 60,
      notes: null,
      sets: [],
    };
    set({
      draft: { ...draft, exercises: [...draft.exercises, next] },
      selectedExerciseLocalId: localId,
    });
    return localId;
  },

  removeExerciseFromDraft: (localId) => {
    const draft = get().draft;
    if (!draft) return;
    const filtered = draft.exercises
      .filter((e) => e.localId !== localId)
      .map((e, i) => ({ ...e, orderInWorkout: i + 1 }));
    set({
      draft: { ...draft, exercises: filtered },
      selectedExerciseLocalId:
        get().selectedExerciseLocalId === localId
          ? filtered[0]?.localId ?? null
          : get().selectedExerciseLocalId,
    });
  },

  hydrateSuggestedExercises: (suggested) => {
    const draft = get().draft;
    if (!draft) return;
    const exercises: DraftExercise[] = suggested.map((s, i) => {
      const exerciseLocalId = newLocalId();
      const repRange = `${s.defaultReps[0]}-${s.defaultReps[1]}`;
      const sets: DraftSet[] = Array.from({ length: s.defaultSets }, (_, idx) => ({
        localId: newLocalId(),
        setNumber: idx + 1,
        targetReps: null,
        actualReps: null,
        weight: null,
        repRange,
        restDurationSeconds: null,
        notes: null,
        completed: false,
      }));
      const next: DraftExercise = {
        localId: exerciseLocalId,
        exerciseId: s.exerciseId,
        exerciseName: s.variation
          ? `${s.exerciseName} · ${s.variation}`
          : s.exerciseName,
        orderInWorkout: i + 1,
        userGrip: null,
        userEquipmentNotes: null,
        targetRepRange: repRange,
        restTimerSeconds: s.restTimerSeconds ?? 60,
        notes: null,
        sets,
      };
      return next;
    });
    set({
      draft: { ...draft, exercises },
      selectedExerciseLocalId: exercises[0]?.localId ?? null,
    });
  },

  addSetToDraft: (exerciseLocalId, partial) => {
    const draft = get().draft;
    if (!draft) return '';
    const exercise = draft.exercises.find((e) => e.localId === exerciseLocalId);
    if (!exercise) return '';
    const localId = newLocalId();
    const nextSet: DraftSet = {
      localId,
      setNumber: exercise.sets.length + 1,
      targetReps: partial?.targetReps ?? null,
      actualReps: partial?.actualReps ?? null,
      weight: partial?.weight ?? null,
      repRange: partial?.repRange ?? null,
      restDurationSeconds: partial?.restDurationSeconds ?? null,
      notes: partial?.notes ?? null,
      completed: partial?.completed ?? false,
    };
    set({
      draft: {
        ...draft,
        exercises: draft.exercises.map((e) =>
          e.localId === exerciseLocalId
            ? { ...e, sets: [...e.sets, nextSet] }
            : e,
        ),
      },
    });
    return localId;
  },

  updateSetInDraft: (exerciseLocalId, setLocalId, patch) => {
    const draft = get().draft;
    if (!draft) return;
    set({
      draft: {
        ...draft,
        exercises: draft.exercises.map((e) =>
          e.localId === exerciseLocalId
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.localId === setLocalId ? { ...s, ...patch } : s,
                ),
              }
            : e,
        ),
      },
    });
  },

  removeSetFromDraft: (exerciseLocalId, setLocalId) => {
    const draft = get().draft;
    if (!draft) return;
    set({
      draft: {
        ...draft,
        exercises: draft.exercises.map((e) =>
          e.localId === exerciseLocalId
            ? {
                ...e,
                sets: e.sets
                  .filter((s) => s.localId !== setLocalId)
                  .map((s, i) => ({ ...s, setNumber: i + 1 })),
              }
            : e,
        ),
      },
    });
  },

  setDraftNotes: (notes) => {
    const draft = get().draft;
    if (!draft) return;
    set({ draft: { ...draft, notes } });
  },

  setDraftDuration: (duration) => {
    const draft = get().draft;
    if (!draft) return;
    set({ draft: { ...draft, duration } });
  },

  toLogWorkoutDTO: (): LogWorkoutDTO | null => {
    const draft = get().draft;
    if (!draft) return null;
    const exercises: WorkoutSessionExerciseInputDTO[] = draft.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      orderInWorkout: e.orderInWorkout,
      userGrip: e.userGrip,
      userEquipmentNotes: e.userEquipmentNotes,
      targetRepRange: e.targetRepRange,
      restTimerSeconds: e.restTimerSeconds,
      notes: e.notes,
      sets: e.sets.map((s): ExerciseSetInputDTO => ({
        setNumber: s.setNumber,
        targetReps: s.targetReps,
        actualReps: s.actualReps,
        weight: s.weight,
        repRange: s.repRange,
        restDurationSeconds: s.restDurationSeconds,
        notes: s.notes,
      })),
    }));
    return {
      date: draft.date,
      splitType: draft.splitType,
      day: draft.day,
      duration: draft.duration,
      notes: draft.notes,
      exercises,
    };
  },

  resetSession: () =>
    set({
      draft: null,
      sessionStartedAt: null,
      isSessionActive: false,
      selectedExerciseLocalId: null,
      sessionError: null,
      isSaving: false,
    }),
}));
