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
// liveProgram — THE LIVE PROGRAM: what the user is actually running
// (the editions, an authored starter, or a generated board by seed —
// shared/types/program.ts). Adopting a starter/generated program
// rewrites THIS without touching splitType, so the edition preference
// survives for the couple page and the lab's comparison baseline.
// splitType — the remembered EDITION (the picker's edition-live
// default; 'twoADay' is the app's primary program). setPreference with
// a splitType keeps liveProgram in sync — choosing an edition at the
// selector IS making it live.
// sessionMode — the AM/PM window the picker opens with.
// Every session start re-writes the defaults (the last choice wins).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { LiveProgram, PreferredSplit } from '../shared/types';
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
  /** THE PROGRAM EDITION: 'upper' (the original) or 'lower' (the female equivalent). */
  edition: 'upper' | 'lower';
  /** THE LIVE PROGRAM — the default is the primary authored edition. */
  liveProgram: LiveProgram;
  setPreference: (pref: { splitType?: PreferredSplit; sessionMode?: SessionMode; edition?: 'upper' | 'lower' }) => void;
  /** MAKE LIVE — adopt any program. Adopting an edition also becomes
   * the remembered edition default (one source of truth per kind). */
  setLiveProgram: (program: LiveProgram) => void;
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
      edition: 'upper',
      liveProgram: { kind: 'edition', split: 'twoADay' },
      setPreference: (pref) =>
        set((state) => ({
          ...state,
          ...pref,
          // Choosing an edition at the selector makes it live.
          ...(pref.splitType
            ? { liveProgram: { kind: 'edition', split: pref.splitType } as LiveProgram }
            : {}),
        })),
      setLiveProgram: (program) =>
        set((state) => ({
          ...state,
          liveProgram: program,
          ...(program.kind === 'edition' ? { splitType: program.split } : {}),
        })),
    }),
    {
      name: 'armandotfit:split-preference',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
