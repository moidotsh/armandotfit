// stores/restStore.ts
// THE REST INSTRUMENT (docs/architecture/scoreboard-thesis.md §7) —
// the rest countdown's state. After every LOG SET the rest clock
// runs: `endsAt` is the epoch-ms deadline (ephemeral, matching the
// draft's in-memory lifecycle — a reload clears it, correctly,
// because the draft itself lives in memory); `defaultSec` is the
// remembered interval preference (persisted — the Settings panel's
// stepper row); `perExercise` remembers the interval the owner LAST
// TUNED per exercise name (deadlifts ≠ lateral raises — a ±15
// adjustment during a station's rest becomes that station's next
// default). Nothing here joins the data spine. The 5 SECTION markers
// below are load-bearing: audit-state (D10) flags any Zustand store
// missing them.

// =============================================================================
// SECTION: Loading
// (No loading state — the countdown resolves synchronously from endsAt.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — arithmetic cannot fail.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — the rest reads inline on the Floor, never in a sheet.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// (No selection state — see UI below.)
// =============================================================================

// =============================================================================
// SECTION: UI
// endsAt — the running rest's deadline (epoch ms), null when no rest
// is running. Settled (the countdown reached 0) is DERIVED at read:
// endsAt != null && now >= endsAt.
// defaultSec — the interval a fresh rest starts with (persisted).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { REST_DEFAULT_SEC } from '../constants';

/** The rest countdown's ceiling — 10 minutes of steppers is plenty. */
export const REST_MAX_SEC = 600;

interface RestState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  // (intentionally empty)

  // SECTION: UI
  endsAt: number | null;
  defaultSec: number;
  /** The owner's last-tuned interval per exercise name (seconds). */
  perExercise: Record<string, number>;
  startRest: (sec?: number, exerciseName?: string) => void;
  adjustRest: (deltaSec: number, exerciseName?: string) => void;
  dismissRest: () => void;
}

export const useRestStore = create<RestState>()(
  persist(
    (set, get) => ({
      // SECTION: Loading
      // (intentionally empty)

      // SECTION: Error
      // (intentionally empty)

      // SECTION: Modals
      // (intentionally empty)

      // SECTION: Selection
      // (intentionally empty)

      // SECTION: UI
      endsAt: null,
      defaultSec: REST_DEFAULT_SEC,
      perExercise: {},
      startRest: (sec, exerciseName) => {
        const s = Math.max(
          1,
          Math.min(
            REST_MAX_SEC,
            sec ?? (exerciseName != null ? get().perExercise[exerciseName] : undefined) ?? get().defaultSec,
          ),
        );
        set({ endsAt: Date.now() + s * 1000 });
      },
      adjustRest: (deltaSec, exerciseName) => {
        const { endsAt } = get();
        if (endsAt == null) return;
        const remaining = Math.max(0, endsAt - Date.now());
        const next = Math.max(0, Math.min(REST_MAX_SEC, remaining / 1000 + deltaSec));
        // A tune is a vote: the adjusted interval becomes this
        // exercise's remembered default (UI-state only).
        if (exerciseName != null && next > 0) {
          set({ endsAt: Date.now() + next * 1000, perExercise: { ...get().perExercise, [exerciseName]: Math.round(next) } });
        } else {
          set({ endsAt: Date.now() + next * 1000 });
        }
      },
      dismissRest: () => set({ endsAt: null }),
    }),
    {
      name: 'armandotfit:rest-instrument',
      storage: createJSONStorage(() => zustandStorage),
      // Only the preferences persist — the running countdown is
      // session UI-state and dies with the draft (a reload mid-rest
      // clears it, exactly like the draft itself).
      partialize: (state) => ({ defaultSec: state.defaultSec, perExercise: state.perExercise }),
    },
  ),
);
