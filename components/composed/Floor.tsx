// components/composed/Floor.tsx
//
// THE FLOOR — the live session, the flagship (docs/architecture/
// gauge-thesis.md §8). ONE scrollable document: the session board
// sits ABOVE the station (pull up to read the whole day — native
// scroll, zero JS), the station follows (name statement, TARGET
// whisper, SWAP / REMOVE furniture), the set pips count the ask off,
// the ledger audits in row-scale pin rails, and THE LOGGER — the
// app's one physical object, carrying the system's one shadow —
// docks below it all with the REST LINE counting recovery after
// every log. THE PINNED STRIP (F4) crossfades in under scroll
// carrying the station + pips + rest — the live instrument bar.
//
// Self-sufficient: reads the workout store directly (no prop drilling
// of store actions) and composes useFloorSession for the draft
// lifecycle, stats, and prefills. Draft set rows exist only once
// logged (the armed-set model); a logged set is a done set, weight
// null → 0 (bodyweight) at commit.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { Animated } from 'react-native';
import {
  MobilePrimaryButton,
  MobileInput,
  MobileDialog,
  Figure,
} from '../MobilePremium';
import { useToast, useAppTheme } from '../../context';
import {
  navigateToExerciseDatabase,
  replaceWithHome,
  safeGoBack,
} from '../../navigation';
import { useLogWorkout, useFloorSession, useRestClock, useWeightUnit, type TopSetFact } from '../../hooks';
import { toDisplayWeight, fromDisplayWeight, roundDisplayWeight, weightUnitLabel, formatVolumeWeight } from '../../utils';
import { useWorkoutStore } from '../../stores';
import { getDayTitle, TAG_VOCABULARY_SEED } from '../../shared/exercises';
import {
  theme,
  MOBILE_CONTENT_WIDTH_STYLE,
  BLOCK_GAP,
  GAUGE,
  railMaxFor,
} from '../../constants';
import { useCompressFade } from '../premium/shared';
import { TheLogger, type RestLine } from './TheLogger';
import { SetPips } from './SetPips';
import { FlipTile } from './FlipTile';
import { StageSetRow } from './StageSetRow';
import { TagChips } from './TagChips';
import { InkRail, SwapGlyph } from './InkRail';
import { NextStation } from './NextStation';

/** The armed set's editable values. */
interface Armed {
  weight: number | null;
  reps: number | null;
}

