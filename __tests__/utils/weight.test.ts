import { describe, it, expect } from 'vitest';
import {
  toDisplayWeight,
  fromDisplayWeight,
  roundDisplayWeight,
  weightStep,
  weightUnitLabel,
  formatWeight,
  formatVolumeWeight,
  isWeightUnit,
} from '../../utils';

// THE WEIGHT UNIT SYSTEM (gauge-thesis §4): storage is and stays
// kilograms; the unit preference converts at read. Round-trips must
// be stable and the display rounding must never drift.

describe('conversion round-trips', () => {
  it('kg passes through untouched', () => {
    expect(toDisplayWeight(61.25, 'kg')).toBe(61.25);
    expect(fromDisplayWeight(61.25, 'kg')).toBe(61.25);
  });

  it('lb converts by the avoirdupois factor and back', () => {
    expect(toDisplayWeight(45.359237, 'lb')).toBeCloseTo(100, 5);
    expect(fromDisplayWeight(100, 'lb')).toBeCloseTo(45.359237, 5);
  });

  it('round-trips a typed pound value through storage and back', () => {
    const stored = fromDisplayWeight(135, 'lb');
    expect(roundDisplayWeight(toDisplayWeight(stored, 'lb'))).toBe(135);
    const stored5 = fromDisplayWeight(137.5, 'lb');
    expect(roundDisplayWeight(toDisplayWeight(stored5, 'lb'))).toBe(137.5);
  });
});

describe('display formatting', () => {
  it('whole numbers stay whole; others carry one decimal', () => {
    expect(roundDisplayWeight(60)).toBe(60);
    expect(roundDisplayWeight(61.25)).toBe(61.3);
    expect(roundDisplayWeight(132.28)).toBe(132.3);
  });

  it('formats a single load without a suffix', () => {
    expect(formatWeight(60, 'kg')).toBe('60');
    expect(formatWeight(61.25, 'kg')).toBe('61.3');
    expect(formatWeight(60, 'lb')).toBe('132.3');
  });

  it('formats volume totals grouped, rounded', () => {
    expect(formatVolumeWeight(7858, 'kg')).toBe('7,858');
    expect(formatVolumeWeight(1000, 'lb')).toBe('2,205');
  });
});

describe('steppers and labels', () => {
  it('steps 2.5 kg / 5 lb', () => {
    expect(weightStep('kg')).toBe(2.5);
    expect(weightStep('lb')).toBe(5);
  });

  it('labels the unit suffix', () => {
    expect(weightUnitLabel('kg')).toBe('kg');
    expect(weightUnitLabel('lb')).toBe('lb');
  });

  it('guards the stored string', () => {
    expect(isWeightUnit('kg')).toBe(true);
    expect(isWeightUnit('lb')).toBe(true);
    expect(isWeightUnit('stones')).toBe(false);
    expect(isWeightUnit(null)).toBe(false);
  });
});
