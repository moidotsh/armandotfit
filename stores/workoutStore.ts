// stores/workoutStore.ts
// Active session state. The draft PERSISTS locally (SE2: non-secret
// ephemeral workout state) so a reload, an OS kill, or a dead zone
// mid-gym never loses a live session — the constitutional SE2 claim,
// now true. On completion, the useLogSession mutation flushes it to
// the DB (offline FINISH rides the session save queue). The 5 SECTION
// markers below are load-bearing: audit-state (D10) flags any Zustand
// store missing them.

// =============================================================================
// SECTION: Loading
// isSaving — true while the logSession mutation is in flight.
// =============================================================================

// =============================================================================
// SECTION: Error
// sessionError — last in-session error (save failure, set-add failure).
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — session UI doesn't use modals.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// selectedExerciseLocalId — which exercise the user is currently logging.
// =============================================================================

// =============================================================================
// SECTION: UI
// draft — the in-progress session (header + exercises + sets). Reset to
// null after a successful save. sessionStartedAt drives the live timer.
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import type { SessionMode } from '../constants';
import type { LoggedExerciseInputDTO, LogSessionDTO, PreferredSplit } from '../shared/types';
import type { ExerciseKey, ResolvedSlot } from '../shared/exercises/splits';
import { SYSTEM_EXERCISES_BY_SLUG } from '../shared/exercises/data';

/** Client-only draft set (no server id yet). */
export interface DraftSet {
  localId: string;
  position: number;
  reps: number | null;
  weight: number | null;
  note: string | null;
}

/** Client-only draft exercise (no server id yet). */
export interface DraftExercise {
  localId: string;
  /** data.ts catalog slug — display lookup key ('' for ad-hoc adds).
   *  Plain string: swaps can bring in any catalog entry, not just the
   *  26 split keys the ExerciseKey union covers. */
  exerciseSlug: string;
  /** Coarse identity name — the join key used at save time. */
  exerciseName: string;
  position: number;
  tags: string[];
  /** Programmed Rx label (e.g. '3 × 8–10') — display only, never saved. */
  targetRx: string | null;
  note: string | null;
  sets: DraftSet[];
}

/** Client-only draft session (no server id yet). */
export interface DraftSession {
  date: string;
  /** Client-side picker context — not persisted. */
  splitType: PreferredSplit;
  /** Day-of-split 1..4 — persisted as sessions.split_day. */
  day: number;
  /** AM vs PM — planning-time context for twoADay; not persisted. */
  sessionMode: SessionMode;
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
    sessionMode?: SessionMode;
  }) => void;
  addExerciseToDraft: (exercise: {
    exerciseName: string;
    exerciseSlug?: string;
    targetRx?: string | null;
  }) => string;
  /**
   * Bulk-populate the draft from the program's split slots. Pre-fills
   * each exercise with its suggested tags + Rx label + an empty set row
   * per programmed set. The caller MUST guard with
   * `draft.exercises.length === 0` — this overwrites unconditionally.
   */
  hydrateFromSplit: (slots: ResolvedSlot[]) => void;
  removeExerciseFromDraft: (localId: string) => void;
  addSetToDraft: (exerciseLocalId: string, partial?: Partial<DraftSet>) => string;
  updateSetInDraft: (exerciseLocalId: string, setLocalId: string, patch: Partial<DraftSet>) => void;
  removeSetFromDraft: (exerciseLocalId: string, setLocalId: string) => void;
  setDraftNotes: (notes: string | null) => void;
  /** Toggle a tag on a draft exercise (add if absent, remove if present). */
  toggleDraftExerciseTag: (exerciseLocalId: string, tag: string) => void;
  /** Replace a draft exercise's tags wholesale (last-used prefill). */
  setDraftExerciseTags: (exerciseLocalId: string, tags: string[]) => void;
  /**
   * Swap a draft exercise's IDENTITY in place (session-time
   * substitution): position, Rx label, and logged set rows survive;
   * the name/slug swap and tags reset (the slot's suggested tags were
   * for the original exercise). Ephemeral by design — the program
   * itself never changes.
   */
  swapDraftExercise: (
    exerciseLocalId: string,
    next: { exerciseName: string; exerciseSlug: string }
  ) => void;
  setDraftExerciseNote: (exerciseLocalId: string, note: string | null) => void;
  toLogSessionDTO: () => LogSessionDTO | null;
  resetSession: () => void;
}

