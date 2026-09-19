// components/composed/TheLogger.tsx
//
// THE LOGGER — the Floor's docked instrument and the app's fastest
// surface (docs/architecture/gauge-thesis.md §8, the flagship). The
// armed set rides pre-armed at carry-forward weight and reads as the
// gym's own instruments: the WEIGHT lives on THE PIN RAIL (a printed
// scale with the steel pin at the load — you aim the pin the way you
// aim a stack pin), the WEIGHT and REPS speak as ROLLING COUNTERS
// (odometer digits that roll when the user changes them), and the
// exact digits ride beside their rails for the audit glance. The most
// common log in existence (same weight, same reps as the last set)
// costs ONE THUMB, ONE TAP on LOG SET. Corrections are ± steppers
// (44px) under each counter; tapping a counter opens a numeric
// keyboard for large jumps. After every log, THE REST LINE counts
// recovery (thesis §7) — steppers ±15s, tap the readout to dismiss.
//
// The room is flat everywhere EXCEPT here: the logger carries the
// system's one shadow (mobilePremium.instrumentShadow) — the app's
// single physical object, sitting ON the concrete. It never scrolls
// away and is tappable at frame 1.
//
// F2 — THE ROLL: stepper changes roll the changed digit columns
// (140ms, post-interactive, never gating the LOG tap). F3 — THE PIN
// DROP rides inside the rail. Inputs parse to number|null (empty
// string → null — Number('') is 0, which would false-positive as
// "0 kg").

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../../context';
import { theme, railMaxFor } from '../../constants';
import { parseNumber } from './parseNumber';
import { PinRail } from './PinRail';
import { RollingCounter } from './RollingCounter';
import { formatLoad } from './PinRail';

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
  /** The rail's ceiling — defaults to railMaxFor(weight). Pass the
   * day's max so the pin reads against the whole session's scale. */
  railMax?: number;
  /** THE REST LINE — present while a rest runs or has settled. */
  rest?: RestLine | null;
  onLog: () => void;
  onChangeWeight: (weight: number | null) => void;
  onChangeReps: (reps: number | null) => void;
  testID?: string;
}

