// app/analytics.tsx
// THE QUIET PAGE's form table (docs/architecture/
// quiet-page-thesis.md §6): "You trained 24 of 30." The nameplate,
// the MobileSurface panel, the section eyebrows, and the MobileHeader
// chrome die — the COUNT is the statement (the page's one sentence,
// restating with the range pick), the grid sits open on the field
// (ink density is the data-viz; today outlined in the record red),
// and the weekly bars read as one quiet line each: date · count,
// with real bar weight. Daily aggregates + weekly bucketing computed
// at read.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MobileAtmosphere,
  SegmentedControl,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { DeskShell, QueryErrorNote, TrainingConsistencyGrid } from '../components/composed';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useAnalyticsHistory } from '../hooks';
import { AnalyticsService } from '../services';
import { addDays } from '../utils';
import { BLOCK_GAP, QUIET, theme } from '../constants';

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
    <DeskShell
      surface="analytics"
      onBack={safeGoBack}
      testID="form-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {/* THE STATEMENT — the count. The page's sentence is "you
          trained N of R days"; the number carries it. */}
      <View>
        <Text style={[styles.count, { color: colors.text }]}>
          {sessionsInRange}
        </Text>
        <Text style={[styles.countFact, { color: colors.textMuted }]} numberOfLines={1}>
          {`sessions · last ${range} days`}
        </Text>
      </View>

      {/* The range pick. */}
      <View style={styles.block}>
        <SegmentedControl<Range>
          variant="selection"
          chromeless
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
      </View>

      {historyQuery.isError ? (
        <QueryErrorNote onRetry={() => void historyQuery.refetch()} testID="analytics-error" />
      ) : (
        <>
          {/* The field — ink density, today outlined in the record red. */}
          <View style={styles.block}>
            {historyQuery.isLoading ? (
              <LoadingSpinner />
            ) : (
              <View style={styles.gridWrap}>
                <TrainingConsistencyGrid
                  data={historyQuery.data ?? []}
                  startDate={gridRange.startDate}
                  endDate={gridRange.endDate}
                  testID="analytics-consistency-grid"
                />
              </View>
            )}
          </View>

          {/* Weekly bars — one quiet line each: date · count, real
              bar weight in ink. */}
          {historyQuery.isLoading ? null : weekly.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No workouts in this range yet.
            </Text>
          ) : (
            <View style={styles.block}>
              <View style={styles.barList}>
                {weekly.map((w) => (
                  <View
                    key={w.weekStart}
                    style={styles.barRow}
                    accessibilityLabel={`Week of ${new Date(w.weekStart).toLocaleDateString()}: ${w.sessions} sessions`}
                  >
                    <Text style={[styles.barLabel, { color: colors.textMuted }]} numberOfLines={1}>
                      {`${new Date(w.weekStart).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })} · ${w.sessions}`}
                    </Text>
                    <View style={styles.barTrackWrap}>
                      {/* No track — a week's bar is a line of ink on
                          the field, its length the count. */}
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(w.sessions > 0 ? 6 : 0, (w.sessions / maxWorkouts) * 88)}%`,
                            backgroundColor: colors.text,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </DeskShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 80,
  },
  block: {
    ...QUIET.block,
  },
  count: {
    ...QUIET.statement,
  },
  // The fact line waits outside the statement's halo.
  countFact: {
    ...QUIET.fact,
  },
  emptyText: { ...theme.typography.mobileMeta, marginTop: BLOCK_GAP },
  // The grid breathes narrower than the column — the field is the
  // story, not the paint.
  gridWrap: {
    maxWidth: 240,
  },
  barList: {
    gap: 14,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 20,
  },
  barLabel: {
    ...theme.typography.mobileLedger,
    minWidth: 84,
  },
  barTrackWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  barFill: {
    height: 8,
    borderRadius: theme.shapes.tile,
  },
});
