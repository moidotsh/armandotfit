// app/settings.tsx
// Settings list. Arqavellum ships the cross-cutting settings rows every
// consumer needs (account identity, theme toggle, sign-out). Domain
// settings (e.g. notification preferences, training config) land in
// consumer-extended surfaces.

import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Moon, Monitor, Check } from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  MobileSettingsRow,
  MobileActionFooter,
  MobilePrimaryButton,
  MobileSelectionList,
  CopyForAiButton,
} from '../components/MobilePremium';
import { useAuth, useAppTheme, type ColorSchemePreference } from '../context';
import { navigateToPremiumShowcase, navigateToEquipmentInventory, navigateToSetupPresets, safeGoBack } from '../navigation';
import { useProfile, useUpdateProfile, useAiPayload } from '../hooks';
import { DAY_OF_WEEK_LABELS, SCREEN_BODY_STYLE } from '../constants';
import { logger } from '../utils/logger';

const PREFERENCE_LABELS: Record<ColorSchemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const PREFERENCE_ORDER: ColorSchemePreference[] = ['light', 'dark', 'system'];

function PreferenceIcon({ pref, color }: { pref: ColorSchemePreference; color: string }) {
  const size = 18;
  switch (pref) {
    case 'light':
      return <Sun size={size} color={color} />;
    case 'dark':
      return <Moon size={size} color={color} />;
    case 'system':
      return <Monitor size={size} color={color} />;
  }
}

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { preference, setPreference, colorScheme, colors } = useAppTheme();
  const accent = colors.brand;

  // Rest-days multi-select state. Reads from the profile cache; mutates
  // via the patch-profile mutation, which optimistically updates the
  // cache so the toggle feels instant.
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const restDays = profileQuery.data?.restDays ?? [];

  const handleToggleRestDay = useCallback(
    (id: string) => {
      const dow = Number(id);
      if (!Number.isInteger(dow) || dow < 0 || dow > 6) return;
      const next = restDays.includes(dow)
        ? restDays.filter((d) => d !== dow)
        : [...restDays, dow].sort((a, b) => a - b);
      updateProfile.mutate({ restDays: next }, {
        onError: (err) => {
          logger.warn('mutations', 'rest-day update failed:', err.message);
        },
      });
    },
    [restDays, updateProfile],
  );

  const restDayIds = restDays.map(String);

  const aiPayload = useAiPayload({
    visibleContent: [
      `- Email: ${session?.email ?? '—'}`,
      `- Theme: ${colorScheme}${preference !== colorScheme ? ` (preference: ${preference})` : ''}`,
      `- Rest days: ${restDays.length}`,
    ].join('\n'),
  });

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title="Settings"
        eyebrow="Account"
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="settings-copy-for-ai" />}
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <MobileSurface padding={0}>
          <MobileSettingsRow label="Email" value={session?.email ?? '—'} />
          <MobileSettingsRow
            label="Resolved theme"
            value={colorScheme === 'dark' ? 'Dark' : 'Light'}
            isLast
          />
        </MobileSurface>

        <MobileSectionEyebrow flush={false}>Appearance</MobileSectionEyebrow>
        <MobileSurface padding={0}>
          {PREFERENCE_ORDER.map((pref, i) => {
            const isActive = preference === pref;
            return (
              <Pressable
                key={pref}
                onPress={() => setPreference(pref)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.preferenceRow,
                  i === PREFERENCE_ORDER.length - 1
                    ? null
                    : {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.mobilePremium.hairlineBorder,
                      },
                  pressed ? { opacity: 0.6 } : null,
                ]}
              >
                <View style={[styles.preferenceIconBox, { backgroundColor: `${accent}10` }]}>
                  <PreferenceIcon pref={pref} color={accent} />
                </View>
                <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                  {PREFERENCE_LABELS[pref]}
                </Text>
                <View
                  style={[
                    styles.preferenceRadio,
                    {
                      borderColor: isActive ? accent : colors.border,
                      backgroundColor: isActive ? accent : 'transparent',
                    },
                  ]}
                >
                  {isActive ? (
                    <Check size={12} color={colors.textOnBrand} strokeWidth={3} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </MobileSurface>

        <MobileSectionEyebrow flush={false}>Training</MobileSectionEyebrow>
        <MobileSurface>
          <MobileSelectionList
            multiSelect
            selectedIds={restDayIds}
            onSelect={handleToggleRestDay}
            options={DAY_OF_WEEK_LABELS.map((d) => ({
              id: String(d.id),
              label: d.label,
            }))}
          />
        </MobileSurface>
        <Text style={[styles.sectionHint, { color: colors.textColors.tertiary }]}>
          Rest days are visually deactivated in the workout-day picker. The
          cycle counter ignores them — it only advances when you log a workout.
        </Text>

        <MobileSectionEyebrow flush={false}>Equipment</MobileSectionEyebrow>
        <MobileSurface padding={0}>
          <MobileSettingsRow
            label="Equipment Inventory"
            value="Edit"
            onPress={navigateToEquipmentInventory}
          />
          <MobileSettingsRow
            label="Setup Presets"
            value="Manage"
            onPress={navigateToSetupPresets}
            isLast
          />
        </MobileSurface>
        <Text style={[styles.sectionHint, { color: colors.textColors.tertiary }]}>
          Tell us what equipment you have access to. Your selections power
          exercise eligibility (Phase 3) without touching your manual
          equipment entries.
        </Text>
        <Text style={[styles.sectionHint, { color: colors.textColors.tertiary }]}>
          Save your usual grip, attachment, and station combinations as
          reusable presets (Phase 6). Compatible presets surface in the
          active workout for one-tap apply.
        </Text>

        <MobileSectionEyebrow flush={false}>Reference</MobileSectionEyebrow>
        <MobileSurface padding={0}>
          <MobileSettingsRow
            label="Design System Showcase"
            value="View"
            onPress={navigateToPremiumShowcase}
          />
          <MobileSettingsRow label="Version" value="0.1.0" isLast />
        </MobileSurface>
      </ScrollView>
      <MobileActionFooter>
        <MobilePrimaryButton onPress={() => void signOut()}>Sign Out</MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  body: {
    ...SCREEN_BODY_STYLE,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
    gap: 12,
  },
  preferenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  preferenceRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHint: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
