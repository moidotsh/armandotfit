// stores/splitPreferenceStore.ts
// The remembered split defaults — what the launcher + picker open with.
// Persisted (unlike the ephemeral draft): the user trains ONE program,
// and re-choosing "AM/PM" every single session is exactly the friction
// the funnel must not have. The 5 SECTION markers below are
// load-bearing: audit-state (D10) flags any Zustand store missing them.

// =============================================================================
// SECTION: Loading
// (No loading state — preferences resolve synchronously from storage.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — storage failures fall back to the defaults via the
// persist middleware's own merge.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — preferences are edited inline in the picker.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// (No selection state — see UI below.)
// =============================================================================

// =============================================================================
// SECTION: UI
// splitType — the program variant the picker opens with ('twoADay' is
// the app's primary program; oneADay is the fallback variant).
// sessionMode — the AM/PM window the picker opens with.
// Both are written by the picker at session start (the last choice wins).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { PreferredSplit } from '../shared/types';
import type { SessionMode } from '../constants';

interface SplitPreferenceState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  // (intentionally empty)

  // SECTION: UI
  splitType: PreferredSplit;
  sessionMode: SessionMode;
  setPreference: (pref: { splitType?: PreferredSplit; sessionMode?: SessionMode }) => void;
}

export const useSplitPreferenceStore = create<SplitPreferenceState>()(
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
      splitType: 'twoADay',
      sessionMode: 'am',
      setPreference: (pref) => set((state) => ({ ...state, ...pref })),
    }),
    {
      name: 'armandotfit:split-preference',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
