// shared/exercises/cardio.ts
//
// THE CARDIO REGISTRY — the machines' field vocabulary (pass C1, the
// owner-sanctioned seventh table's TS half). Cardio's unit of work is
// DURATION AT AN INTENSITY with machine-reported outcomes; the
// stations declare which fields they ask for, what each field means,
// and what its stepper steps by. Vocabulary lives HERE, never in the
// schema (the DB stores TEXT stations + nullable numbers so the list
// extends without migrations).
//
// DISPLAY UNITS: metric for v1 (km, km/h). The mi/mph display toggle
// (following users.weight_unit) is a planned extension — storage is
// and stays metric (m, km/h), the same law as kilograms.

/** The station keys — mirror the catalog slugs, joined by name at read. */
export type CardioStationKey = 'treadmill' | 'bike' | 'stairmaster' | 'walk-loop';

/** One armed-able field of a cardio dock. */
export interface CardioFieldSpec {
  key: 'duration' | 'level' | 'speed' | 'laps' | 'distance' | 'kcal';
  /** The field's furniture word (caps, ≤3 words). */
  label: string;
  /** The stepper's step in the field's own unit. */
  step: number;
  /** The value's printed unit (display only). */
  unit: string;
  /** The whisper under the armed field — what the machine calls it. */
  hint?: string;
}

export interface CardioStationSpec {
  key: CardioStationKey;
  /** The catalog entry's name — the join key. */
  name: string;
  /** The prescription fields (the statement-rank row). */
  params: Array<CardioFieldSpec>;
  /** The outcome fields (filled off the machine at the end). */
  outcomes: Array<CardioFieldSpec>;
  /** The walk loop's lap length in meters (distance derives from laps). */
  loopMeters?: number;
}

const DURATION: CardioFieldSpec = {
  key: 'duration', label: 'TIME', step: 60, unit: 's', hint: 'mm:ss at the counter',
};
const DISTANCE: CardioFieldSpec = {
  key: 'distance', label: 'DIST', step: 100, unit: 'm', hint: 'the console, keyed at the end',
};
const KCAL: CardioFieldSpec = {
  key: 'kcal', label: 'KCAL', step: 10, unit: '', hint: 'the machine\u2019s claim — a claim, not a measurement',
};

export const CARDIO_STATIONS: Record<CardioStationKey, CardioStationSpec> = {
  treadmill: {
    key: 'treadmill',
    name: 'Treadmill',
    params: [
      { key: 'speed', label: 'SPEED', step: 0.5, unit: 'km/h' },
      { key: 'level', label: 'INCLINE', step: 0.5, unit: '%', hint: 'the deck\u2019s grade' },
    ],
    outcomes: [DISTANCE, KCAL],
  },
  bike: {
    key: 'bike',
    name: 'Stationary Bike',
    params: [{ key: 'level', label: 'LEVEL', step: 1, unit: '', hint: 'the machine\u2019s resistance dial' }],
    outcomes: [DISTANCE, KCAL],
  },
  stairmaster: {
    key: 'stairmaster',
    name: 'Stairmaster',
    params: [{ key: 'level', label: 'LEVEL', step: 1, unit: '' }],
    outcomes: [KCAL],
  },
  'walk-loop': {
    key: 'walk-loop',
    name: 'Walk Loop',
    params: [{ key: 'laps', label: 'LAPS', step: 1, unit: '', hint: 'one lap = 100 m' }],
    outcomes: [],
    loopMeters: 100,
  },
};

export const CARDIO_STATION_KEYS = Object.keys(CARDIO_STATIONS) as CardioStationKey[];

/** Catalog slug → station key (the library's adder dispatch). */
export function cardioStationBySlug(slug: string): CardioStationKey | null {
  if (slug === 'treadmill' || slug === 'stationary-bike' || slug === 'stairmaster' || slug === 'walk-loop') {
    return slug === 'stationary-bike' ? 'bike' : (slug as CardioStationKey);
  }
  return null;
}

/** Whether a catalog entry is a cardio station (the adder dispatch). */
export function isCardioSlug(slug: string): boolean {
  return cardioStationBySlug(slug) != null;
}

// ── Formatting (metric v1 — figures print mono at their call sites) ────

/** Seconds → `mm:ss` (or `h:mm:ss` past the hour). */
export function formatCardioDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(h > 0 ? m : m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Meters → `4.8 km` (or `350 m` under a kilometer). */
export function formatCardioDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

/** Minutes as a compact figure (`142 min`). */
export function formatCardioMinutes(totalSec: number): string {
  return `${Math.round(totalSec / 60)} min`;
}

/** The signed Δ between two durations, printed as `−0:42` / `+1:10` (or `=`). */
export function formatCardioDelta(currentSec: number, previousSec: number): string {
  const d = currentSec - previousSec;
  if (d === 0) return '=';
  const sign = d < 0 ? '\u2212' : '+';
  return `${sign}${formatCardioDuration(Math.abs(d))}`;
}
