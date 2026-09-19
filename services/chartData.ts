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
  MUSCLE_DISPLAY_NAMES,
  type MuscleSlug,
} from '../shared/exercises';
import type { SessionWithDetails } from '../shared/types';

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
