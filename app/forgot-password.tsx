// app/forgot-password.tsx
// Password reset request. Supabase sends a reset link; nothing else
// happens on-device until the user clicks it from their inbox.
//
// THE BOARD PAGE's auth: the action sentence IS the statement
// ("Reset."), the form sits open on the field, links are underlined
// ink, the verb is the one red.

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
import { SCREEN_BODY_STYLE, SCOREBOARD, theme } from '../constants';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await resetPassword(email.trim());
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? 'Reset failed.');
      return;
    }
    setSent(true);
  };

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.backgroundDeep }]} edges={['top', 'bottom']}>
      <MobileAtmosphere surface="auth" />
      <View style={[styles.backBlock, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={safeGoBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backCta, pressed ? { opacity: 0.6 } : null]}
          testID="auth-back"
        >
          <ChevronLeft size={26} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.body} testID="forgot-scroll">
        {/* THE STATEMENT — the action sentence. */}
        <Text style={[styles.statement, { color: colors.text }]}>
          Reset.
        </Text>

        <View style={styles.block}>
          {sent ? (
            <MobileAlert
              variant="success"
              title="Check your inbox"
              body={`We sent a password reset link to ${email}. It expires in 60 minutes.`}
            />
          ) : (
            <>
              <Text style={[styles.help, { color: colors.textMuted }]}>
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
        </View>

        <View style={styles.block}>
          <Pressable
            onPress={replaceWithLogin}
            accessibilityRole="link"
            accessibilityLabel="Back to sign in"
            style={styles.helpLinkBox}
          >
            <Text style={[styles.helpLink, { color: colors.textMuted }]}>
              <Text style={styles.helpLinkUnderline}>Back to sign in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      {!sent ? (
        <MobileActionFooter>
          <MobilePrimaryButton
            onPress={handleSubmit}
            loading={submitting}
            disabled={!email}
          >
            SEND RESET LINK
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
    ...SCOREBOARD.block,
  },
  statement: {
    ...SCOREBOARD.statement,
  },
  help: {
    ...theme.typography.mobileBody,
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