const newLocalId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Rx label from a programmed slot: '3 × 8–10' (uses sets max). */
function rxLabel(slot: ResolvedSlot): string {
  const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
  return `${sets} × ${slot.reps[0]}–${slot.reps[1]}`;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
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

      startSession: ({ date, splitType, day, sessionMode = 'am' }) => {
        const startedAt = new Date().toISOString();
        const draft: DraftSession = {
          date: date ?? startedAt,
          splitType,
          day,
          sessionMode,
          notes: null,
          exercises: [],
        };
        set({
          draft,
          sessionStartedAt: startedAt,
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
          exerciseSlug: exercise.exerciseSlug ?? '',
          exerciseName: exercise.exerciseName,
          position: draft.exercises.length + 1,
          tags: [],
          targetRx: exercise.targetRx ?? null,
          note: null,
          sets: [],
        };
        set({
          draft: { ...draft, exercises: [...draft.exercises, next] },
          selectedExerciseLocalId: localId,
        });
        return localId;
      },

      hydrateFromSplit: (slots) => {
        const draft = get().draft;
        if (!draft) return;
        const exercises: DraftExercise[] = slots.map((slot, i) => {
          const catalog = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
          return {
            localId: newLocalId(),
            exerciseSlug: slot.exercise,
            exerciseName: catalog?.name ?? slot.exercise,
            position: i + 1,
            tags: [...slot.suggestedTags],
            targetRx: rxLabel(slot),
            note: null,
            // The armed-set model: a draft set row exists ONLY once logged
            // (the stage's armed slab is the "next set" — it commits rows,
            // it does not pre-create them). The programmed count rides
            // targetRx for progress reads.
            sets: [],
          };
        });
        set({
          draft: { ...draft, exercises },
          selectedExerciseLocalId: exercises[0]?.localId ?? null,
        });
      },

      removeExerciseFromDraft: (localId) => {
        const draft = get().draft;
        if (!draft) return;
        const filtered = draft.exercises
          .filter((e) => e.localId !== localId)
          .map((e, i) => ({ ...e, position: i + 1 }));
        set({
          draft: { ...draft, exercises: filtered },
          selectedExerciseLocalId:
            get().selectedExerciseLocalId === localId
              ? (filtered[0]?.localId ?? null)
              : get().selectedExerciseLocalId,
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
          position: exercise.sets.length + 1,
          reps: partial?.reps ?? null,
          weight: partial?.weight ?? null,
          note: partial?.note ?? null,
        };
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) =>
              e.localId === exerciseLocalId ? { ...e, sets: [...e.sets, nextSet] } : e
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
                    sets: e.sets.map((s) => (s.localId === setLocalId ? { ...s, ...patch } : s)),
                  }
                : e
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
                      .map((s, i) => ({ ...s, position: i + 1 })),
                  }
                : e
            ),
          },
        });
      },

      setDraftNotes: (notes) => {
        const draft = get().draft;
        if (!draft) return;
        set({ draft: { ...draft, notes } });
      },

      swapDraftExercise: (exerciseLocalId, next) => {
        const draft = get().draft;
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) =>
              e.localId === exerciseLocalId
                ? {
                    ...e,
                    exerciseName: next.exerciseName,
                    exerciseSlug: next.exerciseSlug,
                    tags: [],
                  }
                : e
            ),
          },
        });
      },

      setDraftExerciseTags: (exerciseLocalId, tags) => {
        const draft = get().draft;
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) =>
              e.localId === exerciseLocalId ? { ...e, tags } : e
            ),
          },
        });
      },

      toggleDraftExerciseTag: (exerciseLocalId, tag) => {
        const draft = get().draft;
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) =>
              e.localId === exerciseLocalId
                ? {
                    ...e,
                    tags: e.tags.includes(tag) ? e.tags.filter((t) => t !== tag) : [...e.tags, tag],
                  }
                : e
            ),
          },
        });
      },

      setDraftExerciseNote: (exerciseLocalId, note) => {
        const draft = get().draft;
        if (!draft) return;
        set({
          draft: {
            ...draft,
            exercises: draft.exercises.map((e) =>
              e.localId === exerciseLocalId ? { ...e, note } : e
            ),
          },
        });
      },

      toLogSessionDTO: (): LogSessionDTO | null => {
        const draft = get().draft;
        if (!draft) return null;
        // Only sets with both reps + weight filled are logged — a row IS a
        // completed set, so half-filled rows are dropped, not saved as nulls.
        const exercises: LoggedExerciseInputDTO[] = draft.exercises.map((e) => ({
          exerciseName: e.exerciseName,
          position: e.position,
          tags: e.tags,
          note: e.note,
          sets: e.sets
            .filter(
              (s): s is DraftSet & { reps: number; weight: number } =>
                s.reps !== null && s.weight !== null
            )
            .map((s) => ({ reps: s.reps, weight: s.weight, note: s.note })),
        }));
        return {
          startedAt: draft.date,
          splitDay: draft.day,
          note: draft.notes,
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
    }),
    {
      name: 'armandotfit:session-draft',
      storage: createJSONStorage(() => zustandStorage),
      // The session itself survives; loading/error/selection-pending
      // state does not. selectedExerciseLocalId rides along so a
      // restored draft reopens at the station the user was logging.
      partialize: (state) => ({
        draft: state.draft,
        sessionStartedAt: state.sessionStartedAt,
        isSessionActive: state.isSessionActive,
        selectedExerciseLocalId: state.selectedExerciseLocalId,
      }),
    }
  )
);
