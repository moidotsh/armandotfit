// app/progression.tsx
// Progression dashboard. Surfaces streaks + lifetime totals so the user
// can see how their training has accumulated. Volume-trend charts +
// per-exercise PR tracking land in a-Phase 5; this route ships the
// numerical summary first.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  MobilePrimaryButton,
  MobileActionFooter,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme } from '../context';
import { safeGoBack, navigateToAnalytics } from '../navigation';
import { useDashboardSummary } from '../hooks';

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const summary = summaryQuery.data;

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="goal" />
      <MobileHeader title="Progression" eyebrow="Lifetime" onBack={safeGoBack} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {summaryQuery.isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <MobileSectionEyebrow>Streaks</MobileSectionEyebrow>
            <MobileSurface padding={20}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Current
                </Text>
                <Text style={[styles.value, { color: colors.brand }]}>
                  {summary?.streak.current ?? 0} days
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Best
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.streak.best ?? 0} days
                </Text>
              </View>
            </MobileSurface>

            <View style={{ height: 16 }} />
            <MobileSectionEyebrow>Totals</MobileSectionEyebrow>
            <MobileSurface padding={20}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Workouts logged
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.totalWorkouts ?? 0}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Total training time
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.totalDurationMinutes ?? 0} min
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Last workout
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.lastWorkoutDate
                    ? new Date(summary.lastWorkoutDate).toLocaleDateString()
                    : '—'}
                </Text>
              </View>
            </MobileSurface>

            <View style={{ height: 16 }} />
            <MobileSectionEyebrow>This week</MobileSectionEyebrow>
            <MobileSurface padding={20}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Goal progress
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.weeklyGoal.completed ?? 0} / {summary?.weeklyGoal.target ?? 4}
                </Text>
              </View>
            </MobileSurface>
          </>
        )}
      </ScrollView>
      <MobileActionFooter>
        <MobilePrimaryButton variant="ghost" onPress={navigateToAnalytics}>
          View analytics
        </MobilePrimaryButton>
      </MobileActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: { fontSize: 13, fontWeight: '500' },
  value: { fontSize: 15, fontWeight: '600' },
});
