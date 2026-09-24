// app/index.tsx
// Home — THE INTERVAL's front (docs/architecture/
// interval-thesis.md §8). Question: "what am I walking into today?"
// The day's title is the statement (the page carries no name of its
// own); **THE PRESCRIPTION** — the day's plan as ruled rows (name
// left · air · the full expectation right: prefill weight × rep
// range; a lift with no load history carries the range alone,
// muted), under the screen's one 2px rule, with the session's size
// stated above it (stations · sets) — shows the session's numbers
// before you start it. The window whisper is FURNITURE — printed
// caps in muted ink (red never rides furniture; interval-thesis
// §2). START (or RESUME) is the one verb (ink). **THE WEEK LINE**
// answers the browser's second question ("how's the week going?")
// without a tap — the current week as printed figures, today in
// red, one tap through to THE LEDGER. Jump rows keep their one fact
// each (the streak lives on the Progress row); recent sessions
// close the page as Martian lines. While a session runs, BoardShell
// pins the ticker under the folio.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Dumbbell, Settings } from '@tamagui/lucide-icons-2';
import { MobilePrimaryButton, EmptyState } from '../components/MobilePremium';
import {
  BoardShell,
  BoardHead,
  EditionLine,
  SectionWhisper,
  WeekLine,
  WorkoutListSkeleton,
  QueryErrorNote,
  RegisterLine,
} from '../components/composed';
import { useAppTheme } from '../context';
import {
  theme,
  suggestNextSplitDay,
  suggestSessionWindow,
  INTERVAL,
  ROW_GAP,
  PAGE_GUTTER,
  PRESS_DIP
} from '../constants';
import {
  navigateToSettings,
  navigateToWorkoutDetail,
  navigateToSplitSelection,
  navigateToProgram,
  navigateToExerciseDatabase,
  navigateToProgression,
  navigateToAnalytics,
} from '../navigation';
import {
  getSlotsForDay,
  getDayTitle,
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_TO_REGION,
} from '../shared/exercises';
import { useSplitPreferenceStore, useWorkoutStore, useDeloadStore } from '../stores';
import {
  useDashboardSummary,
  useRecentSessionDetails,
  useTopSetsByName,
  useWeightUnit,
  useActivityLog,
} from '../hooks';
import { toDisplayWeight, roundDisplayWeight, joinFacts } from '../utils';

