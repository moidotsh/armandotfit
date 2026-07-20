// app/workout-programs.tsx
//
// Phase 3 program templates browser. Lists the known program template
// + its variants. Tapping a variant navigates to the plan preview
// (/plan-preview?variant=X) where the user sees the generated plan
// for their equipment inventory + can adopt it.
//
// Phase 3 ships only the seeded template (arman-fit-commercial-gym-v1)
// with two variants (one-a-day, two-a-day). The variant list is a
// constants-side fallback for first paint; when Phase 4+ adds dynamic
// template discovery this becomes the cache-loading view.

import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  CopyForAiButton,
} from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { safeGoBack, navigateToPlanPreview } from '../navigation';
import { SCREEN_BODY_STYLE, KNOWN_PROGRAM_VARIANTS } from '../constants';
import { useUserPlans, useAiPayload } from '../hooks';

export default function WorkoutProgramsScreen() {
  const { colors } = useAppTheme();
  const plansQuery = useUserPlans();

  const activeVariantSlugs = new Set(
    (plansQuery.data ?? [])
      .filter((p) => p.status === 'active')
      .map((p) => p.variantId),
  );

  const aiPayload = useAiPayload({
    visibleContent: [
      '- Template: Arman Fit Commercial Gym v1',
      `- Variants available: ${KNOWN_PROGRAM_VARIANTS.length}`,
      `- Active plans: ${activeVariantSlugs.size}`,
    ].join('\n'),
  });

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader
        title="Programs"
        eyebrow="Training"
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="workout-programs-copy-for-ai" />}
      />
      <View style={styles.body}>
        <MobileSurface padding={16}>
          <Text style={[styles.templateName, { color: colors.text }]}>
            Arman Fit Commercial Gym v1
          </Text>
          <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
            Four-day commercial-gym hypertrophy program. Two schedule variants below —
            pick one to preview the equipment-aware plan generated from your inventory.
          </Text>
        </MobileSurface>

        <View style={{ height: 16 }} />

        <MobileSectionEyebrow>Schedule variants</MobileSectionEyebrow>
        {KNOWN_PROGRAM_VARIANTS.map((variant) => (
          <Pressable
            key={variant.slug}
            onPress={() => navigateToPlanPreview(variant.slug)}
            style={({ pressed }) => [
              styles.variantCard,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MobileSurface padding={16}>
              <View style={styles.variantHeader}>
                <Text style={[styles.variantName, { color: colors.text }]}>
                  {variant.name}
                </Text>
              </View>
              <Text
                style={[styles.variantDescription, { color: colors.textSecondary }]}
                numberOfLines={4}
              >
                {variant.description}
              </Text>
              <Text style={[styles.cta, { color: colors.brand }]}>
                Preview plan →
              </Text>
            </MobileSurface>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE, paddingHorizontal: 20, paddingTop: 12 },
  templateName: { fontSize: 18, fontWeight: '700' },
  templateDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  variantCard: { marginBottom: 12 },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  variantName: { fontSize: 16, fontWeight: '600' },
  variantDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
});
