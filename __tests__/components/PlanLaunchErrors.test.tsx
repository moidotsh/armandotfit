// __tests__/components/PlanLaunchErrors.test.tsx
//
// Component-level render + accessibility tests for the Phase 4 resilience
// composed pieces:
//   - PlanLookupErrorAlert (split-selection inline warning)
//   - HydrationErrorState (workout-detail plan-hydration error)
//
// Scope — what this test verifies:
//   - PlanLookupErrorAlert renders the warning title + a Retry control.
//   - HydrationErrorState renders the error title + paired Retry + Discard.
//   - Retry / Discard handlers fire on click.
//   - The error messages do NOT claim "no saved plan" (the whole point of
//     distinguishing error from absence).
//
// Scope — what this test does NOT verify:
//   - Screen-level wiring (retry = refetch, discard = resetSession) —
//     that lives in the integration tests under __tests__/app/.
//   - React Query retry behavior — the parent owns refetch.

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import {
  PlanLookupErrorAlert,
  HydrationErrorState,
} from '../../components/composed/PlanLaunchErrors';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('PlanLookupErrorAlert — render + actions', () => {
  it('renders the warning title', () => {
    const { getByText } = render(
      <Wrap>
        <PlanLookupErrorAlert onRetry={() => {}} />
      </Wrap>,
    );
    expect(getByText("Couldn't check your saved plan")).toBeTruthy();
  });

  it('renders a Retry control', () => {
    const { getByText } = render(
      <Wrap>
        <PlanLookupErrorAlert onRetry={() => {}} />
      </Wrap>,
    );
    expect(getByText('Retry plan check')).toBeTruthy();
  });

  it('fires onRetry when the Retry button is tapped', () => {
    const onRetry = vi.fn();
    const { getByText } = render(
      <Wrap>
        <PlanLookupErrorAlert onRetry={onRetry} />
      </Wrap>,
    );
    fireEvent.click(getByText('Retry plan check'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does NOT claim the user has no saved plan', () => {
    // The whole point of distinguishing error from absence: the alert
    // copy must not say "no plan" or "no saved plan" — that would
    // misrepresent a transient lookup failure as confirmed plan absence.
    const { container } = render(
      <Wrap>
        <PlanLookupErrorAlert onRetry={() => {}} />
      </Wrap>,
    );
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/no saved plan/i);
    expect(text).not.toMatch(/don't have a plan/i);
    // Sanity: the copy frames the failure as a reachability issue.
    expect(text).toMatch(/couldn't reach|may still exist/i);
  });

  it('carries accessibilityRole="alert" so screen readers announce it', () => {
    const { container } = render(
      <Wrap>
        <PlanLookupErrorAlert onRetry={() => {}} />
      </Wrap>,
    );
    const root = container.firstChild as HTMLElement | null;
    expect(root?.getAttribute('accessibilityrole')).toBe('alert');
  });
});

describe('HydrationErrorState — render + actions', () => {
  it('renders the error title', () => {
    const { getByText } = render(
      <Wrap>
        <HydrationErrorState onRetry={() => {}} onDiscard={() => {}} />
      </Wrap>,
    );
    expect(getByText("Couldn't load your saved plan")).toBeTruthy();
  });

  it('states that no workout has been saved or changed', () => {
    // Critical assurance for the error state: the user must know their
    // history is intact and nothing was persisted as a side effect.
    const { container } = render(
      <Wrap>
        <HydrationErrorState onRetry={() => {}} onDiscard={() => {}} />
      </Wrap>,
    );
    const text = container.textContent ?? '';
    expect(text).toMatch(/hasn't been saved|no workout has been saved/i);
  });

  it('renders both Retry and Discard controls', () => {
    const { getByText } = render(
      <Wrap>
        <HydrationErrorState onRetry={() => {}} onDiscard={() => {}} />
      </Wrap>,
    );
    expect(getByText('Retry')).toBeTruthy();
    expect(getByText('Discard')).toBeTruthy();
  });

  it('fires onRetry when Retry is tapped', () => {
    const onRetry = vi.fn();
    const { getByText } = render(
      <Wrap>
        <HydrationErrorState onRetry={onRetry} onDiscard={() => {}} />
      </Wrap>,
    );
    fireEvent.click(getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('fires onDiscard when Discard is tapped', () => {
    const onDiscard = vi.fn();
    const { getByText } = render(
      <Wrap>
        <HydrationErrorState onRetry={() => {}} onDiscard={onDiscard} />
      </Wrap>,
    );
    fireEvent.click(getByText('Discard'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('does NOT offer a static-launch escape inside the error state', () => {
    // Per spec: the error state must NOT add a "start static" action.
    // The user discards → returns to split-selection → makes the
    // explicit static-vs-plan decision there.
    const { container } = render(
      <Wrap>
        <HydrationErrorState onRetry={() => {}} onDiscard={() => {}} />
      </Wrap>,
    );
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/start static/i);
  });

  it('carries accessibilityRole="alert" so screen readers announce it', () => {
    const { container } = render(
      <Wrap>
        <HydrationErrorState onRetry={() => {}} onDiscard={() => {}} />
      </Wrap>,
    );
    const root = container.firstChild as HTMLElement | null;
    expect(root?.getAttribute('accessibilityrole')).toBe('alert');
  });
});
