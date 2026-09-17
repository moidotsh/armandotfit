// __tests__/components/Crossfade.test.tsx
//
// The Transition primitive (Crossfade) — render + staleness contract:
//   - Renders the first child on mount
//   - Index change swaps to the new child (crossfade target is visible)
//   - A children-only re-render (same index — e.g. a theme flip) shows the
//     LIVE children, not the mount-time snapshot
//
// The third case is the regression: the current record used to keep the
// element captured at build time, so any re-render that changed only the
// children left the slide wearing the previous palette's ink forever.

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Crossfade } from '../../components/premium/shared';

describe('Crossfade', () => {
  it('renders the first child on mount', () => {
    const { getByText } = render(
      <Crossfade index="a">
        <div>content-a</div>
      </Crossfade>,
    );
    expect(getByText('content-a')).toBeTruthy();
  });

  it('index change swaps to the new child', () => {
    const { getByText, rerender } = render(
      <Crossfade index="a">
        <div>content-a</div>
      </Crossfade>,
    );
    getByText('content-a');
    rerender(
      <Crossfade index="b">
        <div>content-b</div>
      </Crossfade>,
    );
    // The outgoing child may linger mounted mid-fade; the incoming target
    // must be visible (it renders as a plain View, always visible).
    expect(getByText('content-b')).toBeTruthy();
  });

  it('children-only re-render (same index) shows the live children', () => {
    const { getByText, queryByText, rerender } = render(
      <Crossfade index="a">
        <div>content-a</div>
      </Crossfade>,
    );
    expect(getByText('content-a')).toBeTruthy();

    rerender(
      <Crossfade index="a">
        <div>content-a-live</div>
      </Crossfade>,
    );
    expect(getByText('content-a-live')).toBeTruthy();
    expect(queryByText('content-a')).toBeNull();
  });
});
