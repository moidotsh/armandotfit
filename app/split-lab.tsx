// app/split-lab.tsx
//
// THE SPLIT LAB — the constraint suite surfaced as a dial
// (services/splitGenerator.ts + shared/exercises/splitRules.ts), in
// THE PROGRAM PAGE'S OWN GRAMMAR:
//
//   /split-lab                 THE OVERVIEW — one CARD per generator
//                             program type, the six: Full Body
//                             (one-a-day), HF Full Body (AM/PM),
//                             Push/Pull/Leg, Upper/Lower, Bro Split,
//                             Anything Goes. Each card previews THAT
//                             type's generated board for the current
//                             seed (sessions figure, side facts,
//                             rotation strip, top-muscle share). Tap →
//                             the days.
//   /split-lab?program=…      THE DAYS — the generated rotation as
//                             equal chapters of ruled lines (the
//                             program days' own grammar), closed by
//                             VS THE PROGRAM: the diverging ± share
//                             delta against the authored program (the
//                             full-body types compare against their own
//                             shape; the other types against the
//                             shape you run) and the laws' verdict.
//                             The PENCIL opens Edit Mode — the board's
//                             slots become editable exactly like the
//                             authored previews (swap, remove, re-rx,
//                             add), keyed to this program AND seed; VS
//                             THE PROGRAM stays the generator's pure
//                             verdict.
//
// Reroll picks a new seed; the same seed rebuilds the same boards
// (deterministic — the live program persists BY SEED, never as stored
// rows). RUN THIS PROGRAM adopts the board you're reading as the live
// program — the preference store holds {program, seed, edition} and
// every surface rebuilds it from that identity.

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from '@tamagui/lucide-icons-2';
import { useLocalSearchParams } from 'expo-router';
import { MobilePrimaryButton } from '../components/MobilePremium';
import {
  AddExerciseRow,
  AddExerciseSheet,
  BoardShell,
  EditToggleGlyph,
  InkRail,
  RemoveSlotGlyph,
  RestoreSlotGlyph,
  RxEditSheet,
  SectionWhisper,
  SwapGlyph,
  TagEditSheet,
  TagsGlyph,
  type SlotBench,
} from '../components/composed';
import { navigateToExerciseDetail, navigateToSplitLab, safeGoBack } from '../navigation';
import { useAppTheme, useToast } from '../context';
import { useSplitPreferenceStore, useProgramOverrideStore } from '../stores';
import {
  generateProgram,
  isSameLiveProgram,
  nameForSlug,
  authoredBaselineFor,
  muscleShareDeltas,
  resolveLiveSlots,
  liveSlotKey,
  authoredSlotAt,
  authoredSlotCount,
  nextAddedPosition,
  programOverridePrefix,
  GENERATED_PROGRAM_LABELS,
} from '../services';
import type { LiveProgram } from '../shared/types';
import { derivePlanMuscleShare } from '../services';
import { INTERVAL, ROW_GAP, PAGE_GUTTER, PRESS_DIP, theme } from '../constants';
import { joinFacts } from '../utils';
import { MUSCLE_DISPLAY_NAMES, type ProgramType } from '../shared/exercises';
import type { ResolvedSlot } from '../shared/exercises';

/** The card list — the generator program types, in the owner's order.
 *  Titles are GENERATED_PROGRAM_LABELS (services — one truth). */
const PROGRAM_CARDS: ReadonlyArray<{
  program: ProgramType;
  /** The days view's statement (short — it prints at 36). */
  short: string;
  /** Sessions per day (only HF Full Body trains twice). */
  sessionsPerDay: 1 | 2;
}> = [
  { program: 'fullBodyOneADay', short: 'Full Body', sessionsPerDay: 1 },
  { program: 'fullBodyHighFrequency', short: 'HF Full Body', sessionsPerDay: 2 },
  { program: 'pushPullLegs', short: 'Push/Pull/Leg', sessionsPerDay: 1 },
  { program: 'upperLower', short: 'Upper/Lower', sessionsPerDay: 1 },
  { program: 'broSplit', short: 'Bro Split', sessionsPerDay: 1 },
  { program: 'fullyEqual', short: 'Fully Equal', sessionsPerDay: 1 },
  { program: 'anythingGoes', short: 'Anything Goes', sessionsPerDay: 1 },
];

const CARD_BY_PROGRAM = new Map(PROGRAM_CARDS.map((c) => [c.program, c]));

/** The diverging bars' half-width, in glyphs (the leader fills it). */
const DELTA_BAR_HALF = 8;

