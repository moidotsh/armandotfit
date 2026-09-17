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

/** Tonnage of one filled set (0 when unfilled). */
export function setVolume(set: { reps: number | null; weight: number | null }): number {
  return isSetFilled(set) ? (set.reps as number) * (set.weight as number) : 0;
}

/** Volume across an exercise's sets. */
export function sumVolume(
  sets: ReadonlyArray<{ reps: number | null; weight: number | null }>,
): number {
  return sets.reduce((acc, s) => acc + setVolume(s), 0);
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
