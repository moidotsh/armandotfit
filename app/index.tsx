// app/index.tsx
// Home dashboard. Surfaces the daily-driver summary a returning user
// needs: streak, weekly goal, quick actions, recent workouts. Replaces
// arqavellum's placeholder home.

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
  BookOpen,
  Settings,
  X,
} from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHomeHeader,
  MobilePrimaryButton,
  MobileSectionEyebrow,
  MobileNavDrawer,
  type MobileNavDrawerItem,
} from '../components/MobilePremium';
import {
  HamburgerButton,
  WorkoutSessionItem,
  DashboardSkeleton,
  WorkoutListSkeleton,
} from '../components/composed';
import { useAuth, useAppTheme } from '../context';
import { theme, APP_LAYOUT, SCREEN_BODY_STYLE } from '../constants';
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
      <MobileHomeHeader
        brand="armandotfit"
        subtitle={
          session?.email ? `Welcome back, ${session.email.split('@')[0]}` : 'Welcome'
        }
        menuButton={
          <HamburgerButton
            isOpen={drawerOpen}
            onPress={() => setDrawerOpen((prev) => !prev)}
          />
        }
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak + weekly goal */}
        <MobileSectionEyebrow>Today</MobileSectionEyebrow>
        {summaryQuery.isLoading ? (
          <DashboardSkeleton />
        ) : (
          <MobileSurface padding={20}>
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
          </MobileSurface>
        )}

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
          <WorkoutListSkeleton />
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
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={navItems}
        activePathname={activePathname}
        atmosphere="training"
        brandPersistence={APP_LAYOUT.navDrawerBrandPersistence}
        anchor={APP_LAYOUT.navDrawerAnchor}
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
                  <X size={22} color={colors.text} />
                </Pressable>
                <Text
                  style={[theme.typography.mobileTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  armandotfit
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.mobileSubtitle,
                  { color: colors.textSecondary, marginTop: 4 },
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
