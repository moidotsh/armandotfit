// app/program.tsx
//
// THE PROGRAM — two surfaces behind one route (docs/architecture/
// interval-thesis.md §8, restructured by the owner's direction):
//
//   /program                THE OVERVIEW — the live program states
//                           itself (statement = its name), and each
//                           EDITION reads as a CARD: the ground plus a
//                           2px rule (the home day register's own
//                           grammar — the panel tier stays dead), the
//                           edition's stats as the fact line, its top
//                           muscles as the whisper, LIVE in red ink on
//                           the running program (edition, starter, or
//                           a seeded board — the board's card taps
//                           through to the lab at that seed).
//                           Tap a card → the days.
//   /program?edition=…      THE DAYS — the edition's rotation: every
//                           day an EQUAL chapter (no elevated day 1 —
//                           the owner's correction), THE WORK prints
//                           the whole rotation's muscle share, slots
//                           are ruled lines, plan-time Swap rides the
//                           bench. MAKE LIVE adopts the rotation as
//                           the program that runs the week; viewing
//                           alone never switches.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@tamagui/lucide-icons-2';
import { useLocalSearchParams } from 'expo-router';
import { MobilePrimaryButton } from '../components/MobilePremium';
import { BoardShell, InkRail, SectionWhisper, SwapGlyph } from '../components/composed';
import { navigateToExerciseDetail, navigateToOtherSplits, navigateToProgram, navigateToStarterProgram, navigateToSplitLab, safeGoBack } from '../navigation';
import { useAppTheme, useToast } from '../context';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import {
  resolveSlots,
  slotKey,
  derivePlanMuscleShare,
  generatedBoard,
  isSameLiveProgram,
  liveProgramLabel,
  liveRotationLength,
  STARTER_PROGRAM_LABELS,
  GENERATED_PROGRAM_LABELS,
} from '../services';
import {
  TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  FEMALE_TWO_A_DAY_SPLITS,
  FEMALE_ONE_A_DAY_SPLITS,
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  getSlotsForDay,
  getStarterDays,
  type SessionWindow,
  type StarterProgram,
} from '../shared/exercises';
import { INTERVAL, ROW_GAP, theme, PAGE_GUTTER, PRESS_DIP } from '../constants';
import { joinFacts } from '../utils';
import { CURRENT_ERA } from '../shared/exercises';
import type { PreferredSplit } from '../shared/types';

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

/** The overview's statement: the PAGE's answer, not one plan's —
 * the rotation is N days, offered two ways (the editions below). */
const splitsFor = (which: PreferredSplit, ed: string) =>
  ed === 'lower'
    ? which === 'oneADay' ? FEMALE_ONE_A_DAY_SPLITS : FEMALE_TWO_A_DAY_SPLITS
    : which === 'oneADay' ? ONE_A_DAY_SPLITS : TWO_A_DAY_SPLITS;

const isEdition = (v: string | undefined): v is PreferredSplit =>
  v === 'twoADay' || v === 'oneADay';

/** The starter programs — the other authored archetypes, offered as
 *  quiet links under the editions (OTHER SPLITS). */
const STARTER_CARDS: ReadonlyArray<{ program: StarterProgram }> = [
  { program: 'ppl' },
  { program: 'upperLower' },
  { program: 'broSplit' },
  { program: 'fullyEqual' },
];

const isStarterProgram = (v: string | undefined): v is StarterProgram =>
  v === 'ppl' || v === 'upperLower' || v === 'broSplit' || v === 'fullyEqual';

