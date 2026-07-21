// __tests__/context/ToastContext.test.tsx
//
// Phase 6 toast-system tests. The toast context extended in Phase 6 to
// accept an optional `action` prop on toasts. The 3rd positional arg
// of `showToast` accepts either:
//   • a number (historical duration shape — every existing caller)
//   • an options object of shape `{ duration?, action? }` (new)
//
// A runtime shape check preserves all existing call sites verbatim.
// These tests lock both shapes and the visual action rendering.

import { describe, it, expect } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider, ToastProvider, useToast } from '../../context';
import { ToastContainer } from '../../components/primitives/Toast';

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

// Caller — test component that invokes showToast with the args under
// test. Renders nothing itself; the visual ToastContainer sibling
// inside Wrap is what the test asserts against.
function Caller({ show }: { show: (api: ReturnType<typeof useToast>) => void }) {
  const api = useToast();
  return (
    <button type="button" onClick={() => show(api)} data-testid="fire">
      fire
    </button>
  );
}

function fire(rendered: ReturnType<typeof render>) {
  fireEvent.click(rendered.getByTestId('fire'));
}

describe('ToastContext — showToast shapes', () => {
  it('showToast(type, message) renders a toast with default duration and no action', () => {
    const rendered = render(
      <Wrap>
        <Caller show={(api) => api.showToast('success', 'hi')} />
        <ToastContainer />
      </Wrap>,
    );
    fire(rendered);
    expect(rendered.getByText('hi')).toBeTruthy();
    // No action button rendered.
    expect(rendered.queryByText('Rename')).toBeNull();
    cleanup();
  });

  it('showToast(type, message, number) still works — backward-compat duration shape', () => {
    const rendered = render(
      <Wrap>
        <Caller show={(api) => api.showToast('success', 'five-second', 5000)} />
        <ToastContainer />
      </Wrap>,
    );
    fire(rendered);
    expect(rendered.getByText('five-second')).toBeTruthy();
    // No action — number arg does not carry one.
    expect(rendered.queryByText('Rename')).toBeNull();
    cleanup();
  });

  it('showToast(type, message, { action }) renders the action label as a tappable button', () => {
    const actionOnPress = () => {};
    const rendered = render(
      <Wrap>
        <Caller
          show={(api) =>
            api.showToast('success', 'saved', {
              action: { label: 'Rename', onPress: actionOnPress },
            })
          }
        />
        <ToastContainer />
      </Wrap>,
    );
    fire(rendered);
    expect(rendered.getByText('saved')).toBeTruthy();
    expect(rendered.getByText('Rename')).toBeTruthy();
    cleanup();
  });
});

describe('ToastContext — action tap behavior', () => {
  it('tapping the action calls onPress and dismisses the toast', () => {
    let pressed = 0;
    const rendered = render(
      <Wrap>
        <Caller
          show={(api) =>
            api.showToast('success', 'saved', {
              action: {
                label: 'Rename',
                onPress: () => {
                  pressed += 1;
                },
              },
            })
          }
        />
        <ToastContainer />
      </Wrap>,
    );
    fire(rendered);
    fireEvent.click(rendered.getByText('Rename'));
    expect(pressed).toBe(1);
    // Toast dismissed after action tap.
    expect(rendered.queryByText('saved')).toBeNull();
    cleanup();
  });
});
