// app/program.tsx
// THE TIMETABLE (docs/architecture/interval-thesis.md §8): "The
// rotation, day by day." The FIRST day's title is the statement
// (later chapters at subhead scale), each day is one air-separated
// block, and slots are LINES: name + the Rx as a right-aligned mono
// figure (here the Rx IS the content — this page answers "what's the
// program"). Air separates the chapters; no panels, no rules. A
// standing substitution reads in RED INK (the live edit); the
// authored program in splits.ts is never edited. Plan-time Swap rides
// the same bench as the Floor.

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MobilePrimaryButton, SegmentedControl } from '../components/MobilePremium';
import { BoardShell, InkRail, SectionWhisper, SwapGlyph } from '../components/composed';
import { safeGoBack } from '../navigation';
import { useAppTheme, useToast } from '../context';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots, slotKey, derivePlanMuscleShare } from '../services';
import {
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  getSlotsForDay,
  type SessionWindow,
} from '../shared/exercises';
import { INTERVAL, ROW_GAP, theme, PAGE_GUTTER } from '../constants';
import { joinFacts } from '../utils';
import { CURRENT_ERA } from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

export default function ProgramScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const split = useSplitPreferenceStore((s) => s.splitType);
  // THE EDITION VIEW: the page opens on the LIVE program (the
  // remembered preference) and can flip to inspect the other edition —
  // viewing is not switching; the preference changes on the selector's
  // GO, nowhere else.
  const [viewedSplit, setViewedSplit] = useState<PreferredSplit>(split);

  const overrides = useProgramOverrideStore((s) => s.overrides);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const setOverride = useProgramOverrideStore((s) => s.setOverride);
  const clearOverride = useProgramOverrideStore((s) => s.clearOverride);

  const days = viewedSplit === 'oneADay' ? ONE_A_DAY_SPLITS : TWO_A_DAY_SPLITS;
  const overriddenCount = Object.keys(overrides).length;
  const isTwoADay = viewedSplit === 'twoADay';

  const renderSlot = (
    day: number,
    window: SessionWindow,
    position: number,
  ) => {
    const slots = resolveSlots(viewedSplit, day, window, overrides);
    const slot = slots[position - 1];
    if (!slot) return null;
    const key = slotKey(split, day, window, position);
    const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
    const name = entry?.name ?? slot.exercise;
    const isOverridden = key in overrides;

    // A standing substitution reads in the RED RX only (thesis §8 — the
    // live edit): one red node per override. The name stays ink — a
    // name+Rx pair both in red spent two marks on one edit and, at
    // three substitutions, wallpapered the ration the sight amendment
    // set (red text nodes ≤3 per screen).
    return (
      <View key={key} style={styles.slotRow}>
        <Text
          style={[styles.slotName, { color: colors.text }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <SwapGlyph onPress={() => setPickerFor(key)} label={name} />
        <Text
          style={[styles.slotRx, { color: isOverridden ? colors.brandText : colors.text }]}
        >
          {rxLabel(slot.sets, slot.reps)}
        </Text>
      </View>
    );
  };

  // Per-day lift count across its windows — computed from the split
  // data at read time; nothing stored.
  const dayLifts = (day: number) => {
    const windows: SessionWindow[] = isTwoADay ? ['am', 'pm'] : ['single'];
    let lifts = 0;
    for (const w of windows) {
      lifts += resolveSlots(viewedSplit, day, w, overrides).length;
    }
    return lifts;
  };

  return (
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="program-scroll"
      contentContainerStyle={styles.bodyContent}
    >
      {days.map((day, di) => {
        const windows: SessionWindow[] = isTwoADay ? ['am', 'pm'] : ['single'];
        const dayFact = `${isTwoADay ? 'AM + PM · ' : ''}${dayLifts(day.day)} lifts`;
        return (
          <View key={day.day} style={di === 0 ? styles.dayFirst : styles.day}>
            {/* Day head: the first day is the page's statement under
                the page-identity whisper (THE ROTATION · N DAYS —
                spoken at rest, held in the column); the rest are
                subheads. One fact line beneath each. */}
            {di === 0 ? (
              <>
                <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>
                  {`THE ROTATION · ${days.length} DAYS · ${CURRENT_ERA}`}
                </Text>
                <Text style={[styles.dayTitleLead, { color: colors.text }]} numberOfLines={1}>
                  {day.title}
                </Text>
              </>
            ) : (
              <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={1}>
                {day.title}
              </Text>
            )}
            <Text
              style={[styles.dayFact, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {dayFact}
            </Text>
            {di === 0 ? (
              <View style={styles.editionToggle}>
                {/* THE EDITION VIEW — inspect either plan; viewing is
                    not switching (the preference changes on GO). */}
                <SegmentedControl<PreferredSplit>
                  variant="selection"
                  chromeless
                  segments={[
                    { value: 'twoADay', label: 'two-a-day' },
                    { value: 'oneADay', label: 'one-a-day' },
                  ]}
                  value={viewedSplit}
                  onChange={setViewedSplit}
                  accessibilityLabel="Plan edition view"
                  testID="program-edition"
                />
              </View>
            ) : null}
            {windows.map((window) => (
              <View key={window} style={styles.windowBlock}>
                {isTwoADay ? (
                  <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                    {window.toUpperCase()}
                  </Text>
                ) : null}
                {resolveSlots(viewedSplit, day.day, window, overrides).map((_, i) =>
                  renderSlot(day.day, window, i + 1),
                )}
              </View>
            ))}
            {/* THE SHARE — the day's muscle breakdown as PRINTED
                BARS: block glyphs scaled to the share (type as data,
                the register grid's own trick — nothing drawn). Set
                counts credit each slot's primary muscles; computed at
                read from the program. */}
            {(() => {
              const daySlots = windows.flatMap((w) =>
                resolveSlots(viewedSplit, day.day, w, overrides),
              );
              const share = derivePlanMuscleShare(daySlots);
              if (share.length === 0) return null;
              return (
                <View style={styles.shareBlock} testID={`program-share-${day.day}`}>
                  <SectionWhisper rule={false}>THE WORK</SectionWhisper>
                  {share.map((row) => (
                    <View key={row.muscle} style={styles.shareRow}>
                      <Text style={[styles.shareLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {MUSCLE_DISPLAY_NAMES[row.muscle].toUpperCase()}
                      </Text>
                      <Text style={[styles.shareBar, { color: colors.text }]}>
                        {'\u2588'.repeat(Math.max(1, Math.round((row.share / 100) * 20)))}
                      </Text>
                      <Text style={[styles.sharePct, { color: colors.textMuted }]}>
                        {`${row.share}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        );
      })}

      {overriddenCount > 0 ? (
        <MobilePrimaryButton
          variant="ghost"
          onPress={() => {
            Object.keys(overrides).forEach(clearOverride);
            showToast('success', 'All substitutions cleared');
          }}
          testID="program-reset-all"
        >
          {`Clear substitutions (${overriddenCount})`}
        </MobilePrimaryButton>
      ) : null}

      {pickerFor ? (() => {
      const [sp, d, w, pos] = pickerFor.split(':');
      const slots = resolveSlots(sp as PreferredSplit, Number(d), w as never, overrides);
      const pickerSlot = slots[Number(pos) - 1] ?? null;
      const progSlot = getSlotsForDay(sp as PreferredSplit, Number(d), w as never);
      const prog = progSlot?.[Number(pos) - 1];
      return pickerSlot ? (
        <InkRail
          currentSlug={pickerSlot.exercise}
          programmed={
            prog && prog.exercise !== pickerSlot.exercise
              ? {
                  slug: prog.exercise,
                  name: SYSTEM_EXERCISES_BY_SLUG[prog.exercise]?.name ?? '',
                }
              : null
          }
          open={pickerFor !== null}
          onOpenChange={(next) => {
            if (!next) setPickerFor(null);
          }}
          onRestore={() => {
            clearOverride(pickerFor);
            setPickerFor(null);
            showToast('success', 'Back to the programmed exercise');
          }}
          onSwap={(next) => {
            setOverride(pickerFor, { slug: next.exerciseSlug, name: next.exerciseName });
            setPickerFor(null);
            showToast('success', next.exerciseName);
          }}
          testID="program-swap-picker"
        />
      ) : null;
    })() : null}
    </BoardShell>
  );
}

const styles = StyleSheet.create({
  bodyContent: { paddingHorizontal: PAGE_GUTTER, paddingTop: 4, paddingBottom: 80 },
  dayFirst: {
    ...INTERVAL.blockFirst,
  },
  day: {
    ...INTERVAL.block,
  },
  // The page-identity whisper, spoken at rest where the column holds
  // it.
  pageWhisper: {
    ...INTERVAL.whisper,
    marginBottom: 6,
  },
  dayTitleLead: {
    ...INTERVAL.statement,
  },
  dayTitle: {
    ...theme.typography.mobileTitle,
  },
  // The statement's halo: the fact line waits outside the moat.
  dayFact: {
    ...INTERVAL.fact,
    marginBottom: 8,
  },
  windowBlock: {
    marginTop: ROW_GAP / 2,
  },
  windowLabel: {
    ...theme.typography.mobileEyebrow,
    marginTop: 8,
    marginBottom: 4,
  },
  editionToggle: {
    marginTop: 8,
    marginBottom: 4,
  },
  shareBlock: {
    marginTop: 10,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 22,
  },
  shareLabel: {
    ...theme.typography.mobileEyebrow,
    width: 92,
    flexShrink: 0,
  },
  // THE PRINTED BAR — full-block glyphs at the ledger rank; the run's
  // length IS the share (rounded to the glyph; nothing drawn).
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
  // The timetable's slot line — name, the swap furniture, and the Rx
  // as a right-aligned mono figure. Air separates the chapters.
  slotRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  slotRx: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    // The ruled row's figure post: fixed-width, flush right — the swap
    // glyph between name and figure holds one x for every row.
    minWidth: 88,
    textAlign: 'right',
  },
});
