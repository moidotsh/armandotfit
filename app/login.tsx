// app/login.tsx
// Email + password login. Wires AuthService.signIn via useAuth.
// On success, the central AuthGuard in app/_layout.tsx routes to
// home — no per-screen redirect effect needed.
//
// THE GATE, WELCOME SIDE: the statement greets ("Welcome back.") and
// the verb carries the action; the MODE TOGGLE rides between them and
// the form — one tap to registration for the new lifter, no dead end
// for the returning one (guests funneled here by the logging gates
// flip straight over). Links are RED INK (red's second job); the
// verb is the page's heaviest ink; no nameplate rule.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Dumbbell } from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileInput,
  MobilePrimaryButton,
  MobileAlert,
  SegmentedControl,
} from '../components/MobilePremium';
import { useAuth, useAppTheme } from '../context';
import { navigateToForgotPassword, replaceWithHome, replaceWithRegister } from '../navigation';
import {
  MOBILE_CONTENT_WIDTH_STYLE,
  SCREEN_BODY_STYLE,
  INTERVAL,
  theme,
  PRESS_DIP,
} from '../constants';

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
      {/* The masthead folio — the same brand line as the front page. */}
      <View style={[styles.brandBlock, { paddingTop: insets.top + 16 }]}>
        <View style={styles.brandRow}>
          <Dumbbell size={16} color={colors.text} />
          <Text style={[styles.wordmark, { color: colors.text }]}>
            ARMANDOTFIT
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="login-scroll"
      >
        {/* THE STATEMENT — the greeting; the verb carries the action. */}
        <Text style={[styles.statement, { color: colors.text }]}>
          Welcome back.
        </Text>
        <Text style={[styles.fact, { color: colors.textMuted }]}>
          The iron remembers — every set is where you left it.
        </Text>

        {/* THE MODE TOGGLE — registration one tap away; existing users
            never hunt for their door. */}
        <View style={styles.toggleBlock}>
          <SegmentedControl<string>
            variant="selection"
            segments={[
              { value: 'login', label: 'SIGN IN' },
              { value: 'register', label: 'CREATE ACCOUNT' },
            ]}
            value="login"
            onChange={(v) => {
              if (v === 'register') replaceWithRegister();
            }}
            accessibilityLabel="Sign in or create account"
            testID="auth-mode-toggle"
          />
        </View>

        <View style={styles.block}>
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
            <Text style={[styles.link, { color: colors.brandText }]}>
              Forgot password?
            </Text>
          </Pressable>
          {error ? <MobileAlert variant="error" title="Sign-in failed" body={error} /> : null}
        </View>

        {/* The guest's door — the app browses open; leave the gate and
            go home without an account (the logging gates will be here
            when the lifting gets serious). */}
        <Pressable
          onPress={replaceWithHome}
          accessibilityRole="link"
          accessibilityLabel="Continue as guest"
          style={({ pressed }) => [styles.guestBox, pressed ? { opacity: PRESS_DIP } : null]}
          testID="auth-continue-guest"
        >
          <Text style={[styles.guestWord, { color: colors.textSecondary }]}>
            CONTINUE AS GUEST
          </Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
      {/* THE VERB — bare on the ground (no footer plate: a plate in a
          plate reads as a container in a container; the SafeAreaView's
          bottom edge is the dock). */}
      <View style={styles.verbDock}>
        <MobilePrimaryButton
          onPress={handleSubmit}
          loading={submitting}
          disabled={!email || !password}
        >
          SIGN IN
        </MobilePrimaryButton>
      </View>
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
    // The folio keeps its distance from the statement's halo.
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
  },
  wordmark: {
    ...theme.typography.mobileEyebrow,
  },
  body: {
    ...SCREEN_BODY_STYLE,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  statement: {
    ...INTERVAL.statement,
  },
  fact: {
    ...INTERVAL.fact,
    marginBottom: 8,
  },
  toggleBlock: {
    ...INTERVAL.block,
  },
  block: {
    ...INTERVAL.block,
  },
  linkBox: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  link: {
    ...theme.typography.mobileLedger,
    textDecorationLine: 'underline',
  },
  guestBox: {
    ...INTERVAL.block,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  guestWord: {
    ...theme.typography.mobileEyebrow,
  },
  verbDock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
});
