// services/chartData.ts
//
// Chart derivations, computed at read from raw session history
// (gauge-thesis §0 — nothing stored, nothing aggregated server-side).
//
//   • THE TRAJECTORY — an exercise's top set per session, with each
//     point carrying its TAG SIGNATURE. The signature is the
//     realization context (machine / grip / technique): points group
//     by signature so the owner can merge or exclude variants — a
//     different machine IS a different trajectory, and mixing them
//     would mislead (the identity test's own logic, applied to
//     graphs).
//   • THE MUSCLE SHARE — volume credited to the catalog's muscles
//     (primaries full, secondaries half) over a date range.

import {
  SYSTEM_EXERCISES,
  SYSTEM_EXERCISES_BY_SLUG,
  MUSCLE_DISPLAY_NAMES,
  type MuscleSlug,
} from '../shared/exercises';
import type { SessionWithDetails } from '../shared/types';
import type { ResolvedSlot } from '../shared/exercises/splits';

/** Catalog identity joins by NAME (lowercased) — the data-spine rule. */
const CATALOG_BY_NAME = new Map(
  SYSTEM_EXERCISES.map((e) => [e.name.toLowerCase(), e] as const),
);

/** One point on the trajectory: the session's top set for the lift. */
export interface TrajectoryPoint {
  /** Session start, epoch ms. */
  at: number;
  /** The session's heaviest set for this exercise, in kg (storage). */
  weight: number;
  reps: number;
  /** The logged exercise's tags — the point's variant identity. */
  tags: string[];
  /** Stable key of the sorted tag set — the signature. */
  signature: string;
}

/** A tag signature the owner can filter by. */
export interface TrajectoryGroup {
  signature: string;
  /** Display label: the tags joined, or 'no tags'. */
  label: string;
  points: TrajectoryPoint[];
}

export interface Trajectory {
  /** Chronological points (all variants merged). */
  points: TrajectoryPoint[];
  /** Variant groups seen in history (≥1 when any history exists). */
  groups: TrajectoryGroup[];
}

function signatureOf(tags: string[]): string {
  return [...tags].sort().join('·') || '__none';
}

/**
 * Derive the trajectory for one exercise NAME from session history.
 * A point is the heaviest set logged for that name in each session
 * (ties → the first). Points carry their tag signature for filtering.
 */
export function deriveTrajectory(
  sessions: SessionWithDetails[],
  exerciseName: string,
): Trajectory {
  const target = exerciseName.toLowerCase();
  const bySignature = new Map<string, TrajectoryGroup>();
  const points: TrajectoryPoint[] = [];

  // History arrives latest-first; walk oldest-first for chronology.
  for (const session of [...sessions].reverse()) {
    const match = session.exercises.find(
      (e) => e.exerciseName.toLowerCase() === target,
    );
    if (!match || match.sets.length === 0) continue;
    let top = match.sets[0];
    for (const s of match.sets) {
      if ((s.weight ?? 0) > (top.weight ?? 0)) top = s;
    }
    const tags = match.tags ?? [];
    const point: TrajectoryPoint = {
      at: new Date(session.startedAt).getTime(),
      weight: top.weight ?? 0,
      reps: top.reps ?? 0,
      tags,
      signature: signatureOf(tags),
    };
    points.push(point);
    let group = bySignature.get(point.signature);
    if (!group) {
      group = {
        signature: point.signature,
        label: tags.length > 0 ? tags.join(' · ') : 'no tags',
        points: [],
      };
      bySignature.set(point.signature, group);
    }
    group.points.push(point);
  }

  return {
    points,
    groups: [...bySignature.values()].sort((a, b) => b.points.length - a.points.length),
  };
}

/** A muscle's volume share over a range. */
export interface MuscleShareRow {
  muscle: string;
  /** Credited volume in kg (primaries full, secondaries half). */
  volume: number;
  /** Share of the range's credited total, 0..1. */
  share: number;
}

/**
 * Credit set volume to muscles over the last `daysBack` days:
 * primaries count full, secondaries half (a set's work lands mostly
 * where the lift targets). Exercises join the catalog by NAME;
 * custom lifts the catalog doesn't know are skipped (their muscles
 * are unknown — inventing them would mislead).
 */
