// app/settings.tsx
// THE PANEL — the interval's colophon (docs/architecture/
// interval-thesis.md §8): "This is how it's set." No nameplate, no
// email kicker, no info panel, no section chrome — the current theme
// IS the statement (restating with every pick); the preference rows
// keep their ink-invert selection; the rest-day measure keeps its
// struck marks; install/version ride as single rows; Sign Out is the
// page's one verb.

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check } from '@tamagui/lucide-icons-2';
import {
  MobileActionFooter,
  MobilePrimaryButton,
} from '../components/MobilePremium';
import { BoardShell } from '../components/composed';
import { useAuth, useAppTheme, type ColorSchemePreference } from '../context';
import { navigateToPremiumShowcase, safeGoBack } from '../navigation';
import { useProfile, useUpdateProfile, usePwaPrompt, useRecentSessionDetails } from '../hooks';
import { DAY_OF_WEEK_LABELS, BLOCK_GAP, INTERVAL, theme,
  PRESS_DIP
} from '../constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import { useToast } from '../context';
import { useRestStore, useDeloadStore, useSplitPreferenceStore } from '../stores';
import {
  getMyPartnerCode,
  getPartner,
  connectPartner,
  disconnectPartner,
  logWeight,
  getWeightHistory,
  deleteWeight,
} from '../utils/supabase/repositories';
import { logger } from '../utils/logger';
import { joinFacts } from '../utils';
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
  // The profile read gates its own measure: rest-days derive the next
  // set FROM the cached list, so a toggle before the read lands would
  // mutate from [] and clobber the stored preference. Until the read
  // succeeds the measure stays silent (loading asserts nothing).
  const profileReady = profileQuery.isSuccess;
  const restDays = profileQuery.data?.restDays ?? [];

  const handleToggleRestDay = useCallback(
    (id: string) => {
      const dow = Number(id);
      if (!profileReady) return;
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
    [profileReady, restDays, updateProfile],
  );

  const restDayIds = restDays.map(String);

  // THE PROGRAM EDITION — which split the app trains: 'upper' (the
  // original) or 'lower' (the female equivalent). Persisted UI
  // preference; the Floor, home, and the selector all follow.
  const programEdition = useSplitPreferenceStore((s) => s.edition);
  const setSplitPreference = useSplitPreferenceStore((s) => s.setPreference);

  // THE WEIGHT UNIT — the display conversion preference (kg storage
  // throughout; utils/weight.ts owns the arithmetic).
  const weightUnit = profileQuery.data?.weightUnit ?? 'kg';

  // BODY WEIGHT — the weigh-in log. One entry per weigh-in; the
  // trend derives at read (latest vs. a week ago).
  const [weightInput, setWeightInput] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);
  const weightHistoryQuery = useQuery({
    queryKey: queryKeys.bodyWeight.history(),
    queryFn: async () => {
      const r = await getWeightHistory(30);
      if (!r.success) throw r.error;
      return r.data;
    },
  });
  const handleDeleteWeight = async (id: string) => {
    const r = await deleteWeight(id);
    if (r.success) {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeight.all });
    }
  };

  const handleLogWeight = async () => {
    // THE ONE CONVERSION BOUNDARY (invariant 5): the input reads in
    // DISPLAY units; storage stays kilograms — convert before the write.
    const displayValue = parseFloat(weightInput);
    if (!Number.isFinite(displayValue) || displayValue <= 0 || loggingWeight) return;
    const kg = weightUnit === 'lb' ? displayValue / 2.20462 : displayValue;
    if (kg <= 0 || kg > 500) return;
    setLoggingWeight(true);
    const r = await logWeight(kg);
    setLoggingWeight(false);
    if (r.success) {
      setWeightInput('');
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeight.all });
    } else {
      showToast('error', r.error?.message ?? 'Failed to log weight');
    }
  };

  // THE TRAINING PARTNER — the couples link. Enter each other's
  // partner code in Settings; the couple page gains its live section.
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerConnecting, setPartnerConnecting] = useState(false);
  const myCodeQuery = useQuery({
    queryKey: queryKeys.partner.myCode(),
    queryFn: async () => {
      const r = await getMyPartnerCode();
      if (!r.success) throw r.error;
      return r.data;
    },
    staleTime: Infinity,
  });
  const partnerQuery = useQuery({
    queryKey: queryKeys.partner.current(),
    queryFn: async () => {
      const r = await getPartner();
      if (!r.success) throw r.error;
      return r.data;
    },
  });
  const queryClient = useQueryClient();
  const handleConnectPartner = async () => {
    if (!partnerCode.trim() || partnerConnecting) return;
    setPartnerConnecting(true);
    const r = await connectPartner(partnerCode);
    setPartnerConnecting(false);
    if (r.success) {
      setPartnerCode('');
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.all });
    } else {
      showToast('error', r.error?.message ?? 'Connection failed');
    }
  };
  const handleDisconnectPartner = async () => {
    const r = await disconnectPartner();
    if (r.success) {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.all });
    }
  };

  // THE REST INSTRUMENT's remembered default (interval-thesis §7):
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
                  pressed ? { opacity: PRESS_DIP } : null,
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
              pressed ? { opacity: PRESS_DIP } : null,
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
              pressed ? { opacity: PRESS_DIP } : null,
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
                  pressed ? { opacity: PRESS_DIP } : null,
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

      {/* THE TRAINING PARTNER — the couples link. One partner at a
          time; enter their code, they enter yours. */}
      <View style={styles.block}>
        <Text style={[styles.whisper, { color: colors.textMuted }]}>
          TRAINING PARTNER
        </Text>
        {partnerQuery.data ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={[styles.unitTileLabel, { color: colors.text }]}>
              {partnerQuery.data.partnerDisplayName || 'Connected'}
            </Text>
            <Pressable
              onPress={handleDisconnectPartner}
              accessibilityRole="button"
              accessibilityLabel="Disconnect training partner"
              style={({ pressed }) => [
                styles.unitTile,
                { backgroundColor: colors.glass.inputBackground },
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID="partner-disconnect"
            >
              <Text style={[styles.unitTileLabel, { color: colors.text }]}>
                DISCONNECT
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 8, marginTop: 8 }}>
            {myCodeQuery.data ? (
              <Text style={[styles.unitTileLabel, { color: colors.text }]}>
                Your code: {myCodeQuery.data}
              </Text>
            ) : null}
            <TextInput
              value={partnerCode}
              onChangeText={setPartnerCode}
              placeholder="Enter their partner code"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.unitTile,
                {
                  backgroundColor: colors.glass.inputBackground,
                  color: colors.text,
                  paddingHorizontal: 16,
                },
              ]}
              testID="partner-code-input"
            />
            <Pressable
              onPress={handleConnectPartner}
              accessibilityRole="button"
              accessibilityLabel="Connect training partner"
              disabled={partnerConnecting || !partnerCode.trim()}
              style={({ pressed }) => [
                styles.unitTile,
                {
                  backgroundColor: partnerCode.trim()
                    ? colors.text
                    : colors.glass.inputBackground,
                },
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID="partner-connect"
            >
              <Text
                style={[
                  styles.unitTileLabel,
                  {
                    color: partnerCode.trim()
                      ? colors.background
                      : colors.text,
                  },
                ]}
              >
                {partnerConnecting ? 'CONNECTING…' : 'CONNECT'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* THE PROGRAM EDITION — which split the app trains. Two-tile
          inversion, the same grammar as the archetype measure. */}
      <View style={styles.block}>
        <Text style={[styles.whisper, { color: colors.textMuted }]}>
          PROGRAM EDITION
        </Text>
        <View style={styles.unitRow}>
          {(['upper', 'lower'] as const).map((ed) => {
            const isActive = programEdition === ed;
            return (
              <Pressable
                key={ed}
                onPress={() => setSplitPreference({ edition: ed })}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={ed === 'upper' ? 'Upper focus program' : 'Lower focus program'}
                style={({ pressed }) => [
                  styles.unitTile,
                  {
                    backgroundColor: isActive ? colors.text : colors.glass.inputBackground,
                  },
                  pressed ? { opacity: PRESS_DIP } : null,
                ]}
                testID={`edition-tile-${ed}`}
              >
                <Text
                  style={[
                    styles.unitTileLabel,
                    { color: isActive ? colors.background : colors.text },
                  ]}
                >
                  {ed === 'upper' ? 'UPPER FOCUS' : 'LOWER FOCUS'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* BODY WEIGHT — the weigh-in log + recent history. Storage in
          kilograms; display converts via the unit preference below. */}
      <View style={styles.block}>
        <Text style={[styles.whisper, { color: colors.textMuted }]}>
          BODY WEIGHT
        </Text>
        {weightHistoryQuery.data && weightHistoryQuery.data.length > 0 ? (
          <View style={{ gap: 4, marginTop: 8 }}>
            {weightHistoryQuery.data.slice(0, 5).map((entry) => (
              <View
                key={entry.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text
                  style={[
                    styles.unitTileLabel,
                    { color: colors.text, fontWeight: '400' },
                  ]}
                >
                  {new Date(entry.recordedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={[styles.unitTileLabel, { color: colors.text }]}>
                    {weightUnit === 'lb'
                      ? `${Math.round(entry.weightKg * 2.20462)} lb`
                      : `${entry.weightKg} kg`}
                  </Text>
                  <Pressable
                    onPress={() => void handleDeleteWeight(entry.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete weight entry from ${new Date(entry.recordedAt).toLocaleDateString()}`}
                    style={({ pressed }) => [
                      { paddingHorizontal: 8, paddingVertical: 4, minHeight: 44, justifyContent: 'center' },
                      pressed ? { opacity: PRESS_DIP } : null,
                    ]}
                    testID={`weight-delete-${entry.id}`}
                  >
                    <Text style={[styles.unitTileLabel, { color: colors.textMuted }]}>
                      ×
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder={weightUnit === 'lb' ? 'Enter lb' : 'Enter kg'}
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            style={[
              styles.unitTile,
              {
                backgroundColor: colors.glass.inputBackground,
                color: colors.text,
                paddingHorizontal: 16,
                flex: 1,
              },
            ]}
            testID="weight-input"
          />
          <Pressable
            onPress={handleLogWeight}
            accessibilityRole="button"
            accessibilityLabel="Log body weight"
            disabled={loggingWeight || !weightInput.trim()}
            style={({ pressed }) => [
              styles.unitTile,
              {
                backgroundColor: weightInput.trim()
                  ? colors.text
                  : colors.glass.inputBackground,
                paddingHorizontal: 20,
              },
              pressed ? { opacity: PRESS_DIP } : null,
            ]}
            testID="weight-log"
          >
            <Text
              style={[
                styles.unitTileLabel,
                {
                  color: weightInput.trim() ? colors.background : colors.text,
                },
              ]}
            >
              {loggingWeight ? '…' : 'LOG'}
            </Text>
          </Pressable>
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
                  pressed ? { opacity: PRESS_DIP } : null,
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
                accessibilityState={{ checked: isRest, disabled: !profileReady }}
                accessibilityLabel={`${d.label} rest day`}
                style={({ pressed }) => [
                  styles.restDayTile,
                  {
                    backgroundColor: isRest ? colors.text : colors.glass.inputBackground,
                    opacity: pressed ? PRESS_DIP : 1,
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
                  {/* Furniture prints caps — the same grammar as the
                      picker's day rail (Su → SU). */}
                  {d.label.slice(0, 2).toUpperCase()}
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
          numeric half, computed at read; the chit was decoration).
          Computed facts never truncate: a tag list that ellipsizes
          lies about what was earned. */}
      <View style={styles.block}>
        <Text style={[styles.promotionLine, { color: colors.textMuted }]}>
          {earnedTags.length > 0
            ? joinFacts(['tag promotions earned', joinFacts(earnedTags)])
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
          <MobilePrimaryButton onPress={() => void signOut()}>SIGN OUT</MobilePrimaryButton>
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
      style={({ pressed }) => [styles.colophonRow, pressed ? { opacity: PRESS_DIP } : null]}
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
