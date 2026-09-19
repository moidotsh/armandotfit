// stores/deloadStore.ts
// THE DELOAD WEEK — a persisted UI-state flag (docs/architecture/
// scoreboard-thesis.md; the owner's program remains TS-only): while
// active, the Floor's TARGET rests at the Rx low end (min sets ×
// min reps), and the earned-load suggestion is suppressed. A tap
// clears it. Nothing joins the schema; the logged rows are exactly
// what they always were. The 5 SECTION markers below are
// load-bearing: audit-state (D10) flags any Zustand store missing
// them.

// =============================================================================
// SECTION: Loading
// (No loading state — a boolean resolves synchronously.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// (No selection state.)
// =============================================================================

// =============================================================================
// SECTION: UI
// active — the deload flag (persisted; one owner, one toggle).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

interface DeloadState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  // (intentionally empty)

  // SECTION: UI
  active: boolean;
  setActive: (next: boolean) => void;
}

export const useDeloadStore = create<DeloadState>()(
  persist(
    (set) => ({
      // SECTION: Loading
      // (intentionally empty)

      // SECTION: Error
      // (intentionally empty)

      // SECTION: Modals
      // (intentionally empty)

      // SECTION: Selection
      // (intentionally empty)

      // SECTION: UI
      active: false,
      setActive: (next) => set({ active: next }),
    }),
    {
      name: 'armandotfit:deload-week',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ active: state.active }),
    },
  ),
);