export function deriveMuscleShare(
  sessions: SessionWithDetails[],
  daysBack = 90,
): MuscleShareRow[] {
  const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const byMuscle = new Map<string, number>();
  for (const session of sessions) {
    const at = new Date(session.startedAt).getTime();
    if (at < since) continue;
    for (const ex of session.exercises) {
      // Identity joins by NAME (data.ts); slug only rides the program.
      const entry = CATALOG_BY_NAME.get(ex.exerciseName.toLowerCase());
      if (!entry) continue;
      const volume = ex.sets.reduce(
        (n, s) => n + (s.weight ?? 0) * (s.reps ?? 0),
        0,
      );
      if (volume <= 0) continue;
      for (const m of entry.primaryMuscles) {
        const key = MUSCLE_DISPLAY_NAMES[m as MuscleSlug] ?? m;
        byMuscle.set(key, (byMuscle.get(key) ?? 0) + volume);
      }
      for (const m of entry.secondaryMuscles) {
        const key = MUSCLE_DISPLAY_NAMES[m as MuscleSlug] ?? m;
        byMuscle.set(key, (byMuscle.get(key) ?? 0) + volume * 0.5);
      }
    }
  }
  const total = [...byMuscle.values()].reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  return [...byMuscle.entries()]
    .map(([muscle, volume]) => ({ muscle, volume, share: volume / total }))
    .sort((a, b) => b.volume - a.volume);
}

// ── The chart suite, round two ─────────────────────────────────────────
// (the owner's approved asks: per-exercise volume, e1RM overlay, PR
// timeline, weekly volume by muscle group — still all computed at read)

/** Epley estimated 1RM from a set. */
export function estOneRm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/** One week of an exercise's volume (kg, storage units). */
export interface ExerciseWeekVolume {
  /** Monday-start week key (YYYY-M-D). */
  weekStart: string;
  volume: number;
}

/**
 * An exercise's tonnage bucketed by week, respecting the variant
 * filter (excluded tag signatures drop their rows). Complements the
 * trajectory: the line reads strength, the bars read work.
 */
