// app/split-selection.tsx
// Pre-workout setup. Three picks the user makes here, in order:
//   1. Split archetype (oneADay / twoADay).
//   2. Workout day — a rolling 7-day strip. Each non-rest day is labeled
//      with its day-of-split (1..4), derived from the user's last logged
//      session via getNextSplitDay. Rest days are visually deactivated
//      (reduced opacity, "Rest" label) but still tappable for override.
//   3. AM / PM — only shown for twoADay. AM and PM are separate session
//      rows in the DB (distinguished by their exercises), so sessionMode
//      lives on the draft as planning-time context, not as a column.
//
// On confirm, seeds workoutStore with a fresh draft (date, splitType,
// day, sessionMode) and navigates to the active session — which
// auto-hydrates from the program slots (getSlotsForDay) locally.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  MobileSelectionList,
  CopyForAiButton,
  type MobileSelectionOption,
} from '../components/MobilePremium';
import { SplitExerciseRow } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToWorkoutDetail, safeGoBack } from '../navigation';
import { useProfile, useRecentWorkouts, useAiPayload } from '../hooks';
import { useWorkoutStore, useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots } from '../services';
import {
  WORKOUT_SPLIT_LIST,
  SESSION_MODE_LIST,
  DAY_OF_WEEK_LABELS,
  getUpcomingWorkoutSlots,
  getNextSplitDay,
  suggestNextSplitDay,
  suggestSessionWindow,
  MIN_SPLIT_DAY,
  MAX_SPLIT_DAY,
  SCREEN_BODY_STYLE,
  theme,
  type SessionMode,
  type UpcomingWorkoutSlot,
} from '../constants';
import { getSlotsForDay } from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

const SPLIT_OPTIONS: MobileSelectionOption[] = WORKOUT_SPLIT_LIST.map((s) => ({
  id: s.id,
  label: s.label,
  description: s.description,
}));

const SESSION_OPTIONS: MobileSelectionOption[] = SESSION_MODE_LIST.map((s) => ({
  id: s.id,
  label: s.label,
}));

