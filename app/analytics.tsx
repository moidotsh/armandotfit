// app/analytics.tsx
// Analytics screen — daily-aggregate history + weekly bucketing. The
// chart layer (a real chart lib) lands in a-Phase 5; for now the weekly
// bucketing renders as a text bar-chart so the data is visible.

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MobileAtmosphere,
  MobileSurface,
  MobileHeader,
  MobileSectionEyebrow,
} from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useAnalyticsHistory } from '../hooks';
import { AnalyticsService } from '../services';

type Range = 7 | 30 | 90;

const RANGE_OPTIONS: Range[] = [7, 30, 90];

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const [range, setRange] = useState<Range>(30);
  const historyQuery = useAnalyticsHistory(range);

  const weekly = useMemo(() => {
    if (!historyQuery.data) return [];
    return AnalyticsService.bucketWeekly(historyQuery.data);
  }, [historyQuery.data]);

  const maxWorkouts = Math.max(1, ...weekly.map((w) => w.totalWorkouts));

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <MobileHeader title="Analytics" eyebrow="History" onBack={safeGoBack} />
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((r) => (
            <Text
              key={r}
              style={[
                styles.rangeChip,
                {
                  color: r === range ? colors.brand : colors.textSecondary,
                  borderColor: r === range ? colors.brand : 'transparent',
                },
              ]}
              onPress={() => setRange(r)}
            >
              {r}d
            </Text>
          ))}
        </View>

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
              <View key={w.weekStart} style={styles.barRow}>
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
                        width: `${(w.totalWorkouts / maxWorkouts) * 100}%`,
                        backgroundColor: colors.brand,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {w.totalWorkouts}
                </Text>
              </View>
            ))
          )}
        </MobileSurface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  rangeRow: { flexDirection: 'row', gap: 12 },
  rangeChip: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyText: { fontSize: 13, lineHeight: 18 },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  barLabel: { fontSize: 11, minWidth: 56 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%' },
  barValue: { fontSize: 12, fontWeight: '600', minWidth: 20 },
});
