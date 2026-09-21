// app/couple.tsx
//
// THE COUPLES PAGE — both editions side by side, so two people
// training the same rotation can see where they meet (the shared
// positions, marked) and where each runs their own exercise.
// Toggles between the two-a-day (AM/PM) and one-a-day editions
// with the same two-tile grammar as the split selector.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BoardShell } from '../components/composed';
import { useAppTheme } from '../context';
import { INTERVAL, ROW_GAP, HALO, BLOCK_GAP, theme, PAGE_GUTTER, PRESS_DIP, paperToothStyle } from '../constants';
import { useSplitPreferenceStore } from '../stores';
import {
  TWO_A_DAY_SPLITS,
  FEMALE_TWO_A_DAY_SPLITS,
  ONE_A_DAY_SPLITS,
  FEMALE_ONE_A_DAY_SPLITS,
} from '../shared/exercises/splits';
import { SYSTEM_EXERCISES_BY_SLUG } from '../shared/exercises/data';
import { navigateToExerciseDetail, safeGoBack } from '../navigation';

type Mode = 'twoADay' | 'oneADay';

const isMode = (v: string | undefined): v is Mode =>
  v === 'twoADay' || v === 'oneADay';

const displayName = (slug: string): string =>
  SYSTEM_EXERCISES_BY_SLUG[slug]?.name ?? slug;

const rxLabel = (sets: [number, number], reps: [number, number]): string => {
  const s = sets[0] === sets[1] ? `${sets[0]}` : `${sets[0]}–${sets[1]}`;
  const r = reps[0] === reps[1] ? `${reps[0]}` : `${reps[0]}–${reps[1]}`;
  return `${s}×${r}`;
};

