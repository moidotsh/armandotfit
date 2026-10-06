// services/sessionMath.ts
// Pure session arithmetic — nothing here is ever stored; every value
// derives from the draft's filled sets (a row is a done set) or from
// history at read time. Display-facing formatting lives here too so
// every surface formats identically.

/** Epley estimated 1RM — the comparison figure for best-set ranking. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/** A set counts when both reps and weight are filled. */
export function isSetFilled(set: { reps: number | null; weight: number | null }): boolean {
  return set.reps !== null && set.weight !== null;
}

/** Tonnage of one filled set (0 when unfilled). When the set carries
 * no weight AND a bodyweight effective load is given, that load
 * stands in (the bodyweight factor × the user's bodyweight).
 *
 * PER-SIDE — when the instance is tagged per-side, the stored load is
 * ONE limb's (the notebook's '30s'): both limbs move it, so the LOAD
 * doubles; the body does not (one body lifts, however many limbs). */
export function setVolume(
  set: { reps: number | null; weight: number | null },
  bodyweightEffectiveKg?: number,
  perSide = false,
): number {
  if (!isSetFilled(set)) return 0;
  // ADDITIVE — the bodyweight component (factor × bodyweight) rides
  // ON TOP of any loaded weight (a plate on back extensions).
  const weight = (set.weight ?? 0) * (perSide ? 2 : 1) + (bodyweightEffectiveKg ?? 0);
  return (set.reps as number) * weight;
}

/** Volume across an exercise's sets. */
export function sumVolume(
  sets: ReadonlyArray<{ reps: number | null; weight: number | null }>,
  bodyweightEffectiveKg?: number,
  perSide = false,
): number {
  return sets.reduce((acc, s) => acc + setVolume(s, bodyweightEffectiveKg, perSide), 0);
}

/** Format kilograms/units with thin thousands separators. */
export function formatVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString('en-US')}`;
}

/** Elapsed mm:ss between a start ISO and now (seconds clamped ≥ 0). */
export function formatElapsed(startedAtIso: string, now: number = Date.now()): string {
  const start = new Date(startedAtIso).getTime();
  const secs = Math.max(0, Math.floor((now - start) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** The session's living edge — the first station still OWED sets
 * (a target of "3×8–10" owes 3; an unread target owes only while
 * unstarted), else the last station when the house is full. The
 * Floor opens here and the SessionStrip names it: where you left
 * off, never the beginning. */
export function currentStationIndex(
  exercises: ReadonlyArray<{
    sets: ReadonlyArray<{ reps: number | null; weight: number | null }>;
    targetRx?: string | null;
  }>,
): number {
  if (exercises.length === 0) return 0;
  const owed = exercises.findIndex((e) => {
    const t = parseInt(e.targetRx?.split('×')[0] ?? '', 10);
    const target = Number.isFinite(t) && t > 0 ? t : 0;
    return target > 0 ? e.sets.length < target : e.sets.length === 0;
  });
  return owed === -1 ? exercises.length - 1 : owed;
}
