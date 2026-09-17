// __tests__/utils/routeTransition.test.ts
//
// Goldens for the route-curtain phase machine and the copy resolver.
// The choreography itself (Animated values, the overlay's path watch)
// is web-frame territory the DOM can't honor — the store's state
// transitions, safety valves, and synchronous-fallback behavior are
// the pure, testable core. curtainEnabled() is false under NODE_ENV=test
// by construction, which is itself the tested contract: tests and
// reduced motion never wait on choreography.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useRouteTransitionStore,
  withRouteCurtain,
  routeCurtainCopy,
  curtainEnabled,
  NAV_DELAY_MS,
  REVEAL_SAFETY_MS,
  REVEAL_MAX_LIFE_MS,
} from '../../utils/routeTransition';
import { APP_DISPLAY_NAME } from '../../constants';

const WORDMARK = APP_DISPLAY_NAME.toUpperCase();

describe('curtainEnabled', () => {
  it('is false in the test environment — DOM tests never mount choreography', () => {
    expect(curtainEnabled()).toBe(false);
  });
});

describe('withRouteCurtain', () => {
  beforeEach(() => {
    useRouteTransitionStore.getState().resetForTests();
  });

  it('navigates synchronously when the curtain is disabled (the starter default)', () => {
    const go = vi.fn();
    withRouteCurtain(go, 'up');
    expect(go).toHaveBeenCalledTimes(1);
    // No cover began — the helper passed straight through.
    expect(useRouteTransitionStore.getState().phase).toBe('idle');
  });
});

describe('route transition store', () => {
  beforeEach(() => {
    useRouteTransitionStore.getState().resetForTests();
    vi.useFakeTimers();
    return () => vi.useRealTimers();
  });

  it('walks idle → covering → revealing → idle through the phase machine', () => {
    const s = useRouteTransitionStore.getState();
    s.beginCover('up');
    expect(useRouteTransitionStore.getState().phase).toBe('covering');
    expect(useRouteTransitionStore.getState().mode).toBe('slide');
    expect(useRouteTransitionStore.getState().direction).toBe('up');

    useRouteTransitionStore.getState().startReveal();
    expect(useRouteTransitionStore.getState().phase).toBe('revealing');

    useRouteTransitionStore.getState().finishReveal();
    expect(useRouteTransitionStore.getState().phase).toBe('idle');
  });

  it('bumps session every cycle so the panel remounts with fresh values', () => {
    const before = useRouteTransitionStore.getState().session;
    useRouteTransitionStore.getState().beginCover('up');
    expect(useRouteTransitionStore.getState().session).toBe(before + 1);
    useRouteTransitionStore.getState().startReveal();
    useRouteTransitionStore.getState().finishReveal();
    useRouteTransitionStore.getState().beginSnapReveal('down');
    expect(useRouteTransitionStore.getState().session).toBe(before + 2);
    expect(useRouteTransitionStore.getState().mode).toBe('snap');
    expect(useRouteTransitionStore.getState().direction).toBe('down');
  });

  it('ignores a cover while another transition is in flight (never queues)', () => {
    useRouteTransitionStore.getState().beginCover('up');
    const session = useRouteTransitionStore.getState().session;
    useRouteTransitionStore.getState().beginCover('down');
    expect(useRouteTransitionStore.getState().session).toBe(session);
    expect(useRouteTransitionStore.getState().direction).toBe('up');
  });

  it('the safety valve reveals a cover whose path never moved (guarded navs)', () => {
    useRouteTransitionStore.getState().beginCover('up');
    expect(useRouteTransitionStore.getState().phase).toBe('covering');
    vi.advanceTimersByTime(REVEAL_SAFETY_MS + 1);
    expect(useRouteTransitionStore.getState().phase).toBe('revealing');
  });

  it('the life ceiling finishes a reveal whose panel callback was lost', () => {
    useRouteTransitionStore.getState().beginSnapReveal('up');
    expect(useRouteTransitionStore.getState().phase).toBe('revealing');
    vi.advanceTimersByTime(REVEAL_MAX_LIFE_MS + 1);
    expect(useRouteTransitionStore.getState().phase).toBe('idle');
  });

  it('startReveal clears the armed safety timer (a confirmed swap owns the cycle)', () => {
    useRouteTransitionStore.getState().beginCover('up');
    useRouteTransitionStore.getState().startReveal();
    // Past the safety window: the reveal is already running, the valve
    // must not disturb it; only the life ceiling may finish it.
    vi.advanceTimersByTime(REVEAL_SAFETY_MS + 1);
    expect(useRouteTransitionStore.getState().phase).toBe('revealing');
  });
});

describe('routeCurtainCopy', () => {
  it('the root path is the brand moment — wordmark over wordmark', () => {
    expect(routeCurtainCopy('/')).toEqual({ eyebrow: WORDMARK, stamp: WORDMARK });
  });

  it('echoes the route registry: title stamps, contextLabel becomes the eyebrow', () => {
    const copy = routeCurtainCopy('/warehouse/42', () => ({
      title: 'Warehouse 42',
      contextLabel: 'inventory',
    }));
    expect(copy).toEqual({ eyebrow: 'INVENTORY', stamp: 'Warehouse 42' });
  });

  it('falls back to the shell routes own header titles — never invents copy', () => {
    expect(routeCurtainCopy('/login')).toEqual({ eyebrow: WORDMARK, stamp: 'Welcome back' });
    expect(routeCurtainCopy('/register')).toEqual({ eyebrow: WORDMARK, stamp: 'Create account' });
    expect(routeCurtainCopy('/forgot-password')).toEqual({ eyebrow: WORDMARK, stamp: 'Reset password' });
    // Registered in armandotfit's consumer registry — stamps from there.
    expect(routeCurtainCopy('/settings')).toEqual({ eyebrow: 'PREFERENCES', stamp: 'Settings' });
  });

  it('an unknown route with no registry entry falls back to the wordmark', () => {
    expect(routeCurtainCopy('/somewhere-else')).toEqual({ eyebrow: WORDMARK, stamp: WORDMARK });
  });

  it('NAV_DELAY stays ahead of the cover travel so the swap commits under ink', () => {
    expect(NAV_DELAY_MS).toBeGreaterThan(150 - 1);
    expect(NAV_DELAY_MS).toBeLessThan(200);
  });
});
