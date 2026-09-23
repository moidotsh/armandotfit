// app/split-lab.tsx
//
// THE SPLIT LAB — the constraint suite surfaced as a read-only dial
// (services/splitGenerator.ts + shared/exercises/splitRules.ts). The
// laws that guard the authored program also PRODUCE alternatives:
// pick a shape and edition, roll a seed, read a full-body rotation
// that passes every law. Nothing applies — no override is written, no
// preference flips, the live program is untouched. The lab is the
// first stone of the plan-builder path (user-authored programs);
// until that lands, it is a preview instrument only.
//
// Composition per THE INTERVAL: one statement (the page's answer),
// the days as ruled chapters (the program days' own grammar), THE
// LAWS close the page under the 2px rule (the THE WORK echo). The
// reroll is the verb — ink, never red.

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MobilePrimaryButton, SegmentedControl } from '../components/MobilePremium';
import { BoardShell, SectionWhisper } from '../components/composed';
import { navigateToExerciseDetail, safeGoBack } from '../navigation';
import { useAppTheme } from '../context';
import { generateSplit, nameForSlug } from '../services';
import { INTERVAL, ROW_GAP, PAGE_GUTTER, PRESS_DIP, theme } from '../constants';
import { joinFacts } from '../utils';
import type { ProgramEdition, ResolvedSlot } from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

const SHAPE_SEGMENTS = [
  { value: 'oneADay' as PreferredSplit, label: 'ONE-A-DAY' },
  { value: 'twoADay' as PreferredSplit, label: 'TWO-A-DAY' },
];

const EDITION_SEGMENTS = [
  { value: 'upper' as ProgramEdition, label: 'UPPER' },
  { value: 'lower' as ProgramEdition, label: 'LOWER' },
];

const SHAPE_WORD: Record<PreferredSplit, string> = {
  oneADay: 'one-a-day',
  twoADay: 'two-a-day',
};

const EDITION_WORD: Record<ProgramEdition, string> = {
  upper: 'upper edition',
  lower: 'lower edition',
};

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

const newSeed = (): number => 1000 + Math.floor(Math.random() * 9000);

export default function SplitLabScreen() {
  const { colors } = useAppTheme();
  const [shape, setShape] = useState<PreferredSplit>('twoADay');
  const [edition, setEdition] = useState<ProgramEdition>('upper');
  const [seed, setSeed] = useState<number>(4271);

  // The whole edition is a pure function of (seed, shape, edition) —
  // same inputs, same board, reroll just picks a new name.
  const generated = useMemo(() => generateSplit({ seed, shape, edition }), [seed, shape, edition]);
  const isTwoADay = shape === 'twoADay';

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
      testID="split-lab-screen"
      contentContainerStyle={styles.bodyContent}
    >
      <View style={styles.head}>
        <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>THE SPLIT LAB</Text>
        <Text style={[styles.statement, { color: colors.text }]} numberOfLines={2}>
          Alternatives, by construction.
        </Text>
        <Text style={[styles.fact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([
            `seed ${seed}`,
            SHAPE_WORD[shape],
            EDITION_WORD[edition],
            'preview only',
          ])}
        </Text>
      </View>

      {/* The instrument — shape, edition, reroll. Read-only dials: they
          change what is generated, never what is live. */}
      <View style={styles.controls}>
        <SegmentedControl<PreferredSplit>
          variant="selection"
          segments={SHAPE_SEGMENTS}
          value={shape}
          onChange={setShape}
          accessibilityLabel="Program shape"
          testID="split-lab-shape"
        />
        <View style={styles.controlRow}>
          <SegmentedControl<ProgramEdition>
            variant="selection"
            segments={EDITION_SEGMENTS}
            value={edition}
            onChange={setEdition}
            accessibilityLabel="Program edition"
            testID="split-lab-edition"
          />
        </View>
        <MobilePrimaryButton onPress={() => setSeed(newSeed())} testID="split-lab-reroll">
          REROLL THE SEED
        </MobilePrimaryButton>
      </View>

      {/* THE DAYS — equal chapters of ruled lines (the program days'
          own grammar); every slot taps through to its spec sheet. */}
      {generated.days.map((day, di) => (
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

      {/* THE LAWS close the page — the constraint suite's own verdicts
          on the board above (recomputed at read, never cached). */}
      <View style={[styles.lawsBlock, { borderTopColor: colors.text }]} testID="split-lab-laws">
        <SectionWhisper rule={false}>THE LAWS</SectionWhisper>
        {generated.rules.map((r) => (
          <View key={r.id} style={styles.lawRow}>
            <Text style={[styles.lawLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {r.label}
            </Text>
            <Text
              style={[styles.lawVerdict, { color: r.ok ? colors.textSecondary : colors.alert }]}
            >
              {r.ok ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        ))}
        {generated.ok ? null : (
          <Text style={[styles.lawDetail, { color: colors.textMuted }]}>
            {generated.rules
              .filter((r) => !r.ok)
              .map((r) => r.detail)
              .filter(Boolean)
              .join('; ')}
          </Text>
        )}
      </View>
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 80 },
  head: {
    ...INTERVAL.blockFirst,
  },
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
  controls: {
    ...INTERVAL.block,
  },
  controlRow: {
    marginTop: ROW_GAP,
  },
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
  lawsBlock: {
    marginTop: 36,
    borderTopWidth: 2,
    paddingTop: 10,
  },
  lawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 20,
  },
  lawLabel: {
    ...theme.typography.mobileEyebrow,
    flexShrink: 1,
  },
  lawVerdict: {
    ...theme.typography.mobileFigure,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  lawDetail: {
    ...theme.typography.mobileLedger,
    letterSpacing: 0,
    marginTop: 6,
  },
});
