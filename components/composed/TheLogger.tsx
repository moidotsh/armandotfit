// components/composed/TheLogger.tsx
//
// THE LOGGER — THE ONE-FIELD INSTRUMENT under THE INTERVAL (docs/
// architecture/interval-thesis.md §2, §7 — the flagship's fastest
// surface). THE LIVE FIGURE owns the counter rank, and the question
// changes by the second:
//
//   WORK  — the armed expression `62.5 × 8` at mono 72: the armed
//           field 700 ink + the 2px rule, the UNARMED field demoted
//           (400, muted — ink is state; three countable signals:
//           rule, weight, ink).
//   REST  — the clock takes the counter (72, red — the live pulse),
//           the ±15 steppers flanking it, the figure itself the
//           dismiss target; the armed expression demotes to the
//           statement rank (36, muted — both fields; the armed one
//           keeps its 2px rule so the steppers' target is never in
//           doubt). LOG SET stays full-width ink: logging early is
//           always one tap.
//
// The exchange is THE RE-WEIGHT — a repaint at LOG and at settle,
// never an animation (THE STILL SYSTEM holds). THE ONE-FIELD LAW
// governs both states: exactly one armed field, ONE shared stepper
// pair stepping it by its own step (2.5 kg / 1 rep), tap to arm,
// tap again to type. The most common log in existence still costs
// ONE THUMB, ONE TAP on LOG SET.
//
// 2027-01 refinements (behavior, unchanged): steppers HOLD TO
// REPEAT (400 ms delay, 80 ms cadence — paired cleanup per R4a);
// the armed field RE-ARMS PREDICTIVELY per set (`suggestArm`); an
// EARNED step (`earnedStep`, the double-progression derivation)
// offers itself as one tappable whisper beside the kicker — advice
// in muted ink, never red. Inputs parse to number|null (empty
// string → null — Number('') is 0, which would false-positive as
// "0 kg").

import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { inkSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { theme, REST_STEP_SEC, ANIMATION,
  PRESS_DIP,
  PRESS_DIP_PLATE
} from '../../constants';

import { weightStep, hapticSelection, hapticImpactRigid } from '../../utils';
import type { WeightUnit } from '../../utils/weight';
import { parseNumber } from './parseNumber';

/** The rest instrument's read-side shape (Floor owns the clock). */
export interface RestLine {
  readout: string;
  settled: boolean;
  onAdjust: (deltaSec: number) => void;
  onDismiss: () => void;
}

export interface TheLoggerProps {
  /** The next set's ordinal (logged sets + 1) — display only. */
  setNumber: number;
  weight: number | null;
  reps: number | null;
  /** Programmed rep-range hint ("8–10") — display only. */
  repsHint?: string | null;
  /** THE REST LINE — present while a rest runs or has settled. */
  rest?: RestLine | null;
  /**
   * PREDICTIVE ARMING — the field the recent sets were actually
   * changing ('weight' when reps held, 'reps' when weight held).
   * Applied when a NEW set begins (setNumber changes); never stomps
   * an in-progress edit.
   */
  suggestArm?: 'weight' | 'reps';
  /**
   * THE EARNED STEP — the double-progression derivation's verdict
   * (last time's top set hit the rep-range ceiling at this weight ⇒
   * the next weight is earned). Non-null renders one tappable
   * whisper; null renders nothing (and deload weeks pass null).
   */
  earnedStep?: number | null;
  /** The display unit — the stepper steps in it (2.5 kg / 5 lb). */
  unit?: WeightUnit;
  /**
   * AVERAGE MODE — the programmed rep range [low, high] from the Rx.
   * When present, the TGT hint is tappable and enters average mode:
   * tap LOW / MID / HIGH on the range to set the average, then one
   * LOG writes every set at that average.
   */
  programmedReps?: [number, number] | null;
  /** The programmed set count from the Rx ("3×8–10" → 3). */
  programmedSets?: number;
  /** Bulk log — creates `sets` identical rows at `reps`. */
  onLogAverage?: (reps: number, sets: number) => void;
  onLog: () => void;
  onChangeWeight: (weight: number | null) => void;
  onChangeReps: (reps: number | null) => void;
  testID?: string;
}

/** One stepper button — 44×44 measured, hold-to-repeat (400 ms
 *  delay, 80 ms cadence; both timers paired-cleared per R4a). */
function StepButton({
  dir,
  label,
  onPress,
  testID,
}: {
  dir: 1 | -1;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (delayRef.current != null) clearTimeout(delayRef.current);
    if (intervalRef.current != null) clearInterval(intervalRef.current);
    delayRef.current = null;
    intervalRef.current = null;
  };
  // R4a: a hold that outlives the button still clears.
  useEffect(() => stop, []);
  // The repeat is an ENRICHMENT, never the path: onPress does the
  // work (RN-web's synthesized touch taps reliably fire onPress;
  // press-in/out arm and clear the hold loop where they flow).
  const armHold = () => {
    stop();
    // THE HOLD PULSE (the haptic grammar): the repeat arms with the
    // rigid tap — machined feel, no visual motion (the still law).
    hapticImpactRigid();
    delayRef.current = setTimeout(() => {
      intervalRef.current = setInterval(onPress, ANIMATION.FAST_INTERVAL);
    }, ANIMATION.LONG_PRESS_DELAY);
  };
  return (
    <Pressable
      onPress={onPress}
      onPressIn={armHold}
      onPressOut={stop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        // THE BORDERLESS STEPPER (the atelier pass): the +/− glyphs
        // stand free of their little plates — the panel tier's last
        // hiding place, retired at micro scale. The 44px target and
        // the press dip hold; the air carries the rest.
        styles.stepper,
        pressed ? { opacity: PRESS_DIP } : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.stepperGlyph, { color: colors.text }]}>
        {dir > 0 ? '+' : '−'}
      </Text>
    </Pressable>
  );
}

