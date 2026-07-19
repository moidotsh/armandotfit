// stores/tourStore.ts
// Tour/onboarding overlay state — persisted so a half-finished tour
// survives a reload. Domain-agnostic: this store tracks only the step
// counter and visibility flag; the tour content + step metadata lives
// in a consumer-added `tourConfig.ts` (or wherever the consumer wants).
//
// Arqavellum ships the store but no tour UI. Consumers wanting onboarding
// tours read this store from a `<TourOverlay>` component of their own.

// =============================================================================
// SECTION: Loading
// (No loading state — tours are local UI.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — tour state is local UI.)
// =============================================================================

// =============================================================================
// SECTION: Modals
// (No modal state in this store — see uiStore.)
// =============================================================================

// =============================================================================
// SECTION: Selection
// (No selection state in this store.)
// =============================================================================

// =============================================================================
// SECTION: UI
// isTourVisible / currentStep / totalSteps / tourType — drives the tour
// overlay component. tourType is open-ended string so consumers can have
// multiple distinct tours ('onboarding', 'feature-x', 'pro-upsell', …).
// =============================================================================

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

interface TourState {
  // SECTION: UI
  isTourVisible: boolean;
  currentStep: number;
  totalSteps: number;
  tourType: string | null;

  // Actions
  startTour: (type: string, totalSteps: number) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetTour: () => void;
}

const initialState = {
  isTourVisible: false,
  currentStep: 0,
  totalSteps: 0,
  tourType: null as string | null,
};

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      ...initialState,

      startTour: (type, totalSteps) =>
        set({
          isTourVisible: true,
          tourType: type,
          currentStep: 0,
          totalSteps,
        }),

      endTour: () =>
        set({
          isTourVisible: false,
          currentStep: 0,
          totalSteps: 0,
          tourType: null,
        }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      goToStep: (step) =>
        set((state) => ({
          currentStep: Math.max(0, Math.min(step, state.totalSteps - 1)),
        })),

      resetTour: () =>
        set({
          isTourVisible: false,
          currentStep: 0,
          totalSteps: 0,
          tourType: null,
        }),
    }),
    {
      name: 'arqavellum-tour',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

// Selector hook — returns the four visible-state fields in one shallow
// snapshot so the tour overlay re-renders only when one of them changes.
export const useTourVisibility = () =>
  useTourStore(
    useShallow((state) => ({
      isVisible: state.isTourVisible,
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      tourType: state.tourType,
    })),
  );
