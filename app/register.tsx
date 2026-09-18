// app/register.tsx
// Email + password registration. Default auth flow — Supabase
// sends a confirmation email; until the user clicks the link, no
// session exists. The AuthProvider fires `session === null` and the
// user stays on this screen with a "check your inbox" notice.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileInput,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileAlert,
} from '../components/MobilePremium';
import { useAuth, useAppTheme } from '../context';
import { replaceWithLogin } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOBILE_CONTENT_WIDTH_STYLE, SCREEN_BODY_STYLE, theme } from '../constants';

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
      <View style={[styles.brandBlock, { paddingTop: insets.top + 24 }]}>
        <Text style={[styles.wordmark, { color: colors.textMuted }]}>
          armandotfit
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Create account
        </Text>
      </View>
      <View style={styles.body}>
        {confirmationNeeded ? (
          <MobileSurface padding={20}>
            <MobileAlert
              variant="success"
              title="Check your inbox"
              body={`We sent a confirmation link to ${email}. Click it to activate your account.`}
            />
            <View style={{ height: 16 }} />
            <Text style={[styles.help, { color: colors.textSecondary }]}>
              Already confirmed?
            </Text>
            <Pressable
              onPress={replaceWithLogin}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              style={styles.helpLinkBox}
            >
              <Text style={[styles.helpLink, { color: colors.brand }]}>Sign in</Text>
            </Pressable>
          </MobileSurface>
        ) : (
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
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              helperText="Use at least 8 characters."
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
          </MobileSurface>
        )}

        {!confirmationNeeded ? (
          <>
            <View style={{ height: 16 }} />
            <Text style={[styles.help, { color: colors.textSecondary }]}>
              Already have an account?
            </Text>
            <Pressable
              onPress={replaceWithLogin}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              style={styles.helpLinkBox}
            >
              <Text style={[styles.helpLink, { color: colors.brand }]}>Sign in</Text>
            </Pressable>
          </>
        ) : null}
      </View>
      {!confirmationNeeded ? (
        <MobileActionFooter>
          <MobilePrimaryButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email || !password || !confirmPassword}
          >
            Create Account
          </MobilePrimaryButton>
        </MobileActionFooter>
      ) : null}
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
  wordmark: {
    fontFamily: theme.fonts.displayCondensed ?? theme.fonts.display,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  title: {
    ...theme.typography.mobileTitle,
  },
  body: {
    ...SCREEN_BODY_STYLE,
    paddingHorizontal: 20,
    paddingTop: 20,
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
