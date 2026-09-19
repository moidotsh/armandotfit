// app/login.tsx
// Email + password login. Wires AuthService.signIn via useAuth.
// On success, the central AuthGuard in app/_layout.tsx routes to
// home — no per-screen redirect effect needed.
//
// THE BOARD PAGE's auth: the action sentence IS the statement ("Sign
// in."), the brand rides a folio line (same masthead as home), the
// form sits open on the field (no panel), links are underlined ink,
// and the verb is the page's one red. No nameplate rule.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell } from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileInput,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileAlert,
} from '../components/MobilePremium';
import { useAuth, useAppTheme } from '../context';
import { navigateToRegister, navigateToForgotPassword } from '../navigation';
import {
  MOBILE_CONTENT_WIDTH_STYLE,
  SCREEN_BODY_STYLE,
  BOARD,
  theme,
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
      <View style={styles.body} testID="login-scroll">
        {/* THE STATEMENT — the action sentence. */}
        <Text style={[styles.statement, { color: colors.text }]}>
          Sign in.
        </Text>

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
            <Text style={[styles.link, { color: colors.text }]}>
              Forgot password?
            </Text>
          </Pressable>
          {error ? <MobileAlert variant="error" title="Sign-in failed" body={error} /> : null}
        </View>

        <View style={styles.block}>
          <Pressable
            onPress={navigateToRegister}
            accessibilityRole="link"
            accessibilityLabel="Create an account"
            style={styles.helpLinkBox}
          >
            <Text style={[styles.helpLink, { color: colors.textMuted }]}>
              New here? <Text style={styles.helpLinkUnderline}>Create an account</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      <MobileActionFooter>
        <MobilePrimaryButton
          onPress={handleSubmit}
          loading={submitting}
          disabled={!email || !password}
        >
          SIGN IN
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
    fontFamily: theme.fonts.display,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.8,
  },
  body: {
    ...SCREEN_BODY_STYLE,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  block: {
    ...BOARD.block,
  },
  statement: {
    ...BOARD.statement,
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
