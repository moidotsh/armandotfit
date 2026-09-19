// app/program.tsx
// My Program — THE BOARD's rotation (docs/architecture/
// board-thesis.md §7): "The rotation, day by day." The FIRST day's
// title is the statement (later chapters at subhead scale), each day
// is one air-separated block, and slots are board rows: name + Rx
// whisper. A standing substitution marks in the record-mark read (the
// name and Rx turn record-text); the authored program in splits.ts is
// never edited. Plan-time Swap rides the same InkRail bench as the
// Floor. M3 THE COMPRESS: once day one scrolls away, the pinned bar
// restates the page with its live figure (the day count).

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MobilePrimaryButton } from '../components/MobilePremium';
import { BoardShell, InkRail, SwapGlyph } from '../components/composed';
import { safeGoBack } from '../navigation';
import { useAppTheme, useToast } from '../context';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import { resolveSlots, slotKey } from '../services';
import {
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  getSlotsForDay,
  type SessionWindow,
} from '../shared/exercises';
import { GAUGE, ROW_GAP, theme, PAGE_GUTTER } from '../constants';
import type { PreferredSplit } from '../shared/types';

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

export default function ProgramScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const split = useSplitPreferenceStore((s) => s.splitType);

  const overrides = useProgramOverrideStore((s) => s.overrides);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const setOverride = useProgramOverrideStore((s) => s.setOverride);
  const clearOverride = useProgramOverrideStore((s) => s.clearOverride);

  const days = split === 'oneADay' ? ONE_A_DAY_SPLITS : TWO_A_DAY_SPLITS;
  const overriddenCount = Object.keys(overrides).length;
  const isTwoADay = split === 'twoADay';

  const renderSlot = (
    day: number,
    window: SessionWindow,
    position: number,
  ) => {
    const slots = resolveSlots(split, day, window, overrides);
    const slot = slots[position - 1];
    if (!slot) return null;
    const key = slotKey(split, day, window, position);
    const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
    const name = entry?.name ?? slot.exercise;
    const isOverridden = key in overrides;

    return (
      <View key={key} style={styles.slotRow}>
        <Text
          style={[styles.slotName, { color: isOverridden ? colors.brandText : colors.text }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <SwapGlyph onPress={() => setPickerFor(key)} label={name} />
        <Text
          style={[styles.slotRx, { color: isOverridden ? colors.brandText : colors.textMuted }]}
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
      lifts += resolveSlots(split, day, w, overrides).length;
    }
    return lifts;
  };

  return (
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="program-scroll"
      compact={{
        title: 'The rotation',
        figure: (
          <Text style={[styles.compactFigure, { color: colors.textMuted }]}>
            {`${days.length} DAYS`}
          </Text>
        ),
      }}
      contentContainerStyle={styles.bodyContent}
    >
      {days.map((day, di) => {
        const windows: SessionWindow[] = isTwoADay ? ['am', 'pm'] : ['single'];
        return (
          <View key={day.day} style={di === 0 ? styles.dayFirst : styles.day}>
            {/* Day head: the first day is the page's statement; the
                rest are subheads. One fact line beneath. */}
            <Text
              style={[di === 0 ? styles.dayTitleLead : styles.dayTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {day.title}
            </Text>
            <Text
              style={[styles.dayFact, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {`${isTwoADay ? 'AM + PM · ' : ''}${dayLifts(day.day)} lifts`}
            </Text>
            {windows.map((window) => (
              <View key={window} style={styles.windowBlock}>
                {isTwoADay ? (
                  <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                    {window.toUpperCase()}
                  </Text>
                ) : null}
                <View
                  style={[
                    styles.windowPanel,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  {resolveSlots(split, day.day, window, overrides).map((_, i) =>
                    renderSlot(day.day, window, i + 1),
                  )}
                </View>
              </View>
            ))}
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
  compactFigure: {
    ...theme.typography.mobileEyebrow,
  },
  dayFirst: {
    ...GAUGE.blockFirst,
  },
  day: {
    ...GAUGE.block,
  },
  dayTitleLead: {
    ...GAUGE.statement,
  },
  dayTitle: {
    ...theme.typography.mobileTitle,
  },
  // The statement's halo: the fact line waits outside the moat.
  dayFact: {
    ...GAUGE.fact,
    marginBottom: 8,
  },
  windowBlock: {
    marginTop: ROW_GAP / 2,
  },
  // The timetable's window panel — the day's slots on one enamel
  // panel (the printed timetable row).
  windowPanel: {
    borderWidth: 1,
    borderRadius: theme.shapes.surface,
    paddingVertical: 4,
    paddingHorizontal: 12,
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
  slotName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  slotRx: {
    ...theme.typography.mobileLedger,
  },
});
