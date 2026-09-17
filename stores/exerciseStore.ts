// stores/exerciseStore.ts
// Exercise-library browse/filter state. Ephemeral — NOT persisted. The
// 5 SECTION markers below are load-bearing: audit-state (D10) flags any
// Zustand store missing them.

// =============================================================================
// SECTION: Loading
// (No loading state — the catalog is local data, resolved synchronously.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — local data cannot fail to load.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — filter UI is inline, not modal.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// selectedExerciseSlug — slug of the exercise whose detail card is open.
// =============================================================================

// =============================================================================
// SECTION: UI
// filter — search/category/exerciseType, applied client-side over the
// local SYSTEM_EXERCISES catalog.
// =============================================================================

import { create } from 'zustand';

export interface CatalogFilter {
  search?: string;
  category?: string;
  exerciseType?: string;
}

interface ExerciseBrowseState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedExerciseSlug: string | null;
  selectExercise: (slug: string | null) => void;

  // SECTION: UI
  filter: CatalogFilter;
  setFilter: (patch: Partial<CatalogFilter>) => void;
  resetFilters: () => void;
}

export const useExerciseStore = create<ExerciseBrowseState>((set) => ({
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedExerciseSlug: null,
  selectExercise: (slug) => set({ selectedExerciseSlug: slug }),

  // SECTION: UI
  filter: {},
  setFilter: (patch) =>
    set((state) => ({ filter: { ...state.filter, ...patch } })),
  resetFilters: () => set({ filter: {} }),
}));
