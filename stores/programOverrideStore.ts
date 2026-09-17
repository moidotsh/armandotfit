// stores/programOverrideStore.ts
// Standing per-slot program substitutions ("this gym has no leg
// press"). Persisted client-side; the authored program in splits.ts is
// never modified. Promoted from candidate to built by owner decision
// (2026-10-17) — the swap flow existed first; repeated same-swaps were
// the anticipated trigger.
//
// The 5 SECTION markers below are load-bearing: audit-state (D10)
// flags any Zustand store missing them.

// =============================================================================
// SECTION: Loading
// (No loading state — persisted preferences resolve synchronously.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — the persist middleware falls back to defaults.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — the swap sheet is screen-owned.)
// =============================================================================

// SECTION: Selection
// selectedSlotKey — which program slot's swap sheet is open (screen
// convenience; drives the single mounted SwapExerciseSheet).
// =============================================================================

// =============================================================================
// SECTION: UI
// overrides — slotKey → the standing substitution (catalog slug + name).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

export interface ProgramOverride {
  slug: string;
  name: string;
}

interface ProgramOverrideState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedSlotKey: string | null;
  selectSlot: (key: string | null) => void;

  // SECTION: UI
  overrides: Record<string, ProgramOverride>;
  setOverride: (key: string, next: ProgramOverride) => void;
  clearOverride: (key: string) => void;
}

export const useProgramOverrideStore = create<ProgramOverrideState>()(
  persist(
    (set) => ({
      // SECTION: Loading
      // (intentionally empty)

      // SECTION: Error
      // (intentionally empty)

      // SECTION: Modals
      // (intentionally empty)

      // SECTION: Selection
      selectedSlotKey: null,
      selectSlot: (key) => set({ selectedSlotKey: key }),

      // SECTION: UI
      overrides: {},
      setOverride: (key, next) =>
        set((state) => ({ overrides: { ...state.overrides, [key]: next } })),
      clearOverride: (key) =>
        set((state) => {
          if (!(key in state.overrides)) return state;
          const next = { ...state.overrides };
          delete next[key];
          return { overrides: next };
        }),
    }),
    {
      name: 'armandotfit:program-overrides',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
