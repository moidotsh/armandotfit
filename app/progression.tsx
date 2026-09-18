// app/progression.tsx
// Progression — the emotional number first (docs/architecture/
// logbook-thesis.md §7): the current streak is the hero figure, the
// totals ride beside and beneath it as figures on paper, and personal
// bests close the page as a mono ledger. All computed at read from raw
// sessions; nothing stored.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileHeader,
  MobileSectionEyebrow,
  MobilePrimaryButton,
  MobileActionFooter,
  CopyForAiButton,
  EmptyState,
  Figure,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { QueryErrorNote } from '../components/composed';
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
        ) : summaryQuery.isError ? (
          <QueryErrorNote onRetry={() => void summaryQuery.refetch()} testID="progression-error" />
        ) : isEmpty ? (
          <EmptyState
            title="Nothing to progress yet"
            message="Log your first session and your streak, totals, and personal bests start here."
            action={{ label: 'Start workout', onPress: navigateToSplitSelection }}
            testID="progression-empty"
          />
        ) : (
          <>
            {/* The emotional number: streak at hero scale, best + last
                session murmuring beside it. */}
            <MobileSectionEyebrow rule flush={false}>
              Current streak
            </MobileSectionEyebrow>
            <View style={styles.heroRow}>
              <Figure
                value={summary?.streak.current ?? 0}
                unit="d"
                size="hero"
                tone="brand"
                testID="progression-streak-hero"
              />
              <View style={styles.heroSide}>
                <Text style={[styles.sideLine, { color: colors.text }]}>
                  {`best ${summary?.streak.best ?? 0}`}
                </Text>
                <Text style={[styles.sideMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  {`last ${summary?.lastSessionDate
                    ? new Date(summary.lastSessionDate).toLocaleDateString()
                    : '—'}`}
                </Text>
              </View>
            </View>

            {/* Totals as figures on paper. */}
            <MobileSectionEyebrow rule flush={false}>
              Totals
            </MobileSectionEyebrow>
            <View style={styles.totalsRow}>
              <Figure
                value={summary?.thisWeekSessions ?? 0}
                label="this week"
                style={styles.totalsCell}
              />
              <Figure
                value={summary?.totalSessions ?? 0}
                label="all time"
                align="right"
                style={styles.totalsCell}
              />
            </View>

            {/* Personal bests — the mono ledger. */}
            {pbQuery.data && pbQuery.data.length > 0 ? (
              <>
                <MobileSectionEyebrow rule flush={false}>
                  Personal bests
                </MobileSectionEyebrow>
                <View>
                  {pbQuery.data.slice(0, 10).map((pb, i) => (
                    <View
                      key={pb.exerciseName}
                      style={[
                        styles.pbRow,
                        { borderBottomColor: colors.mobilePremium.hairlineBorder },
                        i === Math.min(pbQuery.data.length, 10) - 1
                          ? { borderBottomWidth: 0 }
                          : null,
                      ]}
                    >
                      <Text style={[styles.pbName, { color: colors.text }]} numberOfLines={1}>
                        {pb.exerciseName}
                      </Text>
                      <Text style={[styles.pbValue, { color: colors.brandText }]}>
                        {`${pb.bestWeight}×${pb.bestReps}`}
                      </Text>
                    </View>
                  ))}
                </View>
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
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginTop: 12,
  },
  heroSide: {
    flex: 1,
    paddingTop: 12,
    gap: 4,
  },
  sideLine: {
    ...theme.typography.mobileLedger,
  },
  sideMeta: {
    ...theme.typography.mobileMeta,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  totalsCell: { flex: 1 },
  pbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  pbName: { ...theme.typography.mobileBody, fontWeight: '600', flex: 1 },
  pbValue: {
    ...theme.typography.mobileLedger,
  },
});
