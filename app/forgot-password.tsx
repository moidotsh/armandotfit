// app/forgot-password.tsx
// Password reset flow. Calls AuthService.resetPassword; Supabase sends
// a reset link to the user's email. The link redirects back to the
// app's configured reset URL (Supabase dashboard setting) where the
// user lands on a "set new password" screen (consumer-implemented).

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

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await resetPassword(email.trim());
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Reset request failed.');
      return;
    }
    setSent(true);
  };

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.backgroundDeep }]} edges={['top', 'bottom']}>
      <MobileAtmosphere surface="auth" />
      <View style={[styles.brandBlock, { paddingTop: insets.top + 24 }]}>
        <Text style={[styles.wordmark, { color: colors.textMuted }]}>
          armandotfit
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Reset password
        </Text>
      </View>
      <View style={styles.body}>
        <MobileSurface padding={20}>
          {sent ? (
            <MobileAlert
              variant="success"
              title="Check your inbox"
              body={`We sent a password reset link to ${email}. It expires in 60 minutes.`}
            />
          ) : (
            <>
              <Text style={[styles.help, { color: colors.textSecondary }]}>
                Enter your email and we&rsquo;ll send a link to reset your password.
              </Text>
              <View style={{ height: 16 }} />
              <MobileInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />
              {error ? (
                <>
                  <View style={{ height: 12 }} />
                  <MobileAlert variant="error" title="Reset failed" body={error} />
                </>
              ) : null}
            </>
          )}
        </MobileSurface>
        <View style={{ height: 16 }} />
        <Pressable
          onPress={replaceWithLogin}
          accessibilityRole="link"
          accessibilityLabel="Back to sign in"
          style={styles.helpLinkBox}
        >
          <Text style={[styles.helpLink, { color: colors.brand }]}>
            Back to sign in
          </Text>
        </Pressable>
      </View>
      {!sent ? (
        <MobileActionFooter>
          <MobilePrimaryButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email}
          >
            Send Reset Link
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
    fontFamily: theme.fonts.display,
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
