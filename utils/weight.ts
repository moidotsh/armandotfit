// utils/weight.ts
//
// THE WEIGHT UNIT SYSTEM (gauge-thesis §4; the owner's pounds
// request). Storage is and stays KILOGRAMS — every logged_sets row,
// every derivation, every rail ratio. The unit preference
// (users.weight_unit) is a DISPLAY concern only: values convert at
// read, steppers step in the display unit, and inputs accept display
// values. Computed-at-read, nothing stored, nothing migrated.
//
// The rails are unit-INVARIANT (they encode ratios, and conversion is
// a shared factor) — only digit-bearing surfaces convert.

import type { WeightUnit } from '../shared/types';

// Re-exported so callers can import the unit type from either home
// (shared/types owns the declaration; this module owns the math).
export type { WeightUnit };

/** Exactly 1 lb in kg (the international avoirdupois definition). */
export const KG_PER_LB = 0.45359237;

/** True when the string is a unit we know how to render. */
export function isWeightUnit(v: unknown): v is WeightUnit {
  return v === 'kg' || v === 'lb';
}

/** Storage kg → the display value in the unit (kg passes through). */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  if (!Number.isFinite(kg)) return 0;
  if (unit === 'kg') return kg;
  return kg / KG_PER_LB;
}

/** A display value in the unit → storage kg (kg passes through). */
export function fromDisplayWeight(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value)) return 0;
  if (unit === 'kg') return value;
  return value * KG_PER_LB;
}

/**
 * The display value rounded for reading: whole numbers stay whole,
 * others carry one decimal (60 → "60", 61.25 → "61.3", 132.28 lb →
 * "132.3"). The digit rounds for reading only — storage keeps the
 * exact value.
 */
export function roundDisplayWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const r = Math.round(value * 10) / 10;
  return Number.isInteger(r) ? r : r;
}

/** The stepper's step in DISPLAY units: 2.5 kg / 5 lb. */
export function weightStep(unit: WeightUnit): number {
  return unit === 'kg' ? 2.5 : 5;
}

/** The unit's printed suffix. */
export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'kg' : 'lb';
}

/** A single load for display: "60", "132.5" (no suffix). */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return String(roundDisplayWeight(toDisplayWeight(kg, unit)));
}

/** A volume/tonnage total for display: "7,858" (grouped, no suffix). */
export function formatVolumeWeight(kgTotal: number, unit: WeightUnit): string {
  const v = toDisplayWeight(kgTotal, unit);
  return Math.round(v).toLocaleString('en-US');
}