const RECENT_COUNT = 3;

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentSessionDetails(5);
  const topSets = useTopSetsByName();
  const activityQuery = useActivityLog();
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const edition = useSplitPreferenceStore((s) => s.edition);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const unit = useWeightUnit();

  const streak = summaryQuery.data?.streak;
  const recent = recentQuery.data ?? [];
  const deload = useDeloadStore((s) => s.active);
  // THE SUGGESTION'S REASON — how long since the last session (the
  // suggestion itself is unchanged; it now says its why). A long gap
  // earns one honest line: open lighter.
  const daysSinceLast = useMemo(() => {
    if (recent.length === 0) return null;
    const last = new Date(recent[0].startedAt).getTime();
    return Math.max(0, Math.floor((Date.now() - last) / 86_400_000));
  }, [recent]);
  const longGap = daysSinceLast != null && daysSinceLast >= 10;
  // THE FUNNEL ENTRY: day suggestion sticks to today's logged day (AM
  // then PM share it), the window follows the clock, the split is the
  // remembered program.
  const suggestedDay = recent.length > 0 ? suggestNextSplitDay(recent) : 1;
  const suggestedWindow = suggestSessionWindow();
  const suggestedSlots = useMemo(
    () => getSlotsForDay(preferredSplit, suggestedDay, suggestedWindow, edition),
    [preferredSplit, suggestedDay, suggestedWindow],
  );
  const dayTitle = getDayTitle(preferredSplit, suggestedDay) || `Day ${suggestedDay}`;

  // THE DAY'S TARGETS, CONSOLIDATED TO REGIONS (the owner's
  // correction): 'Upper Chest, Chest' is CHEST; 'Side Delts, Rear
  // Delts' is DELT — the line states the day's regions, never a
  // muscle census, and never wraps (factSingleLine below).
  const REGION_WORD: Record<string, string> = {
    'Upper Leg': 'Legs',
    'Lower Leg': 'Calves',
    Chest: 'Chest',
    Delt: 'Delts',
    Back: 'Back',
    Arm: 'Arms',
    Core: 'Core',
  };
  const targetGroups = useMemo(() => {
    const regions = new Set<string>();
    for (const slot of suggestedSlots) {
      const muscles = SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.primaryMuscles ?? [];
      for (const m of muscles) {
        const region = MUSCLE_TO_REGION[m];
        if (region) regions.add(region);
      }
    }
    return [...regions].map((r) => REGION_WORD[r] ?? r);
  }, [suggestedSlots]);

  // THE SESSION'S SIZE (the upending pass): stations + the programmed
  // set budget — the one number that says whether this is a full
  // morning or a half. Computed from the slots; honest about ranges.
  const sizeLine = useMemo(() => {
    if (suggestedSlots.length === 0) return null;
    const min = suggestedSlots.reduce((n, s) => n + s.sets[0], 0);
    const max = suggestedSlots.reduce((n, s) => n + s.sets[1], 0);
    return joinFacts([
      `${suggestedSlots.length} ${suggestedSlots.length === 1 ? 'STATION' : 'STATIONS'}`,
      min === max ? `${min} SETS` : `${min}–${max} SETS`,
    ]);
  }, [suggestedSlots]);

  // The prescription rows' figures — the last TOP set per exercise
  // name (the shared derivation; the same rule that arms the Floor)
  // joined to the programmed rep range, in display units. A
  // bodyweight lift (null or 0) carries the range alone, muted —
  // the load fact is absent and the print says so.
  const prefillBySlot = useMemo(
    () =>
      suggestedSlots.map((slot) => {
        const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
        const name = entry?.name ?? slot.exercise;
        const range = `${slot.reps[0]}–${slot.reps[1]}`;
        const kg = topSets.map.get(name.toLowerCase())?.weight ?? null;
        if (kg == null || kg <= 0) return { figure: range, muted: true };
        return {
          figure: `${roundDisplayWeight(toDisplayWeight(kg, unit))} × ${range}`,
          muted: false,
        };
      }),
    [suggestedSlots, topSets, unit],
  );

  const header = (
    <View style={styles.headerRow}>
      {/* The folio — the brand mark at whisper scale. The register's
          content is the brand; the masthead stays a folio line. */}
      <View style={styles.brand}>
        <Dumbbell size={16} color={colors.text} />
        <Text style={[styles.wordmark, { color: colors.text }]}>ARMANDOTFIT</Text>
      </View>
      <Pressable
        onPress={navigateToSettings}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={({ pressed }) => [styles.iconButton, pressed ? { opacity: PRESS_DIP } : null]}
        testID="home-settings"
      >
        <Settings size={20} color={colors.text} />
      </Pressable>
    </View>
  );

  const jumpLine = (
    label: string,
    caption: string | null,
    onPress: () => void,
    testID: string,
  ) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={caption ? `${label} — ${caption}` : label}
      testID={testID}
      style={({ pressed }) => [styles.jumpRow, pressed ? { opacity: PRESS_DIP } : null]}
    >
      <Text style={[styles.jumpLabel, { color: colors.textSecondary }]}>{label}</Text>
      {/* The caption is the row's one FACT — the number that makes the
          destination worth its tap. Content, not chrome. The chevron
          closes it: one way-forward grammar app-wide (the progression
          tail, the NextStation row, and these jumps speak it together). */}
      {caption ? (
        <Text style={[styles.jumpCaption, { color: colors.textMuted }]} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <BoardShell surface="training" header={header} testID="home-scroll">
      {/* THE STATEMENT — the day itself, with the window whisper in
          muted furniture caps above it (the living position is
          furniture — red is strictly record/link/live). */}
      <BoardHead
        statement={dayTitle}
        statementTestID="home-day-title"
        whisper={joinFacts([
          new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase(),
          suggestedWindow === 'am' ? 'MORNING' : 'EVENING',
          `DAY ${suggestedDay}`,
          daysSinceLast != null && daysSinceLast > 0 ? `${daysSinceLast}D BACK` : null,
          deload ? 'DELOAD' : null,
        ])}
        fact={targetGroups.length > 0 ? joinFacts(targetGroups) : null}
        factSingleLine
      />

      {/* The long-gap honesty line — computed at read, one whisper. */}
      {longGap ? (
        <Text style={[styles.gapNote, { color: colors.textMuted }]} testID="home-gap-note">
          {`${daysSinceLast} days since the last session — open lighter.`}
        </Text>
      ) : null}

      {/* THE PRESCRIPTION — the day's plan as ruled rows wearing the
          screen's one 2px rule: name · air · prefill × rep range.
          The session's numbers, stated complete before you start;
          the size line above the rule says how long it runs. */}
      <View style={styles.block}>
        {sizeLine ? (
          <Text style={[styles.sizeLine, { color: colors.textMuted }]} testID="home-size-line">
            {sizeLine}
          </Text>
        ) : null}
        <View style={[styles.dayRegister, { borderTopColor: colors.text }]} testID="home-board">
          {suggestedSlots.length === 0 ? (
            <Text style={[styles.registerEmpty, { color: colors.textMuted }]}>
              No lifts programmed — start anyway and write your own.
            </Text>
          ) : (
            suggestedSlots.map((slot, i) => {
              const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
              const name = entry?.name ?? slot.exercise;
              return (
                <RegisterLine
                  key={slot.exercise + i}
                  label={name}
                  figure={prefillBySlot[i].figure}
                  figureTone={prefillBySlot[i].muted ? 'muted' : 'ink'}
                  testID={`home-board-row-${i}`}
                  figureTestID={`home-board-figure-${i}`}
                />
              );
            })
          )}
        </View>
      </View>

      {/* The one verb. */}
      <View style={styles.block}>
        <MobilePrimaryButton
          onPress={isSessionActive ? () => navigateToWorkoutDetail() : navigateToSplitSelection}
          testID={isSessionActive ? 'home-resume' : 'home-start'}
        >
          {isSessionActive ? 'RESUME' : 'START'}
        </MobilePrimaryButton>
      </View>

      {/* THE WEEK LINE — the browser's second question answered
          without a tap: the current week as printed figures (session
          counts, today in red), one tap through to THE LEDGER. The
          loading posture asserts nothing — it prints when the read
          succeeds, never a wall of dots impersonating a settled
          week. */}
      {activityQuery.isSuccess ? (
        <View style={styles.block}>
          <SectionWhisper>THE WEEK</SectionWhisper>
          <WeekLine
            sessions={activityQuery.data ?? []}
            onPress={navigateToAnalytics}
            testID="home-week"
          />
        </View>
      ) : null}

      {/* The jump rows — the Desk's only chrome, each with its fact. */}
      <View style={[styles.block, styles.jumpStack]}>
        {jumpLine(
          'Program',
          preferredSplit === 'oneADay' ? '4 days · full body' : '4 days · AM/PM',
          navigateToProgram,
          'home-index-program',
        )}
        {jumpLine(
          'Library',
          `${SYSTEM_EXERCISES.length} lifts`,
          navigateToExerciseDatabase,
          'home-index-library',
        )}
        {jumpLine(
          'Progress',
          streak?.current != null ? `${streak.current}-day streak` : null,
          navigateToProgression,
          'home-index-progress',
        )}
      </View>

      {/* Recent sessions — one Martian line each; the latest leads.
          The landmark hairline marks where TODAY ends and the archive
          begins (the atelier pass's one paragraph mark on the front
          page — within the hairline budget beside the register's 2px
          rule). */}
      <View style={styles.block}>
        {recent.length > 0 ? <SectionWhisper>RECENT WORK</SectionWhisper> : null}
        {recentQuery.isError ? (
          <QueryErrorNote onRetry={() => void recentQuery.refetch()} testID="home-recent-error" />
        ) : !recentQuery.isSuccess ? (
          <WorkoutListSkeleton />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            message="Log the first one and the record starts here."
            testID="home-empty-state"
          />
        ) : (
          <View>
            {recent.slice(0, RECENT_COUNT).map((w, i) => (
              <EditionLine
                key={w.id}
                session={w}
                lead={i === 0}
                onPress={navigateToWorkoutDetail}
              />
            ))}
          </View>
        )}
      </View>
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: PAGE_GUTTER,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    ...theme.typography.mobileEyebrow,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top-level blocks carry the air law.
  block: {
    ...INTERVAL.block,
  },
  gapNote: {
    ...theme.typography.mobileLedger,
    marginTop: 10,
  },
  // The prescription's size line — furniture caps above the 2px rule
  // (the running head above the printed heading rule).
  sizeLine: {
    ...theme.typography.mobileEyebrow,
    marginBottom: 8,
  },
  // THE DAY REGISTER — the day's lines wearing the screen's one 2px
  // rule (the printed heading rule). No panel: ground + rule + lines.
  dayRegister: {
    borderTopWidth: 2,
    paddingTop: 4,
  },
  registerEmpty: {
    ...theme.typography.mobileMeta,
    paddingVertical: 8,
  },
  jumpStack: {
    gap: ROW_GAP / 2,
  },
  jumpRow: {
    minHeight: 48,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jumpLabel: {
    // THE FRONT SORTS ITS THREE VOICES (the sight amendment): the
    // plan register is the answer and keeps the ink; the jumps are
    // navigation — row rank, secondary ink, unbold — so one look
    // sorts plan → verb → moves → archive.
    ...INTERVAL.row,
    fontWeight: '400',
  },
  jumpCaption: {
    ...theme.typography.mobileLedger,
    flex: 1,
    textAlign: 'right',
  },
});
