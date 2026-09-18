// app/analytics.tsx
// Analytics screen — daily-aggregate history + weekly bucketing + a
// training-consistency grid over the selected range. The chart layer
// (a real chart lib) lands in a-Phase 5; for now the weekly bucketing
// renders as a text bar-chart so the data is visible, and the
// consistency grid surfaces per-day workout density as a heatmap.

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  CopyForAiButton,
  SegmentedControl,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { QueryErrorNote } from '../components/composed';
import { TrainingConsistencyGrid } from '../components/composed';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useAnalyticsHistory, useAiPayload } from '../hooks';
import { AnalyticsService } from '../services';
import { addDays } from '../utils';
import { SCREEN_BODY_STYLE, theme } from '../constants';

type Range = 7 | 30 | 90;

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const [range, setRange] = useState<Range>(30);
  const historyQuery = useAnalyticsHistory(range);

  const weekly = useMemo(() => {
    if (!historyQuery.data) return [];
    return AnalyticsService.bucketWeekly(historyQuery.data);
  }, [historyQuery.data]);

  const maxWorkouts = Math.max(1, ...weekly.map((w) => w.sessions));

  const sessionsInRange = weekly.reduce((sum, w) => sum + w.sessions, 0);
  const aiPayload = useAiPayload({
    visibleContent: [
      `- Range: ${range} days`,
      `- Sessions in range: ${sessionsInRange}`,
      `- Weeks bucketed: ${weekly.length}`,
    ].join('\n'),
  });

  // Grid range: today + range days back (matches the repository's
  // `gte(date, today - daysBack)` filter so every row returned by the
  // hook lands on a visible cell).
  const gridRange = useMemo(() => {
    const end = new Date();
    const start = addDays(end, -range);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }, [range]);

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader
        title="Analytics"
        eyebrow="History"
        onBack={safeGoBack}
        navRightAction={<CopyForAiButton payload={aiPayload} testID="analytics-copy-for-ai" />}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl<Range>
          variant="selection"
          size="sm"
          segments={[
            { value: 7, label: '7d' },
            { value: 30, label: '30d' },
            { value: 90, label: '90d' },
          ]}
          value={range}
          onChange={setRange}
          accessibilityLabel="Analytics range"
          testID="analytics-range"
        />

        {historyQuery.isError ? (
          <QueryErrorNote onRetry={() => void historyQuery.refetch()} testID="analytics-error" />
        ) : (
          <>
            <View style={{ height: 16 }} />
            <MobileSectionEyebrow>Training consistency</MobileSectionEyebrow>
            <MobileSurface padding={16}>
              {historyQuery.isLoading ? (
                <LoadingSpinner />
              ) : (
                <TrainingConsistencyGrid
                  data={historyQuery.data ?? []}
                  startDate={gridRange.startDate}
                  endDate={gridRange.endDate}
                  testID="analytics-consistency-grid"
                />
              )}
            </MobileSurface>

            <View style={{ height: 16 }} />
            <MobileSectionEyebrow>Workouts per week</MobileSectionEyebrow>
            <MobileSurface padding={16}>
              {historyQuery.isLoading ? (
                <LoadingSpinner />
              ) : weekly.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No workouts in this range yet.
                </Text>
              ) : (
                weekly.map((w) => (
              <View
                key={w.weekStart}
                style={styles.barRow}
                accessibilityLabel={`Week of ${new Date(w.weekStart).toLocaleDateString()}: ${w.sessions} sessions`}
              >
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {new Date(w.weekStart).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <View
                  style={[
                    styles.barTrack,
                    { backgroundColor: colors.backgroundDeep },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(w.sessions / maxWorkouts) * 100}%`,
                        backgroundColor: colors.brand,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {w.sessions}
                </Text>
              </View>
            ))
          )}
            </MobileSurface>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  emptyText: { ...theme.typography.mobileMeta },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  barLabel: { ...theme.typography.mobileMeta, minWidth: 56 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%' },
  barValue: { ...theme.typography.mobileLedger, minWidth: 20 },
});
