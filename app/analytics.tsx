// app/analytics.tsx
// Analytics — the consistency grid is the story (docs/architecture/
// logbook-thesis.md §7): it rides the screen's one bounded sheet; the
// weekly bars stop apologizing — real bar weight, mono values, ledger
// rows on paper. Range via segmented control. Daily-aggregate history +
// weekly bucketing all computed at read.

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
  SegmentedControl,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { QueryErrorNote, TrainingConsistencyGrid } from '../components/composed';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useAnalyticsHistory } from '../hooks';
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
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl<Range>
          variant="selection"
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
            {/* The one visual — the screen's single bounded sheet. */}
            <MobileSectionEyebrow rule flush={false}>
              Training consistency
            </MobileSectionEyebrow>
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

            {/* Weekly bars — real bar weight, mono values, rows on paper. */}
            <MobileSectionEyebrow rule flush={false}>
              Workouts per week
            </MobileSectionEyebrow>
            {historyQuery.isLoading ? (
              <LoadingSpinner />
            ) : weekly.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No workouts in this range yet.
              </Text>
            ) : (
              <View style={styles.barList}>
                {weekly.map((w) => (
                  <View
                    key={w.weekStart}
                    style={styles.barRow}
                    accessibilityLabel={`Week of ${new Date(w.weekStart).toLocaleDateString()}: ${w.sessions} sessions`}
                  >
                    <Text style={[styles.barLabel, { color: colors.text }]}>
                      {new Date(w.weekStart).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <View
                      style={[
                        styles.barTrack,
                        { backgroundColor: colors.mobilePremium.railTrack },
                      ]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(w.sessions > 0 ? 8 : 0, (w.sessions / maxWorkouts) * 100)}%`,
                            backgroundColor: colors.brand,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barValue, { color: colors.text }]}>
                      {w.sessions}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  emptyText: { ...theme.typography.mobileMeta, marginTop: 12 },
  barList: {
    gap: 12,
    marginTop: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barLabel: {
    ...theme.typography.mobileLedger,
    minWidth: 56,
  },
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%' },
  barValue: {
    ...theme.typography.mobileLedger,
    minWidth: 20,
    textAlign: 'right',
  },
});
