import { describe, it, expect, beforeEach } from 'vitest';
import { useRestStore, REST_MAX_SEC } from '../../stores';

// THE REST INSTRUMENT's behavior tests (carried over verbatim from
// the retired GaugeFigures suite — the instrument's behavior is
// precious and survives every redesign; scoreboard-thesis §7).

describe('the rest instrument store', () => {
  beforeEach(() => {
    useRestStore.setState({ endsAt: null });
  });

  it('starts a rest at the default when no seconds are given', () => {
    useRestStore.getState().startRest();
    const endsAt = useRestStore.getState().endsAt;
    expect(endsAt).toBeGreaterThan(Date.now());
    expect(endsAt! - Date.now()).toBeLessThanOrEqual(REST_MAX_SEC * 1000);
  });

  it('adjusts a running rest by the delta', () => {
    useRestStore.getState().startRest(90);
    const before = useRestStore.getState().endsAt!;
    useRestStore.getState().adjustRest(15);
    const after = useRestStore.getState().endsAt!;
    expect(after - before).toBeGreaterThanOrEqual(14_000);
    expect(after - before).toBeLessThanOrEqual(16_000);
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
