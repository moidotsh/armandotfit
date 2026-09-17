// __tests__/components/AlternativesExpansion.test.tsx
// The inline substitution surface: renders modality groups for the
// current exercise's family, hides the current entry, exposes restore
// only when a standing override is active, and fires onSelect.

import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { AlternativesExpansion } from '../../components/composed';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('AlternativesExpansion', () => {
  it('renders same-family alternatives grouped by modality (Leg Press → squats)', () => {
    const { container, getByText } = render(
      <Wrap>
        <AlternativesExpansion currentSlug="leg-press" onSelect={() => {}} />
      </Wrap>,
    );
    expect(getByText('FLOOR')).toBeTruthy();
    expect(getByText('DUMBBELL')).toBeTruthy();
    expect(getByText('BARBELL')).toBeTruthy();
    expect(getByText('Bodyweight Squat')).toBeTruthy();
    expect(getByText('Barbell Back Squat')).toBeTruthy();
    // The current exercise never offers itself.
    expect(container.textContent).not.toContain('Leg Press');
  });

  it('tap an alternative fires onSelect with its identity', () => {
    const onSelect = vi.fn();
    const { getByText } = render(
      <Wrap>
        <AlternativesExpansion currentSlug="leg-press" onSelect={onSelect} />
      </Wrap>,
    );
    fireEvent.click(getByText('Dumbbell Goblet Squat'));
    expect(onSelect).toHaveBeenCalledWith({
      exerciseName: 'Dumbbell Goblet Squat',
      exerciseSlug: 'dumbbell-goblet-squat',
    });
  });

  it('restore appears only when a programmed entry is provided', () => {
    const onRestore = vi.fn();
    const withOverride = render(
      <Wrap>
        <AlternativesExpansion
          currentSlug="barbell-back-squat"
          programmed={{ slug: 'leg-press', name: 'The Programmed Squat' }}
          onRestore={onRestore}
          onSelect={() => {}}
        />
      </Wrap>,
    );
    expect(withOverride.getByText('PROGRAMMED')).toBeTruthy();
    fireEvent.click(withOverride.getByText('The Programmed Squat'));
    expect(onRestore).toHaveBeenCalledTimes(1);

    const without = render(
      <Wrap>
        <AlternativesExpansion
          currentSlug="barbell-back-squat"
          programmed={null}
          onRestore={onRestore}
          onSelect={() => {}}
        />
      </Wrap>,
    );
    expect(without.container.textContent).not.toContain('PROGRAMMED');
  });

  it('custom exercises (no family) render the honest empty line', () => {
    const { getByText } = render(
      <Wrap>
        <AlternativesExpansion currentSlug="" onSelect={() => {}} />
      </Wrap>,
    );
    expect(getByText(/No same-family alternative/)).toBeTruthy();
  });
});
