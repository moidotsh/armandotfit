// app/index.tsx
// Home — the daily brief, set as a logbook page (see
// docs/architecture/logbook-thesis.md §7): the day itself is the hero,
// the start button is the only brand fill above the fold, and every
// section below is a ruled eyebrow + rows on paper — no cards. The
// funnel (start today's session) answers "what am I walking into?"
// without a box around it.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import {
  Home,
  PlusCircle,
  Dumbbell,
  TrendingUp,
  BarChart2,
  CalendarDays,
  Settings,
  X,
} from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileHomeHeader,
  MobilePrimaryButton,
  MobileSectionEyebrow,
  MobileNavDrawer,
  HamburgerButton,
  CopyForAiButton,
  EmptyState,
  Figure,
  type MobileNavDrawerItem,
} from '../components/MobilePremium';
import {
  WorkoutSessionItem,
  DashboardSkeleton,
  WorkoutListSkeleton,
  QueryErrorNote,
} from '../components/composed';
import { useAuth, useAppTheme } from '../context';
import {
  theme,
  APP_LAYOUT,
  MOBILE_CONTENT_MAX_WIDTH,
  SCREEN_BODY_STYLE,
  suggestNextSplitDay,
  suggestSessionWindow,
} from '../constants';
import {
  navigateToSettings,
  navigateToProgram,
  navigateToWorkoutDetail,
  navigateToExerciseDatabase,
  navigateToProgression,
  navigateToAnalytics,
  navigateToSplitSelection,
  navigateToHome,
} from '../navigation';
import { getSlotsForDay, getDayTitle, SYSTEM_EXERCISES_BY_SLUG } from '../shared/exercises';
import { useSplitPreferenceStore } from '../stores';
import {
  useDashboardSummary,
  useRecentSessionDetails,
  useAiPayload,
} from '../hooks';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentSessionDetails(5);
  const activePathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const preferredSplit = useSplitPreferenceStore((s) => s.splitType);

  const summary = summaryQuery.data;
  const streak = summary?.streak;
  const recent = recentQuery.data ?? [];
  // THE FUNNEL ENTRY: what the app opens with. Day suggestion sticks to
  // today's logged day (AM then PM share it), the window follows the
  // clock, the split is the remembered program.
  const suggestedDay = recent.length > 0 ? suggestNextSplitDay(recent) : 1;
  const suggestedWindow = suggestSessionWindow();
  const suggestedSlots = getSlotsForDay(preferredSplit, suggestedDay, suggestedWindow);
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

  const navItems: MobileNavDrawerItem[] = [
    {
      id: '/',
      label: 'Home',
      icon: <Home size={18} color={colors.background} />,
      onPress: navigateToHome,
    },
    {
      id: '/split-selection',
      label: 'Start workout',
      icon: <PlusCircle size={18} color={colors.background} />,
      onPress: navigateToSplitSelection,
    },
    {
      id: '/exercise-database',
      label: 'Exercises',
      icon: <Dumbbell size={18} color={colors.background} />,
      onPress: navigateToExerciseDatabase,
    },
    {
      id: '/program',
      label: 'Program',
      icon: <CalendarDays size={18} color={colors.background} />,
      onPress: navigateToProgram,
    },
    {
      id: '/progression',
      label: 'Progression',
      icon: <TrendingUp size={18} color={colors.background} />,
      onPress: navigateToProgression,
    },
    {
      id: '/analytics',
      label: 'Analytics',
      icon: <BarChart2 size={18} color={colors.background} />,
      onPress: navigateToAnalytics,
    },
    {
      id: '/settings',
      label: 'Settings',
      icon: <Settings size={18} color={colors.background} />,
      onPress: navigateToSettings,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHomeHeader
        brand="armandotfit"
        subtitle={
          session?.email ? `Welcome back, ${session.email.split('@')[0]}` : 'Welcome'
        }
        onPlate={drawerOpen}
        menuButton={
          <HamburgerButton
            isOpen={drawerOpen}
            onPress={() => setDrawerOpen((prev) => !prev)}
            color={drawerOpen ? colors.background : undefined}
          />
        }
        rightAction={<CopyForAiButton variant="subtle" payload={aiPayload} testID="dashboard-copy-for-ai" />}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* THE FUNNEL — the day itself is the hero figure; the plan
            reads beside it; the start button is the only brand fill
            above the fold. */}
        <MobileSectionEyebrow rule flush={false}>
          {`Today · ${suggestedWindow === 'am' ? 'AM' : 'PM'} window`}
        </MobileSectionEyebrow>
        <View style={styles.todayRow}>
          <Figure
            value={suggestedDay}
            label="day of split"
            size="hero"
            tone="brand"
            testID="home-day-hero"
          />
          <View style={styles.todaySide}>
            <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={2}>
              {launcherTitle}
            </Text>
            <Text style={[styles.todayMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {suggestedCount} exercise{suggestedCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        {firstLift ? (
          <Text style={[styles.firstLift, { color: colors.text }]} numberOfLines={1}>
            First up — {firstLift}
          </Text>
        ) : null}
        <MobilePrimaryButton
          onPress={navigateToSplitSelection}
          style={styles.launcher}
          testID="home-launcher-start"
        >
          {preferredSplit === 'twoADay'
            ? `Start ${suggestedWindow.toUpperCase()} workout`
            : 'Start workout'}
        </MobilePrimaryButton>

        {/* This week — figures on paper, no cards. */}
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

        {/* Recent — the logbook's latest page: ledger rows, hairline rules. */}
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
            icon={<PlusCircle size={28} color={colors.brand} />}
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
      </ScrollView>
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={navItems}
        activePathname={activePathname}
        atmosphere="training"
        brandPersistence={APP_LAYOUT.navDrawerBrandPersistence}
        anchor={APP_LAYOUT.navDrawerAnchor}
        columnWidth={MOBILE_CONTENT_MAX_WIDTH}
        itemLabelStyle={{
          ...theme.typography.mobileEyebrow,
          textTransform: 'uppercase',
        }}
        header={
          APP_LAYOUT.navDrawerBrandPersistence === 'slideout' ? (
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrandRow}>
                <Pressable
                  onPress={() => setDrawerOpen(false)}
                  hitSlop={12}
                  accessibilityLabel="Close menu"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed ? { opacity: 0.6 } : null,
                  ]}
                >
                  <X size={22} color={colors.background} />
                </Pressable>
                <Text
                  style={[theme.typography.mobileTitle, { color: colors.background }]}
                  numberOfLines={1}
                >
                  armandotfit
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.mobileSubtitle,
                  { color: `${colors.background}B3`, marginTop: 4 },
                ]}
                numberOfLines={1}
              >
                {session?.email
                  ? `Welcome back, ${session.email.split('@')[0]}`
                  : 'Welcome'}
              </Text>
            </View>
          ) : undefined
        }
        footer={
          <MobilePrimaryButton variant="ghost" onPress={() => void signOut()}>
            Sign out
          </MobilePrimaryButton>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginTop: 12,
  },
  todaySide: {
    flex: 1,
    paddingTop: 8,
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
  drawerHeader: {
    paddingHorizontal: 20,
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
