import { describe, it, expect, beforeEach } from 'vitest';
import { useRestStore, REST_MAX_SEC } from '../../stores';

// THE REST CLOCK's behavior tests (carried over from the retired
// GaugeFigures suite; scoreboard-thesis §7) — the clock starts at
// the one default interval, dismisses, and never overshoots the
// ceiling. No adjust tests: the clock answers to nobody.

describe('the rest clock store', () => {
  beforeEach(() => {
    useRestStore.setState({ endsAt: null });
  });

  it('starts a rest at the default when no seconds are given', () => {
    useRestStore.getState().startRest();
    const endsAt = useRestStore.getState().endsAt;
    expect(endsAt).toBeGreaterThan(Date.now());
    expect(endsAt! - Date.now()).toBeLessThanOrEqual(REST_MAX_SEC * 1000);
  });

  it('dismisses', () => {
    useRestStore.getState().startRest(90);
    useRestStore.getState().dismissRest();
    expect(useRestStore.getState().endsAt).toBeNull();
  });

  it('clamps to the ceiling', () => {
    useRestStore.getState().startRest(REST_MAX_SEC + 500);
    expect(useRestStore.getState().endsAt! - Date.now()).toBeLessThanOrEqual(REST_MAX_SEC * 1000);
  });
});
