// app/progression.tsx
// THE RECORD (count-thesis §7): the emotional number first — the
// current streak as the hero statement in the strike tone with the
// week's measure of marks beneath it — the totals beside it as mono
// figures, and personal bests closing the page as a ruled ledger. All
// computed at read from raw sessions; nothing stored.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MobileSectionEyebrow,
  MobilePrimaryButton,
  EmptyState,
  Figure,
  TallyStrip,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { DeskShell, QueryErrorNote } from '../components/composed';
import { useAppTheme } from '../context';
import { navigateToAnalytics, navigateToSplitSelection } from '../navigation';
import { useDashboardSummary, usePersonalBests } from '../hooks';
import { theme } from '../constants';
import { e1rm } from '../services';

export default function ProgressionScreen() {
  const { colors } = useAppTheme();
  const summaryQuery = useDashboardSummary();
  const pbQuery = usePersonalBests();
  const summary = summaryQuery.data;
  const isEmpty = (summary?.totalSessions ?? 0) === 0;


  return (
    <DeskShell
      surface="goal"
      header={
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
        </View>
      }
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
            {/* The week's measure — the streak as marks: trained days
                struck, the days ahead ghost. */}
            <View style={styles.streakMeasure} testID="progression-streak-measure">
              <TallyStrip
                struck={Math.min(summary?.streak.current ?? 0, 7)}
                ghost={Math.max(0, 7 - Math.min(summary?.streak.current ?? 0, 7))}
                size="sm"
              />
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
                      <Text style={[styles.pbValue, { color: colors.text }]}>
                        {`${pb.bestWeight}×${pb.bestReps}`}
                      </Text>
                      <Text style={[styles.pbEstimate, { color: colors.brandText }]}>
                        {`e1RM ${Math.round(e1rm(pb.bestWeight, pb.bestReps))}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      <MobilePrimaryButton variant="ghost" onPress={navigateToAnalytics} style={styles.analyticsLink}>
        View analytics
      </MobilePrimaryButton>
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
  headerTitle: {
    ...theme.typography.mobileDisplay,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 0.4,
  },
  streakMeasure: {
    marginTop: 10,
  },
  analyticsLink: { marginTop: 24 },
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
  pbEstimate: {
    ...theme.typography.mobileEyebrow,
    fontSize: 10,
    minWidth: 72,
    textAlign: 'right',
  },
});
