// app/analytics.tsx
// THE LEDGER (docs/architecture/interval-thesis.md §8): "How
// regular?" The COUNT is THE LIVE FIGURE (mono 72 — the screen's
// question is a quantity in play; it restates with the range pick).
// THE REGISTER GRID renders the calendar as TYPE: one mono
// character per day — the session count (1, 2, 3…), '·' for days
// off, TODAY in red — seven columns, tabular by construction (and
// ON the ramp: the grid's ad-hoc 13px character died with the
// incumbent's own drift); density reads as ink weight. The weeks
// read as ruled rows: date left · air · the session figure right,
// the record week red. THE BALANCE — the deleted chart's honest
// remnant, RESTORED to the page (the incumbent computed it and
// never rendered it): one row naming the most-neglected group and
// its share. Daily aggregates + weekly bucketing computed at read.

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SegmentedControl } from '../components/MobilePremium';
import { LoadingSpinner } from '../components/primitives';
import { BoardShell, BoardHead, QueryErrorNote, RegisterLine, SectionWhisper, SharePie, TrendGraph } from '../components/composed';
import { useAppTheme } from '../context';
import { safeGoBack } from '../navigation';
import { useAnalyticsHistory, useRecentSessionDetails, useActivityLog } from '../hooks';
import { deriveMuscleShare, deriveTrajectory, MUSCLE_GROUPS } from '../services';
import { AnalyticsService } from '../services';
import { addDays, toDisplayWeight, roundDisplayWeight, joinFacts } from '../utils';
import { navigateToExerciseDetail } from '../navigation';
import { SYSTEM_EXERCISES, MUSCLE_DISPLAY_NAMES } from '../shared/exercises';
import { useWeightUnit } from '../hooks';
import { BLOCK_GAP, INTERVAL, theme, PAGE_GUTTER } from '../constants';
import { formatCardioMinutes } from '../shared/exercises/cardio';
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

  // THE BALANCE — where the work landed over the picked range (the
  // deleted chart's honest remnant: ONE register line naming the
  // most-neglected group; the full per-lift story lives on each
  // spec sheet). Computed at read; nothing stored.
  const detailsQuery = useRecentSessionDetails(60);
  const lowestGroup = useMemo(() => {
    const rows = deriveMuscleShare(detailsQuery.data ?? [], range);
    if (rows.length < 2) return null;
    const byGroup = new Map<string, number>();
    for (const r of rows) byGroup.set(r.muscle, r.share);
    let worst: { group: string; share: number } | null = null;
    for (const g of MUSCLE_GROUPS) {
      const share = byGroup.get(g);
      if (share == null) continue;
      if (!worst || share < worst.share) worst = { group: g, share };
    }
    return worst;
  }, [detailsQuery.data, range]);

  // ── THE CHARTS ROUND (owner-sanctioned): the share as a pie and
  // the historical % rows; the top lifts' trajectories as line graphs.
  const unit = useWeightUnit();
  const shareRows = useMemo(
    () => (detailsQuery.isSuccess ? deriveMuscleShare(detailsQuery.data ?? [], range) : []),
    [detailsQuery.isSuccess, detailsQuery.data, range],
  );
  const pieSlices = useMemo(() => {
    if (shareRows.length <= 6) return shareRows.map((r) => ({ label: MUSCLE_DISPLAY_NAMES[r.muscle as keyof typeof MUSCLE_DISPLAY_NAMES] ?? r.muscle, value: r.share }));
    const top = shareRows.slice(0, 5);
    const rest = shareRows.slice(5).reduce((n, r) => n + r.share, 0);
    return [
      ...top.map((r) => ({ label: MUSCLE_DISPLAY_NAMES[r.muscle as keyof typeof MUSCLE_DISPLAY_NAMES] ?? r.muscle, value: r.share })),
      { label: 'Other', value: rest },
    ];
  }, [shareRows]);
  const topLifts = useMemo(() => {
    if (!detailsQuery.isSuccess) return [];
    const since = Date.now() - range * 24 * 60 * 60 * 1000;
    const counts = new Map<string, number>();
    for (const s of detailsQuery.data ?? []) {
      if (new Date(s.startedAt).getTime() < since) continue;
      for (const ex of s.exercises) {
        const seen = new Set<string>([ex.exerciseName]);
        for (const n of seen) counts.set(n, (counts.get(n) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, n]) => {
        const t = deriveTrajectory(detailsQuery.data ?? [], name);
        const pts = t.points.map((p) => ({ at: p.at, value: roundDisplayWeight(toDisplayWeight(p.weight, unit)) }));
        const slug = SYSTEM_EXERCISES.find((e) => e.name === name)?.slug ?? null;
        return { name, sessions: n, points: pts, slug };
      })
      .filter((x) => x.points.length >= 2);
  }, [detailsQuery.isSuccess, detailsQuery.data, range, unit]);

  const weekly = useMemo(() => {
    if (!historyQuery.data) return [];
    return AnalyticsService.bucketWeekly(historyQuery.data);
  }, [historyQuery.data]);

  const maxWorkouts = Math.max(1, ...weekly.map((w) => w.sessions));
  const sessionsInRange = weekly.reduce((sum, w) => sum + w.sessions, 0);
  // THE ENGINE — cardio minutes in range, computed at read from the
  // recent sessions' cardio rows (the details query — the day
  // aggregates carry no sitting detail; pass C3, nothing stored).
  const cardioSecInRange = useMemo(() => {
    const cutoff = Date.now() - range * 86_400_000;
    return (detailsQuery.data ?? [])
      .filter((session) => new Date(session.startedAt).getTime() >= cutoff)
      .reduce((n, session) => n + session.cardio.reduce((m, r) => m + r.durationSec, 0), 0);
  }, [detailsQuery.data, range]);

  // THE CALENDAR SPANS THE LIFETIME (the owner's correction): from
  // the first logged day to today — never a rolling 30/90 window with
  // dead air before it. The grid reads the shared activity log (200
  // sessions deep, same cache key — no second fetch), unfiltered; the
  // range pick still governs the share, the graphs, and the weekly
  // rows below.
  const activityQuery = useActivityLog();
  const gridData = useMemo(
    () => (activityQuery.data ? AnalyticsService.dailyActivity(activityQuery.data, 4000) : []),
    [activityQuery.data],
  );
  const gridRange = useMemo(() => {
    const end = new Date();
    const earliest = activityQuery.data?.[activityQuery.data.length - 1]?.startedAt;
    const start = earliest ? new Date(earliest) : addDays(end, -range);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }, [activityQuery.data, range]);

  return (
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="form-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {/* THE STATEMENT — the count. The page's sentence is "you
          trained N of R days"; the number carries it. The loading
          posture asserts nothing: the head prints when the reads
          SUCCEED — never during the pre-hydration window (the query
          sits disabled until the auth store hydrates, and "not
          loading" there is not "settled"), and never a 0 impersonating
          a settled count. */}
      {historyQuery.isSuccess ? (
        <BoardHead
          statement={String(sessionsInRange)}
          fact={`sessions · last ${range} days`}
          variant="figure"
        />
      ) : null}

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

          {/* THE SHARE — the historical muscle % as a donut + the
              printed table (the /program share grammar, computed from
              logged history for the picked range). THE CHARTS ROUND:
              the one drawn surface (owner-sanctioned). */}
          {shareRows.length > 0 ? (
            <View style={styles.block}>
              <SectionWhisper>
                {`THE SHARE · LAST ${range} DAYS`}
              </SectionWhisper>
              <View testID="analytics-share-pie">
                <SharePie slices={pieSlices} />
              </View>
              <View style={styles.shareTable} testID="analytics-share-rows">
                {shareRows.map((r) => {
                  const lead = shareRows[0]?.share || 1;
                  const bar = Math.max(1, Math.round((r.share / lead) * 16));
                  return (
                    <View key={r.muscle} style={styles.shareRow}>
                      <Text style={[styles.shareLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {(MUSCLE_DISPLAY_NAMES[r.muscle as keyof typeof MUSCLE_DISPLAY_NAMES] ?? r.muscle).toUpperCase()}
                      </Text>
                      <Text style={[styles.shareBar, { color: colors.text }]}>
                        {'\u2588'.repeat(bar)}
                      </Text>
                      <Text style={[styles.sharePct, { color: colors.textMuted }]}>
                        {`${Math.round(r.share * 100)}%`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* THE PROGRESSION — the top lifts' top-set lines, one
              graph per lift (ink on the ground; tap the name for the
              spec sheet). */}
          {topLifts.length > 0 ? (
            <View style={styles.block}>
              <SectionWhisper>
                {`THE PROGRESSION · TOP LIFTS · ${unit}`}
              </SectionWhisper>
              {topLifts.map((lift) => {
                const first = lift.points[0]?.value ?? 0;
                const last = lift.points[lift.points.length - 1]?.value ?? 0;
                const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
                return (
                  <View
                    key={lift.name}
                    style={styles.liftBlock}
                    testID={`analytics-lift-${lift.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <RegisterLine
                      label={lift.name}
                      figure={`${first} → ${last} · ${pct >= 0 ? '+' : ''}${pct}%`}
                      onPress={lift.slug ? () => navigateToExerciseDetail(lift.slug!) : undefined}
                      accessibilityLabel={`${lift.name}: top set ${first} to ${last} ${unit}, ${pct >= 0 ? '+' : ''}${pct} percent over ${lift.sessions} sessions`}
                      testID={`analytics-lift-row-${lift.slug ?? lift.name}`}
                    />
                    <TrendGraph
                      points={lift.points}
                      accessibilityLabel={`${lift.name} progression line graph`}
                      testID={`analytics-lift-graph-${lift.slug ?? lift.name}`}
                    />
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.block}>
            {/* THE REGISTER GRID — the calendar as type: one mono
                character per day (the session count, '·' for days
                off, TODAY in red), seven columns, density as ink
                weight. Tabular by construction. */}
            <SectionWhisper>
              CALENDAR · TRAINED DAYS
            </SectionWhisper>
            {!historyQuery.isSuccess ? (
              <LoadingSpinner />
            ) : (
              <RegisterGrid
                data={gridData}
                startDate={gridRange.startDate}
                endDate={gridRange.endDate}
                testID="analytics-consistency-grid"
              />
            )}
          </View>

          {/* The weeks — ruled rows: date left · air · the session
              figure right; the record week's figure in red. */}
          {!historyQuery.isSuccess ? null : weekly.length === 0 ? (
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

          {/* THE ENGINE — cardio minutes in the picked range, one
              ruled row (muted figure: it is a fact, not a record). */}
          {detailsQuery.isSuccess && cardioSecInRange > 0 ? (
            <View style={styles.block}>
              <RegisterLine
                label={`cardio · last ${range} days`}
                figure={formatCardioMinutes(cardioSecInRange)}
                figureTone="muted"
                accessibilityLabel={`Cardio, ${formatCardioMinutes(cardioSecInRange)} in the last ${range} days`}
                testID="analytics-cardio"
              />
            </View>
          ) : null}

          {/* THE BALANCE — one row: the most-neglected group and its
              share (computed at read; the full per-lift story lives
              on each spec sheet). */}
          {lowestGroup ? (
            <View style={styles.block}>
              <SectionWhisper>
                THE BALANCE
              </SectionWhisper>
              <RegisterLine
                label={`${lowestGroup.group} carries the least work`}
                figure={`${Math.round(lowestGroup.share)}%`}
                figureTone="muted"
                accessibilityLabel={`Balance: ${lowestGroup.group} carries the least work, ${Math.round(lowestGroup.share)} percent of volume`}
                testID="analytics-balance"
              />
            </View>
          ) : null}
        </>
      )}
    </BoardShell>
  );
}

/** THE REGISTER GRID — the calendar as type (interval-thesis §8):
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
      {/* THE WEEKDAY RAIL — the calendar's column keys, printed caps
          at the whisper rank: seven cells that align with the grid
          below (nothing drawn; the alignment IS the key). */}
      <View style={styles.gridRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={[styles.gridCell, styles.gridRailChar, { color: colors.textMuted }]}>
            {d}
          </Text>
        ))}
      </View>
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
  // ── THE CHARTS ROUND — the share table mirrors /program's share
  // grammar; the lifts stack a ruled row + the drawn line.
  shareTable: { marginTop: 12 },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 20,
  },
  shareLabel: {
    ...theme.typography.mobileEyebrow,
    width: 92,
    flexShrink: 0,
  },
  shareBar: {
    ...theme.typography.mobileLedger,
    letterSpacing: 0,
    color: undefined,
  },
  sharePct: {
    ...theme.typography.mobileLedger,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  liftBlock: {
    marginTop: 12,
  },
  bodyContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 4,
    paddingBottom: 80,
  },
  block: {
    ...INTERVAL.block,
  },
  emptyText: { ...theme.typography.mobileMeta, marginTop: BLOCK_GAP },
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
    letterSpacing: 0,
  },
  // The weekday rail — quieter than the data cells (furniture).
  gridRailChar: {
    ...theme.typography.mobileEyebrow,
    letterSpacing: 0,
  },
  gridCharBold: {
    fontWeight: '700',
  },
});
