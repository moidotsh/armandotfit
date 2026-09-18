// app/split-selection.tsx
// Pre-workout setup, set as a logbook page (docs/architecture/
// logbook-thesis.md §7): the picked day inverts on a 7-day strip —
// selection is inversion, not borders — and the plan previews as a
// numbered ledger. Three picks, in order:
//   1. Split archetype (oneADay / twoADay) — segmented control.
//   2. Workout day — a rolling 7-day strip. Each non-rest day carries
//      its day-of-split (1..4), derived from the user's last logged
//      session via getNextSplitDay. Rest days render muted but stay
//      tappable for override.
//   3. AM / PM — only for twoADay; AM and PM are separate session rows
//      in the DB, so sessionMode lives on the draft as planning-time
//      context, not as a column.
//
// On confirm, seeds workoutStore with a fresh draft (date, splitType,
// day, sessionMode) and navigates to the active session — which
// auto-hydrates from the program slots (getSlotsForDay) locally.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  SegmentedControl,
  CopyForAiButton,
} from '../components/MobilePremium';
import { useAppTheme } from '../context';
import { navigateToWorkoutDetail, safeGoBack } from '../navigation';
import { useProfile, useRecentWorkouts, useAiPayload } from '../hooks';
import { useWorkoutStore, useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots } from '../services';
import {
  WORKOUT_SPLIT_LIST,
  DAY_OF_WEEK_LABELS,
  getUpcomingWorkoutSlots,
  suggestNextSplitDay,
  suggestSessionWindow,
  MIN_SPLIT_DAY,
  MAX_SPLIT_DAY,
  SCREEN_BODY_STYLE,
  theme,
  type SessionMode,
  type UpcomingWorkoutSlot,
} from '../constants';
import {
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  type MuscleSlug,
} from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

const SPLIT_SEGMENTS = WORKOUT_SPLIT_LIST.map((s) => ({ value: s.id, label: s.label }));