/** One figure of the armed expression: the printed value (mono) or
 * the numeric keyboard while editing. INK IS STATE — the armed field
 * carries the full voice (700 ink in work; 500 muted in rest), the
 * unarmed field is always demoted (400, muted), and the 2px ink
 * rule marks the ARMED field in both states — position is state,
 * not motion (interval-thesis §2, §7). */
function ExpressionField({
  value,
  editing,
  armed,
  demoted,
  unset = false,
  boxStyle,
  onDraft,
  commitDraft,
  accessibilityLabel,
  inputAccessibilityLabel,
  onOpenKeyboard,
  onPressField,
  testID,
}: {
  value: string;
  editing: boolean;
  armed: boolean;
  /** The rest clock owns the counter — the whole expression demotes
   * to the statement rank in muted ink (the rule still marks the
   * armed field). */
  demoted: boolean;
  /** No value yet: the dash reads the muted ladder even while armed —
   * ink is for figures, never for the absence of one. */
  unset?: boolean;
  boxStyle: object;
  onDraft: (text: string) => void;
  commitDraft: () => void;
  accessibilityLabel: string;
  inputAccessibilityLabel: string;
  onOpenKeyboard: () => void;
  onPressField: () => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  if (editing) {
    return (
      <View style={[boxStyle, styles.fieldHold]}>
        {/* The edit-state input carries the SAME fixed geometry as the
            figure it replaces — typing never moves anything. */}
        <TextInput
          value={value}
          onChangeText={onDraft}
          onSubmitEditing={commitDraft}
          onBlur={commitDraft}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          accessibilityLabel={inputAccessibilityLabel}
          style={[
            demoted ? styles.inputDemoted : styles.input,
            { color: colors.text, outlineWidth: 0 },
          ]}
          testID={`${testID}-input`}
        />
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPressField}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: armed }}
      style={({ pressed }) => [
        boxStyle,
        styles.fieldHold,
        pressed ? { opacity: PRESS_DIP } : null,
      ]}
      testID={testID}
    >
      <Text
        style={[
          demoted ? styles.figureDemoted : styles.figure,
          !armed && (demoted ? styles.figureUnarmedDemoted : styles.figureUnarmed),
          { color: armed && !demoted && !unset ? colors.text : colors.textMuted },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {/* THE ARMED MARK — the 2px ink rule under the armed field,
          in both states (the steppers' target is never in doubt). */}
      <View
        style={[styles.armedRule, { backgroundColor: armed ? colors.text : 'transparent' }]}
        testID={armed ? 'armed-field-mark' : undefined}
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

export function TheLogger({
  setNumber,
  weight,
  reps,
  repsHint = null,
  programmedReps = null,
  programmedSets = 0,
  onLogAverage,
  rest = null,
  suggestArm,
  earnedStep = null,
  unit = 'kg',
  onLog,
  onChangeWeight,
  onChangeReps,
  testID,
}: TheLoggerProps) {

  const { colors } = useAppTheme();
  const ready = weight != null && reps != null;
  const tid = testID ?? 'the-logger';

  // THE ONE-FIELD LAW: exactly one armed field at a time. The steppers
  // step the armed field; tapping the other field arms it; tapping the
  // armed field opens the keyboard.
  const [field, setField] = useState<'weight' | 'reps'>('weight');
  const [editing, setEditing] = useState<'weight' | 'reps' | null>(null);
  const [draftText, setDraftText] = useState('');

  // PREDICTIVE ARMING — applied when a new set begins (the ordinal
  // changes); an in-progress edit always wins.
  useEffect(() => {
    if (editing == null && suggestArm) setField(suggestArm);
    // setNumber is the trigger: each logged set starts a new arming.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNumber]);

  const openKeyboard = (which: 'weight' | 'reps') => {
    setDraftText(
      which === 'weight'
        ? weight == null
          ? ''
          : String(weight)
        : reps == null
          ? ''
          : String(reps),
    );
    setField(which);
    setEditing(which);
  };
  const commitDraft = () => {
    if (editing === 'weight') onChangeWeight(parseNumber(draftText));
    if (editing === 'reps') onChangeReps(parseNumber(draftText));
    setEditing(null);
  };

  const step = field === 'weight' ? weightStep(unit) : 1;
  const stepLabel = String(step);
  const bump = (dir: 1 | -1) => {
    if (field === 'weight') {
      const base = weight ?? 0;
      const next = Math.round((base + dir * step) * 100) / 100;
      onChangeWeight(next <= 0 ? null : next);
    } else {
      const base = reps ?? 0;
      const next = base + dir * step;
      onChangeReps(next <= 0 ? null : next);
    }
  };

  const weightText = weight == null ? '—' : String(weight);
  const repsText = reps == null ? '—' : String(Math.max(0, Math.round(reps)));

  // THE LIVE QUESTION — while rest runs, the clock owns the counter
  // and the expression demotes (interval-thesis §7).
  const restRunning = rest != null && !rest.settled;

  return (
    <View
      testID={testID}
      style={[
        styles.plate,
        {
          borderTopColor: colors.text,
        },
      ]}
      accessibilityLabel={`Logger, set ${setNumber}: ${weight ?? 'no weight'} ${unit} by ${reps ?? 'no reps'} reps`}
    >
      {/* THE KICKER — the dock's folio: the set ordinal + the target,
          printed caps, with THE EARNED STEP riding beside it (one
          tappable whisper — muted ink; advice is neither record nor
          live). Fixed ABOVE the exchanged figure in BOTH states, so
          THE RE-WEIGHT swaps only the figure below it — the dock
          keeps one constant grammar (the sight amendment). */}
      <View style={styles.kickerRow}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>
          {`SET ${String(setNumber).padStart(2, '0')}${repsHint ? ` · TGT ${repsHint}` : ''}`}
        </Text>
        {earnedStep != null && weight != null ? (
          <Pressable
            onPress={() => onChangeWeight(Math.round((weight! + earnedStep) * 100) / 100)}
            accessibilityLabel={`Add ${earnedStep} — earned: last time hit the top of the rep range at this weight`}
            style={({ pressed }) => [styles.earnedTap, pressed ? { opacity: PRESS_DIP } : null]}
            testID={`${testID ?? 'the-logger'}-earned`}
          >
            <Text style={[styles.earnedWord, { color: colors.textSecondary }]}>
              {`+${earnedStep} EARNED`}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* THE REST INSTRUMENT, rank-corrected (thesis §7). While rest
          RUNS the clock owns THE LIVE FIGURE — 72 mono in RED INK
          (the live pulse), the ±15 steppers flanking it, the figure
          itself the dismiss target. The old REST caption is deleted
          (the sight amendment): a whisper labeling the loudest red
          mark on the page was furniture explaining furniture. At
          settle the expression re-weights back to the counter and
          recovery collapses to the QUIET ROW (muted readout, tap to
          clear). The exchange is a repaint — nothing moves (THE
          STILL SYSTEM). */}
      {rest ? (
        rest.settled ? (
          <View style={styles.restRow} testID={`${tid}-rest`}>
            <Pressable
              onPress={rest.onDismiss}
              accessibilityRole="button"
              accessibilityLabel={`Rest ${rest.readout}, finished — tap to clear`}
              style={({ pressed }) => [styles.restReadoutTap, pressed ? { opacity: PRESS_DIP } : null]}
              testID={`${tid}-rest-readout`}
            >
              <Text style={[styles.restWord, { color: colors.textMuted }]}>REST</Text>
              <Text style={[styles.restFigure, { color: colors.textMuted }]}>
                {rest.readout}
              </Text>
            </Pressable>
            <View style={styles.restSteppers}>
              <StepButton
                dir={-1}
                label="Decrease rest by 15 seconds"
                onPress={() => rest.onAdjust(-REST_STEP_SEC)}
                testID={`${tid}-rest-dec`}
              />
              <StepButton
                dir={1}
                label="Increase rest by 15 seconds"
                onPress={() => rest.onAdjust(REST_STEP_SEC)}
                testID={`${tid}-rest-inc`}
              />
            </View>
          </View>
        ) : (
          <View style={styles.clockRow} testID={`${tid}-rest`}>
            <StepButton
              dir={-1}
              label="Decrease rest by 15 seconds"
              onPress={() => rest.onAdjust(-REST_STEP_SEC)}
              testID={`${tid}-rest-dec`}
            />
            {/* The clock IS the dismiss target — the whole block. The
                red figure alone; the kicker above already carries the
                set facts. */}
            <Pressable
              onPress={rest.onDismiss}
              accessibilityRole="button"
              accessibilityLabel={`Rest ${rest.readout} running — tap to clear`}
              style={({ pressed }) => [styles.clockTap, pressed ? { opacity: PRESS_DIP } : null]}
              testID={`${tid}-rest-readout`}
            >
              <Text
                style={[styles.clockFigure, { color: colors.brandText }]}
              >
                {rest.readout}
              </Text>
            </Pressable>
            <StepButton
              dir={1}
              label="Increase rest by 15 seconds"
              onPress={() => rest.onAdjust(REST_STEP_SEC)}
              testID={`${tid}-rest-inc`}
            />
          </View>
        )
      ) : null}

      {/* THE ARMED EXPRESSION — `62.5 × 8` at the counter in work;
          the statement rank, muted, while the clock runs. The armed
          field wears the 2px rule in both states; values swap,
          nothing moves — THE RE-WEIGHT is a repaint. */}
      <View style={styles.expressionRow}>
        <ExpressionField
          value={editing === 'weight' ? draftText : weightText}
          editing={editing === 'weight'}
          armed={field === 'weight' && editing === null}
          demoted={restRunning}
          unset={weight == null}
          boxStyle={restRunning ? styles.weightBoxRest : styles.weightBox}
          onDraft={setDraftText}
          commitDraft={commitDraft}
          accessibilityLabel={`Weight, currently ${weight == null ? 'not set' : `${weight} ${unit}`} — tap to arm weight`}
          inputAccessibilityLabel="Weight input"
          onOpenKeyboard={() => openKeyboard('weight')}
          onPressField={() => {
            // THE ARM TICK (the haptic grammar): arming a field is a
            // selection — the tick says which field owns the steppers.
            if (field === 'weight') openKeyboard('weight');
            else {
              hapticSelection();
              setField('weight');
            }
          }}
          testID={`${tid}-weight-tap`}
        />
        <Text
          style={[
            styles.multiplier,
            restRunning ? styles.multiplierDemoted : null,
            { color: colors.textMuted },
          ]}
        >
          ×
        </Text>
        <ExpressionField
          value={editing === 'reps' ? draftText : repsText}
          editing={editing === 'reps'}
          armed={field === 'reps' && editing === null}
          demoted={restRunning}
          unset={reps == null}
          boxStyle={restRunning ? styles.repsBoxRest : styles.repsBox}
          onDraft={setDraftText}
          commitDraft={commitDraft}
          accessibilityLabel={`Reps, currently ${reps == null ? 'not set' : reps} — tap to arm reps`}
          inputAccessibilityLabel="Reps input"
          onOpenKeyboard={() => openKeyboard('reps')}
          onPressField={() => {
            if (field === 'reps') openKeyboard('reps');
            else {
              hapticSelection();
              setField('reps');
            }
          }}
          testID={`${tid}-reps-tap`}
        />
      </View>

      {/* THE ONE STEPPER PAIR — steps the ARMED field by its own step. */}
      <View style={styles.stepperRow}>
        <StepButton
          dir={-1}
          label={`Decrease ${field === 'weight' ? `weight by ${stepLabel}` : 'reps by 1'}`}
          onPress={() => bump(-1)}
          testID={`${tid}-step-dec`}
        />
        <Text style={[styles.stepperStep, { color: colors.textMuted }]} testID={`${tid}-step-label`}>
          {field === 'weight' ? `${stepLabel} ${unit}` : '1 rep'}
        </Text>
        <StepButton
          dir={1}
          label={`Increase ${field === 'weight' ? `weight by ${stepLabel}` : 'reps by 1'}`}
          onPress={() => bump(1)}
          testID={`${tid}-step-inc`}
        />
      </View>

      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={ready ? `Log set, ${weight} ${unit}, ${reps} reps` : 'Log set'}
        style={({ pressed }) => [
          styles.logButton,
          // The verb's ink plate wears the paper's tooth (the atelier
          // pass): stock, not screen.
          inkSurface(colors.buttonBackground),
          pressed ? { opacity: PRESS_DIP_PLATE } : null,
        ]}
        testID={`${tid}-log`}
      >
        <Text style={[styles.logLabel, { color: colors.textOnBrand }]}>LOG SET</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // THE DOCK — the screen's one 2px rule carries the logger (no
  // shadow: nothing in the app is lifted; the still law).
  plate: {
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginTop: 2,
  },
  restReadoutTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  restWord: {
    ...theme.typography.mobileEyebrow,
  },
  restFigure: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  restSteppers: {
    flexDirection: 'row',
    gap: 8,
  },
  // ── THE CLOCK — the live figure while rest runs (thesis §7) ──────
  // Steppers flank the readout; the whole clock block is the dismiss
  // target (≥44px many times over). Red is the live pulse.
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 2,
    minHeight: 96,
  },
  clockTap: {
    alignItems: 'center',
    minWidth: 150,
    minHeight: 96,
    justifyContent: 'center',
  },
  clockFigure: {
    ...theme.typography.mobileCounter,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 24,
    marginTop: 2,
  },
  kicker: {
    ...theme.typography.mobileEyebrow,
  },
  // THE EARNED STEP — advice rides at whisper scale beside the
  // kicker, muted ink, 44px target.
  earnedTap: {
    minHeight: 24,
    justifyContent: 'center',
  },
  earnedWord: {
    ...theme.typography.mobileEyebrow,
  },
  // THE ARMED EXPRESSION — fixed boxes so growth never reflows the
  // row: weight spans the decimal's room, reps two digits.
  expressionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  fieldHold: {
    alignItems: 'center',
  },
  weightBox: {
    width: 218,
    minHeight: 78,
    justifyContent: 'flex-end',
  },
  repsBox: {
    width: 96,
    minHeight: 78,
    justifyContent: 'flex-end',
  },
  // The demoted boxes keep the WORK row's widths (nothing reflows
  // horizontally when the question changes) and shrink to the
  // statement rank's height.
  weightBoxRest: {
    width: 218,
    minHeight: 42,
    justifyContent: 'flex-end',
  },
  repsBoxRest: {
    width: 96,
    minHeight: 42,
    justifyContent: 'flex-end',
  },
  // ── THE EXPRESSION'S LADDER (ink is state, thesis §2) ────────────
  // Work: the armed figure rides the counter (700 ink); the unarmed
  // demotes to 400 muted. Rest: the whole expression demotes to the
  // statement rank in muted mono (armed 500 + the rule, unarmed 400).
  figure: {
    ...theme.typography.mobileCounter,
  },
  figureUnarmed: {
    fontWeight: '400',
  },
  figureDemoted: {
    ...theme.typography.mobileHero,
    fontFamily: theme.typography.mobileCounter.fontFamily,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  figureUnarmedDemoted: {
    fontWeight: '400',
  },
  // The edit-state input carries its rank's own geometry — typing
  // never moves anything, in either state.
  input: {
    ...theme.typography.mobileCounter,
    width: '100%',
    textAlign: 'center',
  },
  inputDemoted: {
    ...theme.typography.mobileHero,
    fontFamily: theme.typography.mobileCounter.fontFamily,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    width: '100%',
    textAlign: 'center',
  },
  armedRule: {
    width: '100%',
    height: 2,
    marginTop: 2,
  },
  multiplier: {
    ...theme.typography.mobileFigure,
    marginBottom: 16,
  },
  multiplierDemoted: {
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  stepper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    ...theme.typography.mobileFigure,
    fontWeight: '600',
  },
  stepperStep: {
    ...theme.typography.mobileEyebrow,
    minWidth: 52,
    textAlign: 'center',
  },
  logButton: {
    height: 56,
    borderRadius: theme.shapes.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logLabel: {
    ...theme.typography.mobileAction,
  },
});

export default TheLogger;
