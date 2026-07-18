// app/index.tsx
// Home placeholder. Vellum ships a single-CTA surface so the auth →
// home flow is verifiable end-to-end. Consumers replace this with
// their actual home/dashboard route (and re-evaluate gating per the
// §9 decision framework in docs/architecture/mobile-premium-design-system.md).

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
} from '../components/MobilePremium';
import { useAuth, useAppTheme } from '../context';
import { navigateToSettings, navigateToPremiumShowcase } from '../navigation';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.backgroundDeep }]} edges={['top', 'bottom']}>
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title="Vellum"
        eyebrow="Welcome"
      />
      <View style={styles.body}>
        <MobileSectionEyebrow>Getting Started</MobileSectionEyebrow>
        <MobileSurface padding={20}>
          <Text style={[styles.text, { color: colors.text }]}>
            This is vellum&rsquo;s home placeholder. The shell is wired end-to-end:
            auth, navigation, MobilePremium design system, Zustand stores,
            React Query, and the 10-audit pre-commit gate all work.
          </Text>
          <View style={{ height: 12 }} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Signed in as{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>
              {session?.email ?? 'unknown'}
            </Text>
            .
          </Text>
        </MobileSurface>

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Reference</MobileSectionEyebrow>
        <MobileSurface padding={20}>
          <Text style={[styles.text, { color: colors.text }]}>
            Visit the design-system showcase to see every MobilePremium
            primitive and all 7 atmosphere palettes side-by-side. This is
            the visual source of truth for what vellum ships.
          </Text>
          <View style={{ height: 12 }} />
          <MobilePrimaryButton variant="ghost" onPress={navigateToPremiumShowcase}>
            Open Showcase
          </MobilePrimaryButton>
        </MobileSurface>
      </View>
      <MobileActionFooter>
        <MobilePrimaryButton onPress={() => void signOut()}>
          Sign Out
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
