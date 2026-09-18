// app/index.tsx
// Today — the Desk's front page (docs/architecture/signal-thesis.md
// §7): the masthead answers "what am I walking into?" with the
// day-of-split as the loudest number in the app, the first lift
// named, and START as the one signal fill above the fold. The week's
// figures and the recent ledger ride beneath on steel, no cards.
//
// Scroll choreography: the masthead compresses under scroll — the
// hero day figure scales down and the header's compact day chip fades
// in (transform/opacity only, collapsed to static under reduced
// motion; see signal-thesis §5).

import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Settings, Play } from '@tamagui/lucide-icons-2';
import {
  MobilePrimaryButton,
  MobileSectionEyebrow,
  CopyForAiButton,
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
import { useAuth, useAppTheme } from '../context';
import {
  theme,
  suggestNextSplitDay,
  suggestSessionWindow,
} from '../constants';
import {
  navigateToSettings,
  navigateToWorkoutDetail,
  navigateToSplitSelection,
} from '../navigation';
import { getSlotsForDay, getDayTitle, SYSTEM_EXERCISES_BY_SLUG } from '../shared/exercises';
import { useSplitPreferenceStore, useWorkoutStore } from '../stores';
import {
  useDashboardSummary,
  useRecentSessionDetails,
  useAiPayload,
} from '../hooks';
import { useReducedMotion } from '../components/premium/shared';

export default function HomeScreen() {
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentSessionDetails(5);
  const activePathname = usePathname();
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);
  const reduced = useReducedMotion();

  const summary = summaryQuery.data;
  const streak = summary?.streak;
  const recent = recentQuery.data ?? [];
  // THE FUNNEL ENTRY: what the app opens with. Day suggestion sticks to
  // today's logged day (AM then PM share it), the window follows the
  // clock, the split is the remembered program.
  const suggestedDay = recent.length > 0 ? suggestNextSplitDay(recent) : 1;
  const suggestedWindow = suggestSessionWindow();
  const suggestedSlots = useMemo(
    () => getSlotsForDay(preferredSplit, suggestedDay, suggestedWindow),
    [preferredSplit, suggestedDay, suggestedWindow],
  );
  const suggestedCount = suggestedSlots.length;
  const launcherTitle = getDayTitle(preferredSplit, suggestedDay) || `Day ${suggestedDay}`;
  // The brief names the day's opening lift — the answer to "what am I
  // walking into?" without leaving home.
  const firstLift = suggestedSlots.length > 0
    ? SYSTEM_EXERCISES_BY_SLUG[suggestedSlots[0].exercise]?.name ?? null
    : null;

  const aiPayload = useAiPayload(
    summary
      ? {
          visibleContent: [
            `- Current streak: ${streak?.current ?? 0} days`,
            `- Best streak: ${streak?.best ?? 0} days`,
            `- This week: ${summary.thisWeekSessions ?? 0} sessions`,
            `- Total sessions: ${summary.totalSessions ?? 0} sessions`,
            `- Recent sessions: ${recent.length}`,
          ].join('\n'),
        }
      : undefined,
  );

  // Scroll choreography — the masthead compresses. One Animated value
  // driven by onScroll (transform/opacity only); reduced motion never
  // attaches the listener and everything renders static.
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScrollAnimated = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      ),
    [scrollY],
  );
  const header = (
    <View style={styles.headerRow}>
      <Text style={[styles.wordmark, { color: colors.text }]}>armandotfit</Text>
      <View style={styles.headerActions}>
        {!reduced ? (
          <Animated.Text
            style={[
              styles.headerDay,
              {
                color: colors.brandText,
                opacity: scrollY.interpolate({ inputRange: [40, 90], outputRange: [0, 1] }),
              },
            ]}
          >
            {`D${String(suggestedDay).padStart(2, '0')}`}
          </Animated.Text>
        ) : null}
        <CopyForAiButton variant="subtle" payload={aiPayload} testID="dashboard-copy-for-ai" />
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

  const heroScale = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0.5] });
  const heroTranslate = scrollY.interpolate({ inputRange: [0, 140], outputRange: [0, -24] });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, 140], outputRange: [1, 0.35] });

  return (
    <DeskShell
      surface="training"
      header={header}
      activeTab={activePathname}
      onScroll={reduced ? undefined : onScrollAnimated}
      testID="home-scroll"
    >
      {/* THE MASTHEAD — the day itself is the hero; the START button is
          the only signal fill above the fold. */}
      <MobileSectionEyebrow flush={false}>
        {`TODAY · ${suggestedWindow === 'am' ? 'AM' : 'PM'} WINDOW`}
      </MobileSectionEyebrow>
      <Animated.View
        testID="home-masthead-row"
        style={[
          styles.todayRow,
          reduced
            ? null
            : {
                transform: [{ scale: heroScale }, { translateY: heroTranslate }],
                opacity: heroOpacity,
              },
        ]}
      >
        <Figure
          value={suggestedDay}
          label="day of split"
          size="hero"
          testID="home-day-hero"
        />
        <View style={styles.todaySide}>
          <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={2}>
            {launcherTitle}
          </Text>
          <Text style={[styles.todayMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {suggestedCount} exercise{suggestedCount === 1 ? '' : 's'}
          </Text>
        </View>
      </Animated.View>
      {firstLift ? (
        <Text style={[styles.firstLift, { color: colors.text }]} numberOfLines={1}>
          First up — {firstLift}
        </Text>
      ) : (
        <Text style={[styles.firstLift, { color: colors.textMuted }]} numberOfLines={2}>
          {isSessionActive
            ? 'Session in progress — resume from the bar below.'
            : 'Start from the bar below when you hit the floor.'}
        </Text>
      )}

      {/* This week — figures on steel, no cards. */}
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
            tone="brand"
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

      {/* Recent — the ledger: rows on hairlines. */}
      <MobileSectionEyebrow rule flush={false}>
        Recent
      </MobileSectionEyebrow>
      {recentQuery.isLoading ? (
        <WorkoutListSkeleton />
      ) : recentQuery.isError ? (
        <QueryErrorNote onRetry={() => void recentQuery.refetch()} testID="home-recent-error" />
      ) : recent.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          message="Your logged AM/PM sessions land here — streaks, day-of-split, and history start with the first one."
          icon={<Play size={28} color={colors.brand} />}
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
    paddingHorizontal: 20,
  },
  wordmark: {
    fontFamily: theme.fonts.displayCondensed,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerDay: {
    ...theme.typography.mobileLedger,
    marginRight: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginTop: 4,
  },
  todaySide: {
    flex: 1,
    paddingTop: 10,
    gap: 2,
  },
  dayTitle: {
    ...theme.typography.mobileTitle,
  },
  todayMeta: {
    ...theme.typography.mobileMeta,
  },
  firstLift: {
    ...theme.typography.mobileItemTitle,
    marginTop: 12,
  },
  launcher: { marginTop: 16 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  statCell: { flex: 1 },
});
