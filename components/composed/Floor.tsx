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

import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
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
  navigateToWorkoutDetail,
  replaceWithHome,
} from '../../navigation';
import { useLogWorkout, useFloorSession, useRestClock, useWeightUnit, type TopSetFact } from '../../hooks';
import { toDisplayWeight, fromDisplayWeight, roundDisplayWeight, weightUnitLabel, formatVolumeWeight, weightStep, hapticImpactLight, hapticImpactMedium, hapticNotificationSuccess, joinFacts } from '../../utils';
import { useWorkoutStore, useIsOnline, useDeloadStore, useSplitPreferenceStore, useProgramOverrideStore } from '../../stores';
import { sessionSaveQueue, resolveSlots } from '../../services';
import { SYSTEM_EXERCISES_BY_SLUG, TAG_VOCABULARY_SEED,
  plateUrl,
  tagAxisOf,
} from '../../shared/exercises';
import { plateOffsetFor } from '../../shared/exercises/plateOffsets';
import {
  theme,
  MOBILE_CONTENT_WIDTH_STYLE,
  BLOCK_GAP,
  INTERVAL,
  PRESS_DIP,
  paperToothStyle
} from '../../constants';
import { TheLogger, type RestLine } from './TheLogger';
import { TheCardioDock } from './TheCardioDock';
import {
  CARDIO_STATIONS,
  formatCardioDuration,
  formatCardioDistance,
  type CardioStationKey,
} from '../../shared/exercises/cardio';
import { RegisterLine } from './RegisterLine';
import { TagChips } from './TagChips';
import { InkRail, SwapGlyph } from './InkRail';
import { NextStation } from './NextStation';

/** The armed set's editable values. */
interface Armed {
  weight: number | null;
  reps: number | null;
}

const PLATE_LOOP_KEYFRAMES = `@keyframes plateB {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0; }
}`;
const plateLoopCss = {
  animation: 'plateB 3s ease-in-out infinite',
} as unknown as import('react-native').ViewStyle;

let plateKeyframesInjected = false;
function injectPlateKeyframes() {
  if (typeof document === 'undefined' || plateKeyframesInjected) return;
  plateKeyframesInjected = true;
  if (document.getElementById('plate-loop-css')) return;
  const style = document.createElement('style');
  style.id = 'plate-loop-css';
  style.textContent = PLATE_LOOP_KEYFRAMES;
  document.head.appendChild(style);
}