export default function ProgramScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const liveProgram = useSplitPreferenceStore((s) => s.liveProgram);
  const programEdition = useSplitPreferenceStore((s) => s.edition);
  const setLiveProgram = useSplitPreferenceStore((s) => s.setLiveProgram);
  const { edition, program: programParam, view } = useLocalSearchParams<{
    edition?: string;
    program?: string;
    view?: string;
  }>();

  const overrides = useProgramOverrideStore((s) => s.overrides);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const setOverride = useProgramOverrideStore((s) => s.setOverride);
  const clearOverride = useProgramOverrideStore((s) => s.clearOverride);
  const overriddenCount = Object.keys(overrides).length;

  // ── THE OVERVIEW ────────────────────────────────────────────────────
  // (the shelf views below — view=other and program=… — must slip past
  //  this guard; only the plain /program reads the overview.)
  if (!isEdition(edition) && view !== 'other' && !isStarterProgram(programParam)) {
    // The statement — the live program's own sentence. Editions keep
    // the two-ways line; a starter or a seeded board states its name
    // (the page answers "what am I running?", whatever the answer is).
    const liveDays = liveProgram.kind === 'edition'
      ? splitsFor(liveProgram.split, programEdition).length
      : liveRotationLength(liveProgram);
    const liveStatement = liveProgram.kind === 'edition'
      ? `${liveDays} days, two ways.`
      : `${liveProgramLabel(liveProgram)} — ${liveDays} days.`;
    const statsOf = (which: PreferredSplit) => {
      const days = splitsFor(which, programEdition);
      const windows: SessionWindow[] = which === 'twoADay' ? ['am', 'pm'] : ['single'];
      const slots = days.flatMap((day) =>
        windows.flatMap((w) => resolveSlots(which, day.day, w, overrides, programEdition)),
      );
      const sessions = days.length * windows.length;
      return { days: days.length, lifts: slots.length, sessions };
    };
    return (
      <BoardShell
        surface="analytics"
        onBack={safeGoBack}
        testID="program-overview"
        contentContainerStyle={styles.bodyContent}
      >
        {/* The LIVE program states itself — the page's question is
            "what am I running?" and the answer is the program's name. */}
        <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>
          {joinFacts(['THE PROGRAM', CURRENT_ERA])}
        </Text>
        {/* The statement speaks for the WHOLE page — both editions —
            and stands alone in its halo: the cards below carry every
            stat (the old fact line repeated the live card's). */}
        <Text style={[styles.statement, { color: colors.text }]} numberOfLines={2}>
          {liveStatement}
        </Text>

        {/* THE EDITION CARDS — the ground plus the screen's 2px rule
            (the home day register's grammar); tap to read the days. */}
        {(['twoADay', 'oneADay'] as const).map((which, i) => {
          const st = statsOf(which);
          const isLive = isSameLiveProgram({ kind: 'edition', split: which }, liveProgram);
          // INK IS STATE, SPENT ON THE CARDS: the running program
          // prints in FULL INK under the screen's 2px rule; the other
          // edition demotes — muted ink, hairline rule. The split
          // between the programs is hierarchy, not two identical
          // boxes.
          const edDays = splitsFor(which, programEdition);
          const edWindows: SessionWindow[] = which === 'twoADay' ? ['am', 'pm'] : ['single'];
          const edSlots = edDays.flatMap((d) =>
            edWindows.flatMap((w) => resolveSlots(which, d.day, w, overrides, programEdition)),
          );
          const rows = derivePlanMuscleShare(edSlots, 4);
          const edLead = rows[0]?.share ?? 1;
          // THE ROTATION STRIP — the edition's anatomy as printed
          // cells: one block glyph per window, day-labeled. Twice-a-day
          // reads twice; one-a-day reads once. The split, visible.
          const strip = edDays
            .map((d) => `D${d.day} ${'\u2588'.repeat(edWindows.length)}`)
            .join(' \u2009·\u2009 ');
          const titleInk = isLive ? colors.text : colors.textMuted;
          const labelInk = isLive ? colors.textSecondary : colors.textMuted;
          const barInk = isLive ? colors.text : colors.textMuted;
          return (
            <Pressable
              key={which}
              onPress={() => navigateToProgram(which)}
              accessibilityRole="button"
              accessibilityLabel={`${liveProgramLabel({ kind: 'edition', split: which })} program — ${st.days} days, ${st.lifts} lifts, ${st.sessions} sessions a week. View the days`}
              style={({ pressed }) => [
                styles.card,
                {
                  borderTopWidth: isLive ? 2 : 1,
                  borderTopColor: isLive ? colors.text : colors.mobilePremium.hairlineBorder,
                },
                i > 0 ? styles.cardNotFirst : null,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID={`program-card-${which}`}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: titleInk }]} numberOfLines={1}>
                  {liveProgramLabel({ kind: 'edition', split: which })}
                </Text>
                {isLive ? (
                  <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
                ) : null}
                <ChevronRight size={20} color={titleInk} />
              </View>
              <View style={styles.cardFigureRow}>
                {/* THE CARD'S BIG FIGURE — the demoted-figure grammar
                    (36 mono): the edition's sessions per week, the one
                    number that IS the split. */}
                <Text
                  style={[styles.cardBigFigure, { color: titleInk }]}
                  accessibilityLabel={`${st.sessions} sessions per week`}
                >
                  {String(st.sessions)}
                </Text>
                <Text style={[styles.cardBigUnit, { color: labelInk }]}>SESSIONS/WK</Text>
                <Text style={[styles.cardSideFacts, { color: labelInk }]} numberOfLines={1}>
                  {joinFacts([`${st.days} days`, `${st.lifts} lifts`])}
                </Text>
              </View>
              <Text style={[styles.cardStrip, { color: labelInk }]} numberOfLines={1}>
                {strip}
              </Text>
              {rows.length > 0 ? (
                <View style={styles.cardShare}>
                  {rows.map((row) => (
                    <View key={row.muscle} style={styles.cardShareRow}>
                      <Text style={[styles.cardShareLabel, { color: labelInk }]} numberOfLines={1}>
                        {MUSCLE_DISPLAY_NAMES[row.muscle].toUpperCase()}
                      </Text>
                      <Text style={[styles.cardShareBar, { color: barInk }]}>
                        {'\u2588'.repeat(Math.max(1, Math.round((row.share / edLead) * 10)))}
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

        {/* THE LIVE BOARD — when a Split Lab program runs the week,
            its card sits beside the editions: same hierarchy (full
            ink, LIVE in red), and the tap opens the lab AT ITS SEED —
            the board is a function of the identity, so the lab reads
            exactly what runs. */}
        {liveProgram.kind === 'generated' ? (() => {
          const board = generatedBoard(
            liveProgram.program,
            liveProgram.seed,
            liveProgram.edition,
          );
          const slots = board.days.flatMap((d) => [...d.am, ...d.pm]);
          const sessions =
            board.days.length * (liveProgram.program === 'fullBodyHighFrequency' ? 2 : 1);
          const strip = board.days
            .map((d) => `D${d.day} ${'\u2588'.repeat(liveProgram.program === 'fullBodyHighFrequency' ? 2 : 1)}`)
            .join(' \u2009·\u2009 ');
          return (
            <Pressable
              onPress={() => navigateToSplitLab(liveProgram.program, liveProgram.seed)}
              accessibilityRole="button"
              accessibilityLabel={`${GENERATED_PROGRAM_LABELS[liveProgram.program]}, seed ${liveProgram.seed} — ${board.days.length} days, ${slots.length} lifts, ${sessions} sessions a week. Open it in the Split Lab`}
              style={({ pressed }) => [
                styles.card,
                { borderTopWidth: 2, borderTopColor: colors.text },
                styles.cardNotFirst,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID="program-card-generated-live"
            >
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {`${GENERATED_PROGRAM_LABELS[liveProgram.program]} · seed ${liveProgram.seed}`}
                </Text>
                <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
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
                  {joinFacts([`${board.days.length} days`, `${slots.length} lifts`])}
                </Text>
              </View>
              <Text style={[styles.cardStrip, { color: colors.textSecondary }]} numberOfLines={1}>
                {strip}
              </Text>
            </Pressable>
          );
        })() : null}

        {/* OTHER SPLITS — one quiet link under the editions. The
            starters themselves live one screen deep as cards, the
            generator under them; the overview stays the live
            program's page. */}
        <Pressable
          onPress={() => navigateToOtherSplits()}
          accessibilityRole="button"
          accessibilityLabel="Other splits — the starter programs and the generator"
          style={({ pressed }) => [styles.labLink, pressed ? { opacity: PRESS_DIP } : null]}
          testID="program-other-splits-link"
        >
          <Text style={[styles.labWord, { color: colors.textSecondary }]}>
            OTHER SPLITS
          </Text>
          <Text
            style={[styles.labSide, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {`${STARTER_CARDS.length} STARTERS · GENERATOR`}
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
      </BoardShell>
    );
  }

  // ── OTHER SPLITS — the starter cards + the generator link ──────────
  if (view === 'other') {
    return (
      <BoardShell
        surface="analytics"
        onBack={safeGoBack}
        testID="program-other-splits"
        contentContainerStyle={styles.bodyContent}
      >
        <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>THE STARTERS</Text>
        <Text style={[styles.statement, { color: colors.text }]} numberOfLines={2}>
          Other ways through the week.
        </Text>
        <Text style={[styles.dayFact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts(['authored starters', `${STARTER_CARDS.length} programs`])}
        </Text>

        {/* The starter cards — the same card grammar as the editions,
            muted ink throughout (only the live program carries full
            ink). Tap to read the days. */}
        {STARTER_CARDS.map(({ program: which }, i) => {
          const starter = getStarterDays(which);
          const slots = starter.flatMap((d) => d.session);
          const rows = derivePlanMuscleShare(slots, 4);
          const lead = rows[0]?.share ?? 1;
          const strip = starter.map((d) => `D${d.day} \u2588`).join(' \u2009·\u2009 ');
          // The running starter wears the hierarchy: full ink, 2px
          // rule, LIVE in red — the editions' own card grammar.
          const isLive = isSameLiveProgram({ kind: 'starter', program: which }, liveProgram);
          const title = STARTER_PROGRAM_LABELS[which];
          return (
            <Pressable
              key={which}
              onPress={() => navigateToStarterProgram(which)}
              accessibilityRole="button"
              accessibilityLabel={`${title} starter program — ${starter.length} days, ${slots.length} lifts. View the days`}
              style={({ pressed }) => [
                styles.card,
                {
                  borderTopWidth: isLive ? 2 : 1,
                  borderTopColor: isLive ? colors.text : colors.mobilePremium.hairlineBorder,
                },
                i === 0 ? styles.cardFirst : styles.cardNotFirst,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID={`program-starter-card-${which}`}
            >
              <View style={styles.cardHead}>
                <Text
                  style={[styles.cardTitle, { color: isLive ? colors.text : colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {isLive ? (
                  <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
                ) : null}
                <ChevronRight size={20} color={isLive ? colors.text : colors.textSecondary} />
              </View>
              <View style={styles.cardFigureRow}>
                <Text
                  style={[styles.cardBigFigure, { color: colors.text }]}
                  accessibilityLabel={`${starter.length} sessions per week`}
                >
                  {String(starter.length)}
                </Text>
                <Text style={[styles.cardBigUnit, { color: colors.textSecondary }]}>SESSIONS/WK</Text>
                <Text style={[styles.cardSideFacts, { color: colors.textSecondary }]} numberOfLines={1}>
                  {joinFacts([`${starter.length} days`, `${slots.length} lifts`])}
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
                      <Text style={[styles.cardShareBar, { color: colors.textSecondary }]}>
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

        {/* THE SPLIT LAB — the generator, the quiet last link on the
            shelf (read-only previews, nothing applies). */}
        <Pressable
          onPress={() => navigateToSplitLab()}
          accessibilityRole="button"
          accessibilityLabel="The Split Lab — generate alternative programs, read-only preview"
          style={({ pressed }) => [styles.labLink, pressed ? { opacity: PRESS_DIP } : null]}
          testID="program-split-lab-link"
        >
          <Text style={[styles.labWord, { color: colors.textSecondary }]}>
            THE SPLIT LAB
          </Text>
          <Text style={[styles.labSide, { color: colors.textMuted }]} numberOfLines={1}>
            GENERATE ALTERNATIVES
          </Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
      </BoardShell>
    );
  }

  // ── THE STARTER DAYS (an authored archetype's rotation) ────────────
  if (isStarterProgram(programParam)) {
    const starter = getStarterDays(programParam);
    const starterSlots = starter.flatMap((d) => d.session);
    const starterShare = derivePlanMuscleShare(starterSlots, 99);
    const starterLead = starterShare[0]?.share ?? 1;
    const isStarterLive = isSameLiveProgram(
      { kind: 'starter', program: programParam },
      liveProgram,
    );
    const makeStarterLive = () => {
      setLiveProgram({ kind: 'starter', program: programParam });
      showToast('success', `${STARTER_PROGRAM_LABELS[programParam]} is live`);
    };
    return (
      <BoardShell
        surface="analytics"
        onBack={safeGoBack}
        testID="program-starter-days"
        contentContainerStyle={styles.bodyContent}
      >
        <View style={styles.dayFirst}>
          <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>
            {joinFacts(['THE ROTATION', `${starter.length} DAYS`, CURRENT_ERA])}
          </Text>
          <View style={styles.statementRow}>
            <Text style={[styles.statement, { color: colors.text }]} numberOfLines={1}>
              {STARTER_PROGRAM_LABELS[programParam]}
            </Text>
            {isStarterLive ? (
              <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
            ) : null}
          </View>
          <Text style={[styles.dayFact, { color: colors.textMuted }]} numberOfLines={1}>
            {joinFacts([
              `${starter.length} days`,
              `${starterSlots.length} lifts`,
              `${starter.length} sessions/week`,
              'starter',
            ])}
          </Text>
          {!isStarterLive ? (
            <MobilePrimaryButton onPress={makeStarterLive} testID="program-starter-make-live">
              MAKE LIVE
            </MobilePrimaryButton>
          ) : null}
        </View>

        {/* Equal chapters of ruled lines; the names tap through to the
            spec sheets. Starters carry no override mechanism — the
            authored slots read as authored (the lab generates). */}
        {starter.map((day, di) => (
          <View
            key={day.day}
            style={[
              di === 0 ? styles.dayFirstChapter : styles.daySeparated,
              di > 0 ? { borderTopColor: colors.mobilePremium.hairlineBorder } : null,
            ]}
          >
            <View style={styles.dayHeadRow}>
              <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={1}>
                {day.title}
              </Text>
              <Text style={[styles.dayHeadFigure, { color: colors.textMuted }]}>
                {`${day.session.length} lifts`}
              </Text>
            </View>
            {day.session.map((slot, i) => {
              const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
              const name = entry?.name ?? slot.exercise;
              return (
                <View key={`${day.day}:${i}`} style={styles.slotRow}>
                  <Pressable
                    onPress={entry ? () => navigateToExerciseDetail(entry.slug) : undefined}
                    accessibilityRole={entry ? 'button' : undefined}
                    accessibilityLabel={entry ? `${name} — view details` : name}
                    style={({ pressed }) => [
                      styles.slotNameHold,
                      pressed ? { opacity: PRESS_DIP } : null,
                    ]}
                    testID={`program-starter-slot-${entry?.slug ?? `${day.day}-${i}`}`}
                  >
                    <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                  </Pressable>
                  <Text style={[styles.slotRx, { color: colors.text }]}>
                    {rxLabel(slot.sets, slot.reps)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {starterShare.length > 0 ? (
          <View style={[styles.shareBlock, { borderTopColor: colors.text }]} testID="program-share">
            <SectionWhisper rule={false}>THE WORK</SectionWhisper>
            {starterShare.map((row) => (
              <View key={row.muscle} style={styles.shareRow}>
                <Text style={[styles.shareLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {MUSCLE_DISPLAY_NAMES[row.muscle].toUpperCase()}
                </Text>
                <Text style={[styles.shareBar, { color: colors.text }]}>
                  {'\u2588'.repeat(Math.max(1, Math.round((row.share / starterLead) * 16)))}
                </Text>
                <Text style={[styles.sharePct, { color: colors.textMuted }]}>
                  {`${row.share}%`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </BoardShell>
    );
  }

  // ── THE DAYS (the edition detail) ───────────────────────────────────
  if (!isEdition(edition)) return null; // unreachable past the shelf guards
  const viewedSplit: PreferredSplit = edition;
  const days = splitsFor(viewedSplit, programEdition);
  const isTwoADay = viewedSplit === 'twoADay';
  const windows: SessionWindow[] = isTwoADay ? ['am', 'pm'] : ['single'];
  // THE PAGE'S VERB — viewing is not switching; MAKE LIVE is. The
  // running edition wears the red word instead.
  const isEditionLive = isSameLiveProgram({ kind: 'edition', split: viewedSplit }, liveProgram);
  const makeEditionLive = () => {
    setLiveProgram({ kind: 'edition', split: viewedSplit });
    showToast('success', `${liveProgramLabel({ kind: 'edition', split: viewedSplit })} is live`);
  };

  const dayLifts = (day: number) =>
    windows.reduce((n, w) => n + resolveSlots(viewedSplit, day, w, overrides, programEdition).length, 0);

  const renderSlot = (day: number, window: SessionWindow, position: number) => {
    const slots = resolveSlots(viewedSplit, day, window, overrides, programEdition);
    const slot = slots[position - 1];
    if (!slot) return null;
    const key = slotKey(viewedSplit, day, window, position);
    const entry = SYSTEM_EXERCISES_BY_SLUG[slot.exercise];
    const name = entry?.name ?? slot.exercise;
    const isOverridden = key in overrides;

    // A standing substitution reads in the RED RX only (thesis §8 — the
    // live edit): one red node per override; the name stays ink.
    // TAP THE NAME to see the lift's spec sheet (the plate, the cues,
    // the number to beat); the swap glyph stays the swap.
    return (
      <View key={key} style={styles.slotRow}>
        <Pressable
          onPress={entry ? () => navigateToExerciseDetail(entry.slug) : undefined}
          accessibilityRole={entry ? 'button' : undefined}
          accessibilityLabel={entry ? `${name} — view details` : name}
          style={({ pressed }) => [
            styles.slotNameHold,
            pressed ? { opacity: PRESS_DIP } : null,
          ]}
          testID={`program-slot-${entry?.slug ?? key}`}
        >
          <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
        </Pressable>
        <SwapGlyph onPress={() => setPickerFor(key)} label={name} />
        <Text style={[styles.slotRx, { color: isOverridden ? colors.brandText : colors.text }]}>
          {rxLabel(slot.sets, slot.reps)}
        </Text>
      </View>
    );
  };

  const planSlots = days.flatMap((day) =>
    windows.flatMap((w) => resolveSlots(viewedSplit, day.day, w, overrides, programEdition)),
  );
  // EVERY muscle the rotation works — no cap; bars scale to the LEADER
  // (shares cluster at 5-15%, so a 100% ruler collapses everything).
  const share = derivePlanMuscleShare(planSlots, 99);
  const lead = share[0]?.share ?? 1;

  return (
    <BoardShell
      surface="analytics"
      onBack={safeGoBack}
      testID="program-days"
      contentContainerStyle={styles.bodyContent}
    >
      <View style={styles.dayFirst}>
        <Text style={[styles.pageWhisper, { color: colors.textMuted }]}>
          {joinFacts(['THE ROTATION', `${days.length} DAYS`, CURRENT_ERA])}
        </Text>
        <View style={styles.statementRow}>
          <Text style={[styles.statement, { color: colors.text }]} numberOfLines={1}>
            {liveProgramLabel({ kind: 'edition', split: viewedSplit })}
          </Text>
          {isEditionLive ? (
            <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
          ) : null}
        </View>
        <Text style={[styles.dayFact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([
            `${days.length} days`,
            `${planSlots.length} lifts`,
            `${days.length * windows.length} sessions/week`,
          ])}
        </Text>
        {!isEditionLive ? (
          <MobilePrimaryButton onPress={makeEditionLive} testID="program-edition-make-live">
            MAKE LIVE
          </MobilePrimaryButton>
        ) : null}
      </View>

      {/* EVERY DAY AN EQUAL CHAPTER — no elevated day 1 (the owner's
          correction): the statement above is the EDITION's name, and
          the days read as its table of contents. */}
      {days.map((day, di) => (
        <View
          key={day.day}
          style={[
            di === 0 ? styles.dayFirstChapter : styles.daySeparated,
            di > 0 ? { borderTopColor: colors.mobilePremium.hairlineBorder } : null,
          ]}
        >
          <View style={styles.dayHeadRow}>
            <Text style={[styles.dayTitle, { color: colors.text }]} numberOfLines={1}>
              {day.title}
            </Text>
            <Text style={[styles.dayHeadFigure, { color: colors.textMuted }]}>
              {`${dayLifts(day.day)} lifts`}
            </Text>
          </View>
          {windows.map((window) => (
            <View key={window} style={styles.windowBlock}>
              {isTwoADay ? (
                <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                  {window.toUpperCase()}
                </Text>
              ) : null}
              {resolveSlots(viewedSplit, day.day, window, overrides, programEdition).map((_, i) =>
                renderSlot(day.day, window, i + 1),
              )}
            </View>
          ))}
        </View>
      ))}

        {share.length > 0 ? (
          <View
            style={[styles.shareBlock, { borderTopColor: colors.text }]}
            testID="program-share"
          >
            {/* THE WORK CLOSES THE PAGE — the days are the content
                and lead; the share is the summary the page ends on
                (the 2px rule is the page's one: the closer's
                landmark, the home day register's echo). */}
            <SectionWhisper rule={false}>THE WORK</SectionWhisper>
            {share.map((row) => (
              <View key={row.muscle} style={styles.shareRow}>
                <Text style={[styles.shareLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {MUSCLE_DISPLAY_NAMES[row.muscle].toUpperCase()}
                </Text>
                <Text style={[styles.shareBar, { color: colors.text }]}>
                  {'\u2588'.repeat(Math.max(1, Math.round((row.share / lead) * 16)))}
                </Text>
                <Text style={[styles.sharePct, { color: colors.textMuted }]}>
                  {`${row.share}%`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

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
  // The first chapter follows the page head (which carries the edition).
  dayFirstChapter: {
    ...INTERVAL.block,
  },
  day: {
    ...INTERVAL.block,
  },
  // Days 2-4: the hairline landmark (the ≤3 budget, spent) — the
  // chapter's paragraph mark; Day 1 is demarcated by THE WORK's 2px
  // rule above it.
  daySeparated: {
    ...INTERVAL.block,
    borderTopWidth: 1,
    borderTopColor: undefined,
    paddingTop: 12,
  },
  pageWhisper: {
    ...INTERVAL.whisper,
    marginBottom: 6,
  },
  statement: {
    ...INTERVAL.statement,
  },
  // The statement + its LIVE word (red is record/link/live — the
  // badge rides the head's baseline, never a chip).
  statementRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  dayTitle: {
    ...theme.typography.mobileTitle,
  },
  dayFact: {
    ...INTERVAL.fact,
    marginBottom: 8,
  },
  // ── THE EDITION CARDS — the ground plus the screen's 2px rule (the
  // home day register's grammar; the panel tier stays dead). Tappable
  // wholes with the press dip.
  card: {
    borderTopWidth: 2,
    paddingTop: 12,
    paddingBottom: 8,
    },
  cardNotFirst: {
    marginTop: 24,
  },
  // ── THE OTHER-SPLITS SHELF — the starter cards (first follows the
  // fact line, the rest keep the card rhythm) and THE SPLIT LAB as
  // the quiet last link.
  cardFirst: {
    marginTop: 16,
  },
  labLink: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
  },
  labWord: {
    ...theme.typography.mobileEyebrow,
  },
  labSide: {
    ...theme.typography.mobileEyebrow,
    marginLeft: 'auto',
    flexShrink: 1,
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
  liveWord: {
    ...theme.typography.mobileEyebrow,
  },
  cardFigureRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
  },
  // THE BIG FIGURE — the demoted-figure grammar (36 mono, 500): the
  // card's one loud number.
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
  // THE ROTATION STRIP — day-labeled window cells at the ledger rank.
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
  dayHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
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
  shareBlock: {
    marginTop: 36,
    borderTopWidth: 2,
    paddingTop: 10,
  },
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
  slotNameHold: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
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
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    minWidth: 88,
    textAlign: 'right',
  },
});
