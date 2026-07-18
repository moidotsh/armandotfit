// constants/workoutSplits.ts
// Workout split metadata. Decoupled from theme (was previously inlined in
// archive-v1/constants/theme.ts:16-27) for separation of concerns: this is
// fitness-domain data, not visual theming.
//
// Two pieces of state live here:
//   1. Split metadata (oneADay / twoADay) — static.
//   2. Cycle helpers that determine which split-day the user is on, based
//      on their last completed workout. The cycle is per-user history-
//      driven: next day = (last day mod 4) + 1. The DB has no cycle
//      anchor — it only stores the day (1..4) per session.
//
// The day-of-week pattern (Mon/Thu = rest) is a UI concept for the picker;
// it isn't enforced by the DB and isn't part of the cycle counter.

import type { PreferredSplit } from '../shared/types';

// ──────────────────────────────────────────────────────────────────────
// Split metadata
// ──────────────────────────────────────────────────────────────────────

export interface WorkoutSplitInfo {
  /** Matches the workout_sessions.split_type CHECK constraint. */
  id: PreferredSplit;
  /** Short label for selectors and footers. */
  label: string;
  /** One-line description shown in the split picker. */
  description: string;
}

/**
 * The two split archetypes armandotfit ships with. One session per day
 * (oneADay) vs two sessions per day (twoADay — AM + PM).
 */
export const WORKOUT_SPLITS: Record<PreferredSplit, WorkoutSplitInfo> = {
  oneADay: {
    id: 'oneADay',
    label: '1-a-day',
    description: 'Full Body / Push-Pull-Legs / etc. — one session today.',
  },
  twoADay: {
    id: 'twoADay',
    label: 'AM / PM',
    description: 'Two sessions today (morning + evening).',
  },
};

/** Ordered list — useful for selectors that want a stable display order. */
export const WORKOUT_SPLIT_LIST: WorkoutSplitInfo[] = [
  WORKOUT_SPLITS.oneADay,
  WORKOUT_SPLITS.twoADay,
];

// ──────────────────────────────────────────────────────────────────────
// AM / PM session mode (twoADay only)
// ──────────────────────────────────────────────────────────────────────

export type SessionMode = 'am' | 'pm';

export const SESSION_MODE_LIST: Array<{ id: SessionMode; label: string }> = [
  { id: 'am', label: 'AM' },
  { id: 'pm', label: 'PM' },
];

// ──────────────────────────────────────────────────────────────────────
// Cycle counter (history-derived)
// ──────────────────────────────────────────────────────────────────────

/**
 * The split-day range. workout_sessions.day CHECK is 1..7 (permissive);
 * armandotfit only ever writes 1..4 (the four split-days). The DB
 * constraint isn't tightened so historical rows / external inserts that
 * happen to land 5..7 don't break reads.
 */
export const MIN_SPLIT_DAY = 1;
export const MAX_SPLIT_DAY = 4;

/**
 * Computes the next split-day given the user's last completed day.
 * Wraps 4 → 1. New users (no history, lastDay null/0) start at Day 1.
 *
 *   getNextSplitDay(1) → 2
 *   getNextSplitDay(4) → 1
 *   getNextSplitDay(null) → 1
 */
export function getNextSplitDay(lastDay: number | null | undefined): number {
  if (!lastDay || lastDay < MIN_SPLIT_DAY || lastDay > MAX_SPLIT_DAY) {
    return MIN_SPLIT_DAY;
  }
  return ((lastDay - MIN_SPLIT_DAY) % MAX_SPLIT_DAY) + MIN_SPLIT_DAY + 1;
}

/**
 * Parses a split-day id back to its 1..4 integer. Throws on bad input —
 * signals a programmer error (selectedId out of range), not user input.
 */
export function parseDayId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < MIN_SPLIT_DAY || n > MAX_SPLIT_DAY) {
    // s10-exempt: programmer-error guard, not a boundary throw
    throw new Error(`Invalid split-day id: ${id}`);
  }
  return n;
}

// ──────────────────────────────────────────────────────────────────────
// Rest-day pattern (UI-only, user-configurable)
// ──────────────────────────────────────────────────────────────────────
// JS Date.getDay(): Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6.
// The user picks which days are rest via profile.restDays (stored as an
// array of these integers in the DB). The cycle counter doesn't care
// about day-of-week — only the user's last completed workout. Rest days
// only affect the picker UI ("these days are deactivated").

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Long-form labels for the settings multi-select. */
export const DAY_OF_WEEK_LABELS: Array<{ id: number; label: string }> = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isRestDay(
  date: Date,
  restDaysOfWeek: ReadonlySet<number> | number[],
): boolean {
  const set = Array.isArray(restDaysOfWeek)
    ? new Set(restDaysOfWeek)
    : restDaysOfWeek;
  return set.has(date.getDay());
}

