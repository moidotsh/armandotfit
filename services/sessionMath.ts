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
 * stands in (the bodyweight factor × the user's bodyweight). */
export function setVolume(
  set: { reps: number | null; weight: number | null },
  bodyweightEffectiveKg?: number,
): number {
  if (!isSetFilled(set)) return 0;
  const weight =
    set.weight != null && set.weight > 0
      ? set.weight
      : bodyweightEffectiveKg ?? 0;
  return (set.reps as number) * weight;
}

/** Volume across an exercise's sets. */
export function sumVolume(
  sets: ReadonlyArray<{ reps: number | null; weight: number | null }>,
  bodyweightEffectiveKg?: number,
): number {
  return sets.reduce((acc, s) => acc + setVolume(s, bodyweightEffectiveKg), 0);
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
