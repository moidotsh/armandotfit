// __tests__/components/MobileAnnouncementBar.test.tsx
//
// Render + interaction smoke for the announcement strip:
//   - renders the message
//   - action press fires onAction
//   - dismiss control appears only with onDismiss and fires it

import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../../context';
import { MobileAnnouncementBar } from '../../components/MobilePremium/MobileAnnouncementBar';

function Wrap({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('MobileAnnouncementBar', () => {
  it('renders the message', () => {
    const { container } = render(
      <Wrap>
        <MobileAnnouncementBar message="Pickup Friday 17-19h" />
      </Wrap>,
    );
    expect(container.textContent).toContain('Pickup Friday 17-19h');
  });

  it('fires the action press', () => {
    const onAction = vi.fn();
    const { getByText } = render(
      <Wrap>
        <MobileAnnouncementBar message="Drop opens Friday" actionLabel="Details" onAction={onAction} />
      </Wrap>,
    );
    fireEvent.click(getByText('Details'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows the dismiss control only with onDismiss, and fires it', () => {
    const onDismiss = vi.fn();
    const { container, rerender } = render(
      <Wrap>
        <MobileAnnouncementBar message="Drop opens Friday" />
      </Wrap>,
    );
    expect(container.querySelector('[accessibilitylabel="Dismiss announcement"]')).toBeNull();

    rerender(
      <Wrap>
        <MobileAnnouncementBar message="Drop opens Friday" onDismiss={onDismiss} />
      </Wrap>,
    );
    fireEvent.click(container.querySelector('[accessibilitylabel="Dismiss announcement"]')!);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
