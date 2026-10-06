// stores/restStore.ts
// THE REST CLOCK (docs/architecture/scoreboard-thesis.md §7) —
// after every LOG SET a rest runs at the ONE default interval
// (constants' REST_DEFAULT_SEC, 90s). `endsAt` is the epoch-ms
// deadline — ephemeral, matching the draft's in-memory lifecycle
// (a reload clears it, correctly, because the draft itself lives
// in memory). Nothing here joins the data spine and nothing is
// tuned: no steppers, no per-exercise memory, no settings row —
// the clock starts, it runs, it ends. The 5 SECTION markers below
// are load-bearing: audit-state (D10) flags any Zustand store
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
// =============================================================================

import { create } from 'zustand';
import { REST_DEFAULT_SEC } from '../constants';

/** The rest countdown's ceiling — a defensive clamp on startRest. */
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
  startRest: (sec?: number) => void;
  dismissRest: () => void;
}

export const useRestStore = create<RestState>()((set, get) => ({
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
  startRest: (sec) => {
    const s = Math.max(1, Math.min(REST_MAX_SEC, sec ?? REST_DEFAULT_SEC));
    set({ endsAt: Date.now() + s * 1000 });
  },
  dismissRest: () => set({ endsAt: null }),
}));
