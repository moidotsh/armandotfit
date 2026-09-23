// app/split-lab.tsx
//
// THE SPLIT LAB — the constraint suite surfaced as a read-only dial
// (services/splitGenerator.ts + shared/exercises/splitRules.ts), in
// THE PROGRAM PAGE'S OWN GRAMMAR:
//
//   /split-lab               THE OVERVIEW — one CARD per generator
//                           option (One-a-day / Two-a-day today; the
//                           program-type list — PPL, Upper/Lower, Bro,
//                           Anything — grows here as its law set
//                           lands). Each card previews THAT shape's
//                           generated edition for the current seed:
//                           sessions figure, side facts, rotation
//                           strip, top-muscle share. Tap → the days.
//   /split-lab?shape=…      THE DAYS — the generated rotation as equal
//                           chapters of ruled lines (the program days'
//                           own grammar), closed by VS THE PROGRAM: the
//                           diverging ± share delta against the
//                           authored edition of the same shape (bars
//                           run left of the axis when the generated
//                           program works a muscle LESS, right when it
//                           works it more) and the laws' verdict.
//
// Reroll picks a new seed; the same seed rebuilds the same boards.
// Nothing applies — no override is written, no preference flips, the
// live program is untouched. The edition toggle is deliberately gone:
// the authored upper/lower editions are a couples-training concept,
// not a split archetype, and read here as exactly the wrong thing.

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@tamagui/lucide-icons-2';
import { useLocalSearchParams } from 'expo-router';
import { MobilePrimaryButton } from '../components/MobilePremium';
import { BoardShell, SectionWhisper } from '../components/composed';
import { navigateToExerciseDetail, navigateToSplitLab, safeGoBack } from '../navigation';
import { useAppTheme } from '../context';
import {
  generateSplit,
  nameForSlug,
  authoredProgramSlots,
  muscleShareDeltas,
} from '../services';
import { derivePlanMuscleShare } from '../services';
import {
  INTERVAL,
  ROW_GAP,
  PAGE_GUTTER,
  PRESS_DIP,
  theme,
} from '../constants';
import { joinFacts } from '../utils';
import { MUSCLE_DISPLAY_NAMES } from '../shared/exercises';
import type { ResolvedSlot } from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

const SHAPES: ReadonlyArray<{ which: PreferredSplit; title: string }> = [
  { which: 'oneADay', title: 'One-a-day' },
  { which: 'twoADay', title: 'Two-a-day' },
];

const SHAPE_NAME: Record<PreferredSplit, string> = {
  oneADay: 'One-a-day',
  twoADay: 'Two-a-day',
};

/** The diverging bars' half-width, in glyphs (the leader fills it). */
const DELTA_BAR_HALF = 8;

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

const newSeed = (): number => 1000 + Math.floor(Math.random() * 9000);

const isShape = (v: string | undefined): v is PreferredSplit =>
  v === 'twoADay' || v === 'oneADay';

