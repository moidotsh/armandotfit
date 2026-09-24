// app/register.tsx
// Email + password registration. Default auth flow — Supabase
// sends a confirmation email; until the user clicks the link, no
// session exists. The AuthProvider fires `session === null` and the
// user stays on this screen with a "check your inbox" notice.
//
// THE GATE, PITCH SIDE: the statement is the promise ("Every set,
// remembered.") and THE PITCH carries the three facts of the product
// — the program, the logger, the numbers — in the app's own
// whisper-and-fact grammar. The MODE TOGGLE sits between pitch and
// form: an existing lifter flips to SIGN IN without reading a pitch
// twice. Links are underlined ink; the verb is ink-filled.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileInput,
  MobilePrimaryButton,
  MobileAlert,
  SegmentedControl,
} from '../components/MobilePremium';
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons-2';
import { useAuth, useAppTheme } from '../context';
import { replaceWithHome, replaceWithLogin, safeGoBack } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_BODY_STYLE, INTERVAL, theme, PRESS_DIP } from '../constants';

/** THE PITCH — the product in three facts, the app's own grammar. */
const PITCH: ReadonlyArray<{ whisper: string; fact: string }> = [
  {
    whisper: 'THE PROGRAM',
    fact: 'Four days a week, the whole body — one-a-day or AM/PM.',
  },
  {
    whisper: 'THE LOGGER',
    fact: 'One field. The set is logged before the chalk settles.',
  },
  {
    whisper: 'THE NUMBERS',
    fact: 'PRs, streaks, and the next plate jump — computed, not guessed.',
  },
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    const result = await signUp(email.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Sign-up failed.');
      return;
    }
    // signUp returns success: true + session: undefined when Supabase
    // requires email confirmation. Route to a "check inbox" state.
    setConfirmationNeeded(true);
  };

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.backgroundDeep }]} edges={['top', 'bottom']}>
      <MobileAtmosphere surface="auth" />
      <View style={[styles.backBlock, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={safeGoBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backCta, pressed ? { opacity: PRESS_DIP } : null]}
          testID="auth-back"
        >
          <ChevronLeft size={26} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="register-scroll"
      >
        {/* THE STATEMENT — the promise; the pitch facts carry the rest. */}
        <Text style={[styles.statement, { color: colors.text }]}>
          Every set, remembered.
        </Text>

        {!confirmationNeeded ? (
          <>
            {/* THE PITCH — three facts in the app's own grammar (the
                program cards' whisper + fact lines). */}
            <View style={styles.pitchBlock} testID="register-pitch">
              {PITCH.map((row) => (
                <View key={row.whisper} style={styles.pitchRow}>
                  <Text style={[styles.pitchWhisper, { color: colors.textMuted }]}>
                    {row.whisper}
                  </Text>
                  <Text style={[styles.pitchFact, { color: colors.textSecondary }]}>
                    {row.fact}
                  </Text>
                </View>
              ))}
            </View>

            {/* THE MODE TOGGLE — the returning lifter's door, one tap
                away; the guest funnel never annoys them with a pitch. */}
            <View style={styles.toggleBlock}>
              <SegmentedControl<string>
                variant="selection"
                segments={[
                  { value: 'login', label: 'SIGN IN' },
                  { value: 'register', label: 'CREATE ACCOUNT' },
                ]}
                value="register"
                onChange={(v) => {
                  if (v === 'login') replaceWithLogin();
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
                placeholder="At least 8 characters"
                secureTextEntry
                autoComplete="new-password"
              />
              <View style={{ height: 12 }} />
              <MobileInput
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                secureTextEntry
                autoComplete="new-password"
              />
              {error ? (
                <>
                  <View style={{ height: 12 }} />
                  <MobileAlert variant="error" title="Sign-up failed" body={error} />
                </>
              ) : null}
            </View>

            {/* The guest's door — same as the login side. */}
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
          </>
        ) : (
          <View style={styles.block}>
            <MobileAlert
              variant="success"
              title="Check your inbox"
              body={`We sent a confirmation link to ${email}. Click it to activate your account.`}
            />
            <View style={{ height: 16 }} />
            <Pressable
              onPress={replaceWithLogin}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              style={styles.helpLinkBox}
            >
              <Text style={[styles.helpLink, { color: colors.textMuted }]}>
                Already confirmed?{' '}
                <Text style={[styles.helpLinkUnderline, { color: colors.brandText }]}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      {/* THE VERB — bare on the ground (no footer plate; see login). */}
      {!confirmationNeeded ? (
        <View style={styles.verbDock}>
          <MobilePrimaryButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email || !password || !confirmPassword}
          >
            CREATE ACCOUNT
          </MobilePrimaryButton>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  backBlock: {
    paddingHorizontal: 8,
  },
  backCta: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  pitchBlock: {
    ...INTERVAL.block,
    gap: 10,
  },
  pitchRow: {
    minHeight: 20,
  },
  pitchWhisper: {
    ...theme.typography.mobileEyebrow,
  },
  pitchFact: {
    ...theme.typography.mobileLedger,
    marginTop: 2,
  },
  toggleBlock: {
    ...INTERVAL.block,
  },
  block: {
    ...INTERVAL.block,
  },
  helpLinkBox: {
    minHeight: 44,
    justifyContent: 'center',
  },
  helpLink: {
    ...theme.typography.mobileItemTitle,
  },
  helpLinkUnderline: {
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
