// components/composed/TheLogger.tsx
//
// THE LOGGER — THE ONE-FIELD INSTRUMENT (docs/architecture/
// scoreboard-thesis.md §8, the flagship's fastest surface). The
// armed set reads as ONE EXPRESSION at figure scale — `62.5 × 8` in
// mono 72, the biggest mark in the system — and THE ONE-FIELD LAW
// governs it: exactly one field is armed at a time (the 2px ink
// underline), one shared stepper pair steps the armed field by its
// own step (2.5 kg / 1 rep), and tapping a field arms it — tapping
// the armed field again opens the numeric keyboard for large jumps.
// The most common log in existence (same weight, same reps as the
// last set) still costs ONE THUMB, ONE TAP on LOG SET.
//
// After every log, THE REST LINE counts recovery (thesis §7) —
// steppers ±15s, tap the readout to dismiss, red while running.
//
// 2027-01 refinements: the steppers HOLD TO REPEAT (400 ms delay,
// 80 ms cadence — paired cleanup per R4a); the armed field RE-ARMS
// PREDICTIVELY per set (`suggestArm` — the field the recent sets
// were actually changing); and an EARNED step (`earnedStep`, the
// double-progression derivation) offers itself as one tappable
// whisper beside the kicker — advice in muted ink, never red.
//
// THE STILL SYSTEM: nothing here moves. The odometer roll, the pin
// drop, and the shadow die with THE GAUGE — values swap instantly,
// the logger docks under the screen's one 2px rule, and it is
// tappable at frame 1, forever. Inputs parse to number|null (empty
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
import { useAppTheme } from '../../context';
import { theme, REST_STEP_SEC, ANIMATION } from '../../constants';
import { weightStep } from '../../utils';
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
        styles.stepper,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.mobilePremium.hairlineBorderStrong,
        },
        pressed ? { opacity: 0.6 } : null,
      ]}
      testID={testID}
    >
      <Text style={[styles.stepperGlyph, { color: colors.text }]}>
        {dir > 0 ? '+' : '−'}
      </Text>
    </Pressable>
  );
}

/** One figure of the armed expression: the printed value (mono 72),
 * or the numeric keyboard while editing. The 2px ink underline marks
 * the ARMED field — position is state, not motion. */
function ExpressionField({
  value,
  editing,
  armed,
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
          style={[styles.input, { color: colors.text, outlineWidth: 0 }]}
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
        pressed ? { opacity: 0.75 } : null,
      ]}
      testID={testID}
    >
      <Text
        style={[styles.figure, { color: colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {/* THE ARMED MARK — the 2px ink rule under the armed field. */}
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

  const weightText = weight == null ? '···' : String(weight);
  const repsText = reps == null ? '··' : String(Math.max(0, Math.round(reps)));

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
      {/* THE REST LINE — recovery counts after every log (thesis §7).
          Running: the readout carries the red (the live pulse);
          settled: muted until the next log. ±15 steppers; tap the
          readout to dismiss. */}
      {rest ? (
        <View style={styles.restRow} testID={`${tid}-rest`}>
          <Pressable
            onPress={rest.onDismiss}
            accessibilityRole="button"
            accessibilityLabel={`Rest ${rest.readout}${rest.settled ? ', finished' : ' running'} — tap to clear`}
            style={({ pressed }) => [styles.restReadoutTap, pressed ? { opacity: 0.6 } : null]}
            testID={`${tid}-rest-readout`}
          >
            <Text style={[styles.restWord, { color: colors.textMuted }]}>REST</Text>
            <Text
              style={[
                styles.restFigure,
                { color: rest.settled ? colors.textMuted : colors.brandText },
              ]}
            >
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
      ) : null}

      {/* The kicker — the set ordinal + the target, printed caps —
          with THE EARNED STEP riding beside it: one tappable whisper
          (muted ink — advice is neither record nor live). */}
      <View style={styles.kickerRow}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>
          {`SET ${String(setNumber).padStart(2, '0')}${repsHint ? ` · TGT ${repsHint}` : ''}`}
        </Text>
        {earnedStep != null && weight != null ? (
          <Pressable
            onPress={() => onChangeWeight(Math.round((weight! + earnedStep) * 100) / 100)}
            accessibilityLabel={`Add ${earnedStep} — earned: last time hit the top of the rep range at this weight`}
            style={({ pressed }) => [styles.earnedTap, pressed ? { opacity: 0.6 } : null]}
            testID={`${testID ?? 'the-logger'}-earned`}
          >
            <Text style={[styles.earnedWord, { color: colors.textSecondary }]}>
              {`+${earnedStep} EARNED`}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* THE ARMED EXPRESSION — `62.5 × 8` at figure scale. The armed
          field wears the 2px rule; values swap, nothing moves. */}
      <View style={styles.expressionRow}>
        <ExpressionField
          value={editing === 'weight' ? draftText : weightText}
          editing={editing === 'weight'}
          armed={field === 'weight' && editing === null}
          boxStyle={styles.weightBox}
          onDraft={setDraftText}
          commitDraft={commitDraft}
          accessibilityLabel={`Weight, currently ${weight == null ? 'not set' : `${weight} ${unit}`} — tap to arm weight`}
          inputAccessibilityLabel="Weight input"
          onOpenKeyboard={() => openKeyboard('weight')}
          onPressField={() => {
            if (field === 'weight') openKeyboard('weight');
            else setField('weight');
          }}
          testID={`${tid}-weight-tap`}
        />
        <Text style={[styles.multiplier, { color: colors.textMuted }]}>×</Text>
        <ExpressionField
          value={editing === 'reps' ? draftText : repsText}
          editing={editing === 'reps'}
          armed={field === 'reps' && editing === null}
          boxStyle={styles.repsBox}
          onDraft={setDraftText}
          commitDraft={commitDraft}
          accessibilityLabel={`Reps, currently ${reps == null ? 'not set' : reps} — tap to arm reps`}
          inputAccessibilityLabel="Reps input"
          onOpenKeyboard={() => openKeyboard('reps')}
          onPressField={() => {
            if (field === 'reps') openKeyboard('reps');
            else setField('reps');
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
          { backgroundColor: colors.buttonBackground },
          pressed ? { opacity: 0.85 } : null,
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
  figure: {
    ...theme.typography.mobileCounter,
  },
  // The edit-state input carries the counter's own geometry.
  input: {
    ...theme.typography.mobileCounter,
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
    borderRadius: theme.shapes.control,
    borderWidth: 1,
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
