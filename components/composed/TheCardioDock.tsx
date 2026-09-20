// components/composed/TheCardioDock.tsx
//
// THE CARDIO DOCK — the machines' instrument (pass C2), built on THE
// LOGGER's grammar (docs/architecture/interval-thesis.md §2, §7). The
// live question mid-cardio is "how long" — TIME rides the counter rank
// (72 mono condensed, the armed field 700 ink + the 2px rule); the
// machine's PRESCRIPTION (speed · incline / level / laps) rides the
// statement rank; the OUTCOMES the console reports at the end (dist,
// kcal) ride the row rank. THE ONE-FIELD LAW holds across all of it:
// exactly one armed field, ONE shared stepper pair stepping it by its
// own step, tap to arm, tap again to type. LOG CARDIO commits the
// sitting as a row (the armed values carry — the same law as the
// barbell). Still system throughout: nothing moves.

import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../../context';
import { theme, PRESS_DIP, PRESS_DIP_PLATE } from '../../constants';
import { inkSurface } from '../MobilePremium';
import {
  CARDIO_STATIONS,
  formatCardioDuration,
  formatCardioDistance,
  type CardioFieldSpec,
  type CardioStationKey,
} from '../../shared/exercises/cardio';
import { parseNumber } from './parseNumber';
import { hapticSelection, hapticImpactRigid } from '../../utils';

/** All armed-able field keys (one armed at a time — the one-field law). */
type CardioFieldKey = CardioFieldSpec['key'];

export interface TheCardioDockProps {
  station: CardioStationKey;
  /** The armed expression's current values (the store owns them). */
  armed: {
    durationSec: number | null;
    level: number | null;
    speedKmh: number | null;
    laps: number | null;
    distanceM: number | null;
    kcal: number | null;
  };
  /** Committed sittings so far (the kicker's ordinal). */
  rowCount: number;
  onArmedChange: (patch: Partial<TheCardioDockProps['armed']>) => void;
  onLog: () => void;
  testID?: string;
}

