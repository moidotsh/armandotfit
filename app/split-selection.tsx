// app/split-selection.tsx
// The FUNNEL — set the edition (docs/architecture/
// quiet-page-thesis.md §6): "Which edition?" Three picks in order and
// GO — the page's one verb. The PICKED day's title is the statement
// (restating with every pick); one fact line carries the targets and
// counts outside the halo. The seven-day measure is the second voice:
// weekday whisper + day-of-split figure, the picked tile INVERTING
// (ink plate on paper, paper on ink — inversion is selection; borders
// do not survive glare). The plan previews in the same quiet rows as
// the rotation document: name + Rx, air-separated.
//   1. Workout day — a rolling 7-day measure. Each non-rest day
//      carries its day-of-split (1..4), derived from the user's last
//      logged session via getNextSplitDay. Rest days render muted but
//      stay tappable for override.
//   2. Split archetype (oneADay / twoADay) — segmented control.
//   3. AM / PM — only for twoADay; AM and PM are separate session rows
//      in the DB, so sessionMode lives on the draft as planning-time
//      context, not as a column.
//
// On confirm, seeds workoutStore with a fresh draft (date, splitType,
// day, sessionMode) and navigates to the active session — which
// auto-hydrates from the program slots (getSlotsForDay) locally.

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MobilePrimaryButton,
  MobileActionFooter,
  SegmentedControl,
} from '../components/MobilePremium';
import { DeskShell } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToWorkoutDetail, replaceWithWorkoutDetail, safeGoBack } from '../navigation';
import { useProfile, useRecentWorkouts } from '../hooks';
import { useWorkoutStore, useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots } from '../services';
import {
  WORKOUT_SPLIT_LIST,
  DAY_OF_WEEK_LABELS,
  getUpcomingWorkoutSlots,
  suggestNextSplitDay,
  MIN_SPLIT_DAY,
  MAX_SPLIT_DAY,
  BLOCK_GAP,
  HALO,
  theme,
  type SessionMode,
  type UpcomingWorkoutSlot,
} from '../constants';
import {
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  getDayTitle,
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
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

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
  // The day's targets — the distinct primary muscle groups across the
  // preview slots, in slot order (metadata as structure, computed at
  // read from the catalog).
  const targetGroups = previewSlots
    .map((slot) => SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.primaryMuscles[0])
    .filter((m): m is MuscleSlug => Boolean(m))
    .map((m) => MUSCLE_DISPLAY_NAMES[m]);
  const targets = [...new Set(targetGroups)];

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

  // THE STATEMENT — restating with every pick: the picked day's title.
  const statement = selectedSlot?.isRestDay
    ? 'Rest day'
    : getDayTitle(split, draftDay) || `Day ${draftDay}`;
  // One fact line — what the edition trains, and the counts.
  const fact = [
    targets.length > 0 && !selectedSlot?.isRestDay ? targets.join(' · ') : null,
    `${previewSlots.length} lift${previewSlots.length === 1 ? '' : 's'}`,
    isTwoADay ? session.toUpperCase() : null,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <DeskShell
      surface="setup"
      onBack={safeGoBack}
      testID="funnel-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {/* THE STATEMENT + fact — restating with every pick. */}
      <View>
        <Text style={[styles.statement, { color: colors.text }]} numberOfLines={2} testID="funnel-headline">
          {statement}
        </Text>
        <Text style={[styles.fact, { color: colors.textMuted }]} numberOfLines={1}>
          {fact}
        </Text>
      </View>

      {/* THE MEASURE — seven tiles; weekday whisper above the
          day-of-split figure. The pick inverts. */}
      <View style={styles.block}>
        <View style={styles.dayRow} testID="funnel-day-measure">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.isoDate === slot.isoDate;
            const isRest = slot.isRestDay;
            const dowLabel = DAY_OF_WEEK_LABELS[slot.dayOfWeek].label.slice(0, 2).toUpperCase();
            const numeral = isRest ? 'R' : String(slot.splitDay).padStart(2, '0');
            // Inversion palette: the plate is the text color, the
            // content is the page — one swap, both modes.
            const plateBg = isSelected ? colors.text : isRest ? colors.glass.inputBackground : colors.card;
            const markColor = isSelected ? colors.background : colors.textMuted;
            const numeralColor = isSelected ? colors.background : isRest ? colors.textMuted : colors.text;
            return (
              <Pressable
                key={slot.isoDate}
                onPress={() => setSelectedIsoDate(slot.isoDate)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${dowLabel}, ${isRest ? 'Rest' : `Day ${slot.splitDay}`}`}
                style={({ pressed }) => [
                  styles.dayTile,
                  { backgroundColor: plateBg, borderRadius: theme.shapes.tile },
                  pressed ? { opacity: 0.7 } : null,
                ]}
                testID={`day-tile-${slot.isoDate}`}
              >
                <Text style={[styles.dayDow, { color: markColor }]}>{dowLabel}</Text>
                <Text style={[styles.dayNumeral, { color: numeralColor }]}>
                  {numeral}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Archetype + window — the instrument's second row. */}
      <View style={styles.block}>
        <SegmentedControl<string>
          variant="selection"
          chromeless
          segments={SPLIT_SEGMENTS}
          value={splitChoice}
          onChange={setSplitChoice}
          accessibilityLabel="Split archetype"
          testID="split-archetype"
        />
        {isTwoADay ? (
          <View style={styles.sessionRow}>
            <SegmentedControl<string>
              variant="selection"
              chromeless
              segments={[
                { value: 'am', label: 'AM' },
                { value: 'pm', label: 'PM' },
              ]}
              value={sessionChoice}
              onChange={setSessionChoice}
              accessibilityLabel="Session window"
              testID="split-session"
            />
          </View>
        ) : null}
        <Text style={[styles.splitDescription, { color: colors.textMuted }]} numberOfLines={1}>
          {splitDescription(splitChoice)}
        </Text>
      </View>

      {/* THE PLAN — the same quiet rows as the rotation document. */}
      <View style={styles.block}>
        {previewSlots.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No exercises planned for this day — start anyway and add your own
            from the library.
          </Text>
        ) : (
          <View>
            {previewSlots.map((slot, i) => {
              const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
              const name = entry?.name ?? slot.exercise;
              const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
              const rx = `${sets}×${slot.reps[0]}–${slot.reps[1]}`;
              return (
                <View
                  key={slot.exercise + i}
                  style={styles.slotRow}
                >
                  <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[styles.slotRx, { color: colors.textMuted }]}>
                    {rx}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.block}>
        <MobileActionFooter>
          {isSessionActive ? (
            <MobilePrimaryButton
              onPress={replaceWithWorkoutDetail}
              testID="split-selection-start-session"
            >
              RESUME SESSION
            </MobilePrimaryButton>
          ) : (
            <MobilePrimaryButton
              onPress={handleStart}
              testID="split-selection-start-session"
            >
              GO
            </MobilePrimaryButton>
          )}
        </MobileActionFooter>
      </View>
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  block: {
    marginTop: BLOCK_GAP,
  },
  statement: {
    ...theme.typography.mobileDisplay,
  },
  // The fact line waits outside the statement's halo.
  fact: {
    ...theme.typography.mobileLedger,
    marginTop: HALO,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayTile: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  dayDow: {
    ...theme.typography.mobileEyebrow,
  },
  dayNumeral: {
    ...theme.typography.mobileFigure,
  },
  sessionRow: {
    marginTop: 12,
  },
  splitDescription: {
    ...theme.typography.mobileLedger,
    marginTop: 10,
  },
  emptyText: { ...theme.typography.mobileMeta, marginTop: 4 },
  slotRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotName: { ...theme.typography.mobileItemTitle, flex: 1 },
  slotRx: {
    ...theme.typography.mobileLedger,
  },
});
