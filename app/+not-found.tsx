// app/+not-found.tsx
//
// THE QUIET PAGE's dead end (docs/architecture/quiet-page-thesis.md
// §6): "Nothing runs here." The 404 is the statement (34, in the
// record red — the page's one mark beside the verb), one line of
// copy, one way back. No wordmark, no title stack. Excluded from SB1
// by filename, but it composes ScreenScaffold anyway (the centered
// column + atmosphere read is the same as every other screen).

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenScaffold } from '../components/composed';
import { MobilePrimaryButton } from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { replaceWithHome } from '../navigation';
import { markNotFoundActive, markNotFoundInactive } from '../components/primitives/AuthGuard';
import { GAUGE, theme } from '../constants';

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
      <View style={styles.center} testID="notfound-body">
        <Text style={[styles.statement, { color: colors.brand }]} testID="not-found-hero">
          404
        </Text>
        <Text style={[styles.copy, { color: colors.textMuted }]}>
          Nothing runs here.
        </Text>
        <MobilePrimaryButton onPress={replaceWithHome} style={styles.button}>
          BACK TO HOME
        </MobilePrimaryButton>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    // The dead end rides the same left rule as every page (the
    // scaffold body already carries 16).
    paddingHorizontal: 4,
  },
  statement: {
    ...GAUGE.statement,
  },
  copy: {
    ...theme.typography.mobileItemTitle,
    marginTop: 36,
    marginBottom: 40,
  },
  button: {
    alignSelf: 'stretch' as const,
  },
});