function splitDescription(id: string): string {
  return WORKOUT_SPLIT_LIST.find((s) => s.id === id)?.description ?? '';
}

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
  // muted rest slot.
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
        {/* Split archetype — a segmented control on paper, the one-line
            description following the choice. */}
        <MobileSectionEyebrow rule flush={false}>
          Split
        </MobileSectionEyebrow>
        <SegmentedControl<string>
          variant="selection"
          segments={SPLIT_SEGMENTS}
          value={splitChoice}
          onChange={setSplitChoice}
          accessibilityLabel="Split archetype"
          testID="split-archetype"
        />
        <Text style={[styles.splitDescription, { color: colors.textMuted }]}>
          {splitDescription(splitChoice)}
        </Text>

        {/* The week — one row of days; the pick inverts (ink plate).
            Borders do not survive glare; inversion does. */}
        <MobileSectionEyebrow rule flush={false}>
          Workout day
        </MobileSectionEyebrow>
        <View style={styles.dayRow}>
          {slots.map((slot) => {
            const isSelected = selectedSlot?.isoDate === slot.isoDate;
            const isRest = slot.isRestDay;
            const dowLabel = DAY_OF_WEEK_LABELS[slot.dayOfWeek].label.slice(0, 2).toUpperCase();
            const dateNum = slot.date.getDate();
            const dayLabel = isRest ? 'RST' : `D${slot.splitDay}`;
            return (
              <Pressable
                key={slot.isoDate}
                onPress={() => setSelectedIsoDate(slot.isoDate)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${dowLabel} ${dateNum}, ${isRest ? 'Rest' : `Day ${slot.splitDay}`}`}
                style={({ pressed }) => [
                  styles.dayTile,
                  isSelected
                    ? { backgroundColor: colors.text }
                    : isRest
                      ? [
                          styles.dayTileRest,
                          { backgroundColor: colors.glass.inputBackground },
                        ]
                      : { backgroundColor: colors.card },
                  pressed ? { opacity: 0.7 } : null,
                ]}
                testID={`day-tile-${slot.isoDate}`}
              >
                <Text
                  style={[
                    styles.dayDow,
                    { color: isSelected ? colors.brandOnInk : colors.textMuted },
                  ]}
                >
                  {dowLabel}
                </Text>
                <Text
                  style={[
                    styles.dayDate,
                    { color: isSelected ? colors.background : colors.text },
                  ]}
                >
                  {dateNum}
                </Text>
                <Text
                  style={[
                    styles.daySlotLabel,
                    {
                      color: isSelected
                        ? colors.brandOnInk
                        : isRest
                          ? colors.textColors.tertiary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {dayLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.restHint, { color: colors.textMuted }]}>
          Suggested from your last session. Rest days are configured in settings.
        </Text>

        {/* Session window — AM/PM only exists in the two-a-day split. */}
        {isTwoADay ? (
          <>
            <MobileSectionEyebrow rule flush={false}>
              Session
            </MobileSectionEyebrow>
            <SegmentedControl<string>
              variant="selection"
              segments={[
                { value: 'am', label: 'AM' },
                { value: 'pm', label: 'PM' },
              ]}
              value={sessionChoice}
              onChange={setSessionChoice}
              accessibilityLabel="Session window"
              testID="split-session"
            />
          </>
        ) : null}

        {/* The plan — numbered ledger rows on paper. The same slot
            language as the program screen: one slot, one read. */}
        <MobileSectionEyebrow rule flush={false}>
          {previewSlots.length === 0
            ? 'No exercises planned'
            : isTwoADay
              ? `${session.toUpperCase()} session · ${previewSlots.length} exercise${previewSlots.length === 1 ? '' : 's'}`
              : `${previewSlots.length} exercise${previewSlots.length === 1 ? '' : 's'}`}
        </MobileSectionEyebrow>

        {previewSlots.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No exercises planned for this day. Start a session anyway and add
            your own from the exercise database.
          </Text>
        ) : (
          <View>
            {previewSlots.map((slot, i) => {
              const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
              const name = entry?.name ?? slot.exercise;
              const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
              const rx = `${sets}×${slot.reps[0]}–${slot.reps[1]}`;
              const detail = [
                slot.suggestedTags.length > 0 ? slot.suggestedTags.join(' · ') : null,
                entry?.primaryMuscles[0]
                  ? MUSCLE_DISPLAY_NAMES[entry.primaryMuscles[0] as MuscleSlug]
                  : null,
              ]
                .filter(Boolean)
                .join(' · ');
              const isLast = i === previewSlots.length - 1;
              return (
                <View
                  key={slot.exercise + i}
                  style={[
                    styles.slotRow,
                    { borderBottomColor: colors.mobilePremium.hairlineBorder },
                    isLast ? { borderBottomWidth: 0 } : null,
                  ]}
                >
                  <Text style={[styles.slotIndex, { color: colors.brandText }]}>
                    {i + 1}
                  </Text>
                  <View style={styles.slotMain}>
                    <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    {detail ? (
                      <Text style={[styles.slotDetail, { color: colors.textMuted }]} numberOfLines={1}>
                        {detail}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.slotRx, { color: colors.text }]}>
                    {rx}
                  </Text>
                </View>
              );
            })}
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
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  splitDescription: {
    ...theme.typography.mobileMeta,
    marginTop: 10,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  dayTile: {
    flex: 1,
    minHeight: 72,
    borderRadius: theme.shapes.tile,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  dayTileRest: {
    // Muted, not hidden — rest days stay tappable for override.
    borderWidth: 0,
  },
  dayDow: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: theme.fonts.mono,
    letterSpacing: 1,
    lineHeight: 12,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  daySlotLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.8,
    lineHeight: 12,
  },
  restHint: {
    ...theme.typography.mobileMeta,
    marginTop: 10,
  },
  emptyText: { ...theme.typography.mobileMeta, marginTop: 12 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  slotIndex: {
    ...theme.typography.mobileLedger,
    minWidth: 20,
  },
  slotMain: { flex: 1, gap: 1 },
  slotName: { ...theme.typography.mobileItemTitle },
  slotDetail: { ...theme.typography.mobileMeta },
  slotRx: {
    ...theme.typography.mobileLedger,
  },
});