export default function SplitSelectionScreen() {
  const { colors } = useAppTheme();
  const startSession = useWorkoutStore((s) => s.startSession);

  // Profile + recent sessions drive the day-of-split suggestion + the
  // rest-day map. Both fall back to safe defaults while loading so the
  // picker renders immediately on mount.
  const profileQuery = useProfile();
  const recentQuery = useRecentWorkouts(1);

  const restDays = profileQuery.data?.restDays ?? [];

  // Open pre-configured: the remembered split (persisted) + the
  // time-of-day window. Every session start re-writes the preference —
  // the last choice is the next default.
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const preferredMode = useSplitPreferenceStore((s) => s.sessionMode);
  const setPreference = useSplitPreferenceStore((s) => s.setPreference);
  const programOverrides = useProgramOverrideStore((s) => s.overrides);

  const [splitChoice, setSplitChoice] = useState<string>(preferredSplit);
  const [sessionChoice, setSessionChoice] = useState<string>(preferredMode);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);

  const split = splitChoice as PreferredSplit;
  const session = sessionChoice as SessionMode;
  const isTwoADay = split === 'twoADay';

  // The suggested day: today's logged day sticks (AM then PM share it);
  // otherwise the classic next-after-last walk. getUpcomingWorkoutSlots
  // derives its walk start from getNextSplitDay(lastCompletedDay), so we
  // feed it the day BEFORE the suggestion to land on it exactly.
  const recent = recentQuery.data ?? [];
  const suggestedDay = useMemo(() => suggestNextSplitDay(recent), [recent]);
  const walkStartDay = suggestedDay === MIN_SPLIT_DAY
    ? MAX_SPLIT_DAY
    : suggestedDay - 1;

  const aiPayload = useAiPayload({
    visibleContent: [
      `- Split: ${splitChoice === 'oneADay' ? '1-a-day' : 'AM/PM'}`,
      `- Next day-of-split: ${suggestedDay}`,
      `- Rest days configured: ${restDays.length}`,
    ].join('\n'),
  });

  const slots = useMemo(
    () => getUpcomingWorkoutSlots(7, restDays, walkStartDay),
    [restDays, walkStartDay],
  );

  // Selected slot = explicit pick if valid, else first non-rest day in
  // the window. Falls back to slots[0] when every upcoming day is a
  // rest day.
  const selectedSlot = useMemo<UpcomingWorkoutSlot | null>(() => {
    if (slots.length === 0) return null;
    if (selectedIsoDate) {
      const found = slots.find((s) => s.isoDate === selectedIsoDate);
      if (found) return found;
    }
    return slots.find((s) => !s.isRestDay) ?? slots[0];
  }, [slots, selectedIsoDate]);

  // The split-day to seed. Rest-day picks fall back to getNextSplitDay
  // so the draft always has a valid 1..4 value even if the user tapped a
  // deactivated rest slot.
  const draftDay = selectedSlot?.splitDay ?? suggestedDay;

  // Preview the day's slots with standing substitutions applied.
  const previewSlots = resolveSlots(split, draftDay, session, programOverrides);

  const handleStart = () => {
    // Remember the choices — the next launch opens pre-configured.
    setPreference({ splitType: split, sessionMode: session });
    // The session starts NOW: draft.date defaults to the current instant
    // (startSession), which is what the elapsed timer + started_at save.
    // The picked day rides on `day` (split_day), not on the timestamp —
    // passing the slot's midnight would log a pre-midnight start and
    // read as hours of elapsed training.
    startSession({
      splitType: split,
      day: draftDay,
      sessionMode: session,
    });
    navigateToWorkoutDetail();
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="setup" />
      <MobileHeader
        title="Start workout"
        eyebrow={
          selectedSlot
            ? `${selectedSlot.dayLabel} · ${selectedSlot.dateLabel}`
            : 'Pick your split'
        }
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="split-selection-copy-for-ai" />}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <MobileSectionEyebrow>Split</MobileSectionEyebrow>
        <MobileSurface>
          <MobileSelectionList
            options={SPLIT_OPTIONS}
            selectedId={splitChoice}
            onSelect={setSplitChoice}
          />
        </MobileSurface>

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Workout day</MobileSectionEyebrow>
        <MobileSurface padding={10}>
          <View style={styles.dayGrid}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.isoDate === slot.isoDate;
              const isRest = slot.isRestDay;
              const dowLabel = DAY_OF_WEEK_LABELS[slot.dayOfWeek].label.slice(0, 3);
              const dateNum = slot.date.getDate();
              const slotLabel = isRest ? 'Rest' : `Day ${slot.splitDay}`;
              return (
                <Pressable
                  key={slot.isoDate}
                  onPress={() => setSelectedIsoDate(slot.isoDate)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${dowLabel} ${dateNum}, ${slotLabel}`}
                  style={({ pressed }) => [
                    {
                      ...styles.dayTile,
                      borderColor: isSelected ? colors.brand : colors.border,
                      backgroundColor: isSelected
                        ? `${colors.brand}14`
                        : colors.glass.inputBackground,
                    },
                    isRest ? styles.dayTileRest : null,
                    pressed ? { opacity: 0.6 } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayDow,
                      {
                        color: isSelected ? colors.brand : colors.textSecondary,
                      },
                    ]}
                  >
                    {dowLabel}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      { color: isSelected ? colors.brand : colors.text },
                    ]}
                  >
                    {dateNum}
                  </Text>
                  <Text
                    style={[
                      styles.daySlotLabel,
                      {
                        color: isSelected
                          ? colors.brand
                          : isRest
                            ? colors.textColors.tertiary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {slotLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.restHint, { color: colors.textColors.tertiary }]}>
            Suggested from your last session. Rest days are configured in settings.
          </Text>
        </MobileSurface>

        {isTwoADay ? (
          <>
            <View style={{ height: 16 }} />
            <MobileSectionEyebrow>Session</MobileSectionEyebrow>
            <MobileSurface>
              <MobileSelectionList
                options={SESSION_OPTIONS}
                selectedId={sessionChoice}
                onSelect={setSessionChoice}
              />
            </MobileSurface>
          </>
        ) : null}

        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>
          {previewSlots.length === 0
            ? 'No exercises planned'
            : isTwoADay
              ? `${session.toUpperCase()} session · ${previewSlots.length} exercise${
                  previewSlots.length === 1 ? '' : 's'
                }`
              : `${previewSlots.length} exercise${
                  previewSlots.length === 1 ? '' : 's'
                }`}
        </MobileSectionEyebrow>

        {previewSlots.length === 0 ? (
          <MobileSurface padding={20}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exercises planned for this day. Start a session anyway and
              add your own from the exercise database.
            </Text>
          </MobileSurface>
        ) : (
          <View style={styles.listStack}>
            {previewSlots.map((slot, i) => (
              <SplitExerciseRow key={slot.exercise} slot={slot} index={i + 1} />
            ))}
          </View>
        )}
      </ScrollView>
      <MobileActionFooter>
        <MobilePrimaryButton variant="ghost" onPress={safeGoBack}>
          Cancel
        </MobilePrimaryButton>
        <MobilePrimaryButton
          onPress={handleStart}
          testID="split-selection-start-session"
        >
          Start session
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Center the last row so a 7-day window renders as 4 + 3 with the
    // 3 centered, not left-aligned.
    justifyContent: 'center',
    gap: 8,
  },
  dayTile: {
    // 4 per row max so 7 days wraps to 4 + 3. The 23% width leaves room
    // for the 8px gap between tiles without forcing a tighter wrap.
    width: '23%',
    aspectRatio: 0.78,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayTileRest: {
    opacity: 0.45,
  },
  dayDow: {
    ...theme.typography.mobileEyebrow,
    textTransform: 'uppercase',
  },
  dayDate: {
    ...theme.typography.mobileAction,
    fontVariant: ['tabular-nums'],
    marginTop: 3,
  },
  daySlotLabel: {
    ...theme.typography.mobileEyebrow,
    fontVariant: ['tabular-nums'],
    marginTop: 3,
  },
  restHint: {
    ...theme.typography.mobileMeta,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyText: { ...theme.typography.mobileMeta },
  listStack: { gap: 8 },
});
