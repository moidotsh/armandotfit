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
  CopyForAiButton,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme } from '../context';
import { safeGoBack, navigateToAnalytics } from '../navigation';
import { useDashboardSummary, usePersonalBests, useAiPayload } from '../hooks';
import { SCREEN_BODY_STYLE } from '../constants';

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const summary = summaryQuery.data;

  const aiPayload = useAiPayload(
    summary
      ? {
          visibleContent: [
            `- Current streak: ${summary.streak.current} days`,
            `- Best streak: ${summary.streak.best} days`,
            `- Sessions logged: ${summary.totalSessions}`,
            `- This week: ${summary.thisWeekSessions}`,
          ].join('\n'),
        }
      : undefined,
  );

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="goal" />
      <MobileHeader
        title="Progression"
        eyebrow="Lifetime"
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="progression-copy-for-ai" />}
      />
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
                  Sessions logged
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.totalSessions ?? 0}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Last session
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.lastSessionDate
                    ? new Date(summary.lastSessionDate).toLocaleDateString()
                    : '—'}
                </Text>
              </View>
            </MobileSurface>

            <View style={{ height: 16 }} />
            {pbQuery.data && pbQuery.data.length > 0 ? (
              <>
                <View style={{ height: 16 }} />
                <MobileSectionEyebrow>Personal bests</MobileSectionEyebrow>
                <MobileSurface padding={16}>
                  {pbQuery.data.slice(0, 10).map((pb) => (
                    <View
                      key={pb.exerciseName}
                      style={styles.rowBetween}
                    >
                      <Text
                        style={[styles.pbName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {pb.exerciseName}
                      </Text>
                      <Text
                        style={[styles.pbValue, { color: colors.brand }]}
                      >
                        {pb.bestWeight}×{pb.bestReps}
                      </Text>
                    </View>
                  ))}
                </MobileSurface>
              </>
            ) : null}

            <MobileSectionEyebrow>This week</MobileSectionEyebrow>
            <MobileSurface padding={20}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Sessions
                </Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {summary?.thisWeekSessions ?? 0}
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
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: { fontSize: 13, fontWeight: '500' },
  value: { fontSize: 15, fontWeight: '600' },
  pbName: { fontSize: 13, fontWeight: '500', flex: 1, marginRight: 12 },
  pbValue: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
