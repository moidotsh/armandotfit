// app/index.tsx
// Home dashboard. Surfaces the daily-driver summary a returning user
// needs: streak, weekly goal, quick actions, recent workouts. Replaces
// vellum's placeholder home.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobilePrimaryButton,
  MobileActionFooter,
  MobileSectionEyebrow,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAuth, useAppTheme } from '../context';
import {
  navigateToSettings,
  navigateToWorkoutDetail,
  navigateToExerciseDatabase,
  navigateToProgression,
  navigateToAnalytics,
  navigateToSplitSelection,
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

  const summary = summaryQuery.data;
  const streak = summary?.streak;
  const recent = recentQuery.data ?? [];

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="training" />
      <MobileHeader
        title="armandotfit"
        eyebrow={session?.email ? `Welcome back, ${session.email.split('@')[0]}` : 'Welcome'}
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
              <Pressable
                key={w.id}
                onPress={() => navigateToWorkoutDetail(w.id)}
                accessibilityRole="button"
              >
                <MobileSurface padding={14}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.workoutDate, { color: colors.text }]}>
                      {new Date(w.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={[styles.workoutDuration, { color: colors.textSecondary }]}>
                      {w.duration}m · day {w.day}
                    </Text>
                  </View>
                </MobileSurface>
              </Pressable>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
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
  workoutDate: { fontSize: 14, fontWeight: '600' },
  workoutDuration: { fontSize: 12 },
  emptyText: { fontSize: 13, lineHeight: 18 },
});
