// __tests__/app/SplitSelectionPlanError.test.tsx
//
// Phase 4 resilience integration tests for app/split-selection.
// Locks the contract that an active-plan lookup failure is surfaced as
// a distinct error state (with retry + an explicitly static-labeled
// launch button), and that the normal complete-plan + confirmed-no-plan
// paths remain unchanged.
//
// Scope — what this test verifies:
//   1. Lookup error renders a warning that is visibly distinct from the
//      "no saved plan" state (the error alert text appears ONLY on error).
//   2. Lookup error exposes a Retry control; tapping it calls the React
//      Query refetch path.
//   3. Static launch after lookup failure is gated by an explicit
//      "Start static workout" label, not the generic "Start session".
//   4. Complete active-plan launch renders the saved-plan badge + the
//      normal "Start session" label.
//
// Hooks are centralized in __tests__/setup.ts (screenHookStubs). Each
// test overrides per-test; beforeEach resets the workout store so the
// draft from one test never leaks into another.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import * as React from 'react';
import { ThemeProvider } from '../../context';
import { screenHookStubs } from '../setup';
import { useWorkoutStore } from '../../stores';
import SplitSelectionScreen from '../../app/split-selection';
import type { UserProgramPlanWithSlots } from '../../shared/types/userPlan';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// Minimal variant tree shape that the screen reads (only variant.id +
// template/variant identity for the launch snapshot). The full tree
// shape is exercised in __tests__/services/planLaunchService.test.ts.
const VARIANT_TREE_FIXTURE = {
  variant: {
    id: 'variant-1',
    programTemplateId: 'template-1',
    slug: 'one-a-day',
    name: 'One-a-Day',
    description: null,
    sessionWindowPattern: 'single' as const,
    cycleLengthDays: 4,
    version: 1,
    status: 'active',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  template: {
    id: 'template-1',
    slug: 'arman-fit-commercial-gym-v1',
    name: 'Arman Fit Commercial Gym v1',
    description: null,
    goal: null,
    defaultVariantSlug: null,
    version: 1,
    status: 'active',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  days: [],
};

// Minimal complete plan: active + one slot with non-null chosen +
// non-missing resolution. Mirrors the isPlanComplete contract.
const COMPLETE_PLAN_FIXTURE: UserProgramPlanWithSlots = {
  id: 'plan-1',
  userId: 'user-1',
  templateId: 'template-1',
  variantId: 'variant-1',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  slots: [
    {
      slot: {
        id: 'slot-1',
        planId: 'plan-1',
        templateSlotId: 'tmpl-1',
        chosenExerciseId: 'ex-1',
        resolution: 'template',
        prescriptionSnapshot: {
          setsMin: 3,
          setsMax: 4,
          repsMin: 6,
          repsMax: 10,
          perSide: false,
          slotNotes: null,
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      override: null,
    },
  ],
};

beforeEach(() => {
  cleanup();
  // Reset the workout store so prior-test draft state never leaks in.
  useWorkoutStore.setState({
    draft: null,
    sessionStartedAt: null,
    isSessionActive: false,
    selectedExerciseLocalId: null,
    sessionError: null,
    isSaving: false,
  });
  // Restore stubs to a sane default between tests.
  for (const fn of Object.values(screenHookStubs) as Array<{
    mockReset?: () => void;
    mockReturnValue?: (v: unknown) => unknown;
  }>) {
    if (typeof fn.mockReset === 'function') {
      // These are vi.fn() instances created via vi.hoisted — reset and
      // restore happens by re-stubbing per-test below.
    }
  }
});

describe('split-selection — plan-lookup error vs absence', () => {
  it('renders the lookup-error alert when the active-plan query errors', () => {
    screenHookStubs.useVariantTree.mockReturnValue({
      data: VARIANT_TREE_FIXTURE,
      isLoading: false,
    });
    screenHookStubs.useActivePlanForVariant.mockReturnValue({
      data: null,
      isError: true,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });

    const { getByText, queryByText } = render(
      <Wrap>
        <SplitSelectionScreen />
      </Wrap>,
    );

    // Error surface is visible...
    expect(getByText("Couldn't check your saved plan")).toBeTruthy();
    // ...and the saved-plan badge is NOT (no plan was confirmed).
    expect(queryByText(/Using your saved plan/)).toBeNull();
  });

  it('does NOT render the lookup-error alert when the plan is simply absent', () => {
    screenHookStubs.useVariantTree.mockReturnValue({
      data: VARIANT_TREE_FIXTURE,
      isLoading: false,
    });
    // Confirmed absence: query succeeded, no row.
    screenHookStubs.useActivePlanForVariant.mockReturnValue({
      data: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });

    const { queryByText } = render(
      <Wrap>
        <SplitSelectionScreen />
      </Wrap>,
    );

    expect(queryByText("Couldn't check your saved plan")).toBeNull();
    expect(queryByText(/Using your saved plan/)).toBeNull();
  });

  it('exposes a Retry control that invokes the React Query refetch path', () => {
    const refetch = vi.fn(() => Promise.resolve({}));
    screenHookStubs.useVariantTree.mockReturnValue({
      data: VARIANT_TREE_FIXTURE,
      isLoading: false,
    });
    screenHookStubs.useActivePlanForVariant.mockReturnValue({
      data: null,
      isError: true,
      isLoading: false,
      refetch,
    });

    const { getByText } = render(
      <Wrap>
        <SplitSelectionScreen />
      </Wrap>,
    );

    fireEvent.click(getByText('Retry plan check'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('labels the launch button "Start static workout" only when the lookup failed', () => {
    // Error state — static-labeled.
    screenHookStubs.useVariantTree.mockReturnValue({
      data: VARIANT_TREE_FIXTURE,
      isLoading: false,
    });
    screenHookStubs.useActivePlanForVariant.mockReturnValue({
      data: null,
      isError: true,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });

    const { getByText, queryByText, rerender } = render(
      <Wrap>
        <SplitSelectionScreen />
      </Wrap>,
    );
    expect(getByText('Start static workout')).toBeTruthy();
    // The generic label is NOT rendered when the lookup failed.
    expect(queryByText(/^Start session$/)).toBeNull();

    // Flip to confirmed-no-plan — label reverts to "Start session".
    screenHookStubs.useActivePlanForVariant.mockReturnValue({
      data: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });
    rerender(
      <Wrap>
        <SplitSelectionScreen />
      </Wrap>,
    );
    expect(getByText(/^Start session$/)).toBeTruthy();
    expect(queryByText('Start static workout')).toBeNull();
  });

  it('renders the saved-plan badge + normal Start label when the plan is complete', () => {
    screenHookStubs.useVariantTree.mockReturnValue({
      data: VARIANT_TREE_FIXTURE,
      isLoading: false,
    });
    screenHookStubs.useActivePlanForVariant.mockReturnValue({
      data: COMPLETE_PLAN_FIXTURE,
      isError: false,
      isLoading: false,
      refetch: vi.fn(() => Promise.resolve({})),
    });

    const { getByText, queryByText } = render(
      <Wrap>
        <SplitSelectionScreen />
      </Wrap>,
    );

    expect(getByText(/Using your saved plan/)).toBeTruthy();
    expect(queryByText("Couldn't check your saved plan")).toBeNull();
    expect(getByText(/^Start session$/)).toBeTruthy();
  });
});
