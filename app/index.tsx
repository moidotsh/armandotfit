// app/index.tsx
// Home dashboard. Surfaces the daily-driver summary a returning user
// needs: streak, weekly goal, quick actions, recent workouts. Replaces
// vellum's placeholder home.

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import {
  Home,
  PlusCircle,
  Dumbbell,
  TrendingUp,
  BarChart2,
  BookOpen,
  Settings,
} from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
  MobileNavDrawer,
  type MobileNavDrawerItem,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { HamburgerButton, WorkoutSessionItem } from '../components/composed';
import { useAuth, useAppTheme } from '../context';
import {
  navigateToSettings,
  navigateToWorkoutDetail,
  navigateToExerciseDatabase,
  navigateToProgression,
  navigateToAnalytics,
  navigateToSplitSelection,
  navigateToHome,
  navigateToWorkoutPrograms,
} from '../navigation';
import {
  useDashboardSummary,
  useRecentWorkouts,
} from '../hooks';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const recentQuery = useRecentWorkouts(5);
  const activePathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const summary = summaryQuery.data;
  const streak = summary?.streak;
  const recent = recentQuery.data ?? [];

  const navItems: MobileNavDrawerItem[] = [
    {
      id: '/',
      label: 'Home',
      icon: <Home size={18} color={colors.text} />,
      onPress: navigateToHome,
    },
    {
      id: '/split-selection',
      label: 'Start workout',
      icon: <PlusCircle size={18} color={colors.text} />,
      onPress: navigateToSplitSelection,
    },
    {
      id: '/exercise-database',
      label: 'Exercises',
      icon: <Dumbbell size={18} color={colors.text} />,
      onPress: navigateToExerciseDatabase,
    },
    {
      id: '/progression',
      label: 'Progression',
      icon: <TrendingUp size={18} color={colors.text} />,
      onPress: navigateToProgression,
    },
    {
      id: '/analytics',
      label: 'Analytics',
      icon: <BarChart2 size={18} color={colors.text} />,
      onPress: navigateToAnalytics,
    },
    {
      id: '/workout-programs',
      label: 'Programs',
      icon: <BookOpen size={18} color={colors.text} />,
      onPress: navigateToWorkoutPrograms,
    },
    {
      id: '/settings',
      label: 'Settings',
      icon: <Settings size={18} color={colors.text} />,
      onPress: navigateToSettings,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHeader
        title="armandotfit"
        eyebrow={session?.email ? `Welcome back, ${session.email.split('@')[0]}` : 'Welcome'}
        leftAction={
          <HamburgerButton isOpen={drawerOpen} onPress={() => setDrawerOpen(true)} />
        }
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak + weekly goal */}
        <MobileSectionEyebrow>Today</MobileSectionEyebrow>
        <MobileSurface padding={20}>
          {summaryQuery.isLoading ? (
            <LoadingSpinner />
          ) : (
            <View>
              <View style={styles.rowBetween}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Current streak
                </Text>
                <Text style={[styles.statValue, { color: colors.brand }]}>
                  {streak?.current ?? 0} days
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Best streak
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {streak?.best ?? 0} days
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  This week
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {summary?.weeklyGoal.completed ?? 0} / {summary?.weeklyGoal.target ?? 4}
                </Text>
              </View>
            </View>
          )}
        </MobileSurface>

        {/* Quick actions */}
        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Quick actions</MobileSectionEyebrow>
        <View style={styles.actionsRow}>
          <MobilePrimaryButton
            variant="primary"
            onPress={navigateToSplitSelection}
            style={styles.actionButton}
          >
            Start workout
          </MobilePrimaryButton>
          <MobilePrimaryButton
            variant="ghost"
            onPress={navigateToExerciseDatabase}
            style={styles.actionButton}
          >
            Exercises
          </MobilePrimaryButton>
        </View>

        {/* Recent workouts */}
        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Recent workouts</MobileSectionEyebrow>
        {recentQuery.isLoading ? (
          <MobileSurface padding={20}>
            <LoadingSpinner />
          </MobileSurface>
        ) : recent.length === 0 ? (
          <MobileSurface padding={20}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No workouts yet. Tap “Start workout” to log your first session.
            </Text>
          </MobileSurface>
        ) : (
          <View style={styles.recentList}>
            {recent.map((w) => (
              <WorkoutSessionItem
                key={w.id}
                session={w}
                onPress={navigateToWorkoutDetail}
              />
            ))}
          </View>
        )}

        {/* Secondary navigation */}
        <View style={{ height: 16 }} />
        <MobileSectionEyebrow>Explore</MobileSectionEyebrow>
        <View style={styles.actionsRow}>
          <MobilePrimaryButton
            variant="ghost"
            onPress={navigateToProgression}
            style={styles.actionButton}
          >
            Progression
          </MobilePrimaryButton>
          <MobilePrimaryButton
            variant="ghost"
            onPress={navigateToAnalytics}
            style={styles.actionButton}
          >
            Analytics
          </MobilePrimaryButton>
        </View>
      </ScrollView>
      <MobileActionFooter>
        <MobilePrimaryButton variant="ghost" onPress={navigateToSettings}>
          Settings
        </MobilePrimaryButton>
        <MobilePrimaryButton variant="ghost" onPress={() => void signOut()}>
          Sign out
        </MobilePrimaryButton>
      </MobileActionFooter>
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={navItems}
        activePathname={activePathname}
        atmosphere="training"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1, maxWidth: 420, alignSelf: 'center', width: '100%' },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: { fontSize: 13, fontWeight: '500' },
  statValue: { fontSize: 15, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
  recentList: { gap: 8 },
  emptyText: { fontSize: 13, lineHeight: 18 },
});
