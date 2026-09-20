// components/composed/Floor.tsx
//
// THE FLOOR — the live session, the flagship (docs/architecture/
// interval-thesis.md §8). ONE scrollable document: the session
// board sits ABOVE the station as RULED ROWS under a hairline (name
// left · air · the done/target figure right — position is the
// order, the figure is the progress; status words and tiles are
// gone, and so is the board's title-row toggle: MAP is the board's
// ONE toggle), the station follows (name statement, TARGET whisper
// + THE COUNT figure, SWAP / REMOVE furniture), the ledger audits
// in ruled rows (ordinal left · air · weight × reps right), and THE
// LOGGER — THE ONE-FIELD INSTRUMENT — docks below it all under the
// screen's one 2px rule. THE LIVE FIGURE alternates by the current
// question: the rest clock while rest runs, the armed expression
// otherwise — exchanged by REPAINT (THE STILL SYSTEM holds: no
// pinned strip, no crossfade, the logger never scrolls away).
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
} from '../../navigation';
import { useLogWorkout, useFloorSession, useRestClock, useWeightUnit, type TopSetFact } from '../../hooks';
import { toDisplayWeight, fromDisplayWeight, roundDisplayWeight, weightUnitLabel, formatVolumeWeight, weightStep, hapticImpactLight } from '../../utils';
import { useWorkoutStore, useIsOnline, useDeloadStore } from '../../stores';
import { sessionSaveQueue } from '../../services';
import { TAG_VOCABULARY_SEED } from '../../shared/exercises';
import {
  theme,
  MOBILE_CONTENT_WIDTH_STYLE,
  BLOCK_GAP,
  INTERVAL,
  PRESS_DIP
} from '../../constants';
import { TheLogger, type RestLine } from './TheLogger';
import { RegisterLine } from './RegisterLine';
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
  // §7); the readout rides the logger's rest line. The rest remembers
  // per exercise: a ±15 tune during a station's rest becomes that
  // station's next default (restStore.perExercise).
  const restClock = useRestClock();

  // THE DELOAD WEEK — while set, the TARGET rests at the Rx low end
  // and the earned-load suggestion stays off (program stays TS-only;
  // this is UI-state).
  const deload = useDeloadStore((s) => s.active);

  // THE ANNOUNCEMENT LINE — the polite live region: screen readers
  // hear the log and the rest instrument's state changes (start,
  // settle) without a toast mid-set and without announcing every
  // countdown tick.
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const restPrevRef = useRef({ active: false, settled: false });
  useEffect(() => {
    const prev = restPrevRef.current;
    if (restClock.active && !prev.active) {
      setAnnouncement(`Rest ${restClock.readout}`);
    } else if (restClock.settled && !prev.settled) {
      setAnnouncement('Rest complete');
      // The settle pulse — the still system's one physical channel
      // (rest is over; the next set is yours).
      hapticImpactLight();
    }
    restPrevRef.current = { active: restClock.active, settled: restClock.settled };
  }, [restClock.active, restClock.settled, restClock.readout]);

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
  const isOnline = useIsOnline();

  // Reflect mutation state into the store so the UI shows saving state.
  useEffect(() => {
    setSaving(logMutation.isPending);
  }, [logMutation.isPending, setSaving]);

  // On successful save, toast + reset. The reset is the whole exit:
  // the dispatcher's redirect (replace → selector) is the flow's ONE
  // navigation — a back() fired here beside it raced the reset
  // re-render and the late pop ate the redirect (stranded spinner).
  useEffect(() => {
    if (logMutation.isSuccess) {
      showToast('success', 'Session saved');
      resetSession();
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
  // The opening phase ends for good after the hydration settle (or
  // the first MAP press / drag): the auto-jump must NEVER re-fire on
  // a later board-height change — a collapse would otherwise snap
  // the view back down to the station and fight the toggle.
  const openingSettledRef = useRef(false);
  const [mapHeight, setMapHeight] = useState(0);
  const [scrollerH, setScrollerH] = useState(0);
  useEffect(() => {
    if (mapHeight <= 0 || openingSettledRef.current) return;
    // Re-jump on every growth DURING THE OPENING: the board first
    // lays out before slot hydration fills its rows (and again when
    // the self-hosted faces settle), so the opening position follows
    // the FINAL height. A user who scrolled meanwhile owns the
    // position. After the settle timer completes once, the jump is
    // retired permanently.
    const jump = () => {
      if (!userScrolledRef.current) {
        scrollRef.current?.scrollTo({ y: mapHeightRef.current, animated: false });
      }
    };
    jump();
    const t = setTimeout(() => {
      jump();
      openingSettledRef.current = true;
    }, 650);
    return () => clearTimeout(t);
  }, [mapHeight]);

  // The scroller's position, for the MAP chip's toggle rule (at the
  // top the chip folds the board; anywhere else it reveals the board).
  const scrollYRef = useRef(0);
  const [atTop, setAtTop] = useState(true);
  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      scrollYRef.current = y;
      setAtTop((prev) => {
        const next = y < 40;
        return prev === next ? prev : next;
      });
    },
    [],
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

  // The Rx ceiling ("4×8–10" → 10) — the double-progression bar.
  const targetRepsHigh = useMemo(() => {
    const hint = targetRx?.split('×')[1]?.trim();
    if (!hint) return null;
    const parts = hint.split(/[\u2013\u2014-]/);
    const high = parts.length > 1 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    return Number.isFinite(high) && high > 0 ? high : null;
  }, [targetRx]);

  // THE DELOAD TARGET — the Rx low end while the deload week runs.
  const targetShown = useMemo(() => {
    if (!targetRx || !deload) return targetRx;
    const sets = targetRx.split('×')[0]?.trim();
    const hint = targetRx.split('×')[1]?.trim();
    const lowReps = hint ? parseInt(hint.split(/[\u2013\u2014-]/)[0], 10) : NaN;
    const minSets = sets ? parseInt(sets, 10) : NaN;
    if (Number.isFinite(lowReps) && Number.isFinite(minSets)) {
      return `${minSets}×${lowReps}`;
    }
    return targetRx;
  }, [targetRx, deload]);

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

  // PREDICTIVE ARMING — the field the recent sets were actually
  // changing: reps held while weight moved → arm weight (you're
  // loading); weight held while reps moved → arm reps (you're
  // rep-ing out). Two-set lookback; default weight.
  const suggestArm: 'weight' | 'reps' = useMemo(() => {
    const sets = exercise?.sets ?? [];
    if (sets.length < 2) return 'weight';
    const a = sets[sets.length - 2];
    const b = sets[sets.length - 1];
    if (a.reps === b.reps && a.weight !== b.weight) return 'weight';
    if (a.weight === b.weight && a.reps !== b.reps) return 'reps';
    return 'weight';
  }, [exercise]);

  // THE EARNED STEP (double progression, computed at read): last
  // time's TOP set for this exercise hit the rep-range ceiling at
  // the armed weight ⇒ the next increment is earned. Suppressed in a
  // deload week and when the bar hasn't been met.
  const earnedStep: number | null = useMemo(() => {
    if (deload) return null;
    if (!exercise || armed.weight == null || targetRepsHigh == null) return null;
    const fact = armedPrefill.get(exercise.exerciseName.toLowerCase());
    if (!fact) return null;
    const armedKg = fromDisplayWeight(armed.weight, unit);
    if (Math.abs(fact.weight - armedKg) > 0.01) return null;
    if (fact.reps < targetRepsHigh) return null;
    return weightStep(unit);
  }, [deload, exercise, armed.weight, armedPrefill, targetRepsHigh, unit]);

  const repsHint = targetRx?.split('×')[1]?.trim() ?? null;

  // The rest line rides the CURRENT station (per-exercise memory).
  const stationName = exercise?.exerciseName ?? null;
  const restLine: RestLine | null = restClock.active
    ? {
        readout: restClock.readout,
        settled: restClock.settled,
        onAdjust: (deltaSec: number) => restClock.adjustRest(deltaSec, stationName ?? undefined),
        onDismiss: restClock.dismissRest,
      }
    : null;

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
    // THE REST INSTRUMENT starts with the log (thesis §7), at this
    // station's remembered interval when one exists.
    hapticImpactLight();
    restClock.startRest(undefined, exercise.exerciseName);
    // The screen reader's record of the log (the live region below —
    // no toast mid-set, no visual change). The log announcement
    // carries the rest start: restPrevRef is pre-advanced so the
    // transition effect below doesn't overwrite this message with a
    // bare 'Rest …' in the same render.
    restPrevRef.current = { active: true, settled: false };
    setAnnouncement(`Set logged — ${armed.weight ?? 0} ${unit} × ${armed.reps} · rest started`);
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
    // Dead zone at FINISH: the completed session queues locally and
    // syncs on reconnect (D4). The draft resets here and only here —
    // the queue and the mutation are the two save paths and they are
    // mutually exclusive per session (the stable id dedups anyway).
    if (!isOnline) {
      sessionSaveQueue.enqueue(dto);
      setFinishOpen(false);
      showToast('success', 'Session saved — syncs when back online');
      // The reset alone exits — the dispatcher's redirect is the one
      // navigation (see the save-success effect above).
      resetSession();
      return;
    }
    logMutation.mutate(dto);
    setFinishOpen(false);
  };


  // The pips' ask: the program's set count when present, extended as
  // extra sets land; a free draw when the station has no Rx.
  const pipsTotal = targetSets > 0
    ? Math.max(targetSets, exercise ? exercise.sets.length + 1 : 1)
    : exercise
      ? Math.max(exercise.sets.length + 1, 1)
      : 1;

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      {/* The announcement line — visually quiet (1×1, transparent),
          politely live for screen readers. */}
      <Text
        accessibilityLiveRegion="polite"
        style={styles.announceLine}
        testID="floor-announcement"
      >
        {announcement ?? ''}
      </Text>
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
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: PRESS_DIP } : null]}
            testID="stage-minimize"
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          {/* THE MAP CHIP — the board's one toggle: folded or scrolled
              away, it reveals the board (expand + scroll to top); board
              showing at the top, it folds the board away. Touching MAP
              ends the opening phase — the auto-jump never fights the
              toggle. */}
          <Pressable
            onPress={() => {
              openingSettledRef.current = true;
              if (mapCollapsed || !atTop) {
                setMapCollapsed(false);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              } else {
                setMapCollapsed(true);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={
              mapCollapsed || !atTop ? 'Show session board' : 'Collapse session board'
            }
            style={({ pressed }) => [styles.iconButton, pressed ? { opacity: PRESS_DIP } : null]}
            testID="stage-map"
          >
            <Text style={[styles.headerWord, { color: colors.text }]}>
              MAP
            </Text>
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
              pressed ? { opacity: PRESS_DIP } : null,
            ]}
            testID="stage-finish"
          >
            <Text style={[styles.headerWord, { color: colors.text }]}>
              FINISH
            </Text>
          </Pressable>
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
          {/* THE SESSION BOARD — the whole day at a glance: hairline +
              ruled rows, nothing else (the title-row toggle is
              deleted — MAP is the board's one toggle; the day's name
              already states itself on the statement above). Pull up
              (or tap MAP) to read it; every row is a jump; INK IS
              STATE (the sight amendment): the current row is the only
              full-ink row, done rows carry their figure in muted. */}
          <View
            style={[styles.boardPanel, { borderTopColor: colors.mobilePremium.hairlineBorder }]}
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              mapHeightRef.current = h;
              setMapHeight(h);
            }}
            testID="floor-map"
          >
            {mapCollapsed ? null : exercises.map((ex, i) => {
              const isCurrent = i === index;
              const done = ex.sets.length;
              const slotTarget = parseInt(ex.targetRx?.split('×')[0] ?? '', 10);
              const target = Number.isFinite(slotTarget) && slotTarget > 0 ? slotTarget : 0;
              const figure = done > 0 ? (target > 0 ? `${done}/${target}` : `${done}`) : null;
              return (
                <RegisterLine
                  key={ex.localId}
                  label={ex.exerciseName}
                  figure={figure}
                  muted={!isCurrent}
                  bold={isCurrent}
                  onPress={() => {
                    openingSettledRef.current = true;
                    userScrolledRef.current = true;
                    setStationIndex(i);
                    scrollRef.current?.scrollTo({ y: mapHeightRef.current, animated: true });
                  }}
                  accessibilityLabel={`Station ${i + 1}, ${ex.exerciseName}, ${done} sets logged. Go to station`}
                  testID={`floor-map-row-${i}`}
                  figureTestID={`floor-map-figure-${i}`}
                />
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
                      {`TARGET ${targetShown}${deload ? ' · DELOAD' : ''}`}
                    </Text>
                  ) : null}
                  {/* THE COUNT — done sets over the program's ask, the
                      mono figure beside the target. */}
                  <Text
                    style={[styles.countFigure, { color: colors.text }]}
                    testID="stage-count"
                  >
                    {`${exercise.sets.length}/${pipsTotal}`}
                  </Text>
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
                    style={({ pressed }) => [styles.removeCta, pressed ? { opacity: PRESS_DIP } : null]}
                  >
                    <Text style={[styles.furnitureWord, { color: colors.textMuted }]}>
                      REMOVE
                    </Text>
                  </Pressable>
                </View>
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
                style={({ pressed }) => [styles.tagsToggle, pressed ? { opacity: PRESS_DIP } : null]}
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
                  testID={`tag-chips-${exercise.localId}`}
                />
              ) : null}

              {/* THE LEDGER — every logged set a ruled row: ordinal
                  left, `weight × reps` right, remove riding the far
                  edge. */}
              {exercise.sets.length > 0 ? (
                <View style={styles.ledger}>
                  {exercise.sets.map((s) => (
                    <View
                      key={s.localId}
                      style={styles.ledgerLine}
                      testID={`stage-set-row-${s.position}`}
                    >
                      <View style={styles.ledgerLineFlex}>
                        <RegisterLine
                          monoLabel
                          label={String(s.position)}
                          figure={`${roundDisplayWeight(toDisplayWeight(s.weight ?? 0, unit))} × ${s.reps ?? 0}`}
                          testID={`stage-set-figure-${s.position}`}
                        />
                      </View>
                      <Pressable
                        onPress={() => removeSetFromDraft(exercise.localId, s.localId)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove set ${s.position}`}
                        style={({ pressed }) => [
                          styles.ledgerRemove,
                          pressed ? { opacity: PRESS_DIP } : null,
                        ]}
                        testID={`stage-set-remove-${s.position}`}
                      >
                        <Text style={[styles.ledgerRemoveGlyph, { color: colors.textMuted }]}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {index < exercises.length - 1 ? (
                <NextStation
                  name={exercises[index + 1].exerciseName}
                  onPress={() => setStationIndex(index + 1)}
                  bright={restClock.settled}
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
                style={({ pressed }) => [styles.addExerciseCta, pressed ? { opacity: PRESS_DIP } : null]}
                testID="stage-add-exercise"
              >
                <Text style={[styles.addExerciseWord, { color: colors.textMuted }]}>
                  + ADD EXERCISE
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
                style={({ pressed }) => [styles.addExerciseCta, pressed ? { opacity: PRESS_DIP } : null]}
                testID="stage-add-exercise"
              >
                <Text style={[styles.addExerciseWord, { color: colors.textMuted }]}>
                  + ADD EXERCISE
                </Text>
              </Pressable>
            </View>
          )}
          </View>
        </ScrollView>

        {/* THE LOGGER — THE ONE-FIELD INSTRUMENT, docked under the
          screen's one 2px rule, never scrolling away. */}
        {exercise ? (
          <TheLogger
            setNumber={exercise.sets.length + 1}
            weight={armed.weight}
            reps={armed.reps}
            repsHint={repsHint}
            rest={restLine}
            suggestArm={suggestArm}
            earnedStep={earnedStep}
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
              ? `SAVE SESSION · ${sessionSets} SET${sessionSets === 1 ? '' : 'S'}`
              : 'LOG A SET FIRST'}
          </MobilePrimaryButton>
          <View style={{ height: 8 }} />
          {/* The destructive tail arms by ink, never by a second red:
              unarmed is the quiet ghost whisper; the tap-again step is
              the armed state and reads the full ink plate. */}
          <MobilePrimaryButton
            variant={confirmDiscard ? 'primary' : 'ghost'}
            onPress={() => {
              if (!confirmDiscard) {
                setConfirmDiscard(true);
                return;
              }
              setFinishOpen(false);
              // The reset alone exits — the dispatcher's redirect is
              // the one navigation.
              resetSession();
            }}
            testID="stage-discard"
          >
            {confirmDiscard ? 'TAP AGAIN TO DISCARD' : 'DISCARD SESSION'}
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
  announceLine: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
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
  stationScroll: { flex: 1 },
  stationContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  // THE SESSION BOARD — ruled register lines under a hairline: the
  // day at a glance, no panel.
  boardPanel: {
    borderTopWidth: 1,
    paddingVertical: 6,
  },
  stationHead: {
    gap: 4,
    marginBottom: 2,
    marginTop: BLOCK_GAP,
  },
  stationName: {
    ...INTERVAL.statement,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  stationRx: {
    ...theme.typography.mobileEyebrow,
  },
  // THE COUNT — the done/asked figure beside the target whisper.
  countFigure: {
    ...theme.typography.mobileFigure,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginLeft: 'auto',
    marginRight: 4,
  },
  furnitureWord: {
    ...theme.typography.mobileEyebrow,
  },
  removeCta: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  ledger: {
    marginTop: 6,
  },
  // One ledger line: the register + the remove affordance at the
  // right edge (a mis-log needs its undo).
  ledgerLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerLineFlex: {
    flex: 1,
  },
  ledgerRemove: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerRemoveGlyph: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
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
