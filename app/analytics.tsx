// app/analytics.tsx
// THE LEDGER (docs/architecture/scoreboard-thesis.md §8): "How
// regular?" The COUNT is the statement (the page's one sentence,
// restating with the range pick). THE REGISTER GRID renders the
// calendar as TYPE: one mono character per day — the session count
// (1, 2, 3…), '·' for days off, TODAY in red — seven columns,
// tabular by construction; density reads as ink weight. The weeks
// read as register lines: date · leader · the session figure, the
// record week red. The muscle-share bars and the stacked balance
// chart are DELETED — they answered a different question ("where
// did work land"), and that answer lives on each lift's spec sheet.
// Daily aggregates + weekly bucketing computed at read.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SegmentedControl } from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { BoardShell, BoardHead, QueryErrorNote, RegisterLine } from '../components/composed';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useAnalyticsHistory } from '../hooks';
import { AnalyticsService } from '../services';
import { addDays } from '../utils';
import { BLOCK_GAP, SCOREBOARD, theme, PAGE_GUTTER } from '../constants';
import type { DayActivity } from '../shared/types';

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
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="form-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {/* THE STATEMENT — the count. The page's sentence is "you
          trained N of R days"; the number carries it. */}
      <BoardHead
        statement={String(sessionsInRange)}
        fact={`sessions · last ${range} days`}
        variant="figure"
      />

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
          <View style={styles.block}>
            {/* THE REGISTER GRID — the calendar as type: one mono
                character per day (the session count, '·' for days
                off, TODAY in red), seven columns, density as ink
                weight. Tabular by construction. */}
            <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
              CALENDAR · TRAINED DAYS
            </Text>
            {historyQuery.isLoading ? (
              <LoadingSpinner />
            ) : (
              <RegisterGrid
                data={historyQuery.data ?? []}
                startDate={gridRange.startDate}
                endDate={gridRange.endDate}
                testID="analytics-consistency-grid"
              />
            )}
          </View>

          {/* The weeks — register lines: date · leader · the session
              figure; the record week's figure in red. */}
          {historyQuery.isLoading ? null : weekly.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No workouts in this range yet.
            </Text>
          ) : (
            <View style={styles.block}>
              {weekly.map((w) => {
                const isRecord = w.sessions === maxWorkouts && w.sessions > 0;
                return (
                  <RegisterLine
                    key={w.weekStart}
                    label={new Date(w.weekStart).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    figure={`${w.sessions}`}
                    muted={!isRecord}
                    figureTone={isRecord ? 'record' : 'ink'}
                    accessibilityLabel={`Week of ${new Date(w.weekStart).toLocaleDateString()}: ${w.sessions} sessions`}
                    testID={`analytics-week-${w.weekStart}`}
                  />
                );
              })}
            </View>
          )}
        </>
      )}
    </BoardShell>
  );
}

/** THE REGISTER GRID — the calendar as type (scoreboard-thesis §8):
 * one mono character per day — the session count (1, 2, 3…), '·'
 * for a day off — seven columns keyed to the range's first weekday.
 * Density is ink weight (2+ sessions bold); TODAY carries the red
 * (the living position). Nothing is drawn; the grid is a table. */
function RegisterGrid({
  data,
  startDate,
  endDate,
  testID,
}: {
  data: readonly DayActivity[];
  startDate: string;
  endDate: string;
  testID?: string;
}) {
  const { colors } = useAppTheme();
  const byDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.sessions);
    return m;
  }, [data]);
  const todayISO = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const out: Array<Array<{ iso: string; char: string; n: number }>> = [[]];
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    // Pad the first row to the range's first weekday (Sun=0).
    for (let i = 0; i < start.getDay(); i++) {
      out[0].push({ iso: `pad-${i}`, char: ' ', n: -1 });
    }
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = toISODate(d);
      const n = byDate.get(iso) ?? 0;
      const char = n > 0 ? String(Math.min(n, 9)) : '·';
      const row = out[out.length - 1];
      row.push({ iso, char, n });
      if (row.length === 7 && iso !== toISODate(end)) out.push([]);
    }
    return out;
  }, [byDate, startDate, endDate]);

  return (
    <View style={styles.gridWrap} testID={testID} accessibilityLabel="Training consistency register">
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map((cell) =>
            cell.n === -1 ? (
              <View key={cell.iso} style={styles.gridCell} />
            ) : (
              <Text
                key={cell.iso}
                style={[
                  styles.gridCell,
                  styles.gridChar,
                  {
                    color:
                      cell.iso === todayISO
                        ? colors.brandText
                        : cell.n > 0
                          ? colors.text
                          : colors.textMuted,
                  },
                  cell.n >= 2 ? styles.gridCharBold : null,
                ]}
                accessibilityLabel={
                  cell.n > 0 ? `${cell.iso}: ${cell.n} sessions` : `${cell.iso}: no session`
                }
                testID={`grid-cell-${cell.iso}`}
              >
                {cell.char}
              </Text>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 4,
    paddingBottom: 80,
  },
  block: {
    ...SCOREBOARD.block,
  },
  emptyText: { ...theme.typography.mobileMeta, marginTop: BLOCK_GAP },
  sectionWhisper: {
    ...SCOREBOARD.whisper,
    marginBottom: 8,
  },
  // THE REGISTER GRID — seven mono columns; density is ink weight.
  gridWrap: {
    alignSelf: 'flex-start',
    minWidth: 240,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
    minHeight: 30,
  },
  gridCell: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridChar: {
    ...theme.typography.mobileEyebrow,
    fontSize: 13,
    letterSpacing: 0,
  },
  gridCharBold: {
    fontWeight: '700',
  },
});
