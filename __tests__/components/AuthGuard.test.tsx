// __tests__/components/AuthGuard.test.tsx
// The guard's two modes: open (the starter default — no wall) and
// protected (the consumer flip — wall non-public routes). The
// signed-in-away-from-auth-screens redirect runs in both.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../../stores';
import { AuthGuard } from '../../components/primitives/AuthGuard';

const segment = (root: string) => vi.mocked(useSegments).mockReturnValue([root] as never);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.mocked(router.replace).mockClear();
    useAuthStore.setState({ status: 'unauthenticated', userId: null, email: null });
  });

  it('open mode (enabled=false, the APP_LAYOUT.authGuard default): unauthenticated visitors render protected routes', async () => {
    segment('settings');
    render(
      <AuthGuard enabled={false}>
        <div>the screen</div>
      </AuthGuard>,
    );
    await waitFor(() => expect(screenText()).toBe('the screen'));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('protected mode (enabled=true): unauthenticated + non-public route redirects to /login', async () => {
    segment('settings');
    render(
      <AuthGuard enabled>
        <div>the screen</div>
      </AuthGuard>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
  });

  it('both modes: signed-in users sitting on auth screens go home', async () => {
    useAuthStore.setState({ status: 'authenticated', userId: 'u-1', email: 'a@b.c' });
    segment('login');
    render(
      <AuthGuard enabled={false}>
        <div>auth screen</div>
      </AuthGuard>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  });
});

function screenText(): string | null {
  return document.body.textContent || null;
}
