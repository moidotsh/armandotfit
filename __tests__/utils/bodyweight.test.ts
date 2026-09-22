// __tests__/utils/bodyweight.test.ts
// THE BODYWEIGHT LOAD FACTOR — goldens for the pattern rules and the
// effective-weight computation.

import { describe, expect, it } from 'vitest';
import {
  bodyweightFactorFor,
  effectiveSetWeight,
  bodyweightAsOf,
} from '../../utils/bodyweight';

describe('bodyweightFactorFor', () => {
  it('push-up variants carry the Ebben 2011 factors', () => {
    expect(bodyweightFactorFor('Push-Up')).toBe(0.64);
    expect(bodyweightFactorFor('Pushups')).toBe(0.64);
    expect(bodyweightFactorFor('Incline Push-Up')).toBe(0.45);
    expect(bodyweightFactorFor('Decline Push-Up')).toBe(0.74);
  });

  it('weighted/banded push-ups carry no factor', () => {
    expect(bodyweightFactorFor('Weighted Push-Up')).toBeNull();
    expect(bodyweightFactorFor('Push-Ups - With Bands')).toBeNull();
  });

  it('pull-ups and chin-ups carry the near-full factor', () => {
    expect(bodyweightFactorFor('Pullups')).toBe(0.95);
    expect(bodyweightFactorFor('Chin-Up')).toBe(0.95);
  });

  it('assisted pull-ups carry no factor (band reduces load)', () => {
    expect(bodyweightFactorFor('Band Assisted Pull-Up')).toBeNull();
  });

  it('leg raises carry the legs-only factor', () => {
    expect(bodyweightFactorFor('Captain\'s Chair Leg Raise')).toBe(0.35);
    expect(bodyweightFactorFor('Hanging Leg Raise')).toBe(0.35);
    expect(bodyweightFactorFor('Hanging Knee Raise')).toBe(0.35);
  });

  it('machine leg raises carry no factor', () => {
    expect(bodyweightFactorFor('Machine Leg Raise')).toBeNull();
  });

  it('back extensions carry the torso factor', () => {
    expect(bodyweightFactorFor('Back Extension')).toBe(0.55);
    expect(bodyweightFactorFor('Hyperextensions')).toBe(0.55);
  });

  it('glute bridges carry the pelvis factor', () => {
    expect(bodyweightFactorFor('Glute Bridge')).toBe(0.40);
  });

  it('barbell glute bridges carry no factor (loaded)', () => {
    expect(bodyweightFactorFor('Barbell Glute Bridge')).toBeNull();
  });

  it('bodyweight squats carry half', () => {
    expect(bodyweightFactorFor('Bodyweight Squat')).toBe(0.50);
    expect(bodyweightFactorFor('Air Squat')).toBe(0.50);
  });

  it('pistol squats carry most of the body', () => {
    expect(bodyweightFactorFor('Pistol Squat')).toBe(0.85);
  });

  it('lunges and split squats carry the front-leg factor', () => {
    expect(bodyweightFactorFor('Alternating Lunges')).toBe(0.65);
    expect(bodyweightFactorFor('Bulgarian Split Squat')).toBe(0.65);
  });

  it('weighted lunges carry no factor', () => {
    expect(bodyweightFactorFor('Dumbbell Lunges')).toBeNull();
    expect(bodyweightFactorFor('Barbell Lunge')).toBeNull();
  });

  it('crunches carry the supine-torso factor', () => {
    expect(bodyweightFactorFor('Floor Crunch')).toBe(0.25);
    expect(bodyweightFactorFor('3/4 Sit-Up')).toBe(0.25);
  });

  it('planks carry zero (isometric)', () => {
    expect(bodyweightFactorFor('Plank')).toBe(0.00);
    expect(bodyweightFactorFor('Side Plank')).toBe(0.00);
  });

  it('nordic curls carry the torso-pivot factor', () => {
    expect(bodyweightFactorFor('Nordic Hamstring Curl')).toBe(0.50);
  });

  it('bodyweight calf raises carry the ankle factor', () => {
    expect(bodyweightFactorFor('Single-Leg Calf Raise')).toBe(0.15);
  });

  it('machine calf raises carry no factor', () => {
    expect(bodyweightFactorFor('Standing Machine Calf Raise')).toBeNull();
  });

  it('dips carry the parallel-bar factor', () => {
    expect(bodyweightFactorFor('Dips')).toBe(0.70);
  });

  it('bench dips carry the lower factor', () => {
    expect(bodyweightFactorFor('Bench Dip')).toBe(0.55);
  });

  it('unknown exercises carry no factor', () => {
    expect(bodyweightFactorFor('Leg Press')).toBeNull();
    expect(bodyweightFactorFor('Lat Pulldown')).toBeNull();
    expect(bodyweightFactorFor('Machine Chest Fly')).toBeNull();
  });
});

describe('effectiveSetWeight', () => {
  it('a logged weight with no factor IS the effective weight', () => {
    expect(effectiveSetWeight(100, null, 100)).toBe(100);
  });

  it('a bodyweight exercise with added load is ADDITIVE', () => {
    // weighted push-up: bodyweight component + plate
    expect(effectiveSetWeight(62.5, 0.64, 100)).toBe(0.64 * 100 + 62.5);
    // back extension with a 25lb plate at 100kg bodyweight
    expect(effectiveSetWeight(25, 0.55, 100)).toBe(0.55 * 100 + 25);
  });

  it('bodyweight exercises compute factor × bodyweight', () => {
    expect(effectiveSetWeight(null, 0.35, 100)).toBe(35);
    expect(effectiveSetWeight(0, 0.64, 100)).toBe(64);
    expect(effectiveSetWeight(null, 0.95, 100)).toBe(95);
  });

  it('no factor and no weight reads zero', () => {
    expect(effectiveSetWeight(null, null, 100)).toBe(0);
    expect(effectiveSetWeight(null, 0.64, null)).toBe(0);
    expect(effectiveSetWeight(null, 0.64, 0)).toBe(0);
  });
});

describe('bodyweightAsOf — point-in-time resolution', () => {
  const entries = [
    { weightKg: 100, recordedAt: '2027-09-01T10:00:00Z' },
    { weightKg: 95, recordedAt: '2027-09-15T10:00:00Z' },
    { weightKg: 92, recordedAt: '2027-09-29T10:00:00Z' },
  ];

  it('uses the most recent entry at-or-before the session', () => {
    // Session on Sep 20 → the Sep 15 entry (95 kg) is the latest known
    expect(bodyweightAsOf(entries, '2027-09-20T08:00:00Z')).toBe(95);
  });

  it('uses the exact-date entry when it matches', () => {
    expect(bodyweightAsOf(entries, '2027-09-15T12:00:00Z')).toBe(95);
  });

  it('a session before all entries falls back to the earliest', () => {
    // The owner's case: workout happened, weight logged after
    expect(bodyweightAsOf(entries, '2027-08-30T08:00:00Z')).toBe(100);
  });

  it('a session after all entries uses the latest', () => {
    expect(bodyweightAsOf(entries, '2027-10-05T08:00:00Z')).toBe(92);
  });

  it('empty history returns null', () => {
    expect(bodyweightAsOf([], '2027-09-20T08:00:00Z')).toBeNull();
  });
});
