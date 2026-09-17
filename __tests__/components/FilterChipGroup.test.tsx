// __tests__/components/FilterChipGroup.test.tsx
//
// Component-level render + layout tests for FilterChipGroup.
//   - Renders children
//   - oneRow default true → chips sit inside a horizontal scroll container
//   - oneRow={false} → flex-wrap row, no scroll container
//   - Carries no a11y role of its own (presentational)

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { FilterChipGroup } from '../../components/MobilePremium/FilterChipGroup';
import { FilterChip } from '../../components/MobilePremium/FilterChip';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

function inScrollView(container: HTMLElement, label: string): boolean {
  const chip = container.querySelector(`[accessibilitylabel="${label}"]`);
  expect(chip).not.toBeNull();
  let el: Element | null = chip;
  while (el) {
    if (el.tagName.toLowerCase() === 'scrollview') return true;
    el = el.parentElement;
  }
  return false;
}

describe('FilterChipGroup — layout', () => {
  it('renders its children', () => {
    const { getByText } = render(
      <Wrap>
        <FilterChipGroup>
          <FilterChip label="One" selected={false} onPress={() => {}} />
          <FilterChip label="Two" selected={false} onPress={() => {}} />
        </FilterChipGroup>
      </Wrap>,
    );
    expect(getByText('One')).toBeTruthy();
    expect(getByText('Two')).toBeTruthy();
  });

  it('default oneRow places chips inside a horizontal scroll container', () => {
    const { container } = render(
      <Wrap>
        <FilterChipGroup>
          <FilterChip label="A" selected={false} onPress={() => {}} accessibilityLabel="chip-a" />
        </FilterChipGroup>
      </Wrap>,
    );
    expect(inScrollView(container, 'chip-a')).toBe(true);
  });

  it('oneRow={false} wraps without a scroll container', () => {
    const { container } = render(
      <Wrap>
        <FilterChipGroup oneRow={false}>
          <FilterChip label="A" selected={false} onPress={() => {}} accessibilityLabel="chip-a" />
          <FilterChip label="B" selected={false} onPress={() => {}} accessibilityLabel="chip-b" />
        </FilterChipGroup>
      </Wrap>,
    );
    expect(inScrollView(container, 'chip-a')).toBe(false);
    expect(inScrollView(container, 'chip-b')).toBe(false);
  });

  it('accepts a custom gap without error', () => {
    const { container } = render(
      <Wrap>
        <FilterChipGroup gap={16}>
          <FilterChip label="A" selected={false} onPress={() => {}} />
        </FilterChipGroup>
      </Wrap>,
    );
    // The group root exists and has at least one chip descendant.
    expect(
      container.querySelector('[accessibilityrole="button"]'),
    ).not.toBeNull();
  });

  it('carries no a11y role of its own', () => {
    // The group is presentational — no radiogroup/checkboxgroup/etc.
    // The chip inside carries the semantic role; the group is a layout View.
    const { container } = render(
      <Wrap>
        <FilterChipGroup>
          <FilterChip
            label="A"
            selected={false}
            onPress={() => {}}
            accessibilityRole="radio"
          />
        </FilterChipGroup>
      </Wrap>,
    );
    const radiogroups = container.querySelectorAll(
      '[accessibilityrole="radiogroup"]',
    );
    expect(radiogroups.length).toBe(0);
  });
});
