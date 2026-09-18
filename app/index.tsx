// app/index.tsx
// Home — THE BROADSHEET's front page (docs/architecture/
// broadsheet-thesis.md §7). No tab bar: the Desk is a stack and home
// is its hub. The page opens with the masthead (wordmark + settings),
// then the day's statement: the kicker (TODAY · edition window · DAY
// N OF 4) above the day-title HEADLINE in Rokkitt, the lede naming
// the first lift, and START (or RESUME) as the one primary verb. The
// JUMP LINES — three ruled rows leading to Program, Library, Progress
// — replace navigation chrome. This week's figures and the recent
// editions ride beneath as agate on the ruled field. While a session
// runs, DeskShell pins the wire ticker under the header (thesis §6).
//
// Scroll choreography (the fold): the headline compresses under
// scroll — it scales down and lifts while the header's compact day
// marking fades in (transform/opacity only; collapsed to static under
// reduced motion — thesis §5).

import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Settings, ChevronRight } from '@tamagui/lucide-icons-2';
import {
  MobilePrimaryButton,
  MobileSectionEyebrow,
  EmptyState,
  Figure,
} from '../components/MobilePremium';
import {
  DeskShell,
  WorkoutSessionItem,
  DashboardSkeleton,
  WorkoutListSkeleton,
  QueryErrorNote,
} from '../components/composed';
import { useAppTheme } from '../context';
import {
  theme,
  suggestNextSplitDay,
  suggestSessionWindow,
} from '../constants';
import {
  navigateToSettings,
  navigateToWorkoutDetail,
  navigateToSplitSelection,
  navigateToProgram,
  navigateToExerciseDatabase,
  navigateToProgression,
} from '../navigation';
import {
  getSlotsForDay,
  getDayTitle,
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
} from '../shared/exercises';
import { useSplitPreferenceStore, useWorkoutStore } from '../stores';
import {
  useDashboardSummary,
  useRecentSessionDetails,
} from '../hooks';
import { useReducedMotion } from '../components/premium/shared';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentSessionDetails(5);
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const reduced = useReducedMotion();

  const summary = summaryQuery.data;
  const streak = summary?.streak;
  const recent = recentQuery.data ?? [];
  // THE FUNNEL ENTRY: day suggestion sticks to today's logged day (AM
  // then PM share it), the window follows the clock, the split is the
  // remembered program.
  const suggestedDay = recent.length > 0 ? suggestNextSplitDay(recent) : 1;
  const suggestedWindow = suggestSessionWindow();
  const suggestedSlots = useMemo(
    () => getSlotsForDay(preferredSplit, suggestedDay, suggestedWindow),
    [preferredSplit, suggestedDay, suggestedWindow],
  );
  const suggestedCount = suggestedSlots.length;
  const launcherTitle = getDayTitle(preferredSplit, suggestedDay) || `Day ${suggestedDay}`;
  // The lede names the day's opening lift — the answer to "what am I
  // walking into?" without leaving the front page.
  const firstLift = suggestedSlots.length > 0
    ? SYSTEM_EXERCISES_BY_SLUG[suggestedSlots[0].exercise]?.name ?? null
    : null;

  // The fold — one Animated value driven by onScroll
  // (transform/opacity only); reduced motion never attaches the
  // listener and the masthead renders static.
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScrollAnimated = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      ),
    [scrollY],
  );
  const titleScale = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0.6] });
  const titleTranslate = scrollY.interpolate({ inputRange: [0, 140], outputRange: [0, -18] });
  const titleOpacity = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0.4] });
  const headerMarkOpacity = scrollY.interpolate({ inputRange: [40, 90], outputRange: [0, 1] });

  const header = (
    <View style={styles.headerRow}>
      <Text style={[styles.wordmark, { color: colors.text }]}>ARMANDOTFIT</Text>
      <View style={styles.headerActions}>
        {!reduced ? (
          <Animated.Text
            testID="home-header-day"
            style={[
              styles.headerDayMark,
              { color: colors.textMuted, opacity: headerMarkOpacity },
            ]}
          >
            {`D${String(suggestedDay).padStart(2, '0')}`}
          </Animated.Text>
        ) : null}
        <Pressable
          onPress={navigateToSettings}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.6 } : null]}
          testID="home-settings"
        >
          <Settings size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );

  const jumpLine = (
    label: string,
    caption: string,
    onPress: () => void,
    testID: string,
  ) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${caption}`}
      testID={testID}
      style={({ pressed }) => [
        styles.indexRow,
        { borderBottomColor: colors.mobilePremium.hairlineBorder },
        pressed ? { opacity: 0.6 } : null,
      ]}
    >
      <Text style={[styles.indexLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.indexCaption, { color: colors.textMuted }]} numberOfLines={1}>
        {caption}
      </Text>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <DeskShell
      surface="training"
      header={header}
      onScroll={reduced ? undefined : onScrollAnimated}
      testID="home-scroll"
    >
      {/* THE HEADLINE — the day's statement. The kicker carries the
          edition facts (window, day-of-split position); the title is
          the one display-scale element on the page. */}
      <MobileSectionEyebrow flush={false}>
        {`TODAY · ${suggestedWindow === 'am' ? 'AM' : 'PM'} EDITION · DAY ${suggestedDay} OF 4`}
      </MobileSectionEyebrow>
      <Animated.Text
        testID="home-masthead-title"
        style={[
          styles.dayTitle,
          { color: colors.text },
          reduced
            ? null
            : {
                transform: [{ scale: titleScale }, { translateY: titleTranslate }],
                opacity: titleOpacity,
              },
        ]}
        numberOfLines={2}
      >
        {launcherTitle.toUpperCase()}
      </Animated.Text>
      {firstLift ? (
        <Text style={[styles.firstLift, { color: colors.text }]} numberOfLines={1}>
          {`First up — ${firstLift}${suggestedCount > 1 ? `  +${suggestedCount - 1} more` : ''}`}
        </Text>
      ) : (
        <Text style={[styles.firstLift, { color: colors.textMuted }]} numberOfLines={2}>
          {isSessionActive
            ? 'Session on the floor — the ticker above returns you to it.'
            : 'Start from the button below when you hit the floor.'}
        </Text>
      )}
      <MobilePrimaryButton
        onPress={isSessionActive ? () => navigateToWorkoutDetail() : navigateToSplitSelection}
        testID={isSessionActive ? 'home-resume' : 'home-start'}
      >
        {isSessionActive ? 'RESUME SESSION' : 'START'}
      </MobilePrimaryButton>

      {/* THE JUMP LINES — the tab bar's replacement. Three ruled rows,
          each with its agate caption; the Desk navigates from here. */}
      <MobileSectionEyebrow rule flush={false}>
        In this app
      </MobileSectionEyebrow>
      <View style={styles.indexStack} testID="home-index">
        {jumpLine(
          'PROGRAM',
          '4-day · AM/PM',
          navigateToProgram,
          'home-index-program',
        )}
        {jumpLine(
          'LIBRARY',
          `${SYSTEM_EXERCISES.length} lifts`,
          navigateToExerciseDatabase,
          'home-index-library',
        )}
        {jumpLine(
          'PROGRESS',
          streak?.current != null ? `${streak.current}-day streak` : 'streak + bests',
          navigateToProgression,
          'home-index-progress',
        )}
      </View>

      {/* This week — agate figures on the field. */}
      <MobileSectionEyebrow rule flush={false}>
        This week
      </MobileSectionEyebrow>
      {summaryQuery.isLoading ? (
        <DashboardSkeleton />
      ) : summaryQuery.isError ? (
        <QueryErrorNote onRetry={() => void summaryQuery.refetch()} testID="home-summary-error" />
      ) : (
        <View style={styles.statRow}>
          <Figure
            value={streak?.current ?? 0}
            unit="d"
            label="streak"
            style={styles.statCell}
          />
          <Figure
            value={summary?.thisWeekSessions ?? 0}
            label="sessions"
            style={styles.statCell}
          />
          <Figure
            value={summary?.totalSessions ?? 0}
            label="all time"
            align="right"
            style={styles.statCell}
          />
        </View>
      )}

      {/* Recent — the edition archive: agate rows on hairlines. */}
      <MobileSectionEyebrow rule flush={false}>
        Recent editions
      </MobileSectionEyebrow>
      {recentQuery.isLoading ? (
        <WorkoutListSkeleton />
      ) : recentQuery.isError ? (
        <QueryErrorNote onRetry={() => void recentQuery.refetch()} testID="home-recent-error" />
      ) : recent.length === 0 ? (
        <EmptyState
          title="No editions yet"
          message="Your logged AM/PM sessions land here — streaks, day-of-split, and history start with the first one."
          action={{ label: 'Start workout', onPress: navigateToSplitSelection }}
          testID="home-empty-state"
        />
      ) : (
        <View>
          {recent.map((w, i) => (
            <WorkoutSessionItem
              key={w.id}
              session={w}
              isLast={i === recent.length - 1}
              onPress={navigateToWorkoutDetail}
            />
          ))}
        </View>
      )}
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: 0.6,
  },
  headerDayMark: {
    ...theme.typography.mobileLedger,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTitle: {
    ...theme.typography.mobileDisplay,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  firstLift: {
    ...theme.typography.mobileItemTitle,
    marginTop: 10,
    marginBottom: 14,
  },
  indexStack: {
    marginTop: 2,
  },
  indexRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  indexLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  indexCaption: {
    ...theme.typography.mobileLedger,
    flex: 1,
    textAlign: 'right',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  statCell: { flex: 1 },
});
