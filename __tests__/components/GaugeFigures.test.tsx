import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../context';
import { PinRail, SetPips, FlipTile, RollingCounter, formatLoad } from '../../components/composed';
import { useRestStore, REST_MAX_SEC } from '../../stores';

const renderUi = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

// The RN mock surfaces `testID` as the lowercase `testid` attribute
// (no data-testid mapping in jsdom — see __mocks__/react-native.ts).
const byTestId = (id: string) => document.querySelector(`[testid="${id}"]`);
const countTestId = (prefix: string) =>
  document.querySelectorAll(`[testid^="${prefix}"]`).length;

// THE GAUGE's figure language (docs/architecture/gauge-thesis.md
// §10): DOM-truth assertions — the rail's ticks + pin + fill, the
// pips' count law, the flip tile's word, the roller's digits — all
// static-safe in jsdom (reduced-motion paths render final state).

describe('PinRail', () => {
  it('draws an engaged fill and the pin', () => {
    renderUi(<PinRail kg={62.5} scale="row" testID="rail" />);
    expect(byTestId('rail-fill')).toBeTruthy();
    expect(byTestId('rail-pin')).toBeTruthy();
  });

  it('carries no words at counter scale (the digits beside it are the number)', () => {
    renderUi(<PinRail kg={0} scale="counter" testID="crail" />);
    expect(byTestId('crail-label')).toBeNull();
    expect(byTestId('crail-max')).toBeNull();
    expect(byTestId('crail-pin')).toBeTruthy();
  });

  it('speaks its load in the accessibility label', () => {
    renderUi(<PinRail kg={60} scale="row" />);
    // jsdom surfaces accessibilityRole="image" verbatim (RN-web maps
    // it to ARIA "img" in production; the mock does not).
    expect(screen.getByRole('image', { name: /load 60 kilograms/i })).toBeTruthy();
  });
});

describe('formatLoad', () => {
  it('renders without trailing zeros and BW for bodyweight', () => {
    expect(formatLoad(60)).toBe('60');
    expect(formatLoad(62.5)).toBe('62.5');
    expect(formatLoad(0)).toBe('BW');
    expect(formatLoad(-1)).toBe('BW');
  });
});

describe('SetPips', () => {
  it('draws exactly `total` pips (pip count == set count)', () => {
    renderUi(<SetPips done={3} total={4} testID="pips" />);
    expect(countTestId('pips-pip-')).toBe(4);
  });

  it('extends the live pip beyond the ask when extra sets land', () => {
    const { unmount } = renderUi(<SetPips done={5} total={5} live testID="a" />);
    unmount();
    renderUi(<SetPips done={5} total={4} live testID="b" />);
    expect(countTestId('b-pip-')).toBe(6);
  });

  it('speaks done-of-total in the accessibility label', () => {
    renderUi(<SetPips done={2} total={4} />);
    expect(screen.getByRole('image', { name: '2 of 4 sets done' })).toBeTruthy();
  });
});

describe('FlipTile', () => {
  it('renders the authored caps word', () => {
    renderUi(<FlipTile word="NOW" tone="ink" testID="tile" />);
    expect(byTestId('tile')?.textContent).toBe('NOW');
  });

  it('swaps the word on change (the flip midpoint carries it)', async () => {
    const { rerender } = renderUi(<FlipTile word="NEXT" testID="tile" />);
    expect(byTestId('tile')?.textContent).toBe('NEXT');
    rerender(
      <ThemeProvider>
        <FlipTile word="DONE·4" testID="tile" />
      </ThemeProvider>,
    );
    // The word swaps at the flip's midpoint (55ms) — post-interactive,
    // never blocking: the tile is already showing; only the word is
    // deferred to the far edge of the rotation.
    await waitFor(() => expect(byTestId('tile')?.textContent).toBe('DONE·4'));
  });
});

describe('RollingCounter', () => {
  it('renders a rolling column per digit with static separators', () => {
    renderUi(<RollingCounter value="62.5" testID="roll" />);
    // Digits 6, 2, 5 roll (columns); the '.' separates (static text).
    expect(byTestId('roll-digit-0')).toBeTruthy();
    expect(byTestId('roll-digit-1')).toBeTruthy();
    expect(byTestId('roll-digit-3')).toBeTruthy();
    expect(byTestId('roll-digit-2')).toBeNull();
    expect(byTestId('roll')?.textContent).toContain('.');
  });
});

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
