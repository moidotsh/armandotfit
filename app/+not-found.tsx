// app/+not-found.tsx
//
// The honest dead end, wearing the app's voice: the wordmark eyebrow and
// copy that points back at the training surfaces instead of generic
// starter text. Excluded from SB1 by filename, but it composes
// ScreenScaffold anyway (the centered column + atmosphere read is the
// same as every other screen).

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ScreenScaffold } from '../components/composed';
import { EmptyState, MobileSectionEyebrow, MobileSurface } from '../components/MobilePremium';
import { replaceWithHome } from '../navigation';
import { markNotFoundActive, markNotFoundInactive } from '../components/primitives/AuthGuard';

// The honest dead end renders for EVERY visitor — a mistyped URL shows
// this page, never a login wall. The mount effect exempts the screen
// from AuthGuard's redirect (child-before-parent effect ordering — the
// same documented guarantee the /qr screen relies on).
export default function NotFoundScreen() {
  useEffect(() => {
    markNotFoundActive();
    return () => markNotFoundInactive();
  }, []);
  return (
    <ScreenScaffold surface="analytics">
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <MobileSurface padding={20}>
          <MobileSectionEyebrow>armandotfit</MobileSectionEyebrow>
          <View style={{ height: 8 }} />
          <EmptyState
            title="Page not found"
            message="Nothing lives at this address — your program, sessions, and streaks are all still where you left them."
            action={{
              label: 'Back to home',
              onPress: replaceWithHome,
              variant: 'primary',
            }}
          />
        </MobileSurface>
      </View>
    </ScreenScaffold>
  );
}
