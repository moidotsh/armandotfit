// app/+not-found.tsx
//
// The honest dead end, wearing the logbook voice (docs/architecture/
// logbook-thesis.md §7): the 404 itself is the hero figure, the copy
// points back at the training surfaces, the wordmark murmurs above.
// Excluded from SB1 by filename, but it composes ScreenScaffold anyway
// (the centered column + atmosphere read is the same as every other
// screen).

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenScaffold } from '../components/composed';
import { Figure, MobilePrimaryButton } from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { replaceWithHome } from '../navigation';
import { markNotFoundActive, markNotFoundInactive } from '../components/primitives/AuthGuard';
import { theme } from '../constants';

// The honest dead end renders for EVERY visitor — a mistyped URL shows
// this page, never a login wall. The mount effect exempts the screen
// from AuthGuard's redirect (child-before-parent effect ordering — the
// same documented guarantee the /qr screen relies on).
export default function NotFoundScreen() {
  const { colors } = useAppTheme();
  useEffect(() => {
    markNotFoundActive();
    return () => markNotFoundInactive();
  }, []);
  return (
    <ScreenScaffold surface="analytics">
      <View style={styles.center}>
        <Text style={[styles.wordmark, { color: colors.textMuted }]}>
          ARMANDOTFIT
        </Text>
        <Figure value="404" size="hero" tone="brand" testID="not-found-hero" />
        <Text style={[styles.title, { color: colors.text }]}>
          Page not found
        </Text>
        <Text style={[styles.copy, { color: colors.textSecondary }]}>
          Nothing lives at this address — your program, sessions, and streaks are all still where you left them.
        </Text>
        <MobilePrimaryButton onPress={replaceWithHome} style={styles.button}>
          Back to home
        </MobilePrimaryButton>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  wordmark: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 24,
    letterSpacing: 0.6,
  },
  title: {
    ...theme.typography.mobileTitle,
    marginTop: 16,
  },
  copy: {
    ...theme.typography.mobileBody,
    marginTop: 8,
    marginBottom: 28,
  },
  button: {
    alignSelf: 'stretch' as const,
  },
});