/** One stepper button — 44×44 measured. */
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.stepper,
        {
          backgroundColor: colors.backgroundAlt,
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

/** The weight side: the rolling counter + steppers (the rail spans
 * both sides from the caller — one scale for the whole instrument). */
function WeightSide({
  weight,
  step,
  stepLabel,
  onChange,
  testID,
}: {
  weight: number | null;
  step: number;
  stepLabel: string;
  onChange: (next: number | null) => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  const bump = (dir: 1 | -1) => {
    const base = weight ?? 0;
    const next = Math.round((base + dir * step) * 100) / 100;
    onChange(next <= 0 ? null : next);
  };

  return (
    <View style={styles.counterSide}>
      {editing ? (
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          onSubmitEditing={() => {
            onChange(parseNumber(draftText));
            setEditing(false);
          }}
          onBlur={() => {
            onChange(parseNumber(draftText));
            setEditing(false);
          }}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          accessibilityLabel="Weight input"
          style={[styles.weightInput, { color: colors.text, outlineWidth: 0 }]}
          testID={`${testID}-input`}
        />
      ) : (
        <Pressable
          onPress={() => {
            setDraftText(weight == null ? '' : String(weight));
            setEditing(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Edit weight, currently ${weight == null ? 'not set' : `${weight} kilograms`}`}
          style={styles.counterTap}
          testID={`${testID}-tap`}
        >
          <RollingCounter value={weight == null ? '—' : formatLoad(weight)} testID={`${testID}-roll`} />
        </Pressable>
      )}
      <View style={styles.stepperRow}>
        <StepButton
          dir={-1}
          label={`Decrease weight by ${stepLabel}`}
          onPress={() => bump(-1)}
          testID={`${testID}-dec`}
        />
        <Text style={[styles.stepperStep, { color: colors.textMuted }]}>{stepLabel}</Text>
        <StepButton
          dir={1}
          label={`Increase weight by ${stepLabel}`}
          onPress={() => bump(1)}
          testID={`${testID}-inc`}
        />
      </View>
    </View>
  );
}

/** The reps side: the rolling counter + steppers. */
function RepsSide({
  reps,
  step,
  stepLabel,
  onChange,
  testID,
}: {
  reps: number | null;
  step: number;
  stepLabel: string;
  onChange: (next: number | null) => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');

  const bump = (dir: 1 | -1) => {
    const base = reps ?? 0;
    const next = base + dir * step;
    onChange(next <= 0 ? null : next);
  };

  return (
    <View style={styles.counterSide}>
      {editing ? (
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          onSubmitEditing={() => {
            onChange(parseNumber(draftText));
            setEditing(false);
          }}
          onBlur={() => {
            onChange(parseNumber(draftText));
            setEditing(false);
          }}
          keyboardType="number-pad"
          autoFocus
          selectTextOnFocus
          accessibilityLabel="Reps input"
          style={[styles.repsInput, { color: colors.text, outlineWidth: 0 }]}
          testID={`${testID}-input`}
        />
      ) : (
        <Pressable
          onPress={() => {
            setDraftText(reps == null ? '' : String(reps));
            setEditing(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Edit reps, currently ${reps == null ? 'not set' : reps}`}
          style={styles.counterTap}
          testID={`${testID}-tap`}
        >
          <RollingCounter value={reps == null ? '—' : String(reps)} testID={`${testID}-roll`} />
        </Pressable>
      )}
      <View style={styles.stepperRow}>
        <StepButton
          dir={-1}
          label={`Decrease reps by ${stepLabel}`}
          onPress={() => bump(-1)}
          testID={`${testID}-dec`}
        />
        <Text style={[styles.stepperStep, { color: colors.textMuted }]}>{stepLabel}</Text>
        <StepButton
          dir={1}
          label={`Increase reps by ${stepLabel}`}
          onPress={() => bump(1)}
          testID={`${testID}-inc`}
        />
      </View>
    </View>
  );
}

export function TheLogger({
  setNumber,
  weight,
  reps,
  repsHint = null,
  railMax,
  rest = null,
  onLog,
  onChangeWeight,
  onChangeReps,
  testID,
}: TheLoggerProps) {
  const { colors } = useAppTheme();
  const ready = weight != null && reps != null;
  const tid = testID ?? 'the-logger';

  return (
    <View
      testID={testID}
      style={[
        styles.plate,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.mobilePremium.hairlineBorder,
          boxShadow: colors.mobilePremium.instrumentShadow,
        },
      ]}
      accessibilityLabel={`Logger, set ${setNumber}: ${weight ?? 'no weight'} kilograms by ${reps ?? 'no reps'} reps`}
    >
      {/* THE REST LINE — recovery counts after every log (thesis §7).
          Running: the readout pulses signal (the live pulse); settled:
          muted until the next log. ±15 steppers; tap the readout to
          dismiss. */}
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
              onPress={() => rest.onAdjust(-15)}
              testID={`${tid}-rest-dec`}
            />
            <StepButton
              dir={1}
              label="Increase rest by 15 seconds"
              onPress={() => rest.onAdjust(15)}
              testID={`${tid}-rest-inc`}
            />
          </View>
        </View>
      ) : null}

      {/* The kicker — the set ordinal + the target, printed caps. */}
      <Text style={[styles.kicker, { color: colors.textMuted }]}>
        {`SET ${String(setNumber).padStart(2, '0')}${repsHint ? ` · TGT ${repsHint}` : ''}`}
      </Text>

      {/* THE INSTRUMENT — the pin rail spans the row; the rolling
          counters meet at the ×, each side's steppers beneath its
          figure. */}
      <View style={styles.callRow}>
        <PinRail
          kg={weight}
          scale="counter"
          railMax={railMax ?? railMaxFor(weight)}
          testID={`${tid}-rail`}
        />
        <WeightSide
          weight={weight}
          step={2.5}
          stepLabel="2.5"
          onChange={onChangeWeight}
          testID={`${tid}-weight`}
        />
        <Text style={[styles.multiplier, { color: colors.textMuted }]}>×</Text>
        <RepsSide
          reps={reps}
          step={1}
          stepLabel="1"
          onChange={onChangeReps}
          testID={`${tid}-reps`}
        />
      </View>

      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={ready ? `Log set, ${weight} kilograms, ${reps} reps` : 'Log set'}
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
  plate: {
    borderTopWidth: 1,
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
    fontSize: 21,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  restSteppers: {
    flexDirection: 'row',
    gap: 8,
  },
  kicker: {
    ...theme.typography.mobileEyebrow,
    textAlign: 'center',
    minHeight: 20,
    marginTop: 2,
  },
  // THE INSTRUMENT reads as one line: the rail at the left (one scale
  // for the whole instrument), the counters meeting at the ×, each
  // side's steppers beneath its figure.
  callRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  counterSide: {
    alignItems: 'center',
  },
  counterTap: {
    minHeight: 60,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  weightInput: {
    ...theme.typography.mobileCounter,
    minWidth: 96,
    minHeight: 60,
    textAlign: 'center',
  },
  repsInput: {
    ...theme.typography.mobileCounter,
    minWidth: 72,
    minHeight: 60,
    textAlign: 'center',
  },
  multiplier: {
    ...theme.typography.mobileFigure,
    marginTop: 22,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
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
    fontSize: 18,
  },
  stepperStep: {
    ...theme.typography.mobileEyebrow,
    minWidth: 28,
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
    letterSpacing: 1.2,
  },
});

export default TheLogger;