export interface UpcomingDay {
  date: Date;
  /** yyyy-mm-dd, suitable for cache keys + equality. */
  isoDate: string;
  dayOfWeek: number;
  /** "Tue" */
  dayLabel: string;
  /** "Jul 21" */
  dateLabel: string;
  /** "Tue · Jul 21" */
  fullLabel: string;
  isRestDay: boolean;
  isToday: boolean;
  /** Calendar days from today (0 = today, 1 = tomorrow, ...). */
  offsetDays: number;
}

/**
 * Returns the next `count` calendar days starting today (or `fromDate`),
 * each annotated with rest-day + "today" flags. `restDaysOfWeek` is the
 * user's profile.restDays (array of JS getDay integers). Used by the
 * split-selection picker to render a rolling window of upcoming workout
 * slots with rest days visually deactivated.
 */
export function getUpcomingDays(
  count: number,
  restDaysOfWeek: ReadonlySet<number> | number[],
  fromDate: Date = new Date(),
): UpcomingDay[] {
  const restSet = Array.isArray(restDaysOfWeek)
    ? new Set(restDaysOfWeek)
    : restDaysOfWeek;
  const todayStart = startOfDay(fromDate);
  const days: UpcomingDay[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({
      date: d,
      isoDate: `${yyyy}-${mm}-${dd}`,
      dayOfWeek,
      dayLabel: DAY_LABELS[dayOfWeek],
      dateLabel: `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`,
      fullLabel: `${DAY_LABELS[dayOfWeek]} · ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`,
      isRestDay: restSet.has(dayOfWeek),
      isToday: i === 0,
      offsetDays: i,
    });
  }
  return days;
}

/**
 * Returns the next non-rest day on or after `fromDate`. Used to suggest
 * "your next workout is on <day>" when today is a rest day. Returns the
 * input unchanged if it's already a workout day.
 */
export function nextWorkoutDay(
  restDaysOfWeek: ReadonlySet<number> | number[],
  fromDate: Date = new Date(),
): UpcomingDay {
  const upcoming = getUpcomingDays(14, restDaysOfWeek, fromDate);
  const next = upcoming.find((d) => !d.isRestDay);
  return next ?? upcoming[0];
}

// ──────────────────────────────────────────────────────────────────────
// Cycle-aware rolling picker
// ──────────────────────────────────────────────────────────────────────
// The split-selection picker renders a rolling window of upcoming calendar
// days. Each non-rest day is labeled with its day-of-split (1..4), derived
// from the user's last completed workout: the next workout day is
// `getNextSplitDay(lastDay)`, the one after that is +1 (mod 4), and so on.
// Rest days get null and are rendered as visually deactivated.
//
// This is a SUGGESTION, not a constraint: the cycle counter only advances
// when a workout is actually logged. If the user skips a non-rest day, the
// next render recomputes from the (unchanged) last-completed-day — so the
// suggested split-day for "today" stays put until they log.

export interface UpcomingWorkoutSlot extends UpcomingDay {
  /**
   * The day-of-split (1..4) suggested for this calendar day, or null if
   * it's a rest day. Drives the row label ("Day 1" vs "Rest").
   */
  splitDay: number | null;
}

/**
 * Returns the next `count` calendar days as workout slots, each annotated
 * with its suggested day-of-split (or null for rest days). The cycle
 * starts at `getNextSplitDay(lastCompletedDay)` and walks forward through
 * non-rest days only.
 *
 *   lastCompletedDay = 1 → first non-rest slot is Day 2, next is Day 3, ...
 *   lastCompletedDay = null → first non-rest slot is Day 1 (new-user default)
 */
export function getUpcomingWorkoutSlots(
  count: number,
  restDaysOfWeek: ReadonlySet<number> | number[],
  lastCompletedDay: number | null | undefined,
  fromDate: Date = new Date(),
): UpcomingWorkoutSlot[] {
  const upcoming = getUpcomingDays(count, restDaysOfWeek, fromDate);
  let cursor = getNextSplitDay(lastCompletedDay);
  return upcoming.map((day) => {
    const slot: UpcomingWorkoutSlot = { ...day, splitDay: null };
    if (!day.isRestDay) {
      slot.splitDay = cursor;
      cursor = (cursor % MAX_SPLIT_DAY) + MIN_SPLIT_DAY; // 4 → 1
    }
    return slot;
  });
}
