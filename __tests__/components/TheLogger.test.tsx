// __tests__/components/TheLogger.test.tsx
// THE STEPPER PAIRS — one per figure, both always live: stepping
// never asks arming, mid-rest included (the gassed-on-set-two law —
// the plan bends with a thumb, not a field hunt).

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { TheLogger } from '../../components/composed/TheLogger';
import { weightStep } from '../../utils';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

const base = {
  setNumber: 2,
  weight: 60,
  reps: 8,
  onLog: () => {},
  onChangeWeight: () => {},
  onChangeReps: () => {},
};

describe('TheLogger — the stepper pairs', () => {
  it('one pair per figure, both rendered with their captions', () => {
    const { getByText } = render(
      <Wrap>
        <TheLogger {...base} testID="log" />
      </Wrap>,
    );
    expect(getByText(`${weightStep('kg')} kg`)).toBeTruthy();
    expect(getByText('1 rep')).toBeTruthy();
  });

  it('the reps pair steps reps with NO arming', () => {
    const onChangeReps = vi.fn();
    const onChangeWeight = vi.fn();
    const { getByLabelText } = render(
      <Wrap>
        <TheLogger
          {...base}
          onChangeReps={onChangeReps}
          onChangeWeight={onChangeWeight}
          testID="log"
        />
      </Wrap>,
    );
    fireEvent.click(getByLabelText('Increase reps by 1'));
    expect(onChangeReps).toHaveBeenCalledWith(9);
    expect(onChangeWeight).not.toHaveBeenCalled();
    fireEvent.click(getByLabelText('Decrease reps by 1'));
    expect(onChangeReps).toHaveBeenCalledWith(7);
  });

  it('the weight pair steps by its own step', () => {
    const onChangeWeight = vi.fn();
    const step = weightStep('kg');
    const { getByLabelText } = render(
      <Wrap>
        <TheLogger {...base} onChangeWeight={onChangeWeight} testID="log" />
      </Wrap>,
    );
    fireEvent.click(getByLabelText(`Increase weight by ${step}`));
    expect(onChangeWeight).toHaveBeenCalledWith(60 + step);
  });

  it('the pairs survive mid-rest — the clock takes the counter, not the stepping', () => {
    const onChangeReps = vi.fn();
    const { getByLabelText } = render(
      <Wrap>
        <TheLogger
          {...base}
          rest={{ readout: '1:12', settled: false, onDismiss: () => {} }}
          onChangeReps={onChangeReps}
          testID="log"
        />
      </Wrap>,
    );
    fireEvent.click(getByLabelText('Increase reps by 1'));
    expect(onChangeReps).toHaveBeenCalledWith(9);
  });
});
