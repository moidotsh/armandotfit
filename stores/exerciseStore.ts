// stores/exerciseStore.ts
// Exercise-library browse/filter state. Ephemeral — NOT persisted (the
// next session starts with cleared filters so the user sees the full
// library, not whatever they last filtered to). The 5 SECTION markers
// below are load-bearing: audit-state (D10) flags any Zustand store
// missing them.

// =============================================================================
// SECTION: Loading
// (No loading state — loading is owned by React Query useExercises.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — errors surface through React Query's isError.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state — filter UI is inline, not modal.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// selectedExerciseId — id of the exercise whose detail card is open in
// the browse view (mobile: pushed route; tablet/desktop: side panel).
// =============================================================================

// =============================================================================
// SECTION: UI
// filter — the ExerciseFilter threaded into useExercises' queryKey.
// searchQuery — raw text input; committed to filter.search on submit.
// sortBy — 'name' | 'difficulty' | 'type' (UI hint; not in ExerciseFilter
// because Supabase ordering is set in the repository).
// favoritesOnly — toggles a "show only favorites" view.
// =============================================================================

import { create } from 'zustand';
import type { ExerciseFilter, ID } from '../shared/types';

type SortBy = 'name' | 'difficulty' | 'type';

interface ExerciseBrowseState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedExerciseId: ID | null;
  selectExercise: (id: ID | null) => void;

  // SECTION: UI
  filter: ExerciseFilter;
  searchQuery: string;
  sortBy: SortBy;
  favoritesOnly: boolean;
  setFilter: (patch: Partial<ExerciseFilter>) => void;
  setSearchQuery: (query: string) => void;
  commitSearch: () => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleFavoritesOnly: () => void;
  resetFilters: () => void;
}

const DEFAULT_FILTER: ExerciseFilter = {};

export const useExerciseStore = create<ExerciseBrowseState>((set, get) => ({
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

  // SECTION: Modals
  // (intentionally empty)

  // SECTION: Selection
  selectedExerciseId: null,
  selectExercise: (id) => set({ selectedExerciseId: id }),

  // SECTION: UI
  filter: DEFAULT_FILTER,
  searchQuery: '',
  sortBy: 'name',
  favoritesOnly: false,

  setFilter: (patch) =>
    set((state) => ({ filter: { ...state.filter, ...patch } })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  commitSearch: () =>
    set((state) => ({
      filter: { ...state.filter, search: state.searchQuery.trim() || undefined },
    })),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleFavoritesOnly: () =>
    set((state) => ({ favoritesOnly: !state.favoritesOnly })),

  resetFilters: () =>
    set({
      filter: DEFAULT_FILTER,
      searchQuery: '',
      sortBy: 'name',
      favoritesOnly: false,
    }),
}));
