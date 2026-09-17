// __tests__/components/MobileAbsorbBar.test.tsx
//
// Render smoke for the absorbing top bar. The liquid engine is
// web-motion territory the DOM can't honor (the provider gates itself
// out of NODE_ENV=test), so the contract pinned here is the SHAPE: the
// provider mounts, stations render their children, the bar renders its
// inert strip, and the tone reads neutral at rest — plus the pure
// colour math the stations are registered with.

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from 'react-native';
import { ThemeProvider } from '../../context';
import {
  AbsorbProvider,
  AbsorbTopBar,
  AbsorbSpacer,
  AbsorbStation,
  compositeWash,
  dimmedOver,
} from '../../components/MobilePremium/MobileAbsorbBar';

describe('MobileAbsorbBar render shape', () => {
  it('mounts provider + bar + stations; children render; the engine stays dormant in DOM tests', () => {
    render(
      <ThemeProvider>
        <AbsorbProvider>
          <AbsorbTopBar />
          <AbsorbSpacer />
          <AbsorbStation color="#123456">
            <Text>station child</Text>
          </AbsorbStation>
        </AbsorbProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText('station child')).toBeTruthy();
    // The inert strip mounts (RN-web renders testID as the bare
    // `testid` attribute — not DTL's data-testid default).
    expect(document.querySelector('view[testid="absorb-bar"]')).toBeTruthy();
    expect(document.querySelector('view[testid="absorb-station"]')).toBeTruthy();
  });
});

describe('compositeWash', () => {
  it('flattens a translucent wash over the page colour — the colour the card READS', () => {
    // brandMuted-style wash: red at 50% over white reads as light red.
    expect(compositeWash('rgba(255, 0, 0, 0.5)', '#FFFFFF')).toBe('#ff8080');
    // An opaque wash passes its own colour through.
    expect(compositeWash('rgba(10, 20, 30, 1)', '#FFFFFF')).toBe('#0a141e');
    // A non-parseable wash falls back to the page colour, never NaNs.
    expect(compositeWash('not-a-color', '#0F172A')).toBe('#0F172A');
  });
});

describe('dimmedOver', () => {
  it('composites a dimmed surface over the page — a stepped-back card absorbs as the grey it is', () => {
    expect(dimmedOver('#FFFFFF', 0.5, '#000000')).toBe('#808080');
    expect(dimmedOver('#FFFFFF', 0, '#0F172A')).toBe('#0f172a');
    expect(dimmedOver('#FFFFFF', 1, '#0F172A')).toBe('#ffffff');
  });
});