export function Floor() {
  const { colors, colorScheme } = useAppTheme();
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
      // The settle pulse — the one MEDIUM impact in the grammar (the
      // atelier pass): rest is over, the next set is yours — grace you
      // feel with the screen off.
      hapticImpactMedium();
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
  const appendDraftSlots = useWorkoutStore((s) => s.appendDraftSlots);
  const draftSession = useWorkoutStore((s) => s.draft);
  const programEdition = useSplitPreferenceStore((s) => s.edition);
  const programOverrides = useProgramOverrideStore((s) => s.overrides);
  // THE OTHER WINDOW — the Floor's one big session: on a two-a-day,
  // the window you did NOT start is one quiet link away (an 8pm AM
  // offers PM — rotation, not clock). Hidden once its stations ride
  // the draft.
  const otherWindow =
    draftSession?.splitType === 'twoADay' &&
    draftSession.day != null &&
    !draftSession.adHoc
      ? draftSession.sessionMode === 'am'
        ? ('pm' as const)
        : ('am' as const)
      : null;
  const otherSlots =
    otherWindow && draftSession?.day != null
      ? resolveSlots('twoADay', draftSession.day, otherWindow, programOverrides, programEdition)
      : [];
  const toggleDraftExerciseTag = useWorkoutStore(
    (s) => s.toggleDraftExerciseTag,
  );
  const swapDraftExercise = useWorkoutStore((s) => s.swapDraftExercise);
  // CARDIO (pass C2): the machines' stations + their dock actions.
  const cardioDrafts = useWorkoutStore((s) => s.draft?.cardio) ?? [];
  const updateCardioArmed = useWorkoutStore((s) => s.updateCardioArmed);
  const commitCardioRow = useWorkoutStore((s) => s.commitCardioRow);
  const removeCardioRow = useWorkoutStore((s) => s.removeCardioRow);
  const removeCardioStation = useWorkoutStore((s) => s.removeCardioStation);

  // ONE dock slot, two instruments: the logger (iron) or the cardio
  // dock — the focus follows the last board tap, so ONE counter answers
  // ONE question at a time (the thesis's law, spent on instrument
  // choice). A cardio-only session opens focused on the machines.
  const [instrument, setInstrument] = useState<'iron' | 'cardio'>(() => {
    const d = useWorkoutStore.getState().draft;
    return d && d.exercises.length === 0 && d.cardio.length > 0 ? 'cardio' : 'iron';
  });
  const [activeCardioId, setActiveCardioId] = useState<string | null>(null);
  // The active machine defaults to the newest station (the adder's way
  // in lands focused on what it just added).
  const activeCardio =
    cardioDrafts.find((c) => c.localId === activeCardioId) ??
    cardioDrafts[cardioDrafts.length - 1] ??
    null;
  const cardioRowsTotal = cardioDrafts.reduce((n, c) => n + c.rows.length, 0);
  const cardioSecTotal = cardioDrafts.reduce(
    (n, c) => n + c.rows.reduce((m, r) => m + r.durationSec, 0),
    0,
  );

  const [stationIndex, setStationIndex] = useState(0);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  // THE FORM CHECK — the station's plate + cues; the reset lives in an
  // effect below (after `exercise` exists), closing all three when the
  // station changes.
  const [formOpen, setFormOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const [plateFrame, setPlateFrame] = useState(0);
  // THE PLATE LOOP — the pair auto-animates: frame A holds ~1s,
  // crossfades to B, B holds ~1s, fades back. The movement reads as
  // a continuous range without any tap. Still-system compliant: the
  // fade is the opacity dip, nothing else moves.
  const plateBOpacity = useRef(new Animated.Value(0)).current;
  const plateLoop = useRef<Animated.CompositeAnimation | null>(null);
  const startPlateLoop = useCallback(() => {
    plateLoop.current?.stop();
    plateBOpacity.setValue(0);
    plateLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(plateBOpacity, {
          toValue: 1,
          duration: 600,
          delay: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(plateBOpacity, {
          toValue: 0,
          duration: 600,
          delay: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    plateLoop.current.start();
  }, [plateBOpacity]);
  const stopPlateLoop = useCallback(() => {
    plateLoop.current?.stop();
    plateBOpacity.setValue(0);
  }, [plateBOpacity]);
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

  // THE FINISH MOMENT (the atelier pass): the save's celebration is
  // the RECEIPT — the day's tonnage as a printed artifact under the
  // lifted curtain — plus the one success haptic you feel with the
  // screen off. The receipt is id-keyed, so the session resets one
  // beat BEHIND the navigation (the redirect is !id-guarded; there is
  // no window to race — the stranded-spinner lesson, honored).
  useEffect(() => {
    if (logMutation.isSuccess) {
      const savedId = logMutation.data?.id;
      showToast('success', 'Session saved');
      if (savedId) {
        hapticNotificationSuccess();
        navigateToWorkoutDetail(savedId);
        setTimeout(() => resetSession(), 50);
      } else {
        resetSession();
      }
    }
  }, [logMutation.isSuccess, logMutation.data, showToast, resetSession]);

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
  // The other window's stations are missing until one of them rides
  // the draft (the ADD link's visibility rule).
  const otherMissing =
    otherSlots.length > 0 &&
    !exercises.some((e) => otherSlots.some((slot) => slot.exercise === e.exerciseSlug));
  const index = Math.min(stationIndex, Math.max(0, exercises.length - 1));
  const exercise = exercises[index] ?? null;
  const plateOffset = plateOffsetFor(exercise?.exerciseSlug ?? '');
  const pickerExercise = draft?.exercises.find((e) => e.localId === pickerFor) ?? null;

  // THE FORM CHECK RESET — close the plate/cues when the station
  // changes (a mid-set reference never lingers into the next station).
  const formStationKey = exercise?.localId ?? null;
  const formStationRef = useRef<string | null>(formStationKey);
  if (formStationRef.current !== formStationKey) {
    formStationRef.current = formStationKey;
    setFormOpen(false);;
    setReadingOpen(false);
    setPlateFrame(0);
  }

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
    const hasLoggedSets =
      dto.exercises.some((e) => e.sets.length > 0) || (dto.cardio?.length ?? 0) > 0;
    if (!hasLoggedSets) {
      setFinishOpen(false);
      showToast('error', 'Log a set or a cardio sitting first.');
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
      {/* THE PAPER'S TOOTH — the Floor's stage ground wears the same
          stock as every Desk page (the atelier pass). */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, paperToothStyle(colorScheme)]}
      />
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
              {/* The chip's word is its action (the atelier pass): MAP
                  offers the board; HIDE folds it away. */}
              {mapCollapsed || !atTop ? 'MAP' : 'HIDE'}
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
                    setInstrument('iron');
                    scrollRef.current?.scrollTo({ y: mapHeightRef.current, animated: true });
                  }}
                  accessibilityLabel={`Station ${i + 1}, ${ex.exerciseName}, ${done} sets logged. Go to station`}
                  testID={`floor-map-row-${i}`}
                  figureTestID={`floor-map-figure-${i}`}
                />
              );
            })}
            {/* THE OTHER WINDOW'S TAIL — one big session: the quiet
                link that appends the PM (or AM) block to THIS session.
                Disappears once its stations ride the board. */}
            {mapCollapsed || !(otherMissing && otherWindow) ? null : (
              <NextStation
                label={`${otherWindow.toUpperCase()} BLOCK`}
                name={`Add ${otherWindow.toUpperCase()} exercises`}
                onPress={() => appendDraftSlots(otherSlots)}
                accessibilityLabel={`Add the ${otherWindow.toUpperCase()} exercises to this session`}
                testID={`floor-add-${otherWindow}`}
              />
            )}
            {mapCollapsed ? null : cardioDrafts.map((c, i) => {
              const isActive = instrument === 'cardio' && activeCardio?.localId === c.localId;
              const total = c.rows.reduce((n, r) => n + r.durationSec, 0);
              return (
                <RegisterLine
                  key={c.localId}
                  label={CARDIO_STATIONS[c.station].name}
                  figure={c.rows.length > 0 ? formatCardioDuration(total) : null}
                  muted={!isActive}
                  bold={isActive}
                  onPress={() => {
                    openingSettledRef.current = true;
                    userScrolledRef.current = true;
                    setActiveCardioId(c.localId);
                    setInstrument('cardio');
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }}
                  accessibilityLabel={`Cardio, ${CARDIO_STATIONS[c.station].name}, ${c.rows.length} sittings. Focus the machine`}
                  testID={`floor-map-cardio-${i}`}
                  figureTestID={`floor-map-cardio-figure-${i}`}
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
                  {exercise.tags.length > 0 ? joinFacts(exercise.tags) : '+ TAGS'}
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

              {/* THE FORM CHECK — the mid-workout reference: the
                  station's plate (monochrome, collapsed strip, tap to
                  open the full engraving) + its cues truncated at
                  three lines with READ MORE. One furniture word opens
                  the whole thing; it closes when the station changes
                  (mid-set, the answer is one tap, never a scroll). */}
              {(() => {
                const entry = exercise.exerciseSlug
                  ? SYSTEM_EXERCISES_BY_SLUG[exercise.exerciseSlug]
                  : undefined;
                if (!entry?.image && !entry?.instructions) return null;
                return (
                  <View testID={`form-check-${exercise.localId}`}>
                    <Pressable
                      onPress={() => setFormOpen((o) => !o)}
                      accessibilityRole="button"
                      accessibilityLabel={formOpen ? 'Hide form check' : 'Show form check — plate and cues'}
                      style={({ pressed }) => [styles.formToggle, pressed ? { opacity: PRESS_DIP } : null]}
                      testID="form-check-toggle"
                    >
                      <Text style={[styles.formToggleWord, { color: colors.textMuted }]}>
                        {formOpen ? 'HIDE HOW-TO' : 'HOW-TO'}
                      </Text>
                    </Pressable>
                    {formOpen ? (
                      <View style={styles.formPanel}>
                        {/* The plate — fully open inside the HOW-TO, no
                            second toggle (the owner's call: opening the
                            how-to IS asking for the picture). One tap
                            in, one tap out. */}
                        {entry.image ? (
                          <Pressable
                            onPress={undefined}
                            accessibilityRole="imagebutton"
                            accessibilityLabel={
                              entry.imageB
                                ? `Plate: ${exercise.exerciseName} — ${plateFrame === 0 ? 'concentric' : 'eccentric'} frame; tap to flip`
                                : `Plate: ${exercise.exerciseName}`
                            }
                            style={({ pressed }) => [
                              styles.formPlate,
                              {
                                borderTopColor: colors.mobilePremium.hairlineBorder,
                                borderBottomColor: colors.mobilePremium.hairlineBorder,
                              },
                              pressed ? { opacity: PRESS_DIP } : null,
                            ]}
                            testID="form-plate"
                          >
                            <View style={styles.formPlateStack}>
                              <Image
                                source={{ uri: plateUrl(entry.image) }}
                                style={[
                                  StyleSheet.absoluteFillObject,
                                  styles.formPlateFilter,
                                ] as unknown as ImageStyle[]}
                                accessibilityElementsHidden
                                testID="form-plate-image-a"
                                resizeMode="cover"
                              />
                              {entry.imageB ? (
                                <View
                                  style={[
                                    StyleSheet.absoluteFillObject,
                                    plateLoopCss,
                                    {
                                      transform: plateOffset
                                        ? ([{ translateX: -plateOffset.dx, translateY: -plateOffset.dy }] as unknown as import('react-native').ViewStyle['transform'])
                                        : undefined,
                                    },
                                  ]}
                                >
                                  <Image
                                    source={{ uri: plateUrl(entry.imageB) }}
                                    style={[StyleSheet.absoluteFillObject, styles.formPlateFilter] as unknown as ImageStyle[]}
                                    accessibilityElementsHidden
                                    testID="form-plate-image-b"
                                    resizeMode="cover"
                                  />
                                </View>
                              ) : null}
                            </View>
                            {entry.imageB ? (
                              <Text style={[styles.formPlateWord, { color: colors.textMuted }]}>
                                '1 · 2'
                              </Text>
                            ) : null}
                          </Pressable>
                        ) : null}
                        {entry.instructions ? (
                          <View>
                            <Text
                              style={[styles.formCues, { color: colors.text }]}
                              numberOfLines={readingOpen ? undefined : 3}
                            >
                              {entry.instructions}
                            </Text>
                            {entry.instructions.length > 140 ? (
                              <Pressable
                                onPress={() => setReadingOpen((o) => !o)}
                                accessibilityRole="button"
                                accessibilityLabel={readingOpen ? 'Show less' : 'Read more'}
                                style={({ pressed }) => [
                                  styles.readMoreHold,
                                  pressed ? { opacity: PRESS_DIP } : null,
                                ]}
                                testID="form-read-more"
                              >
                                <Text style={[styles.readMoreWord, { color: colors.brandText }]}>
                                  {readingOpen ? 'READ LESS' : 'READ MORE'}
                                </Text>
                              </Pressable>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })()}

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

              {/* THE CARDIO SECTION — the machines' stations: name + the
                  total-time figure, every committed sitting a ruled row
                  (duration · the prescription → the outcomes), remove
                  per row, remove per station. The DOCK rides the bottom
                  plate when a machine is focused. */}
              {cardioDrafts.map((c) => {
                const spec = CARDIO_STATIONS[c.station];
                const total = c.rows.reduce((n, r) => n + r.durationSec, 0);
                return (
                  <View key={c.localId} style={styles.cardioStation} testID={`cardio-station-${c.station}`}>
                    <View style={styles.cardioHead}>
                      <Text style={[styles.cardioName, { color: colors.text }]} numberOfLines={1}>
                        {spec.name}
                      </Text>
                      <Text style={[styles.cardioTotal, { color: colors.textMuted }]}>
                        {c.rows.length > 0 ? formatCardioDuration(total) : 'READY'}
                      </Text>
                      <Pressable
                        onPress={() => removeCardioStation(c.localId)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${spec.name} from session`}
                        style={({ pressed }) => [styles.removeCta, pressed ? { opacity: PRESS_DIP } : null]}
                      >
                        <Text style={[styles.furnitureWord, { color: colors.textMuted }]}>
                          REMOVE
                        </Text>
                      </Pressable>
                    </View>
                    {c.rows.map((r, ri) => (
                      <View key={r.localId} style={styles.ledgerLine}>
                        <View style={styles.ledgerLineFlex}>
                          <RegisterLine
                            monoLabel
                            label={`${String(ri + 1).padStart(2, '0')} · ${formatCardioDuration(r.durationSec)}`}
                            figure={
                              r.distanceM != null || r.kcal != null
                                ? joinFacts([
                                    r.distanceM != null ? formatCardioDistance(r.distanceM) : null,
                                    r.kcal != null ? `${r.kcal} kcal` : null,
                                  ])
                                : null
                            }
                            muted
                            testID={`cardio-row-${c.station}-${ri}`}
                          />
                        </View>
                        <Pressable
                          onPress={() => removeCardioRow(c.localId, r.localId)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove cardio sitting ${ri + 1}`}
                          style={({ pressed }) => [
                            styles.ledgerRemove,
                            pressed ? { opacity: PRESS_DIP } : null,
                          ]}
                          testID={`cardio-row-remove-${c.station}-${ri}`}
                        >
                          <Text style={[styles.ledgerRemoveGlyph, { color: colors.textMuted }]}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                );
              })}

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
          ) : cardioDrafts.length === 0 ? (
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
          ) : null}
          </View>
        </ScrollView>

        {/* THE DOCK ZONE — ONE instrument under the screen's one 2px
            rule, never scrolling away: the logger (iron) or the cardio
            dock (the machines). The focus follows the last board tap —
            one counter, one question at a time. */}
        {instrument === 'cardio' && activeCardio ? (
          <TheCardioDock
            station={activeCardio.station}
            armed={activeCardio.armed}
            rowCount={activeCardio.rows.length}
            onArmedChange={(patch) => updateCardioArmed(activeCardio.localId, patch)}
            onLog={() => {
              if (activeCardio.armed.durationSec == null) {
                showToast('error', 'Set the time first');
                return;
              }
              commitCardioRow(activeCardio.localId);
              hapticImpactLight();
            }}
            testID="cardio-dock"
          />
        ) : exercise ? (
          <TheLogger
            setNumber={exercise.sets.length + 1}
            weight={armed.weight}
            reps={armed.reps}
            repsHint={repsHint}
            grade={tagAxisOf('good')?.members.find((t) => exercise.tags.includes(t)) ?? null}
            onGrade={(tag) => toggleDraftExerciseTag(exercise.localId, tag)}
            rest={restLine}
            suggestArm={suggestArm}
            earnedStep={earnedStep}
            unit={unit}
            programmedReps={
              targetRepsLow != null && targetRepsHigh != null
                ? [targetRepsLow, targetRepsHigh]
                : null
            }
            programmedSets={targetSets}
            onLogAverage={(reps, sets) => {
              if (!exercise) return;
              // The average log: N identical rows at the armed weight
              // × the selected average (the notebook line, one tap).
              for (let i = 0; i < sets; i++) {
                addSetToDraft(exercise.localId, {
                  weight: fromDisplayWeight(armed.weight ?? 0, unit),
                  reps,
                });
              }
              setArmedByExercise((prev) => ({
                ...prev,
                [exercise.localId]: { weight: armed.weight ?? 0, reps },
              }));
              hapticImpactLight();
              restClock.startRest(undefined, exercise.exerciseName);
              restPrevRef.current = { active: true, settled: false };
              setAnnouncement(
                `${sets} sets logged — ${armed.weight ?? 0} ${unit} × ${reps} average · rest started`,
              );
            }}
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
            {cardioRowsTotal > 0 ? (
              <Figure
                value={formatCardioDuration(cardioSecTotal)}
                label="cardio"
                tone="ink"
                size="sm"
                style={styles.finishStat}
              />
            ) : null}
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
            disabled={sessionSets === 0 && cardioRowsTotal === 0}
            testID="stage-save"
          >
            {sessionSets > 0 || cardioRowsTotal > 0
              ? `SAVE SESSION · ${sessionSets > 0 ? `${sessionSets} SET${sessionSets === 1 ? '' : 'S'}` : `${Math.round(cardioSecTotal / 60)} MIN`}`
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
  shell: {
    flex: 1,
    // iOS 27 LIQUID GLASS GUARD — matches BoardShell's shift so the
    // Floor's header clears the frosted zone on every iPhone.
    paddingTop: 24,
  },
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
  // ── THE FORM CHECK (mid-workout reference) ─────────────────────────
  formToggle: {
    minHeight: 44,
    justifyContent: 'center',
  },
  formToggleWord: {
    ...theme.typography.mobileEyebrow,
  },
  formPanel: {
    marginTop: 2,
    marginBottom: 6,
  },
  formPlate: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginBottom: 8,
  },
  formPlateWord: {
    ...theme.typography.mobileEyebrow,
    marginTop: 4,
    textAlign: 'center',
  },
  // The plate inside the HOW-TO: the full 220 figure, monochrome.
  formPlateStack: {
    position: 'relative' as const,
    height: 220,
    width: '100%',
  },
  formPlateFilter: {
    filter: 'grayscale(1) sepia(0.22) contrast(1.04) brightness(1.03)',
  } as unknown as ImageStyle,
  // The cues — the body voice, truncated to three lines; READ MORE
  // wears the link red (the sanctioned second job).
  formCues: {
    ...theme.typography.mobileBody,
  },
  readMoreHold: {
    minHeight: 44,
    justifyContent: 'center',
  },
  readMoreWord: {
    ...theme.typography.mobileEyebrow,
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
  // ── THE CARDIO SECTION (pass C2) ─────────────────────────────────
  cardioStation: {
    marginTop: BLOCK_GAP,
  },
  cardioHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  cardioName: {
    ...INTERVAL.row,
    flex: 1,
  },
  cardioTotal: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

export default Floor;