/** One stepper (44×44, hold-to-repeat — the logger's own StepButton). */
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
  const [delay, setDelay] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [interval, setInterval_] = useState<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (delay != null) clearTimeout(delay);
    if (interval != null) clearInterval(interval);
    setDelay(null);
    setInterval_(null);
  };
  useEffect(() => stop, []);
  const armHold = () => {
    stop();
    // THE HOLD PULSE — same grammar as the logger's steppers.
    hapticImpactRigid();
    setDelay(setTimeout(() => setInterval_(setInterval(onPress, 80)), 400));
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

export function TheCardioDock({
  station,
  armed,
  rowCount,
  onArmedChange,
  onLog,
  testID,
}: TheCardioDockProps) {
  const { colors } = useAppTheme();
  const spec = CARDIO_STATIONS[station];
  const tid = testID ?? 'cardio-dock';

  const [field, setField] = useState<CardioFieldKey>('duration');
  const [editing, setEditing] = useState<CardioFieldKey | null>(null);
  const [draftText, setDraftText] = useState('');

  const specOf = (key: CardioFieldKey): CardioFieldSpec =>
    key === 'duration' ? { key: 'duration', label: 'TIME', step: 60, unit: 's' } :
    key === 'distance' ? { key: 'distance', label: 'DIST', step: 100, unit: 'm' } :
    key === 'kcal' ? { key: 'kcal', label: 'KCAL', step: 10, unit: '' } :
    spec.params.find((p) => p.key === key)!;

  const rawOf = (key: CardioFieldKey): number | null => {
    switch (key) {
      case 'duration': return armed.durationSec;
      case 'level': return armed.level;
      case 'speed': return armed.speedKmh;
      case 'laps': return armed.laps;
      case 'distance': return armed.distanceM;
      case 'kcal': return armed.kcal;
    }
  };
  const setRaw = (key: CardioFieldKey, v: number | null) => {
    switch (key) {
      case 'duration': onArmedChange({ durationSec: v }); break;
      case 'level': onArmedChange({ level: v }); break;
      case 'speed': onArmedChange({ speedKmh: v }); break;
      case 'laps': onArmedChange({ laps: v }); break;
      case 'distance': onArmedChange({ distanceM: v }); break;
      case 'kcal': onArmedChange({ kcal: v }); break;
    }
  };

  /** The printed value per field (figures never draw). */
  const printOf = (key: CardioFieldKey): string => {
    const v = rawOf(key);
    if (v == null) return '—';
    if (key === 'duration') return formatCardioDuration(v);
    if (key === 'distance') return formatCardioDistance(v);
    if (key === 'speed') return String(v);
    if (key === 'level') return String(v);
    return String(Math.max(0, Math.round(v)));
  };

  const openKeyboard = (key: CardioFieldKey) => {
    const v = rawOf(key);
    // Distance types in KILOMETERS (the printed unit); everything else
    // in its own unit (time in MINUTES).
    if (key === 'distance') setDraftText(v == null ? '' : String(Math.round(v / 100) / 10));
    else if (key === 'duration') setDraftText(v == null ? '' : String(Math.round(v / 60)));
    else setDraftText(v == null ? '' : String(v));
    setField(key);
    setEditing(key);
  };
  const commitDraft = () => {
    if (editing != null) {
      const n = parseNumber(draftText);
      if (editing === 'distance') onArmedChange({ distanceM: n == null ? null : Math.round(n * 1000) });
      else if (editing === 'duration') onArmedChange({ durationSec: n == null ? null : Math.round(n * 60) });
      else setRaw(editing, n);
    }
    setEditing(null);
  };

  const bump = (dir: 1 | -1) => {
    const key = field;
    const s = specOf(key);
    const base = rawOf(key) ?? 0;
    const round2 = (x: number) => Math.round(x * 100) / 100;
    let next = round2(base + dir * s.step);
    if (next <= 0) next = key === 'duration' ? 60 : key === 'laps' ? 1 : 0;
    setRaw(key, next === 0 && key !== 'kcal' ? null : next);
  };

  /** One armed-able cell: label + value + the 2px armed rule. */
  const Field = (key: CardioFieldKey, rank: 'counter' | 'statement' | 'row') => {
    const s = specOf(key);
    const isArmed = field === key && editing === null;
    const valueStyle =
      rank === 'counter' ? styles.figureCounter :
      rank === 'statement' ? styles.figureStatement : styles.figureRow;
    const unarmed = rank === 'counter' ? styles.counterUnarmed :
      rank === 'statement' ? styles.statementUnarmed : null;
    return (
      <Pressable
        key={key}
        onPress={() => {
          // THE ARM TICK — arming is a selection.
          if (isArmed) openKeyboard(key);
          else {
            hapticSelection();
            setField(key);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`${s.label}, ${rawOf(key) ?? 'not set'}`}
        accessibilityState={{ selected: isArmed }}
        style={({ pressed }) => [
          styles.fieldHold,
          rank === 'counter' ? styles.fieldCounter : styles.fieldParam,
          pressed ? { opacity: PRESS_DIP } : null,
        ]}
        testID={`${tid}-${key}`}
      >
        {rank !== 'counter' ? (
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{s.label}</Text>
        ) : null}
        {editing === key ? (
          <TextInput
            value={draftText}
            onChangeText={setDraftText}
            onSubmitEditing={commitDraft}
            onBlur={commitDraft}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            accessibilityLabel={`${s.label} input`}
            style={[valueStyle, { color: colors.text, outlineWidth: 0, width: '100%', textAlign: 'center' }]}
            testID={`${tid}-${key}-input`}
          />
        ) : (
          <Text
            style={[
              valueStyle,
              !isArmed && unarmed ? unarmed : null,
              { color: isArmed ? colors.text : colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {printOf(key)}
          </Text>
        )}
        <View
          style={[styles.armedRule, { backgroundColor: isArmed ? colors.text : 'transparent' }]}
          testID={isArmed ? 'armed-cardio-mark' : undefined}
          accessibilityElementsHidden
        />
      </Pressable>
    );
  };

  return (
    <View
      testID={testID}
      style={[styles.plate, { borderTopColor: colors.text }]}
      accessibilityLabel={`Cardio dock, ${spec.name}, ${rowCount} sittings logged`}
    >
      {/* THE KICKER — the dock's folio (fixed above the figure). */}
      <View style={styles.kickerRow}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>
          {`CARDIO · ${spec.name.toUpperCase()}${rowCount > 0 ? ` · ${String(rowCount).padStart(2, '0')}` : ''}`}
        </Text>
      </View>

      {/* THE COUNTER — time owns it (the live question mid-cardio). */}
      <View style={styles.counterRow}>{Field('duration', 'counter')}</View>

      {/* THE PRESCRIPTION — the machine's dials at the statement rank. */}
      {spec.params.length > 0 ? (
        <View style={styles.paramsRow}>
          {spec.params.map((p) => Field(p.key, 'statement'))}
        </View>
      ) : null}

      {/* THE OUTCOMES — the console's report at the row rank. */}
      {spec.outcomes.length > 0 ? (
        <View style={styles.paramsRow}>
          {spec.outcomes.map((p) => Field(p.key, 'row'))}
        </View>
      ) : null}

      {/* THE ONE STEPPER PAIR — steps the armed field by its own step. */}
      <View style={styles.stepperRow}>
        <StepButton
          dir={-1}
          label={`Decrease ${specOf(field).label}`}
          onPress={() => bump(-1)}
          testID={`${tid}-step-dec`}
        />
        <Text style={[styles.stepperStep, { color: colors.textMuted }]} testID={`${tid}-step-label`}>
          {`${specOf(field).step} ${specOf(field).unit || specOf(field).label.toLowerCase()}`}
        </Text>
        <StepButton
          dir={1}
          label={`Increase ${specOf(field).label}`}
          onPress={() => bump(1)}
          testID={`${tid}-step-inc`}
        />
      </View>

      <Pressable
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel={
          armed.durationSec != null
            ? `Log cardio, ${formatCardioDuration(armed.durationSec)} on ${spec.name}`
            : 'Log cardio'
        }
        style={({ pressed }) => [
          styles.logButton,
          // The verb's ink plate wears the paper's tooth.
          inkSurface(colors.buttonBackground),
          pressed ? { opacity: PRESS_DIP_PLATE } : null,
        ]}
        testID={`${tid}-log`}
      >
        <Text style={[styles.logLabel, { color: colors.textOnBrand }]}>LOG CARDIO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // THE DOCK — the screen's one 2px rule carries it (no shadow; the
  // still law). Same plate grammar as TheLogger.
  plate: {
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  kickerRow: {
    alignItems: 'center',
    minHeight: 24,
    marginTop: 2,
  },
  kicker: {
    ...theme.typography.mobileEyebrow,
  },
  // THE COUNTER — one figure, centered, alone on its rank.
  counterRow: {
    minHeight: 78,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  fieldHold: {
    alignItems: 'center',
  },
  fieldCounter: {
    minWidth: 180,
  },
  fieldParam: {
    flex: 1,
    maxWidth: 180,
    minHeight: 44,
    justifyContent: 'flex-end',
  },
  fieldLabel: {
    ...theme.typography.mobileEyebrow,
    marginBottom: 2,
  },
  figureCounter: {
    ...theme.typography.mobileCounter,
  },
  counterUnarmed: {
    fontWeight: '400',
  },
  // The prescription's rank — the demoted figure's own grammar (mono
  // at the statement rank, 500 armed / 400 unarmed).
  figureStatement: {
    ...theme.typography.mobileHero,
    fontFamily: theme.typography.mobileCounter.fontFamily,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  statementUnarmed: {
    fontWeight: '400',
  },
  figureRow: {
    ...theme.typography.mobileFigure,
  },
  armedRule: {
    width: '100%',
    height: 2,
    marginTop: 2,
  },
  paramsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
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

export default TheCardioDock;
