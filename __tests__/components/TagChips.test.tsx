// __tests__/components/TagChips.test.tsx
// The tag editor renders the qualifier axes as labeled runs — the
// single-choice nature visible BEFORE the tap.

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { TagChips } from '../../components/composed/TagChips';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('TagChips — the axes', () => {
  it('renders every axis label and its member words', () => {
    const { getByText, getByLabelText } = render(
      <Wrap>
        <TagChips tags={[]} onToggleTag={() => {}} onAddTag={() => {}} testID="chips" />
      </Wrap>,
    );
    for (const label of ['GRIP', 'ATTACHMENT', 'IMPLEMENT', 'STANCE', 'PULLEYS', 'STATION']) {
      expect(getByText(label)).toBeTruthy();
    }
    // The station run carries three instances (this gym's cable stacks).
    expect(getByLabelText('Add tag station-1')).toBeTruthy();
    expect(getByLabelText('Add tag station-3')).toBeTruthy();
  });

  it('tapping an axis word calls onToggleTag with the FULL token', () => {
    const onToggleTag = vi.fn();
    const { getByLabelText } = render(
      <Wrap>
        <TagChips tags={[]} onToggleTag={onToggleTag} onAddTag={() => {}} testID="chips" />
      </Wrap>,
    );
    fireEvent.click(getByLabelText('Add tag station-2'));
    expect(onToggleTag).toHaveBeenCalledWith('station-2');
    fireEvent.click(getByLabelText('Add tag single-pulley'));
    expect(onToggleTag).toHaveBeenCalledWith('single-pulley');
  });

  it('an active member is marked (its word becomes the clear affordance)', () => {
    // Ink weights are verified on the real page by the WebKit probe
    // (JSDOM computes no RN-web styles); the STATE is the contract here.
    const { getByLabelText, queryByLabelText, getByText } = render(
      <Wrap>
        <TagChips tags={['station-2']} onToggleTag={() => {}} onAddTag={() => {}} testID="chips" />
      </Wrap>,
    );
    expect(getByLabelText('Clear tag station-2')).toBeTruthy();
    expect(queryByLabelText('Add tag station-2')).toBeNull();
    expect(getByLabelText('Add tag station-1')).toBeTruthy();
    // The chip row carries the active tag (the removable chip).
    expect(getByText('station-2 ✕')).toBeTruthy();
  });
});
