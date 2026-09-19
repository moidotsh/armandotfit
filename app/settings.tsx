// app/settings.tsx
// THE BOARD PAGE's colophon (docs/architecture/
// quiet-page-thesis.md §6): "This is how it's set." No nameplate, no
// email kicker, no info panel, no section chrome — the current theme
// IS the statement (restating with every pick); the preference rows
// keep their ink-invert selection; the rest-day measure keeps its
// struck marks; install/version ride as single rows; Sign Out is the
// page's one verb.

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from '@tamagui/lucide-icons-2';
import {
  MobileActionFooter,
  MobilePrimaryButton,
} from '../components/MobilePremium';
import { BoardShell } from '../components/composed';
import { useAuth, useAppTheme, type ColorSchemePreference } from '../context';
import { navigateToPremiumShowcase, safeGoBack } from '../navigation';
import { useProfile, useUpdateProfile, usePwaPrompt } from '../hooks';
import { DAY_OF_WEEK_LABELS, BLOCK_GAP, BOARD, theme } from '../constants';
import { useToast } from '../context';
import { logger } from '../utils/logger';

const PREFERENCE_LABELS: Record<ColorSchemePreference, string> = {
  light: 'Paper',
  dark: 'Evening',
  system: 'System',
};

const PREFERENCE_ORDER: ColorSchemePreference[] = ['light', 'dark', 'system'];

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { preference, setPreference, colors } = useAppTheme();
  const { showToast } = useToast();
  const pwaPrompt = usePwaPrompt();
  // The showcase route only exists where dev surfaces do — linking it
  // from a production build would land on the stubbed blank route.
  const devSurfaces = process.env.EXPO_PUBLIC_DEV_SURFACES === '1';

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

  return (
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="colophon-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {/* THE STATEMENT — how it's set, restating with every pick. */}
      <View>
        <Text style={[styles.statement, { color: colors.text }]}>
          {PREFERENCE_LABELS[preference]}
        </Text>
      </View>

      {/* The theme trio — ink-invert selection, no panel, no rules. */}
      <View style={styles.block}>
        {PREFERENCE_ORDER.map((pref) => {
          const isActive = preference === pref;
          return (
            <Pressable
              key={pref}
              onPress={() => setPreference(pref)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.preferenceRow,
                pressed ? { opacity: 0.6 } : null,
              ]}
            >
              <Text style={[styles.preferenceLabel, { color: colors.text }]}>
                {PREFERENCE_LABELS[pref]}
              </Text>
              <View
                style={[
                  styles.preferenceRadio,
                  {
                    // Selection = inversion (ink fill, page-colored
                    // check), matching the funnel's picked tile —
                    // not a brand disc.
                    borderColor: isActive ? colors.text : colors.border,
                    backgroundColor: isActive ? colors.text : 'transparent',
                  },
                ]}
              >
                {isActive ? (
                  <Check size={12} color={colors.background} strokeWidth={3} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Rest days — the seven-mark measure; a rest day is struck. */}
      <View style={styles.block}>
        <Text style={[styles.whisper, { color: colors.textMuted }]}>
          REST DAYS
        </Text>
        <View style={styles.restDayRow}>
          {DAY_OF_WEEK_LABELS.map((d) => {
            const isRest = restDayIds.includes(String(d.id));
            return (
              <Pressable
                key={d.id}
                onPress={() => handleToggleRestDay(String(d.id))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isRest }}
                accessibilityLabel={`${d.label} rest day`}
                style={({ pressed }) => [
                  styles.restDayTile,
                  {
                    backgroundColor: isRest ? colors.text : colors.glass.inputBackground,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                testID={`rest-day-${d.id}`}
              >
                <Text
                  style={[
                    styles.restDayLabel,
                    { color: isRest ? colors.background : colors.text },
                  ]}
                >
                  {d.label.slice(0, 2)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {pwaPrompt.shouldShow ? (
        <View style={styles.block}>
          <ColophonRow
            label="Install app"
            value="How?"
            onPress={() => {
              showToast(
                'info',
                pwaPrompt.platform === 'ios'
                  ? 'Safari: Share → Add to Home Screen'
                  : 'Chrome: ⋮ menu → Install app',
              );
              pwaPrompt.dismiss();
            }}
          />
        </View>
      ) : null}

      <View style={styles.block}>
        {devSurfaces ? (
          <ColophonRow
            label="Design system"
            value="View"
            onPress={navigateToPremiumShowcase}
          />
        ) : null}
        <ColophonRow label="Version" value="0.1.0" />
      </View>

      <View style={styles.block}>
        <Text style={[styles.signedInAs, { color: colors.textMuted }]} numberOfLines={1}>
          {`signed in as ${session?.email ?? '—'}`}
        </Text>
      </View>

      <View style={styles.block}>
        <MobileActionFooter>
          <MobilePrimaryButton onPress={() => void signOut()}>Sign Out</MobilePrimaryButton>
        </MobileActionFooter>
      </View>
    </BoardShell>
  );
}

/** One colophon row: label at row scale, value whispering right. */
function ColophonRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const body = (
    <>
      <Text style={[styles.colophonLabel, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.colophonValue, { color: colors.textMuted }]} numberOfLines={1}>
        {value}
      </Text>
    </>
  );
  if (!onPress) {
    return <View style={styles.colophonRow}>{body}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.colophonRow, pressed ? { opacity: 0.6 } : null]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 140,
  },
  block: {
    ...BOARD.block,
  },
  statement: {
    ...BOARD.statement,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
  },
  preferenceLabel: {
    flex: 1,
    // Row titles read in the platform sans (body voice) — the display
    // face is for statements, not settings labels.
    ...theme.typography.mobileItemTitle,
  },
  preferenceRadio: {
    width: 22,
    height: 22,
    borderRadius: theme.shapes.tile,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whisper: {
    ...BOARD.whisper,
    marginBottom: 8,
  },
  // The rest-day MEASURE — seven marks; a rest day is a struck mark
  // (selection is ink inversion, never brand). Square-cut, agate
  // letters.
  restDayRow: {
    flexDirection: 'row',
    gap: 4,
  },
  restDayTile: {
    flex: 1,
    height: 44,
    borderRadius: theme.shapes.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayLabel: {
    ...theme.typography.mobileTag,
    letterSpacing: 0.4,
  },
  signedInAs: {
    ...theme.typography.mobileLedger,
  },
  colophonRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colophonLabel: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  colophonValue: {
    ...theme.typography.mobileLedger,
  },
});
