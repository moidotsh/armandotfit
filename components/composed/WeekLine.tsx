// components/composed/WeekLine.tsx
//
// THE WEEK LINE — the front page's consistency register (the
// upending pass): the current week as one rail of printed figures —
// the weekday caps over each day's session count, seven columns,
// Sunday-first (the analytics grid's column grammar, so the two
// calendars teach one shape). TODAY wears the red (the living
// position — the same job it holds in the grid); a past day without
// a session prints '·' muted (a day off is a fact); a day AFTER
// today prints NOTHING (the future is not a rest day — a '·' there
// would lie). Computed at read from the shared activity log;
// nothing stored. One tap opens THE LEDGER.

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme, PRESS_DIP } from '../../constants';

/** Local calendar key ('YYYY-MM-DD') — a session counts for its day. */
function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const RAIL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** One column of the week line (the derivation is pure for tests). */
export interface WeekDay {
  /** Local calendar key ('YYYY-MM-DD'). */
  key: string;
  isToday: boolean;
  /** After today — prints nothing (the future is not a rest day). */
  future: boolean;
  count: number;
}

/**
 * The current week as seven columns, Sunday-first (the analytics
 * grid's column grammar). Pure: `now` is a parameter so tests pin
 * the calendar.
 */
export function buildWeekLineDays(
  sessions: ReadonlyArray<{ startedAt: string }>,
  now: Date = new Date(),
): WeekDay[] {
  const todayKey = localDayKey(now);
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const key = localDayKey(new Date(s.startedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sunday = new Date(now);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  sunday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const key = localDayKey(d);
    return {
      key,
      isToday: key === todayKey,
      // The future prints nothing — only the past may state a fact.
      future: key !== todayKey && d.getTime() > now.getTime(),
      count: counts.get(key) ?? 0,
    };
  });
}

export interface WeekLineProps {
  /** Session headers (startedAt only) — the shared activity log. */
  sessions: ReadonlyArray<{ startedAt: string }>;
  /** One tap opens analytics (THE LEDGER). */
  onPress: () => void;
  /** The calendar's anchor — a seam for deterministic tests. */
  now?: Date;
  testID?: string;
}

export function WeekLine({ sessions, onPress, now, testID }: WeekLineProps) {
  const { colors } = useAppTheme();

  const days = useMemo(() => buildWeekLineDays(sessions, now), [sessions, now]);

  const doneSoFar = days.filter((d) => !d.future).reduce((n, d) => n + d.count, 0);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`This week so far: ${doneSoFar} session${doneSoFar === 1 ? '' : 's'}. Open analytics.`}
      testID={testID}
      style={({ pressed }) => [styles.hold, pressed ? { opacity: PRESS_DIP } : null]}
    >
      <View style={styles.railRow}>
        {days.map((d, i) => (
          <Text key={`rail-${d.key}`} style={[styles.railChar, { color: colors.textMuted }]}>
            {RAIL[i]}
          </Text>
        ))}
      </View>
      <View style={styles.countRow}>
        {days.map((d) => (
          <Text
            key={d.key}
            testID={`${testID}-day-${d.key}`}
            style={[
              styles.countChar,
              {
                color: d.isToday
                  ? colors.brandText
                  : d.count > 0
                    ? colors.text
                    : colors.textMuted,
              },
              d.count >= 2 ? styles.countBold : null,
            ]}
          >
            {/* The future is blank — a rest day is a logged fact, and
                tomorrow has none yet. */}
            {d.future ? '' : d.count > 0 ? String(Math.min(d.count, 9)) : '·'}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hold: {
    paddingTop: 2,
  },
  railRow: {
    flexDirection: 'row',
  },
  railChar: {
    ...theme.typography.mobileEyebrow,
    flex: 1,
    textAlign: 'center',
  },
  countRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  // The counts are figures — mono, letter-spaced 0 (the grid's char
  // grammar; the +0.8 tracking belongs to caps furniture, not data).
  countChar: {
    ...theme.typography.mobileEyebrow,
    letterSpacing: 0,
    flex: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  countBold: {
    fontWeight: '700',
  },
});

export default WeekLine;
