// app/register.tsx
// Email + password registration. Default auth flow — Supabase
// sends a confirmation email; until the user clicks the link, no
// session exists. The AuthProvider fires `session === null` and the
// user stays on this screen with a "check your inbox" notice.
//
// THE GATE's register page: the action sentence IS the statement
// ("Create account."), the brand dies (the back chevron leads), the
// form sits open on the field, links are underlined ink, the verb is
// ink-filled (touch amendment: one fact, one place — the password
// rule rides the placeholder alone; the verb never wore red).

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileInput,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileAlert,
} from '../components/MobilePremium';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { useAuth, useAppTheme } from '../context';
import { replaceWithLogin, safeGoBack } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_BODY_STYLE, INTERVAL, theme,
  PRESS_DIP
} from '../constants';

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
      <View style={styles.body} testID="register-scroll">
        {/* THE STATEMENT — the action sentence. */}
        <Text style={[styles.statement, { color: colors.text }]}>
          Create account.
        </Text>

        {confirmationNeeded ? (
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
                Already confirmed? <Text style={[styles.helpLinkUnderline, { color: colors.brandText }]}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
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

            <View style={styles.block}>
              <Pressable
                onPress={replaceWithLogin}
                accessibilityRole="link"
                accessibilityLabel="Sign in"
                style={styles.helpLinkBox}
              >
                <Text style={[styles.helpLink, { color: colors.textMuted }]}>
                  Already have an account? <Text style={styles.helpLinkUnderline}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
      {!confirmationNeeded ? (
        <MobileActionFooter>
          <MobilePrimaryButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email || !password || !confirmPassword}
          >
            CREATE ACCOUNT
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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  block: {
    ...INTERVAL.block,
  },
  statement: {
    ...INTERVAL.statement,
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
});