export default function CoupleScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(isMode(params.mode) ? params.mode : 'twoADay');
  const programEdition = useSplitPreferenceStore((s) => s.edition);

  const days = useMemo(() => {
    if (mode === 'oneADay') {
      return ONE_A_DAY_SPLITS.map((m, i) => ({
        day: m.day,
        title: m.title,
        male: m.session,
        female: FEMALE_ONE_A_DAY_SPLITS[i]?.session ?? [],
      }));
    }
    return TWO_A_DAY_SPLITS.map((m, i) => ({
      day: m.day,
      title: m.title,
      male: m.am,
      female: FEMALE_TWO_A_DAY_SPLITS[i]?.am ?? [],
      window: 'AM' as const,
      malePm: m.pm,
      femalePm: FEMALE_TWO_A_DAY_SPLITS[i]?.pm ?? [],
    }));
  }, [mode]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ground: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: PAGE_GUTTER, paddingBottom: HALO * 2 },
        statement: {
          ...INTERVAL.statement,
          color: colors.text,
          marginTop: ROW_GAP * 2,
          marginBottom: PAGE_GUTTER,
        } as const,
        whisper: {
          ...INTERVAL.whisper,
          color: colors.textMuted,
          marginBottom: ROW_GAP * 2,
        } as const,
        modeRow: { flexDirection: 'row', marginBottom: PAGE_GUTTER },
        modeTile: {
          flex: 1,
          paddingVertical: ROW_GAP * 2,
          alignItems: 'center' as const,
          borderWidth: 1,
          borderColor: colors.mobilePremium.hairlineBorder,
        },
        modeTileFirst: { marginRight: ROW_GAP * 2 },
        modeTileActive: { backgroundColor: colors.text },
        modeTileLabel: {
          ...INTERVAL.whisper,
          color: colors.text,
        } as const,
        modeTileLabelActive: { color: colors.background },
        dayHead: {
          ...INTERVAL.statement,
          color: colors.text,
          marginTop: BLOCK_GAP,
          marginBottom: ROW_GAP * 2,
        } as const,
        windowWhisper: {
          ...INTERVAL.whisper,
          color: colors.textMuted,
          marginTop: ROW_GAP * 2,
          marginBottom: ROW_GAP / 2,
        } as const,
        headerRow: {
          flexDirection: 'row',
          paddingVertical: ROW_GAP / 2,
          borderBottomWidth: 2,
          borderBottomColor: colors.text,
        },
        headerCell: {
          ...INTERVAL.whisper,
          flex: 1,
          color: colors.text,
        } as const,
        row: {
          flexDirection: 'row',
          paddingVertical: ROW_GAP,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.mobilePremium.hairlineBorder,
          alignItems: 'center',
        },
        cell: { flex: 1, paddingRight: ROW_GAP / 2 },
        exerciseName: {
          ...INTERVAL.row,
          color: colors.text,
        } as const,
        exerciseNameMuted: { color: colors.textMuted },
        rx: {
          ...INTERVAL.figure,
          color: colors.textMuted,
          marginTop: 2,
        } as const,
        sharedMark: {
          position: 'absolute' as const,
          top: ROW_GAP,
          right: ROW_GAP / 4,
          width: 6,
          height: 6,
          backgroundColor: colors.brandText,
        },
      }),
    [colors],
  );

  const renderRow = (
    maleEx: string | undefined,
    maleRx: [number, number] | undefined,
    maleReps: [number, number] | undefined,
    femaleEx: string | undefined,
    femaleRx: [number, number] | undefined,
    femaleReps: [number, number] | undefined,
    key: string,
  ) => {
    const shared = maleEx === femaleEx && maleEx !== undefined;
    const maleSlug = maleEx;
    const femaleSlug = femaleEx;
    return (
      <View key={key} style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.cell,
            pressed ? { opacity: PRESS_DIP } : null,
          ]}
          onPress={maleSlug ? () => navigateToExerciseDetail(maleSlug) : undefined}
          accessibilityRole={maleSlug ? 'button' : undefined}
          accessibilityLabel={maleSlug ? `${displayName(maleSlug)} — view details` : undefined}
        >
          {maleSlug ? (
            <>
              <Text style={styles.exerciseName} numberOfLines={2}>
                {displayName(maleSlug)}
              </Text>
              {maleRx && maleReps ? (
                <Text style={styles.rx}>{rxLabel(maleRx, maleReps)}</Text>
              ) : null}
            </>
          ) : null}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.cell,
            pressed ? { opacity: PRESS_DIP } : null,
          ]}
          onPress={femaleSlug ? () => navigateToExerciseDetail(femaleSlug) : undefined}
          accessibilityRole={femaleSlug ? 'button' : undefined}
          accessibilityLabel={femaleSlug ? `${displayName(femaleSlug)} — view details` : undefined}
        >
          {femaleSlug ? (
            <>
              <Text
                style={[
                  styles.exerciseName,
                  programEdition === 'lower' ? null : styles.exerciseNameMuted,
                ]}
                numberOfLines={2}
              >
                {displayName(femaleSlug)}
              </Text>
              {femaleRx && femaleReps ? (
                <Text style={styles.rx}>{rxLabel(femaleRx, femaleReps)}</Text>
              ) : null}
            </>
          ) : null}
        </Pressable>
        {shared ? <View style={styles.sharedMark} testID={`couple-shared-${key}`} /> : null}
      </View>
    );
  };

  return (
    <BoardShell
      onBack={safeGoBack}
      contentContainerStyle={{ paddingHorizontal: PAGE_GUTTER, paddingBottom: HALO * 2 }}
    >
      <View style={[styles.ground, paperToothStyle('light')]} pointerEvents="box-none">
        <Text style={styles.statement}>Two lifters, one rotation.</Text>

        {/* THE MODE TOGGLE — two-a-day vs one-a-day */}
        <View style={styles.modeRow}>
          {(['twoADay', 'oneADay'] as const).map((m) => {
            const isActive = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={m === 'twoADay' ? 'Two a day' : 'One a day'}
                style={({ pressed }) => [
                  styles.modeTile,
                  isActive ? styles.modeTileActive : null,
                  m === 'twoADay' ? styles.modeTileFirst : null,
                  pressed ? { opacity: PRESS_DIP } : null,
                ]}
                testID={`couple-mode-${m}`}
              >
                <Text
                  style={[
                    styles.modeTileLabel,
                    isActive ? styles.modeTileLabelActive : null,
                  ]}
                >
                  {m === 'twoADay' ? 'AM / PM' : 'ONE A DAY'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* THE DAYS */}
        {days.map((day) => {
          if (mode === 'oneADay') {
            const d = day as {
              day: number;
              title: string;
              male: { exercise: string; sets: [number, number]; reps: [number, number] }[];
              female: { exercise: string; sets: [number, number]; reps: [number, number] }[];
            };
            const maxLen = Math.max(d.male.length, d.female.length);
            return (
              <View key={`d${d.day}`}>
                <Text style={styles.dayHead}>{d.title}</Text>
                <View style={styles.headerRow}>
                  <Text style={[styles.headerCell, { paddingRight: ROW_GAP / 2 }]}>
                    Male
                  </Text>
                  <Text style={styles.headerCell}>Female</Text>
                </View>
                {Array.from({ length: maxLen }, (_, i) =>
                  renderRow(
                    d.male[i]?.exercise,
                    d.male[i]?.sets,
                    d.male[i]?.reps,
                    d.female[i]?.exercise,
                    d.female[i]?.sets,
                    d.female[i]?.reps,
                    `d${d.day}-s${i}`,
                  ),
                )}
              </View>
            );
          }

          const d = day as unknown as {
            day: number;
            title: string;
            male: { exercise: string; sets: [number, number]; reps: [number, number] }[];
            female: { exercise: string; sets: [number, number]; reps: [number, number] }[];
            window: 'AM';
            malePm: { exercise: string; sets: [number, number]; reps: [number, number] }[];
            femalePm: { exercise: string; sets: [number, number]; reps: [number, number] }[];
          };
          return (
            <View key={`d${d.day}`}>
              <Text style={styles.dayHead}>{d.title}</Text>

              {/* AM */}
              <Text style={styles.windowWhisper}>AM</Text>
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, { paddingRight: ROW_GAP / 2 }]}>
                  Male
                </Text>
                <Text style={styles.headerCell}>Female</Text>
              </View>
              {Array.from({ length: 4 }, (_, i) =>
                renderRow(
                  d.male[i]?.exercise,
                  d.male[i]?.sets,
                  d.male[i]?.reps,
                  d.female[i]?.exercise,
                  d.female[i]?.sets,
                  d.female[i]?.reps,
                  `d${d.day}-am${i}`,
                ),
              )}

              {/* PM */}
              <Text style={styles.windowWhisper}>PM</Text>
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, { paddingRight: ROW_GAP / 2 }]}>
                  Male
                </Text>
                <Text style={styles.headerCell}>Female</Text>
              </View>
              {Array.from({ length: 4 }, (_, i) =>
                renderRow(
                  d.malePm[i]?.exercise,
                  d.malePm[i]?.sets,
                  d.malePm[i]?.reps,
                  d.femalePm[i]?.exercise,
                  d.femalePm[i]?.sets,
                  d.femalePm[i]?.reps,
                  `d${d.day}-pm${i}`,
                ),
              )}
            </View>
          );
        })}

      </View>
    </BoardShell>
  );
}
