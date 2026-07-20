// __tests__/components/TrainingConsistencyGrid.test.tsx
//
// Adapter-level tests. Verifies the UserAnalytics → ActivityGridDatum
// mapping and prop pass-through. The underlying grid's geometry,
// padding-cell behavior, and accessibility contract are covered by
// ActivityGrid.test.tsx — these tests assert only the adapter layer.

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { TrainingConsistencyGrid } from '../../components/composed/TrainingConsistencyGrid';
import type { UserAnalytics } from '../../shared/types';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// Single-week range, Sunday to Saturday — 7 date cells, no padding.
const WEEK_RANGE = {
  startDate: '2026-03-15', // Sunday
  endDate: '2026-03-21',   // Saturday
};

function makeAnalytics(overrides: Partial<UserAnalytics> = {}): UserAnalytics {
  return {
    id: 'uuid-1',
    userId: 'user-1',
    date: '2026-03-15',
    totalWorkouts: 1,
    totalDuration: 30,
    currentStreak: 1,
    bestStreak: 1,
    weeklyGoalProgress: { completed: 1, target: 4 },
    createdAt: '2026-03-15T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
    ...overrides,
  };
}

describe('TrainingConsistencyGrid — mapping', () => {
  it('renders the underlying grid (accessibilityRole="list") for a valid range', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    expect(container.querySelector('[accessibilityrole="list"]')).not.toBeNull();
  });

  it('empty UserAnalytics[] still renders the full zero-level calendar (not empty state)', () => {
    const { container, queryByText } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    expect(container.querySelector('[accessibilityrole="list"]')).not.toBeNull();
    expect(queryByText('Invalid date range.')).toBeNull();
  });

  it('uses totalWorkouts as the per-cell value (single-workout day announces "1 activity")', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[makeAnalytics({ date: '2026-03-17', totalWorkouts: 1 })]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    const labeled = container.querySelectorAll('[accessibilitylabel]');
    const labels = Array.from(labeled).map((el) => el.getAttribute('accessibilitylabel') || '');
    expect(labels.some((l) => /1 activity$/.test(l))).toBe(true);
    expect(labels.some((l) => /Mar 17, 2026/.test(l))).toBe(true);
  });

  it('uses totalWorkouts as the per-cell value (two-workout day announces "2 activities")', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[makeAnalytics({ date: '2026-03-18', totalWorkouts: 2 })]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    const labeled = container.querySelectorAll('[accessibilitylabel]');
    const labels = Array.from(labeled).map((el) => el.getAttribute('accessibilitylabel') || '');
    expect(labels.some((l) => /2 activities$/.test(l))).toBe(true);
  });

  it('days not in the source data render as zero-activity cells (no crash, no gap)', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[makeAnalytics({ date: '2026-03-17', totalWorkouts: 1 })]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    // 7 date cells, all with non-empty labels.
    const cells = container.querySelectorAll('[accessibilityrole="text"]');
    expect(cells.length).toBe(7);
    const labels = Array.from(cells).map((el) => el.getAttribute('accessibilitylabel') || '');
    expect(labels.every((l) => l.length > 0)).toBe(true);
  });
});

describe('TrainingConsistencyGrid — prop pass-through', () => {
  it('forwards the default accessibilityLabel when none is supplied', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    const grid = container.querySelector('[accessibilityrole="list"]');
    expect(grid?.getAttribute('accessibilitylabel')).toBe('Training consistency');
  });

  it('forwards a custom accessibilityLabel when supplied', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
          accessibilityLabel="Last 30 days of training"
        />
      </Wrap>,
    );
    const grid = container.querySelector('[accessibilityrole="list"]');
    expect(grid?.getAttribute('accessibilitylabel')).toBe('Last 30 days of training');
  });

  it('forwards testID', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
          testID="training-grid"
        />
      </Wrap>,
    );
    // With the RN string-component mock, `testID` surfaces as the lowercase
    // `testid` attribute on the rendered DOM node (RN Web would translate
    // to `data-testid`, but the mock does not).
    const node = container.querySelector('[testid="training-grid"]');
    expect(node).not.toBeNull();
  });

  it('renders non-interactive cells by default (no onDayPress)', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
        />
      </Wrap>,
    );
    expect(container.querySelectorAll('pressable').length).toBe(0);
  });

  it('renders interactive cells when onDayPress is supplied', () => {
    const { container } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate={WEEK_RANGE.startDate}
          endDate={WEEK_RANGE.endDate}
          onDayPress={() => {}}
        />
      </Wrap>,
    );
    // 7 date cells become Pressables with accessibilityRole="button".
    expect(container.querySelectorAll('pressable').length).toBe(7);
    expect(container.querySelectorAll('[accessibilityrole="button"]').length).toBe(7);
  });

  it('invalid range (start > end) renders the empty-state copy', () => {
    const { getByText } = render(
      <Wrap>
        <TrainingConsistencyGrid
          data={[]}
          startDate="2026-03-21"
          endDate="2026-03-15"
        />
      </Wrap>,
    );
    expect(getByText('Invalid date range.')).toBeDefined();
  });
});
