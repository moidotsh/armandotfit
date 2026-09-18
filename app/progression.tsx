// app/progression.tsx
// Progression dashboard. One summary card — current streak, this week,
// lifetime sessions as figures with a quiet meta line (best streak, last
// session) — then the personal-best ledger. All computed at read from
// raw sessions; nothing stored. Volume-trend charts land in a-Phase 5.

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
  EmptyState,
  Figure,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme } from '../context';
import { safeGoBack, navigateToAnalytics, navigateToSplitSelection } from '../navigation';
import { useDashboardSummary, usePersonalBests, useAiPayload } from '../hooks';
import { SCREEN_BODY_STYLE, theme } from '../constants';

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const summary = summaryQuery.data;
  const isEmpty = (summary?.totalSessions ?? 0) === 0;

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

  const figures = [
    { value: summary?.streak.current ?? 0, label: 'day streak', brand: true },
    { value: summary?.thisWeekSessions ?? 0, label: 'this week', brand: false },
    { value: summary?.totalSessions ?? 0, label: 'all time', brand: false },
  ];

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
        ) : isEmpty ? (
          <EmptyState
            title="Nothing to progress yet"
            message="Log your first session and your streak, totals, and personal bests start here."
            action={{ label: 'Start workout', onPress: navigateToSplitSelection }}
            testID="progression-empty"
          />
        ) : (
          <>
            <MobileSectionEyebrow>Summary</MobileSectionEyebrow>
            <MobileSurface padding={20}>
              <View style={styles.figureRow}>
                {figures.map((f) => (
                  <Figure
                    key={f.label}
                    value={f.value}
                    label={f.label}
                    tone={f.brand ? 'brand' : 'ink'}
                    align="center"
                    style={styles.figureCell}
                  />
                ))}
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Best streak {summary?.streak.best ?? 0}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Last session{' '}
                  {summary?.lastSessionDate
                    ? new Date(summary.lastSessionDate).toLocaleDateString()
                    : '—'}
                </Text>
              </View>
            </MobileSurface>

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
                        style={[styles.pbValue, { color: colors.brandText }]}
                      >
                        {pb.bestWeight}×{pb.bestReps}
                      </Text>
                    </View>
                  ))}
                </MobileSurface>
              </>
            ) : null}
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
  figureRow: { flexDirection: 'row' },
  figureCell: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { height: 1, marginVertical: 14 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: { ...theme.typography.mobileMeta },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pbName: { ...theme.typography.mobileLedger, flex: 1, marginRight: 12 },
  pbValue: { ...theme.typography.mobileLedger },
});
