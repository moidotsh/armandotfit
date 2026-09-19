// app/settings.tsx
// THE PANEL — the scoreboard's colophon (docs/architecture/
// scoreboard-thesis.md §8): "This is how it's set." No nameplate, no
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
import { useProfile, useUpdateProfile, usePwaPrompt, useRecentSessionDetails } from '../hooks';
import { DAY_OF_WEEK_LABELS, BLOCK_GAP, INTERVAL, theme } from '../constants';
import { useToast } from '../context';
import { useRestStore, useDeloadStore } from '../stores';
import { logger } from '../utils/logger';
import type { WeightUnit } from '../shared/types';

const PREFERENCE_LABELS: Record<ColorSchemePreference, string> = {
  light: 'Card',
  dark: 'Board',
  system: 'System',
};

const PREFERENCE_ORDER: ColorSchemePreference[] = ['light', 'dark', 'system'];

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { preference, setPreference, colors } = useAppTheme();
  const { showToast } = useToast();
  // THE DELOAD WEEK — a persisted UI flag: while on, the Floor's
  // TARGET rests at the Rx low end and the earned-load suggestion is
  // off (the program itself never changes).
  const deload = useDeloadStore((s) => s.active);
  const setDeload = useDeloadStore((s) => s.setActive);
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

  // THE WEIGHT UNIT — the display conversion preference (kg storage
  // throughout; utils/weight.ts owns the arithmetic).
  const weightUnit = profileQuery.data?.weightUnit ?? 'kg';

  // THE REST INSTRUMENT's remembered default (scoreboard-thesis §7):
  // the interval a fresh rest starts with. ±15s steppers, mono
  // readout — the panel row that tunes the Floor's clock.
  // THE PROMOTION AUDIT (invariant 7's numeric half, computed at
  // read): tags with ≥10 consistent uses have earned their half of
  // the promotion rule — the row names them so the second half (the
  // twice-attempted filter) has a place to happen.
  const historyQuery = useRecentSessionDetails(60);
  const earnedTags = (() => {
    const counts = new Map<string, number>();
    for (const session of historyQuery.data ?? []) {
      for (const ex of session.exercises) {
        for (const tag of ex.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()].filter(([, n]) => n >= 10).map(([t]) => t).sort();
  })();

  const restDefaultSec = useRestStore((s) => s.defaultSec);
  const setRestDefault = useCallback((next: number) => {
    useRestStore.setState({
      defaultSec: Math.max(30, Math.min(300, Math.round(next / 15) * 15)),
    });
  }, []);
  const restReadout = `${Math.floor(restDefaultSec / 60)}:${String(restDefaultSec % 60).padStart(2, '0')}`;

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

      {/* The theme measure — three tiles, inversion is selection
          (the same pick vocabulary as the funnel's day rail). */}
      <View style={styles.block}>
        <View style={styles.unitRow}>
          {PREFERENCE_ORDER.map((pref) => {
            const isActive = preference === pref;
            return (
              <Pressable
                key={pref}
                onPress={() => setPreference(pref)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Theme ${PREFERENCE_LABELS[pref]}`}
                style={({ pressed }) => [
                  styles.unitTile,
                  {
                    backgroundColor: isActive ? colors.text : colors.glass.inputBackground,
                  },
                  pressed ? { opacity: 0.6 } : null,
                ]}
                testID={`theme-tile-${pref}`}
              >
                <Text
                  style={[
                    styles.unitTileLabel,
                    { color: isActive ? colors.background : colors.text },
                  ]}
                >
                  {pref === 'light' ? 'CARD' : pref === 'dark' ? 'BOARD' : 'SYSTEM'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* THE REST INSTRUMENT's default — the interval the Floor's
          clock counts after every log. One inline row: the printed
          label, the mono figure, the ± steppers. */}
      <View style={styles.block}>
        <View style={styles.restIntervalRow}>
          <Text style={[styles.restIntervalLabel, { color: colors.textMuted }]}>
            REST INTERVAL
          </Text>
          <Pressable
            onPress={() => setRestDefault(restDefaultSec - 15)}
            accessibilityRole="button"
            accessibilityLabel="Decrease rest interval by 15 seconds"
            style={({ pressed }) => [
              styles.restStep,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.mobilePremium.hairlineBorderStrong,
              },
              pressed ? { opacity: 0.6 } : null,
            ]}
            testID="rest-default-dec"
          >
            <Text style={[styles.restStepGlyph, { color: colors.text }]}>−</Text>
          </Pressable>
          <Text
            style={[styles.restIntervalFigure, { color: colors.text }]}
            testID="rest-default-readout"
          >
            {restReadout}
          </Text>
          <Pressable
            onPress={() => setRestDefault(restDefaultSec + 15)}
            accessibilityRole="button"
            accessibilityLabel="Increase rest interval by 15 seconds"
            style={({ pressed }) => [
              styles.restStep,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.mobilePremium.hairlineBorderStrong,
              },
              pressed ? { opacity: 0.6 } : null,
            ]}
            testID="rest-default-inc"
          >
            <Text style={[styles.restStepGlyph, { color: colors.text }]}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* THE DELOAD WEEK — one honest toggle; inversion is
          selection (the same pick vocabulary as everything). */}
      <View style={styles.block}>
        <View style={styles.unitRow}>
          <Text style={[styles.unitInlineLabel, { color: colors.textMuted }]}>
            DELOAD WEEK
          </Text>
          {([false, true] as const).map((v) => {
            const isActive = deload === v;
            return (
              <Pressable
                key={String(v)}
                onPress={() => setDeload(v)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Deload week ${v ? 'on' : 'off'}`}
                style={({ pressed }) => [
                  styles.unitTile,
                  {
                    backgroundColor: isActive ? colors.text : colors.glass.inputBackground,
                  },
                  pressed ? { opacity: 0.6 } : null,
                ]}
                testID={`deload-tile-${v ? 'on' : 'off'}`}
              >
                <Text
                  style={[
                    styles.unitTileLabel,
                    { color: isActive ? colors.background : colors.text },
                  ]}
                >
                  {v ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* THE WEIGHT UNIT — the display conversion (storage stays
          kilograms; every read converts). Inversion is selection. */}
      <View style={styles.block}>
        <View style={styles.unitRow}>
          <Text style={[styles.unitInlineLabel, { color: colors.textMuted }]}>
            WEIGHT UNIT
          </Text>
          {(['kg', 'lb'] as WeightUnit[]).map((u) => {
            const isActive = weightUnit === u;
            return (
              <Pressable
                key={u}
                onPress={() => {
                  if (isActive) return;
                  updateProfile.mutate({ weightUnit: u }, {
                    onError: (err) => {
                      logger.warn('mutations', 'weight-unit update failed:', err.message);
                    },
                  });
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Weights in ${u === 'kg' ? 'kilograms' : 'pounds'}`}
                style={({ pressed }) => [
                  styles.unitTile,
                  {
                    backgroundColor: isActive ? colors.text : colors.glass.inputBackground,
                  },
                  pressed ? { opacity: 0.6 } : null,
                ]}
                testID={`unit-tile-${u}`}
              >
                <Text
                  style={[
                    styles.unitTileLabel,
                    { color: isActive ? colors.background : colors.text },
                  ]}
                >
                  {u.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
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

      {/* The promotion audit — one information line (the rule's
          numeric half, computed at read; the chit was decoration). */}
      <View style={styles.block}>
        <Text style={[styles.promotionLine, { color: colors.textMuted }]} numberOfLines={1}>
          {earnedTags.length > 0
            ? `tag promotions earned: ${earnedTags.join(' · ')}`
            : 'tag promotions: none earned yet (10+ uses each)'}
        </Text>
      </View>

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
    paddingTop: 0,
    paddingBottom: 140,
  },
  // The colophon's rows are minor sections — they carry the 24 half-
  // rhythm, not the 32 block gap, so the one verb stays reachable at
  // SE (the 490px law).
  block: {
    marginTop: 24,
  },
  statement: {
    ...INTERVAL.statement,
  },
  // The unit measure's inline label — the printed word beside its
  // tiles, on one line.
  unitInlineLabel: {
    ...INTERVAL.whisper,
    marginRight: 8,
  },
  whisper: {
    ...INTERVAL.whisper,
    marginBottom: 8,
  },
  // THE REST INSTRUMENT's panel row: the printed label, the ±
  // steppers, and the mono figure on one line.
  restIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  restIntervalLabel: {
    ...theme.typography.mobileEyebrow,
    flex: 1,
  },
  restStep: {
    width: 44,
    height: 44,
    borderRadius: theme.shapes.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restStepGlyph: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    fontSize: 18,
  },
  restIntervalFigure: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 64,
    textAlign: 'center',
  },
  // The tile MEASURE (theme, weight unit) — inversion is selection.
  unitRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitTile: {
    flex: 1,
    height: 44,
    borderRadius: theme.shapes.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitTileLabel: {
    ...theme.typography.mobileTag,
    letterSpacing: 0.8,
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
  },
  signedInAs: {
    ...theme.typography.mobileLedger,
  },
  promotionLine: {
    ...theme.typography.mobileLedger,
    minHeight: 20,
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