function rxLabel(sets: [number, number], reps: [number, number]): string {
  const s = sets[1] > 0 ? sets[1] : sets[0];
  return `${s}×${reps[0]}–${reps[1]}`;
}

const newSeed = (): number => 1000 + Math.floor(Math.random() * 9000);

const isProgram = (v: string | undefined): v is ProgramType =>
  PROGRAM_CARDS.some((c) => c.program === v);

export default function SplitLabScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const [seed, setSeed] = useState<number>(4271);
  const { program, seed: seedParam } = useLocalSearchParams<{
    program?: string;
    seed?: string;
  }>();
  const preferredShape = useSplitPreferenceStore((s) => s.splitType);
  const liveProgram = useSplitPreferenceStore((s) => s.liveProgram);
  const setLiveProgram = useSplitPreferenceStore((s) => s.setLiveProgram);
  const overrides = useProgramOverrideStore((s) => s.overrides);
  const setOverride = useProgramOverrideStore((s) => s.setOverride);
  const clearOverride = useProgramOverrideStore((s) => s.clearOverride);

  // ── EDIT MODE — the pencil opens the board's bench (the program
  // days' own grammar); the sheets capture their slot at open time.
  const [editing, setEditing] = useState(false);
  const [bench, setBench] = useState<SlotBench | null>(null);
  const [addFor, setAddFor] = useState<{ day: number; window: 'am' | 'pm' } | null>(null);

  // A seed ARRIVING ON THE ROUTE (the program page's generated-live
  // card taps through) takes over the dial — the URL is the lab's
  // state, the reroll rewrites it.
  React.useEffect(() => {
    const n = Number(seedParam);
    if (Number.isFinite(n) && n > 0 && n !== seed) setSeed(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedParam]);

  // All six boards are pure functions of the seed — the overview
  // previews them; the days view reads one.
  const boards = useMemo(() => {
    const map = {} as Record<ProgramType, ReturnType<typeof generateProgram>>;
    for (const { program: p } of PROGRAM_CARDS) {
      map[p] = generateProgram({ seed, program: p });
    }
    return map;
  }, [seed]);

  const rerollVerb = (
    <MobilePrimaryButton onPress={() => setSeed(newSeed())} testID="split-lab-reroll">
      REROLL THE SEED
    </MobilePrimaryButton>
  );

  // ── THE OVERVIEW — one card per program type ────────────────────────
  if (!isProgram(program)) {
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
          {joinFacts([`seed ${seed}`, 'reroll until it fits — then make it live'])}
        </Text>

        {PROGRAM_CARDS.map(({ program: which, sessionsPerDay }, i) => {
          const board = boards[which];
          // The board that IS the live program wears the red word and
          // the full-ink rule (the program page's card hierarchy).
          const isLive =
            liveProgram.kind === 'generated' &&
            liveProgram.program === which &&
            liveProgram.seed === seed;
          const slots = board.days.flatMap((d) => [...d.am, ...d.pm]);
          const sessions = board.days.length * sessionsPerDay;
          const rows = derivePlanMuscleShare(slots, 4);
          const lead = rows[0]?.share ?? 1;
          const strip = board.days
            .map((d) => `D${d.day} ${'\u2588'.repeat(sessionsPerDay)}`)
            .join(' \u2009·\u2009 ');
          return (
            <Pressable
              key={which}
              onPress={() => navigateToSplitLab(which)}
              accessibilityRole="button"
              accessibilityLabel={`${GENERATED_PROGRAM_LABELS[which]} generated program — ${slots.length} lifts, ${sessions} sessions a week. View the days`}
              style={({ pressed }) => [
                styles.card,
                {
                  borderTopWidth: isLive ? 2 : 1,
                  borderTopColor: isLive ? colors.text : colors.mobilePremium.hairlineBorder,
                },
                i > 0 ? styles.cardNotFirst : null,
                pressed ? { opacity: PRESS_DIP } : null,
              ]}
              testID={`split-lab-card-${which}`}
            >
              <View style={styles.cardHead}>
                <Text
                  style={[styles.cardTitle, { color: isLive ? colors.text : colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {GENERATED_PROGRAM_LABELS[which]}
                </Text>
                {isLive ? (
                  <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
                ) : null}
                <ChevronRight size={20} color={isLive ? colors.text : colors.textSecondary} />
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
  const card = CARD_BY_PROGRAM.get(program)!;
  const board = boards[program];
  const isTwoADay = program === 'fullBodyHighFrequency';
  // THE BOARD'S IDENTITY — {program, seed, edition} is everything the
  // resolver needs to rebuild this exact rotation anywhere.
  const boardIdentity: LiveProgram = {
    kind: 'generated',
    program,
    seed,
    edition: board.edition,
  };
  const isLive = isSameLiveProgram(boardIdentity, liveProgram);
  const genSlots = board.days.flatMap((d) => [...d.am, ...d.pm]);
  // The comparison baseline: the archetype's own authored starter when
  // one exists (PPL / Upper-Lower / Bro), the same-shape full-body
  // edition otherwise, the shape you actually run for Anything Goes.
  const { rows: deltaRows, maxAbsDelta } = useMemo(
    () => muscleShareDeltas(genSlots, authoredBaselineFor(program, preferredShape ?? 'twoADay')),
    [genSlots, program, preferredShape],
  );
  const passing = board.rules.filter((r) => r.ok).length;

  // ── THE EDIT HELPERS — the program days' own slot grammar, keyed to
  // this board's identity (program AND seed). VS THE PROGRAM below
  // stays the generator's pure verdict; only the day list and the
  // figures read the edited board.
  const openBench = (
    mode: 'swap' | 'rx' | 'tags',
    window: 'am' | 'pm',
    slot: ResolvedSlot,
    day: number,
  ) => {
    const pos = slot.position ?? 0;
    const key = liveSlotKey(boardIdentity, day, window, pos);
    const def = authoredSlotAt(boardIdentity, day, window, pos, board.edition);
    setBench({
      mode,
      key,
      currentSlug: slot.exercise,
      currentName: nameForSlug(slot.exercise),
      sets: slot.sets,
      reps: slot.reps,
      tags: slot.suggestedTags,
      defaultSlug: def?.exercise ?? '',
      defaultName: def ? nameForSlug(def.exercise) : '',
      defaultSets: def?.sets ?? slot.sets,
      defaultReps: def?.reps ?? slot.reps,
      defaultTags: def?.suggestedTags ?? [],
      isEdited: key in overrides,
    });
  };

  const slotRow = (window: 'am' | 'pm', slot: ResolvedSlot, day: number) => {
    const key = liveSlotKey(boardIdentity, day, window, slot.position ?? 0);
    const name = nameForSlug(slot.exercise);
    const isEdited = key in overrides;
    const rx = rxLabel(slot.sets, slot.reps);
    return (
      <View key={key} style={styles.slotRow}>
        <Pressable
          onPress={() => navigateToExerciseDetail(slot.exercise)}
          accessibilityRole="button"
          accessibilityLabel={`${name} — view details`}
          style={({ pressed }) => [styles.slotNameHold, pressed ? { opacity: PRESS_DIP } : null]}
          testID={`split-lab-slot-${slot.exercise}`}
        >
          <Text style={[styles.slotName, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          {slot.suggestedTags.length > 0 ? (
            <Text style={[styles.slotTags, { color: colors.textMuted }]} numberOfLines={1}>
              {slot.suggestedTags.join(' · ')}
            </Text>
          ) : null}
        </Pressable>
        {editing ? (
          <SwapGlyph onPress={() => openBench('swap', window, slot, day)} label={name} />
        ) : null}
        {editing ? (
          <TagsGlyph
            onPress={() => openBench('tags', window, slot, day)}
            label={name}
            active={overrides[key]?.tags != null}
            testID={`split-lab-slot-tags-${key}`}
          />
        ) : null}
        {editing ? (
          <RemoveSlotGlyph
            name={name}
            onRemove={() => {
              setOverride(key, { removed: true });
              showToast('success', `${name} removed`);
            }}
            testID={`split-lab-slot-remove-${key}`}
          />
        ) : null}
        {editing ? (
          <Pressable
            onPress={() => openBench('rx', window, slot, day)}
            accessibilityRole="button"
            accessibilityLabel={`Change the prescription for ${name}, currently ${rx}`}
            style={({ pressed }) => [styles.slotRxHold, pressed ? { opacity: PRESS_DIP } : null]}
            testID={`split-lab-slot-rx-${key}`}
          >
            <Text style={[styles.slotRx, { color: isEdited ? colors.brandText : colors.text }]}>
              {rx}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.slotRx, { color: isEdited ? colors.brandText : colors.text }]}>
            {rx}
          </Text>
        )}
      </View>
    );
  };

  const ghostRow = (key: string, name: string) => (
    <View key={`ghost:${key}`} style={styles.slotRow}>
      <View style={styles.slotNameHold}>
        <Text style={[styles.slotName, styles.slotGhost, { color: colors.textMuted }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <RestoreSlotGlyph
        name={name}
        onRestore={() => {
          clearOverride(key);
          showToast('success', `${name} — back in`);
        }}
        testID={`split-lab-slot-restore-${key}`}
      />
      <Text style={[styles.slotRx, { color: colors.textMuted }]}>{'\u2014'}</Text>
    </View>
  );

  /** One window's rows: ghosts (edit mode only), the resolved slots,
   * and — in edit mode — the + ADD EXERCISE line. */
  const windowRows = (day: number, window: 'am' | 'pm') => {
    const rows: React.ReactNode[] = [];
    if (editing) {
      const count = authoredSlotCount(boardIdentity, day, window, board.edition);
      for (let pos = 1; pos <= count; pos++) {
        const key = liveSlotKey(boardIdentity, day, window, pos);
        if (overrides[key]?.removed) {
          const def = authoredSlotAt(boardIdentity, day, window, pos, board.edition);
          rows.push(ghostRow(key, def ? nameForSlug(def.exercise) : key));
        }
      }
    }
    for (const slot of resolveLiveSlots(boardIdentity, day, window, overrides, board.edition)) {
      rows.push(slotRow(window, slot, day));
    }
    if (editing) {
      rows.push(
        <AddExerciseRow
          key={`add:${day}:${window}`}
          onPress={() => setAddFor({ day, window })}
          testID={`split-lab-slot-add`}
        />,
      );
    }
    return rows;
  };

  // The resolved day list — the figures say what actually runs.
  const labWindows = (isTwoADay ? ['am', 'pm'] : ['am']) as ('am' | 'pm')[];
  const resolvedLifts = board.days.reduce(
    (n, d) =>
      n +
      labWindows.reduce(
        (m, w) => m + resolveLiveSlots(boardIdentity, d.day, w, overrides, board.edition).length,
        0,
      ),
    0,
  );
  // The program-scoped RESTORE TO DEFAULTS verb (seed-distinct prefix).
  const restoreKeys = Object.keys(overrides).filter((k) =>
    k.startsWith(programOverridePrefix(boardIdentity)),
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
        <View style={styles.statementRow}>
          <Text style={[styles.statement, { color: colors.text }]} numberOfLines={1}>
            {card.short}
          </Text>
          {isLive ? (
            <Text style={[styles.liveWord, { color: colors.brandText }]}>LIVE</Text>
          ) : null}
          <View style={styles.headTools}>
            <EditToggleGlyph
              editing={editing}
              onPress={() => setEditing(!editing)}
              testID="split-lab-edit-toggle"
            />
          </View>
        </View>
        <Text style={[styles.fact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([
            `${board.days.length} days`,
            `${resolvedLifts} lifts`,
            `${board.days.length * card.sessionsPerDay} sessions/week`,
            'generated',
          ])}
        </Text>
        {!isLive ? (
          <MobilePrimaryButton
            onPress={() => {
              setLiveProgram(boardIdentity);
              showToast('success', `${card.short} is live`);
            }}
            testID="split-lab-make-live"
          >
            RUN THIS PROGRAM
          </MobilePrimaryButton>
        ) : null}
      </View>

      {/* THE DAYS — equal chapters of ruled lines; every slot taps
          through to its spec sheet. The pencil opens Edit Mode; the
          edits key to this program AND seed. */}
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
              {`${labWindows.reduce(
                (m, w) =>
                  m + resolveLiveSlots(boardIdentity, day.day, w, overrides, board.edition).length,
                0,
              )} lifts`}
            </Text>
          </View>
          {labWindows.map((window) => (
            <View key={window} style={styles.windowBlock}>
              {isTwoADay ? (
                <Text style={[styles.windowLabel, { color: colors.textMuted }]}>
                  {window.toUpperCase()}
                </Text>
              ) : null}
              {windowRows(day.day, window)}
            </View>
          ))}
        </View>
      ))}

      {/* VS THE PROGRAM — the page's 2px-rule closer. The diverging
          bars: left of the axis the generated program works the muscle
          LESS than the authored one, right more; the figure carries
          the signed points. */}
      <View style={[styles.deltaBlock, { borderTopColor: colors.text }]} testID="split-lab-delta">
        <SectionWhisper rule={false}>VS THE PROGRAM</SectionWhisper>
        <Text style={[styles.deltaFact, { color: colors.textMuted }]} numberOfLines={1}>
          {joinFacts([
            'share of weekly set volume',
            board.ok
              ? `${passing}/${board.rules.length} laws pass`
              : `${board.rules.length - passing} law${board.rules.length - passing === 1 ? '' : 's'} fail`,
          ])}
        </Text>
        {deltaRows.map((row) => {
          const len =
            maxAbsDelta === 0
              ? 0
              : Math.round((Math.abs(row.delta) / maxAbsDelta) * DELTA_BAR_HALF);
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

      {restoreKeys.length > 0 ? (
        <MobilePrimaryButton
          variant="ghost"
          onPress={() => {
            restoreKeys.forEach(clearOverride);
            setEditing(false);
            showToast('success', `${card.short} · seed ${seed} — back to the generated board`);
          }}
          testID="split-lab-restore-defaults"
        >
          {`Restore to defaults (${restoreKeys.length})`}
        </MobilePrimaryButton>
      ) : null}

      {/* The edit sheets — the same bench the program days open; the
          capture carries this board's identity. */}
      {bench ? (() => {
        const b = bench;
        const defaultRow =
          b.defaultSlug && (b.defaultSlug !== b.currentSlug || b.isEdited)
            ? { slug: b.defaultSlug, name: b.defaultName }
            : null;
        return b.mode === 'swap' ? (
          <InkRail
            currentSlug={b.currentSlug}
            programmed={defaultRow}
            open
            onOpenChange={(next) => {
              if (!next) setBench(null);
            }}
            onRestore={() => {
              clearOverride(b.key);
              setBench(null);
              showToast('success', `${b.defaultName} — back to the default`);
            }}
            onSwap={(next) => {
              setOverride(b.key, { slug: next.exerciseSlug, name: next.exerciseName });
              setBench(null);
              showToast('success', next.exerciseName);
            }}
            testID="split-lab-swap-picker"
          />
        ) : b.mode === 'tags' ? (
          <TagEditSheet
            open
            onOpenChange={(next) => {
              if (!next) setBench(null);
            }}
            exerciseName={b.currentName}
            tags={b.tags}
            defaultTags={b.defaultTags}
            isEdited={b.isEdited}
            onSave={(tags) => {
              setOverride(b.key, { tags });
              showToast(
                'success',
                `${b.currentName} — ${tags.length > 0 ? tags.join(' · ') : 'logs bare'}`,
              );
            }}
            onRestoreDefault={() => {
              clearOverride(b.key);
              showToast('success', `${b.defaultName || b.currentName} — back to the default`);
            }}
            testID="split-lab-tag-editor"
          />
        ) : (
          <RxEditSheet
            open
            onOpenChange={(next) => {
              if (!next) setBench(null);
            }}
            exerciseName={b.currentName}
            sets={b.sets}
            reps={b.reps}
            defaultSets={b.defaultSets}
            defaultReps={b.defaultReps}
            isEdited={b.isEdited}
            onSave={(sets, reps) => {
              setOverride(b.key, { sets, reps });
              showToast('success', `${b.currentName} — now ${rxLabel(sets, reps)}`);
            }}
            onRestoreDefault={() => {
              clearOverride(b.key);
              showToast('success', `${b.defaultName} — back to the default`);
            }}
            testID="split-lab-rx-editor"
          />
        );
      })() : null}
      {addFor ? (() => {
        const resolved = resolveLiveSlots(
          boardIdentity,
          addFor.day,
          addFor.window,
          overrides,
          board.edition,
        );
        return (
          <AddExerciseSheet
            open
            onOpenChange={(next) => {
              if (!next) setAddFor(null);
            }}
            excludeSlugs={new Set(resolved.map((s) => s.exercise))}
            onPick={(slug, name) => {
              const pos = nextAddedPosition(
                boardIdentity,
                addFor.day,
                addFor.window,
                overrides,
                board.edition,
              );
              setOverride(
                liveSlotKey(boardIdentity, addFor.day, addFor.window, pos),
                { slug, name, removed: false, sets: undefined, reps: undefined },
              );
              showToast('success', `${name} added`);
            }}
            testID="split-lab-add-picker"
          />
        );
      })() : null}

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
  statementRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  liveWord: {
    ...theme.typography.mobileEyebrow,
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
    marginTop: 20,
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
  // The pencil's berth in the statement row (the head's tools sit
  // right, clear of the LIVE word).
  headTools: {
    marginLeft: 'auto',
  },
  // A removed slot's ghost — struck through, muted (edit mode only).
  slotGhost: {
    textDecorationLine: 'line-through',
  },
  // The rx figure as a button (edit mode) — the plain rx's metrics so
  // the row doesn't shift when the pencil turns.
  slotRxHold: {
    minWidth: 88,
    alignItems: 'flex-end',
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
