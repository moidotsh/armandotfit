// app/login.tsx
// Email + password login. Wires AuthService.signIn via useAuth.
// On success, the central AuthGuard in app/_layout.tsx routes to
// home — no per-screen redirect effect needed.
//
// The auth page speaks the logbook voice: the wordmark in the display
// face + the screen title at poster scale lead; the form rides the
// page's one sheet beneath.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileInput,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileAlert,
} from '../components/MobilePremium';
import { useAuth, useAppTheme } from '../context';
import { navigateToRegister, navigateToForgotPassword } from '../navigation';
import { MOBILE_CONTENT_WIDTH_STYLE, SCREEN_BODY_STYLE, theme } from '../constants';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Sign-in failed.');
    }
    // On success, the central AuthGuard in _layout.tsx redirects home.
  };

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.backgroundDeep }]} edges={['top', 'bottom']}>
      <MobileAtmosphere surface="auth" />
      <View style={[styles.brandBlock, { paddingTop: insets.top + 24 }]}>
        <Text style={[styles.wordmark, { color: colors.text }]}>
          ARMANDOTFIT
        </Text>
        <View style={[styles.wordmarkRule, { backgroundColor: colors.brand }]} />
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome back
        </Text>
      </View>
      <View style={styles.body}>
        <MobileSurface padding={20}>
          <MobileInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
          />
          <View style={{ height: 12 }} />
          <MobileInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
          />
          <View style={{ height: 4 }} />
          <Pressable
            onPress={navigateToForgotPassword}
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
            style={styles.linkBox}
          >
            <Text style={[styles.link, { color: colors.brand }]}>
              Forgot password?
            </Text>
          </Pressable>
          {error ? (
            <View style={{ height: 12 }} />
          ) : null}
          {error ? <MobileAlert variant="error" title="Sign-in failed" body={error} /> : null}
        </MobileSurface>

        <View style={{ height: 16 }} />
        <Text style={[styles.help, { color: colors.textSecondary }]}>
          New here?
        </Text>
        <Pressable
          onPress={navigateToRegister}
          accessibilityRole="link"
          accessibilityLabel="Create an account"
          style={styles.helpLinkBox}
        >
          <Text style={[styles.helpLink, { color: colors.brand }]}>
            Create an account
          </Text>
        </Pressable>
      </View>
      <MobileActionFooter>
        <MobilePrimaryButton
          onPress={handleSubmit}
          loading={submitting}
          disabled={!email || !password}
        >
          Sign In
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  brandBlock: {
    ...MOBILE_CONTENT_WIDTH_STYLE,
    paddingHorizontal: 20,
    gap: 4,
  },
  wordmarkRule: {
    // The boot plate's mark: a 2px signal rule UNDER the wordmark,
    // left-anchored to it — the brand moment, once, quietly. Centered,
    // it floated detached between two left-set lines.
    width: 72,
    height: 2,
    marginTop: 8,
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  wordmark: {
    fontFamily: theme.fonts.display,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: 0.6,
  },
  title: {
    // The auth statement at headline scale (the wordmark above is the
    // folio masthead; the rule beneath it is the paper's red nameplate
    // rule — the one brand mark beside the verb).
    ...theme.typography.mobileDisplay,
  },
  body: {
    ...SCREEN_BODY_STYLE,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  linkBox: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  link: {
    ...theme.typography.mobileAction,
  },
  help: {
    ...theme.typography.mobileSubtitle,
    textAlign: 'center',
  },
  helpLinkBox: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  helpLink: {
    ...theme.typography.mobileAction,
  },
});