export default function SplitLabScreen() {
  const { colors } = useAppTheme();
  const [seed, setSeed] = useState<number>(4271);
  const { shape } = useLocalSearchParams<{ shape?: string }>();

  // Both boards are pure functions of the seed — the overview previews
  // them all; the days view reads one.
  const boards = useMemo(() => {
    const map = {} as Record<PreferredSplit, ReturnType<typeof generateSplit>>;
    for (const { which } of SHAPES) {
      map[which] = generateSplit({ seed, shape: which, edition: 'upper' });
    }
    return map;
  }, [seed]);

  const rerollVerb = (
    <MobilePrimaryButton onPress={() => setSeed(newSeed())} testID="split-lab-reroll">
      REROLL THE SEED
    </MobilePrimaryButton>
  );

  // ── THE OVERVIEW — one card per generator option ────────────────────
  if (!isShape(shape)) {
    return (
      <BoardShell
        surface="analytics"
        onBack={safeGoBack}
        testID="split-lab-overview"
        contentContainerStyle={styles.bodyContent}
      >
        <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>THE SPLIT LAB</Text>
        <Text style={[styles.statement, { color: colors.text }]} numberOfLines={2}>
          Alternatives, by construction.
        </Text>
        <Text style={[styles.fact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([`seed ${seed}`, 'preview only — nothing applies'])}
        </Text>

        {SHAPES.map(({ which, title }, i) => {
          const board = boards[which];
          const slots = board.days.flatMap((d) => [...d.am, ...d.pm]);
          const sessions = which === 'twoADay' ? 8 : 4;
          const rows = derivePlanMuscleShare(slots, 4);
          const lead = rows[0]?.share ?? 1;
          const strip = board.days
            .map((d) => `D${d.day} ${'\u2588'.repeat(which === 'twoADay' ? 2 : 1)}`)
            .join(' \u2009·\u2009 ');
          return (
            <Pressable
              key={which}
              onPress={() => navigateToSplitLab(which)}
              accessibilityRole="button"
              accessibilityLabel={`${title} generated program — ${slots.length} lifts, ${sessions} sessions a week. View the days`}
              style={({ pressed }) => [
                styles.card,
                { borderTopColor: colors.mobilePremium.hairlineBorder },
                i > 0 ? styles.cardNotFirst : null,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID={`split-lab-card-${which}`}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {title}
                </Text>
                <ChevronRight size={20} color={colors.text} />
              </View>
              <View style={styles.cardFigureRow}>
                <Text
                  style={[styles.cardBigFigure, { color: colors.text }]}
                  accessibilityLabel={`${sessions} sessions per week`}
                >
                  {String(sessions)}
                </Text>
                <Text style={[styles.cardBigUnit, { color: colors.textSecondary }]}>SESSIONS/WK</Text>
                <Text style={[styles.cardSideFacts, { color: colors.textSecondary }]} numberOfLines={1}>
                  {joinFacts(['4 days', `${slots.length} lifts`])}
                </Text>
              </View>
              <Text style={[styles.cardStrip, { color: colors.textSecondary }]} numberOfLines={1}>
                {strip}
              </Text>
              {rows.length > 0 ? (
                <View style={styles.cardShare}>
                  {rows.map((row) => (
                    <View key={row.muscle} style={styles.cardShareRow}>
                      <Text style={[styles.cardShareLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {MUSCLE_DISPLAY_NAMES[row.muscle].toUpperCase()}
                      </Text>
                      <Text style={[styles.cardShareBar, { color: colors.text }]}>
                        {'\u2588'.repeat(Math.max(1, Math.round((row.share / lead) * 10)))}
                      </Text>
                      <Text style={[styles.cardSharePct, { color: colors.textMuted }]}>
                        {`${row.share}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <View style={styles.verbBlock}>{rerollVerb}</View>
      </BoardShell>
    );
  }

  // ── THE DAYS — the generated rotation ───────────────────────────────
  const board = boards[shape];
  const isTwoADay = shape === 'twoADay';
  const genSlots = board.days.flatMap((d) => [...d.am, ...d.pm]);
  const authored = useMemo(() => authoredProgramSlots(shape), [shape]);
  const delta = useMemo(() => muscleShareDeltas(genSlots, authored), [genSlots, authored]);
  const failing = board.rules.filter((r) => !r.ok);

  const renderSlot = (slot: ResolvedSlot, key: string) => (
    <View key={key} style={styles.slotRow}>
      <Pressable
        onPress={() => navigateToExerciseDetail(slot.exercise)}
        accessibilityRole="button"
        accessibilityLabel={`${nameForSlug(slot.exercise)} — view details`}
        style={({ pressed }) => [styles.slotNameHold, pressed ? { opacity: PRESS_DIP } : null]}
        testID={`split-lab-slot-${slot.exercise}`}
      >
        <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
          {nameForSlug(slot.exercise)}
        </Text>
        {slot.suggestedTags.length > 0 ? (
          <Text style={[styles.slotTags, { color: colors.textMuted }]} numberOfLines={1}>
            {slot.suggestedTags.join(' · ')}
          </Text>
        ) : null}
      </Pressable>
      <Text style={[styles.slotRx, { color: colors.text }]}>
        {rxLabel(slot.sets, slot.reps)}
      </Text>
    </View>
  );

  return (
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="split-lab-days"
      contentContainerStyle={styles.bodyContent}
    >
      <View style={styles.headBlock}>
        <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>
          {joinFacts(['THE ROTATION', `SEED ${seed}`])}
        </Text>
        <Text style={[styles.statement, { color: colors.text }]} numberOfLines={1}>
          {SHAPE_NAME[shape]}
        </Text>
        <Text style={[styles.fact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([
            '4 days',
            `${genSlots.length} lifts`,
            `${isTwoADay ? 8 : 4} sessions/week`,
            'generated',
          ])}
        </Text>
      </View>

      {/* THE DAYS — equal chapters of ruled lines; every slot taps
          through to its spec sheet. */}
      {board.days.map((day, di) => (
        <View
          key={day.day}
          style={[
            di === 0 ? styles.dayFirst : styles.daySeparated,
            di > 0 ? { borderTopColor: colors.mobilePremium.hairlineBorder } : null,
          ]}
        >
          <View style={styles.dayHeadRow}>
            <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={1}>
              {day.title}
            </Text>
            <Text style={[styles.dayHeadFigure, { color: colors.textMuted }]}>
              {`${day.am.length + day.pm.length} lifts`}
            </Text>
          </View>
          {(isTwoADay ? (['am', 'pm'] as const) : (['am'] as const)).map((window) => (
            <View key={window} style={styles.windowBlock}>
              {isTwoADay ? (
                <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                  {window.toUpperCase()}
                </Text>
              ) : null}
              {day[window].map((slot, i) => renderSlot(slot, `${day.day}:${window}:${i}`))}
            </View>
          ))}
        </View>
      ))}

      {/* VS THE PROGRAM — the page's 2px-rule closer. The diverging
          bars: left of the axis the generated program works the muscle
          LESS than the authored one, right more; the figure carries
          the signed points. The authored baseline is the same shape's
          authored edition (upper) — overrides never enter. */}
      <View style={[styles.deltaBlock, { borderTopColor: colors.text }]} testID="split-lab-delta">
        <SectionWhisper rule={false}>VS THE PROGRAM</SectionWhisper>
        <Text style={[styles.deltaFact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([
            'share of weekly set volume',
            board.ok ? '7/7 laws pass' : `${failing.length} law${failing.length === 1 ? '' : 's'} fail`,
          ])}
        </Text>
        {delta.rows.map((row) => {
          const len =
            delta.maxAbsDelta === 0
              ? 0
              : Math.round((Math.abs(row.delta) / delta.maxAbsDelta) * DELTA_BAR_HALF);
          return (
            <View key={row.muscle} style={styles.deltaRow}>
              <Text style={[styles.deltaLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {MUSCLE_DISPLAY_NAMES[row.muscle as keyof typeof MUSCLE_DISPLAY_NAMES]?.toUpperCase() ?? row.muscle}
              </Text>
              <View style={styles.deltaBarZone}>
                <View style={styles.deltaNeg}>
                  {row.delta < 0 ? (
                    <Text style={[styles.deltaBar, { color: colors.textMuted }]}>
                      {'\u2588'.repeat(len)}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.deltaAxis, { backgroundColor: colors.mobilePremium.hairlineBorder }]} />
                <View style={styles.deltaPos}>
                  {row.delta > 0 ? (
                    <Text style={[styles.deltaBar, { color: colors.text }]}>
                      {'\u2588'.repeat(len)}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text
                style={[
                  styles.deltaFigure,
                  { color: row.delta === 0 ? colors.textMuted : colors.text },
                ]}
              >
                {row.delta === 0 ? '0' : `${row.delta > 0 ? '+' : '−'}${Math.abs(row.delta).toFixed(1)}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.verbBlock}>{rerollVerb}</View>
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 80 },
  pageWhisper: {
    ...INTERVAL.whisper,
    marginBottom: 6,
  },
  statement: {
    ...INTERVAL.statement,
  },
  fact: {
    ...INTERVAL.fact,
    marginBottom: 8,
  },
  headBlock: {
    ...INTERVAL.blockFirst,
  },
  // ── THE CARDS (the program overview's card grammar — equal
  // previews, hairline rules; the live/non-live hierarchy belongs to
  // the program page, not the lab).
  card: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 16,
  },
  cardNotFirst: {
    marginTop: 24,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    ...theme.typography.mobileItemTitle,
    fontWeight: '700',
    flex: 1,
  },
  cardFigureRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
  },
  cardBigFigure: {
    ...INTERVAL.demotedFigure,
  },
  cardBigUnit: {
    ...theme.typography.mobileEyebrow,
  },
  cardSideFacts: {
    ...theme.typography.mobileLedger,
    marginLeft: 'auto',
    flexShrink: 1,
  },
  cardStrip: {
    ...theme.typography.mobileLedger,
    letterSpacing: 0,
    marginTop: 6,
  },
  cardShare: {
    marginTop: 10,
  },
  cardShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 18,
  },
  cardShareLabel: {
    ...theme.typography.mobileEyebrow,
    width: 84,
    flexShrink: 0,
  },
  cardShareBar: {
    ...theme.typography.mobileLedger,
    letterSpacing: 0,
    color: undefined,
  },
  cardSharePct: {
    ...theme.typography.mobileLedger,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  // ── THE DAYS (the program days view's chapter grammar).
  dayFirst: {
    ...INTERVAL.block,
  },
  daySeparated: {
    ...INTERVAL.block,
    borderTopWidth: 1,
    borderTopColor: undefined,
    paddingTop: 12,
  },
  dayHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayTitle: {
    ...theme.typography.mobileTitle,
  },
  dayHeadFigure: {
    ...theme.typography.mobileFigure,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  windowBlock: {
    marginTop: ROW_GAP / 2,
  },
  windowLabel: {
    ...theme.typography.mobileEyebrow,
    marginTop: 8,
    marginBottom: 4,
  },
  slotRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotNameHold: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  slotName: {
    ...theme.typography.mobileItemTitle,
  },
  slotTags: {
    ...theme.typography.mobileLedger,
    letterSpacing: 0,
    marginTop: 2,
  },
  slotRx: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    minWidth: 88,
    textAlign: 'right',
  },
  // ── VS THE PROGRAM — the diverging delta closer (the page's one
  // 2px rule; the axis hairline inside each row is the bars' zero).
  deltaBlock: {
    marginTop: 36,
    borderTopWidth: 2,
    paddingTop: 10,
  },
  deltaFact: {
    ...INTERVAL.fact,
    marginBottom: 8,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 20,
  },
  deltaLabel: {
    ...theme.typography.mobileEyebrow,
    width: 92,
    flexShrink: 0,
  },
  deltaBarZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaNeg: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deltaPos: {
    flex: 1,
    flexDirection: 'row',
  },
  deltaAxis: {
    width: 1,
    height: 14,
    marginHorizontal: 4,
  },
  deltaBar: {
    ...theme.typography.mobileLedger,
    letterSpacing: 0,
    color: undefined,
  },
  deltaFigure: {
    ...theme.typography.mobileFigure,
    fontVariant: ['tabular-nums'],
    minWidth: 44,
    textAlign: 'right',
    flexShrink: 0,
  },
  verbBlock: {
    marginTop: 24,
  },
});