export function Floor() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();

  // THE WEIGHT UNIT — the display conversion (storage stays kg; the
  // armed values live in DISPLAY units and cross the store boundary
  // through fromDisplayWeight at log time).
  const unit = useWeightUnit();
  const toArmed = (kg: number | null) =>
    kg == null ? null : roundDisplayWeight(toDisplayWeight(kg, unit));

  // Session lifecycle + stats + prefills (the composite hook).
  const {
    draft,
    isSaving: storeSaving,
    sessionError,
    sessionSets,
    sessionKg,
    elapsed,
    topSets: armedPrefill,
  } = useFloorSession();

  // THE REST INSTRUMENT — recovery counts after every log (thesis
  // §7); the readout rides the logger's rest line + the pinned strip.
  const restClock = useRestClock();
  const restLine: RestLine | null = restClock.active
    ? {
        readout: restClock.readout,
        settled: restClock.settled,
        onAdjust: restClock.adjustRest,
        onDismiss: restClock.dismissRest,
      }
    : null;

  // Store actions — read directly, not drilled.
  const setSaving = useWorkoutStore((s) => s.setSaving);
  const setSessionError = useWorkoutStore((s) => s.setSessionError);
  const setDraftNotes = useWorkoutStore((s) => s.setDraftNotes);
  const resetSession = useWorkoutStore((s) => s.resetSession);
  const toLogSessionDTO = useWorkoutStore((s) => s.toLogSessionDTO);
  const addSetToDraft = useWorkoutStore((s) => s.addSetToDraft);
  const removeSetFromDraft = useWorkoutStore((s) => s.removeSetFromDraft);
  const removeExerciseFromDraft = useWorkoutStore(
    (s) => s.removeExerciseFromDraft,
  );
  const toggleDraftExerciseTag = useWorkoutStore(
    (s) => s.toggleDraftExerciseTag,
  );
  const swapDraftExercise = useWorkoutStore((s) => s.swapDraftExercise);

  const [stationIndex, setStationIndex] = useState(0);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [armedByExercise, setArmedByExercise] = useState<
    Record<string, Armed>
  >({});
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const logMutation = useLogWorkout();
  const isSaving = storeSaving || logMutation.isPending;

  // Reflect mutation state into the store so the UI shows saving state.
  useEffect(() => {
    setSaving(logMutation.isPending);
  }, [logMutation.isPending, setSaving]);

  // On successful save, toast + reset + go back.
  useEffect(() => {
    if (logMutation.isSuccess) {
      showToast('success', 'Session saved');
      resetSession();
      safeGoBack();
    }
  }, [logMutation.isSuccess, showToast, resetSession]);

  // Surface mutation errors via the store.
  useEffect(() => {
    if (logMutation.isError) {
      setSessionError(
        logMutation.error instanceof Error
          ? logMutation.error.message
          : 'Save failed',
      );
    }
  }, [logMutation.isError, logMutation.error, setSessionError]);

  // THE BOARD — one document, the board above the station. The
  // scroller opens AT the station (scrolled past the board); the MAP
  // chip and the board's rows are the two ways to move.
  const scrollRef = useRef<ScrollView>(null);
  const mapHeightRef = useRef(0);
  const userScrolledRef = useRef(false);
  const [mapHeight, setMapHeight] = useState(0);
  const [scrollerH, setScrollerH] = useState(0);
  useEffect(() => {
    if (mapHeight <= 0) return;
    // Re-jump on every growth: the board first lays out before slot
    // hydration fills its rows (and again when the self-hosted faces
    // settle), so the opening position follows the FINAL height. A
    // user who scrolled meanwhile owns the position.
    const jump = () => {
      if (!userScrolledRef.current) {
        scrollRef.current?.scrollTo({ y: mapHeightRef.current, animated: false });
      }
    };
    jump();
    const t = setTimeout(jump, 650);
    return () => clearTimeout(t);
  }, [mapHeight]);

  // F4 — THE PINNED STRIP: the live instrument bar (station + pips +
  // rest) crossfades in under scroll as the station head leaves.
  const { compress, handleScroll: fadeScroll, static: fadeStatic } =
    useCompressFade(true);
  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      fadeScroll(event);
    },
    [fadeScroll],
  );

  const exercises = draft?.exercises ?? [];
  const index = Math.min(stationIndex, Math.max(0, exercises.length - 1));
  const exercise = exercises[index] ?? null;
  const pickerExercise = draft?.exercises.find((e) => e.localId === pickerFor) ?? null;

  // The program's own ask for this station: the SET count and the LOW
  // end of the rep range ("4×8-10" -> 4 sets, 8 reps) — the pips
  // draw the ask; the default arms to its low end.
  const targetRx = exercise?.targetRx ?? null;
  const targetSets = useMemo(() => {
    const head = targetRx?.split('×')[0]?.trim();
    const n = head ? parseInt(head, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [targetRx]);
  const targetRepsLow = useMemo(() => {
    const hint = targetRx?.split('×')[1]?.trim();
    if (!hint) return null;
    const low = parseInt(hint.split(/[\u2013\u2014-]/)[0], 10);
    return Number.isFinite(low) && low > 0 ? low : null;
  }, [targetRx]);

  // THE DAY'S RAIL — one ceiling for every pin on the Floor (the
  // logger's instrument rail, the ledger rows). The ceiling is
  // auto-ranging and STICKY: it grows to cover the heaviest load the
  // day has seen or armed (rounded up to the next 25) and never
  // shrinks mid-session — the pin never parks past the top, and the
  // scale never re-zeros under a reading (the auto-range law, thesis
  // §4.3).
  const [dayRailMax, setDayRailMax] = useState(0);
  useEffect(() => {
    let m = 0;
    for (const ex of exercises) {
      for (const s of ex.sets) m = Math.max(m, toDisplayWeight(s.weight ?? 0, unit));
      const pre = armedPrefill.get(ex.exerciseName.toLowerCase());
      if (pre) m = Math.max(m, toDisplayWeight(pre.weight, unit));
    }
    for (const a of Object.values(armedByExercise)) m = Math.max(m, a.weight ?? 0);
    const next = railMaxFor(m);
    setDayRailMax((prev) => (next > prev ? next : prev));
  }, [exercises, armedPrefill, armedByExercise, unit]);

  // The armed set for the current station: whatever the user has set,
  // else carry-forward from this exercise's last logged set, else the
  // previous session's TOP set for this exercise name, else fresh
  // ground — reps default to the target range's low end (the
  // program's ask), weight stays an empty rail until the bar loads.
  const armed: Armed = useMemo(() => {
    const explicit = armedByExercise[exercise?.localId ?? ''];
    if (explicit) return explicit;
    const lastSet = exercise && exercise.sets.length > 0
      ? exercise.sets[exercise.sets.length - 1]
      : null;
    if (lastSet) return { weight: toArmed(lastSet.weight), reps: lastSet.reps };
    const lastTime: TopSetFact | undefined = exercise
      ? armedPrefill.get(exercise.exerciseName.toLowerCase())
      : undefined;
    if (lastTime) return { weight: toArmed(lastTime.weight), reps: lastTime.reps };
    return { weight: null, reps: targetRepsLow };
  }, [armedByExercise, exercise, armedPrefill, targetRepsLow, unit]);

  const setArmed = (next: Armed) => {
    if (!exercise) return;
    setArmedByExercise((prev) => ({ ...prev, [exercise.localId]: next }));
  };

  const repsHint = targetRx?.split('×')[1]?.trim() ?? null;

  const handleLog = () => {
    if (!exercise) return;
    if (armed.reps == null) {
      showToast('error', 'Set the reps first');
      return;
    }
    // A logged set is a done set: weight null → 0 (bodyweight), and
    // the DISPLAY units cross into storage kilograms HERE — the one
    // conversion boundary on the Floor. The armed values CARRY — the
    // next set defaults to what just worked.
    addSetToDraft(exercise.localId, {
      weight: fromDisplayWeight(armed.weight ?? 0, unit),
      reps: armed.reps,
    });
    setArmedByExercise((prev) => ({
      ...prev,
      [exercise.localId]: { weight: armed.weight ?? 0, reps: armed.reps },
    }));
    // THE REST INSTRUMENT starts with the log (thesis §7).
    restClock.startRest();
  };

  const handleSave = () => {
    const dto = toLogSessionDTO();
    if (!dto) {
      setFinishOpen(false);
      return;
    }
    const hasLoggedSets = dto.exercises.some((e) => e.sets.length > 0);
    if (!hasLoggedSets) {
      setFinishOpen(false);
      showToast('error', 'Log at least one set before saving.');
      return;
    }
    logMutation.mutate(dto);
    setFinishOpen(false);
  };

  const dayTitle = draft ? getDayTitle(draft.splitType, draft.day) : null;

  // The pips' ask: the program's set count when present, extended as
  // extra sets land; a free draw when the station has no Rx.
  const pipsTotal = targetSets > 0
    ? Math.max(targetSets, exercise ? exercise.sets.length + 1 : 1)
    : exercise
      ? Math.max(exercise.sets.length + 1, 1)
      : 1;

  // The board row's status word (THE FLIP TILE's vocabulary): NOW for
  // the current station, NEXT for the one following, DONE·n wherever
  // sets landed. Rows with nothing to say carry no tile.
  const statusFor = (i: number, sets: number): { word: string; tone: 'ink' | 'quiet' } | null => {
    if (i === index) return { word: 'NOW', tone: 'ink' };
    if (i === index + 1 && sets === 0) return { word: 'NEXT', tone: 'quiet' };
    if (sets > 0) return { word: `DONE·${sets}`, tone: 'quiet' };
    return null;
  };

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      {/* The Floor rides the mobile column like every Desk screen —
          the concrete bleeds full-viewport, the content does not. */}
      <View style={[styles.stageColumn, MOBILE_CONTENT_WIDTH_STYLE]}>
        {/* Floor header — minimize, the board, the clock, finish. One
            number running, three words to move by. */}
        <View style={styles.stageHeader} testID="stage-header">
          <Pressable
            onPress={replaceWithHome}
            accessibilityRole="button"
            accessibilityLabel="Minimize session"
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.6 } : null]}
            testID="stage-minimize"
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => {
              setMapCollapsed(false);
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            }}
            accessibilityRole="button"
            accessibilityLabel="Show session board"
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.6 } : null]}
            testID="stage-map"
          >
            <Text style={[styles.headerWord, { color: colors.text }]}>MAP ▲</Text>
          </Pressable>
          <View style={styles.stageHeaderCenter}>
            <Text style={[styles.stageClock, { color: colors.text }]} numberOfLines={1}>
              {elapsed}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setConfirmDiscard(false);
              setFinishOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Finish session"
            style={({ pressed }) => [
              styles.finishButton,
              pressed ? { opacity: 0.6 } : null,
            ]}
            testID="stage-finish"
          >
            <Text style={[styles.headerWord, { color: colors.text }]}>
              FINISH
            </Text>
          </Pressable>
        </View>

        {/* F4 — THE PINNED STRIP. The live instrument bar: the station
            + its pips + the rest readout. Crossfades in under scroll
            as the station head leaves (transform/opacity only);
            static under reduced motion. */}
        <View
          pointerEvents="none"
          style={[styles.pinnedStrip, { borderBottomColor: colors.border }]}
          testID="floor-pinned-strip"
        >
          <Animated.View
            style={[
              styles.pinnedRow,
              fadeStatic ? null : { opacity: compress },
            ]}
          >
            <Text style={[styles.pinnedName, { color: colors.text }]} numberOfLines={1}>
              {exercise ? exercise.exerciseName : dayTitle ?? 'Session'}
            </Text>
            {exercise ? (
              <SetPips
                done={exercise.sets.length}
                total={pipsTotal}
                live
                scale="row"
                testID="pinned-pips"
              />
            ) : null}
            {restClock.active ? (
              <Text
                style={[
                  styles.pinnedRest,
                  { color: restClock.settled ? colors.textMuted : colors.brandText },
                ]}
                testID="pinned-rest"
              >
                {restClock.readout}
              </Text>
            ) : null}
          </Animated.View>
        </View>

        {/* THE FLOOR — one document: the board above, the station
            below, the logger docked out of the scroller. */}
        <ScrollView
          ref={scrollRef}
          style={styles.stationScroll}
          contentContainerStyle={styles.stationContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            userScrolledRef.current = true;
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(e) => setScrollerH(Math.floor(e.nativeEvent.layout.height))}
          testID="floor-scroll"
        >
          {/* THE SESSION BOARD — the whole day at a glance, one enamel
              panel. Pull up (or tap MAP) to read it; every row is a
              jump; statuses flip as the day progresses. */}
          <View
            style={[
              styles.boardPanel,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              mapHeightRef.current = h;
              setMapHeight(h);
            }}
            testID="floor-map"
          >
            {/* The board's title row IS the collapse toggle: the day
                at a glance, or folded to one line when the station
                owns the screen. */}
            <Pressable
              onPress={() => setMapCollapsed((c) => !c)}
              accessibilityRole="button"
              accessibilityLabel={
                mapCollapsed
                  ? `Expand session board, ${exercises.length} stations`
                  : `Collapse session board, ${exercises.length} stations`
              }
              style={({ pressed }) => [styles.boardToggle, pressed ? { opacity: 0.6 } : null]}
              testID="floor-map-toggle"
            >
              <Text style={[styles.boardTitle, { color: colors.textMuted }]} numberOfLines={1}>
                {`${dayTitle ? `${dayTitle} · ` : ''}${exercises.length} STATIONS`}
              </Text>
              <Text style={[styles.boardChevron, { color: colors.textMuted }]}>
                {mapCollapsed ? '▾' : '▴'}
              </Text>
            </Pressable>
            {mapCollapsed ? null : exercises.map((ex, i) => {
              const isCurrent = i === index;
              const done = ex.sets.length;
              const status = statusFor(i, done);
              return (
                <Pressable
                  key={ex.localId}
                  onPress={() => {
                    setStationIndex(i);
                    scrollRef.current?.scrollTo({ y: mapHeightRef.current, animated: true });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Station ${i + 1}, ${ex.exerciseName}, ${done} sets logged. Go to station`}
                  style={({ pressed }) => [
                    styles.boardRow,
                    pressed ? { opacity: 0.6 } : null,
                  ]}
                  testID={`floor-map-row-${i}`}
                >
                  {status ? (
                    <FlipTile
                      word={status.word}
                      tone={status.tone}
                      testID={`floor-map-status-${i}`}
                    />
                  ) : (
                    <View style={styles.boardTileSpacer} />
                  )}
                  <Text
                    style={[
                      styles.boardName,
                      { color: isCurrent ? colors.text : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {ex.exerciseName}
                  </Text>
                  <SetPips
                    done={done}
                    total={Math.max(done, 1)}
                    scale="row"
                    testID={`floor-map-pips-${i}`}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* THE STATION — its wrapper floors at the scroller's height
              so the board can ALWAYS clear above the fold, even before
              the ledger grows. */}
          <View style={{ minHeight: scrollerH }}>
          {exercise ? (
            <>
              <View style={styles.stationHead}>
                <Text
                  style={[styles.stationName, { color: colors.text }]}
                  numberOfLines={2}
                  testID="stage-station-name"
                >
                  {exercise.exerciseName}
                </Text>
                <View style={styles.stationMeta}>
                  {targetRx ? (
                    <Text style={[styles.stationRx, { color: colors.textMuted }]}>
                      {`TARGET ${targetRx}`}
                    </Text>
                  ) : null}
                  <SwapGlyph
                    onPress={() => setPickerFor(exercise.localId)}
                    label={exercise.exerciseName}
                  />
                  <Pressable
                    onPress={() => {
                      removeExerciseFromDraft(exercise.localId);
                      setStationIndex((i) => Math.max(0, i - 1));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${exercise.exerciseName} from session`}
                    style={({ pressed }) => [styles.removeCta, pressed ? { opacity: 0.6 } : null]}
                  >
                    <Text style={[styles.furnitureWord, { color: colors.textMuted }]}>
                      REMOVE
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* THE SET PIPS — the ask counted off in groups of five;
                  the live pip breathes signal. */}
              <View style={styles.pipsRow} testID="stage-tally">
                <SetPips
                  done={exercise.sets.length}
                  total={pipsTotal}
                  live
                  scale="counter"
                  testID="stage-tally-gates"
                />
              </View>

              {/* Tags — one whisper line; the editor opens one tap
                  deeper (tags prefill from last time; mid-set editing
                  is the exception, not the default). */}
              <Pressable
                onPress={() => setTagsOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityLabel={
                  exercise.tags.length > 0
                    ? `Edit tags — ${exercise.tags.join(', ')}`
                    : 'Add tags'
                }
                style={({ pressed }) => [styles.tagsToggle, pressed ? { opacity: 0.6 } : null]}
              >
                <Text style={[styles.tagsToggleText, { color: colors.textMuted }]} numberOfLines={1}>
                  {exercise.tags.length > 0 ? exercise.tags.join(' · ') : '+ TAGS'}
                </Text>
              </Pressable>
              {tagsOpen ? (
                <TagChips
                  tags={exercise.tags}
                  suggestions={TAG_VOCABULARY_SEED.filter(
                    (t) => !exercise.tags.includes(t),
                  ).slice(0, 3)}
                  onToggleTag={(tag) => toggleDraftExerciseTag(exercise.localId, tag)}
                  onAddTag={(tag) => toggleDraftExerciseTag(exercise.localId, tag)}
                  register="desk"
                  testID={`tag-chips-${exercise.localId}`}
                />
              ) : null}

              {/* THE LEDGER — every row a logged set, drawn as pin
                  rails on the day's one scale. */}
              {exercise.sets.length > 0 ? (
                <View style={styles.ledger}>
                  {exercise.sets.map((s) => (
                    <StageSetRow
                      key={s.localId}
                      position={s.position}
                      weight={roundDisplayWeight(toDisplayWeight(s.weight ?? 0, unit))}
                      reps={s.reps ?? 0}
                      unit={unit}
                      railMax={dayRailMax || undefined}
                      onRemove={() => removeSetFromDraft(exercise.localId, s.localId)}
                      testID={`stage-set-row-${s.position}`}
                    />
                  ))}
                </View>
              ) : (
                <Text style={[styles.ledgerEmpty, { color: colors.textMuted }]}>
                  No sets logged yet — the logger below arms your first.
                </Text>
              )}

              {index < exercises.length - 1 ? (
                <NextStation
                  name={exercises[index + 1].exerciseName}
                  onPress={() => setStationIndex(index + 1)}
                  testID="stage-next-station"
                />
              ) : null}

              {/* The adder — a FOOTNOTE, deliberately quiet: the way
                  forward is the NEXT panel above; adding mid-session
                  is the exception, not the path. Isolated by air so a
                  mid-set thumb cannot land on it by accident. */}
              <Pressable
                onPress={navigateToExerciseDatabase}
                accessibilityRole="button"
                accessibilityLabel="Add exercise from library"
                style={({ pressed }) => [styles.addExerciseCta, pressed ? { opacity: 0.6 } : null]}
                testID="stage-add-exercise"
              >
                <Text style={[styles.addExerciseWord, { color: colors.textMuted }]}>
                  + add exercise
                </Text>
              </Pressable>

              {sessionError ? (
                <Text style={[styles.errorText, { color: colors.alert }]}>
                  {sessionError}
                </Text>
              ) : null}
            </>
          ) : (
            <View>
              <Text style={[styles.ledgerEmpty, { color: colors.textMuted }]}>
                No exercises in this session.
              </Text>
              <Pressable
                onPress={navigateToExerciseDatabase}
                accessibilityRole="button"
                accessibilityLabel="Add exercise from library"
                style={({ pressed }) => [styles.addExerciseCta, pressed ? { opacity: 0.6 } : null]}
                testID="stage-add-exercise"
              >
                <Text style={[styles.addExerciseWord, { color: colors.textMuted }]}>
                  + add exercise
                </Text>
              </Pressable>
            </View>
          )}
          </View>
        </ScrollView>

        {/* THE LOGGER — docked, never scrolls away, the app's one
          physical object. The pin rail + rolling counters + the rest
          line + the one verb. */}
        {exercise ? (
          <TheLogger
            setNumber={exercise.sets.length + 1}
            weight={armed.weight}
            reps={armed.reps}
            repsHint={repsHint}
            railMax={dayRailMax || undefined}
            rest={restLine}
            unit={unit}
            onLog={handleLog}
            onChangeWeight={(weight) => setArmed({ ...armed, weight })}
            onChangeReps={(reps) => setArmed({ ...armed, reps })}
            testID="armed-set"
          />
        ) : null}

        {/* Finish — the summary sheet. */}
        <MobileDialog
          visible={finishOpen}
          onOpenChange={(open) => {
            if (!open) setFinishOpen(false);
          }}
          title="Finish session"
          testID="stage-finish-dialog"
        >
          <View style={styles.finishStats}>
            <Figure value={elapsed} label="elapsed" tone="ink" size="sm" style={styles.finishStat} />
            <Figure value={sessionSets} label={sessionSets === 1 ? 'set' : 'sets'} tone="ink" size="sm" style={styles.finishStat} />
            <Figure
              value={formatVolumeWeight(sessionKg, unit)}
              unit={weightUnitLabel(unit)}
              label="moved"
              tone="ink"
              size="sm"
              align="right"
              style={styles.finishStat}
            />
          </View>
          <MobileInput
            label="Notes"
            value={draft?.notes ?? ''}
            onChangeText={setDraftNotes}
            placeholder="How did it feel?"
          />
          <View style={{ height: 16 }} />
          <MobilePrimaryButton
            onPress={handleSave}
            loading={isSaving}
            disabled={sessionSets === 0}
            testID="stage-save"
          >
            {sessionSets > 0
              ? `Save session · ${sessionSets} set${sessionSets === 1 ? '' : 's'}`
              : 'Log a set first'}
          </MobilePrimaryButton>
          <View style={{ height: 8 }} />
          <MobilePrimaryButton
            variant="ghost"
            accentColor={colors.alert}
            onPress={() => {
              if (!confirmDiscard) {
                setConfirmDiscard(true);
                return;
              }
              setFinishOpen(false);
              resetSession();
              safeGoBack();
            }}
            testID="stage-discard"
          >
            {confirmDiscard ? 'Tap again to discard' : 'Discard session'}
          </MobilePrimaryButton>
        </MobileDialog>

        {/* Mid-workout swap — the swap bench over the floor. Catalog
            exercises rank alternatives; custom-named lifts (no slug) have
            nothing to rank and swap from the library instead. */}
        {pickerExercise && pickerExercise.exerciseSlug ? (
          <InkRail
            currentSlug={pickerExercise.exerciseSlug}
            open={pickerFor !== null}
            onOpenChange={(next) => {
              if (!next) setPickerFor(null);
            }}
            onSwap={(next) => {
              const target = pickerFor;
              if (!target) return;
              swapDraftExercise(target, next);
              setPickerFor(null);
              showToast('success', next.exerciseName);
            }}
            testID="live-swap-picker"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stageColumn: {
    flex: 1,
  },
  shell: { flex: 1 },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 8,
    gap: 4,
  },
  stageHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The clock — the Floor's only running figure in the chrome. It
  // NEVER animates (time-driven figures render static — thesis §6).
  stageClock: {
    ...theme.typography.mobileFigure,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWord: {
    ...theme.typography.mobileEyebrow,
  },
  finishButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  // F4 — THE PINNED STRIP: fixed 40px; its content fades in as the
  // station head leaves (never a layout change; the bar is always in
  // the tree so the pin never jumps).
  pinnedStrip: {
    height: 40,
    justifyContent: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinnedName: {
    ...theme.typography.mobileItemTitle,
    flex: 1,
  },
  pinnedRest: {
    ...theme.typography.mobileFigure,
    fontVariant: ['tabular-nums'],
  },
  stationScroll: { flex: 1 },
  stationContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  // THE SESSION BOARD — one enamel panel (hairline edge, machined
  // corner): the day at a glance.
  boardPanel: {
    borderWidth: 1,
    borderRadius: theme.shapes.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  boardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 44,
    marginBottom: 4,
  },
  boardChevron: {
    ...theme.typography.mobileEyebrow,
    fontSize: 12,
  },
  boardTitle: {
    ...theme.typography.mobileEyebrow,
    flex: 1,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  boardTileSpacer: {
    width: 8,
  },
  boardName: {
    ...GAUGE.row,
    fontWeight: '600',
    flex: 1,
  },
  stationHead: {
    gap: 4,
    marginBottom: 2,
    marginTop: BLOCK_GAP,
  },
  stationName: {
    ...GAUGE.statement,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  stationRx: {
    ...theme.typography.mobileEyebrow,
    flex: 1,
  },
  furnitureWord: {
    ...theme.typography.mobileEyebrow,
  },
  removeCta: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pipsRow: {
    minHeight: 32,
    justifyContent: 'center',
  },
  ledger: {
    marginTop: 6,
  },
  tagsToggle: {
    minHeight: 44,
    justifyContent: 'center',
  },
  tagsToggleText: {
    ...theme.typography.mobileLedger,
  },
  ledgerEmpty: {
    ...theme.typography.mobileMeta,
    marginTop: 12,
    marginBottom: 12,
  },
  addExerciseCta: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  // The footnote adder — whisper scale, sentence case: content-quiet,
  // never competing with the NEXT panel.
  addExerciseWord: {
    ...theme.typography.mobileLedger,
  },
  errorText: { ...theme.typography.mobileMeta, marginTop: 12 },
  finishStats: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  finishStat: { flex: 1 },
});

export default Floor;
