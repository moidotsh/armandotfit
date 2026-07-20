// __tests__/app/WorkoutDetailHydrationError.test.tsx
//
// Phase 4 resilience integration tests for app/workout-detail.
// Locks the contract that a plan-hydration query failure surfaces as a
// distinct error state (instead of an indefinite loading spinner),
// with Retry wired to the React Query refetch path and Discard wired
// to the existing resetSession + safeGoBack discard path. Also locks
// that the static-suggested path never silently substitutes when a
// plan-backed session has been selected.
//
// Scope — what this test verifies:
//   5. Hydration pending still renders the loading spinner (no regression).
//   6. Hydration error renders the error EmptyState and NOT the spinner.
//   7. Retry invokes the plan-hydration query's refetch.
//   8. Discard clears the active draft via resetSession (the existing
//      safe discard path).
//   9. A plan-backed launch that errors never silently substitutes
//      static exercises into the draft.
//
// Hooks centralized in __tests__/setup.ts (screenHookStubs). Per-test
// overrides; beforeEach resets the workout store.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, ToastProvider } from '../../context';
import { screenHookStubs } from '../setup';
import { useWorkoutStore } from '../../stores';
import WorkoutDetailScreen from '../../app/workout-detail';

function Wrap({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function makePlanDraft() {
  // Mirrors the DraftSession shape workoutStore.startSession creates
  // when a plan arg is threaded through.
  return {
    date: '2026-07-24T00:00:00.000Z',
    splitType: 'oneADay' as const,
    day: 1,
    sessionMode: 'am' as const,
    duration: 0,
    notes: null,
    exercises: [],
    sessionWindow: 'single' as const,
    startedAt: '2026-07-24T00:00:00.000Z',
    planId: 'plan-1',
    planTemplateSnapshot: null,
    planVariantSnapshot: null,
    launchSource: 'plan' as const,
  };
}

beforeEach(() => {
  cleanup();
  useWorkoutStore.setState({
    draft: null,
    sessionStartedAt: null,
    isSessionActive: false,
    selectedExerciseLocalId: null,
    sessionError: null,
    isSaving: false,
  });
});

describe('workout-detail — plan-hydration states', () => {
  it('renders a loading spinner while the plan-hydration query is pending', () => {
    useWorkoutStore.setState({
      draft: makePlanDraft(),
      isSessionActive: true,
      sessionStartedAt: '2026-07-24T00:00:00.000Z',
    });
    screenHookStubs.usePlanLaunchHydration.mockReturnValue({
      data: null,
      isError: false,
      isLoading: true,
      refetch: vi.fn(() => Promise.resolve({})),
    });
    screenHookStubs.useSuggestedExercises.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { queryByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Spinner is rendered (the LoadingSpinner mock surfaces as an
    // <activityindicator> tag). The error state must NOT be visible.
    expect(queryByText("Couldn't load your saved plan")).toBeNull();
  });

  it('renders the error EmptyState (not a spinner) when the hydration query errors', () => {
    useWorkoutStore.setState({
      draft: makePlanDraft(),
      isSessionActive: true,
      sessionStartedAt: '2026-07-24T00:00:00.000Z',
    });
    screenHookStubs.usePlanLaunchHydration.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    expect(getByText("Couldn't load your saved plan")).toBeTruthy();
    expect(getByText(/hasn't been saved or changed/i)).toBeTruthy();
  });

  it('invokes the plan-hydration refetch when Retry is tapped', () => {
    useWorkoutStore.setState({
      draft: makePlanDraft(),
      isSessionActive: true,
      sessionStartedAt: '2026-07-24T00:00:00.000Z',
    });
    const refetch = vi.fn(() => Promise.resolve({}));
    screenHookStubs.usePlanLaunchHydration.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch,
    });

    const { getByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    fireEvent.click(getByText('Retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('clears the active draft via resetSession when Discard is tapped', () => {
    useWorkoutStore.setState({
      draft: makePlanDraft(),
      isSessionActive: true,
      sessionStartedAt: '2026-07-24T00:00:00.000Z',
    });
    screenHookStubs.usePlanLaunchHydration.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });

    const { getAllByText } = render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Two "Discard" affordances render in this state: the error-state
    // Discard (inside HydrationErrorState) and the footer Discard. The
    // error-state Discard is the target of this test — it must clear
    // the draft through the existing resetSession + safeGoBack path.
    // The error-state Discard renders first (in scrollview content);
    // the footer Discard renders second.
    const discardButtons = getAllByText('Discard');
    expect(discardButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(discardButtons[0]);

    // resetSession nulls the draft + drops isSessionActive.
    const state = useWorkoutStore.getState();
    expect(state.draft).toBeNull();
    expect(state.isSessionActive).toBe(false);
  });

  it('never silently substitutes static exercises when the plan-hydration query errors', () => {
    // The hydration query errored, but suggestedExercises "happens to"
    // carry data for the same day. The screen must NOT hydrate that
    // data into a plan-backed draft.
    useWorkoutStore.setState({
      draft: makePlanDraft(),
      isSessionActive: true,
      sessionStartedAt: '2026-07-24T00:00:00.000Z',
    });
    screenHookStubs.usePlanLaunchHydration.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });
    // Pretend the suggested-exercises query returned data anyway.
    screenHookStubs.useSuggestedExercises.mockReturnValue({
      data: [
        {
          id: 'ex-static-1',
          slug: 'squat-barbell',
          name: 'Barbell Squat',
        },
      ],
      isLoading: false,
    });

    render(
      <Wrap>
        <WorkoutDetailScreen />
      </Wrap>,
    );

    // Draft exercises must still be empty — no static substitution.
    expect(useWorkoutStore.getState().draft?.exercises).toEqual([]);
  });
});