export function deriveExerciseVolumeByWeek(
  sessions: SessionWithDetails[],
  exerciseName: string,
  excluded?: ReadonlySet<string>,
): ExerciseWeekVolume[] {
  const target = exerciseName.toLowerCase();
  const byWeek = new Map<string, number>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (ex.exerciseName.toLowerCase() !== target) continue;
      if (ex.sets.length === 0) continue;
      const sig = signatureOf(ex.tags ?? []);
      if (excluded?.has(sig)) continue;
      const volume = ex.sets.reduce((n, s) => n + (s.weight ?? 0) * (s.reps ?? 0), 0);
      const key = weekKey(session.startedAt);
      byWeek.set(key, (byWeek.get(key) ?? 0) + volume);
    }
  }
  return [...byWeek.entries()]
    .map(([weekStart, volume]) => ({ weekStart, volume }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - day);
  // Zero-padded so week keys sort chronologically as strings.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A fallen record: the session where an exercise's best first moved. */
export interface PrEvent {
  at: number;
  exerciseName: string;
  /** The new best top-set weight (kg, storage). */
  weight: number;
  reps: number;
  tags: string[];
}

/**
 * The PR timeline: walking history oldest→latest per exercise, every
 * session that raised that exercise's best top-set weight is a record.
 * Returns latest-first (a feed), capped.
 */
export function derivePrTimeline(
  sessions: SessionWithDetails[],
  cap = 8,
): PrEvent[] {
  const best = new Map<string, number>();
  const events: PrEvent[] = [];
  for (const session of [...sessions].reverse()) {
    for (const ex of session.exercises) {
      if (ex.sets.length === 0) continue;
      let top = ex.sets[0];
      for (const s of ex.sets) {
        if ((s.weight ?? 0) > (top.weight ?? 0)) top = s;
      }
      const key = ex.exerciseName.toLowerCase();
      const prev = best.get(key) ?? 0;
      if ((top.weight ?? 0) > prev) {
        best.set(key, top.weight ?? 0);
        events.push({
          at: new Date(session.startedAt).getTime(),
          exerciseName: ex.exerciseName,
          weight: top.weight ?? 0,
          reps: top.reps ?? 0,
          tags: ex.tags ?? [],
        });
      }
    }
  }
  return events.reverse().slice(0, cap);
}

/** The muscle groups (chart-round-two vocabulary, derived from slugs). */
export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

const GROUP_OF_MUSCLE: Record<string, MuscleGroup> = {
  chest: 'chest', 'upper-chest': 'chest', 'lower-chest': 'chest',
  'upper-back': 'back', lats: 'back', 'lower-back': 'back', traps: 'back', rhomboids: 'back',
  'front-delts': 'shoulders', 'side-delts': 'shoulders', 'rear-delts': 'shoulders',
  biceps: 'arms', triceps: 'arms', forearms: 'arms',
  quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs', tibialis: 'legs',
  abs: 'core', 'lower-abs': 'core', obliques: 'core',
};

/** One week's credited volume split by muscle group. */
export interface GroupWeekVolume {
  weekStart: string;
  byGroup: Record<MuscleGroup, number>;
  total: number;
}

/**
 * Weekly volume by muscle group (primaries full, secondaries half),
 * Monday-start weeks, oldest→latest, capped to `weeks` most recent.
 */
export function deriveWeeklyGroupVolume(
  sessions: SessionWithDetails[],
  weeks = 10,
): GroupWeekVolume[] {
  const byWeek = new Map<string, Record<MuscleGroup, number>>();
  for (const session of sessions) {
    let week: Record<MuscleGroup, number> | undefined;
    for (const ex of session.exercises) {
      const entry = CATALOG_BY_NAME.get(ex.exerciseName.toLowerCase());
      if (!entry) continue;
      const volume = ex.sets.reduce((n, s) => n + (s.weight ?? 0) * (s.reps ?? 0), 0);
      if (volume <= 0) continue;
      week ??= { chest: 0, back: 0, shoulders: 0, arms: 0, legs: 0, core: 0 };
      for (const m of entry.primaryMuscles) {
        const g = GROUP_OF_MUSCLE[m];
        if (g) week[g] += volume;
      }
      for (const m of entry.secondaryMuscles) {
        const g = GROUP_OF_MUSCLE[m];
        if (g) week[g] += volume * 0.5;
      }
    }
    if (!week) continue;
    const key = weekKey(session.startedAt);
    const existing = byWeek.get(key);
    if (existing) {
      for (const g of MUSCLE_GROUPS) existing[g] += week[g];
    } else {
      byWeek.set(key, week);
    }
  }
  return [...byWeek.entries()]
    .map(([weekStart, byGroup]) => ({
      weekStart,
      byGroup,
      total: MUSCLE_GROUPS.reduce((n, g) => n + byGroup[g], 0),
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-weeks);
}


// ── THE PLAN'S SHARE (the timetable's muscle breakdown) ────────────────

export interface PlanMuscleShareRow {
  muscle: MuscleSlug;
  /** Programmed set-count credit (primary muscles, per slot). */
  sets: number;
  /** Share of the day's programmed work, 0–100 (rounded). */
  share: number;
}

/**
 * A day-plan's muscle share, computed at read from the SLOTS the
 * program authors: each slot credits its programmed set count (max,
 * else min) to each of its primary muscles. The timetable prints it as
 * GLYPH BARS — type as data (the register grid's own trick), never a
 * drawn chart. Sorted most-work-first, capped to `cap` rows.
 */
export function derivePlanMuscleShare(
  slots: ResolvedSlot[],
  cap = 5,
): PlanMuscleShareRow[] {
  const tally = new Map<MuscleSlug, number>();
  let total = 0;
  for (const slot of slots) {
    const sets = slot.sets[1] > 0 ? slot.sets[1] : slot.sets[0];
    for (const m of SYSTEM_EXERCISES_BY_SLUG[slot.exercise]?.primaryMuscles ?? []) {
      tally.set(m, (tally.get(m) ?? 0) + sets);
      total += sets;
    }
  }
  if (total === 0) return [];
  return [...tally.entries()]
    .map(([muscle, sets]) => ({ muscle, sets, share: Math.round((sets / total) * 100) }))
    .sort((a, b) => b.sets - a.sets)
    .slice(0, cap);
}
