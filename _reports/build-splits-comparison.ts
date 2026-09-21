// _reports/build-splits-comparison.ts
// Normalizes all four split contributions into one comparable JSON.
// Run: bun _reports/build-splits-comparison.ts

import { TWO_A_DAY_SPLITS, ONE_A_DAY_SPLITS } from '../shared/exercises/splits';
import { SYSTEM_EXERCISES } from '../shared/exercises/data';
import { writeFileSync } from 'fs';

const byName = new Map(SYSTEM_EXERCISES.map(e => [e.name.toLowerCase(), e.slug]));
const resolve = (name: string): string => {
  const slug = byName.get(name.toLowerCase());
  if (slug) return slug;
  // Try partial matches (e.g. "Machine Shoulder Press" → "shoulder-press")
  const cleaned = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  for (const [n, s] of byName) {
    if (n === cleaned || n.includes(cleaned) || cleaned.includes(n)) return s;
  }
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const parseRange = (v: unknown): [number, number] => {
  if (typeof v === 'string') {
    const m = v.match(/(\d+)\s*[-–]\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2])] : [parseInt(v) || 0, parseInt(v) || 0];
  }
  if (Array.isArray(v)) return [v[0], v[1]];
  return [Number(v) || 0, Number(v) || 0];
};

interface RawSlot { exercise: string; sets: unknown; reps: unknown; tags?: string[] }
const norm = (s: RawSlot) => ({
  exercise: resolve(s.exercise),
  suggestedTags: s.tags ?? [],
  sets: parseRange(s.sets),
  reps: parseRange(s.reps),
});

// ── The no-context shape (gpt-5.6nocontext and sonnet5-nocontext are identical) ──
const noContextTwoADay = {
  day1: {
    am: [
      { exercise: 'Machine Chest Fly', sets: 2, reps: '12-15', tags: ['controlled'] },
      { exercise: 'Leg Press', sets: 3, reps: '8-10', tags: ['feet-high', 'glute-bias'] },
      { exercise: 'Leg Raise', sets: '2-3', reps: '15-20', tags: ['captains-chair'] },
      { exercise: 'Hip Thrust', sets: 3, reps: '8-10', tags: ['machine'] },
    ],
    pm: [
      { exercise: 'Incline Barbell Press', sets: 3, reps: '6-8', tags: [] },
      { exercise: 'Shoulder Press', sets: 2, reps: '8-10', tags: ['machine'] },
      { exercise: 'Cable Lateral Raise', sets: 3, reps: '15-20', tags: ['egyptian', 'handle'] },
      { exercise: 'Cable Overhead Tricep Extension', sets: '2-3', reps: '10-12', tags: ['rope', 'neutral'] },
    ],
  },
  day2: {
    am: [
      { exercise: 'Machine Shrug', sets: 2, reps: '8-10', tags: [] },
      { exercise: 'Machine Leg Curl', sets: 3, reps: '8-10', tags: ['seated'] },
      { exercise: 'Tibia Raise', sets: '2-3', reps: '15-20', tags: ['machine'] },
      { exercise: 'Glute Kickback', sets: '2-3', reps: '12-20', tags: ['cable'] },
    ],
    pm: [
      { exercise: 'Lat Pulldown', sets: 3, reps: '8-10', tags: ['underhand', 'lat-bar'] },
      { exercise: 'Cable Row', sets: 3, reps: '8-10', tags: ['seated', 'v-grip', 'neutral'] },
      { exercise: 'Dumbbell Curl', sets: 3, reps: '8-10', tags: ['seated', 'incline'] },
      { exercise: 'Face Pull', sets: '2-3', reps: '15-20', tags: ['rope', 'neutral'] },
    ],
  },
  day3: {
    am: [
      { exercise: 'Straight-Arm Pulldown', sets: '2-3', reps: '12-15', tags: ['rope', 'neutral'] },
      { exercise: 'Bulgarian Split Squat', sets: 3, reps: '8-10', tags: ['dumbbell', 'per-leg', 'glute-bias'] },
      { exercise: 'Standing Machine Calf Raise', sets: 3, reps: '15-20', tags: [] },
      { exercise: 'Back Extension', sets: 3, reps: '10-12', tags: ['glute-bias'] },
    ],
    pm: [
      { exercise: 'Machine Incline Press', sets: 3, reps: '8-10', tags: [] },
      { exercise: 'Machine Dip', sets: 2, reps: '8-10', tags: [] },
      { exercise: 'Dumbbell Overhead Press', sets: 2, reps: '8-10', tags: [] },
      { exercise: 'Cable Lateral Raise', sets: 3, reps: '15-20', tags: ['egyptian', 'handle'] },
    ],
  },
  day4: {
    am: [
      { exercise: 'Incline Dumbbell Fly', sets: 2, reps: '12-15', tags: [] },
      { exercise: 'Leg Extension', sets: 3, reps: '10-12', tags: [] },
      { exercise: 'Machine Ab Crunch', sets: '2-3', reps: '15-20', tags: ['eccentric'] },
      { exercise: 'Glute Kickback', sets: '2-3', reps: '12-15', tags: ['cable'] },
    ],
    pm: [
      { exercise: 'Cable Row', sets: 3, reps: '8-10', tags: ['seated', 'v-grip', 'neutral'] },
      { exercise: 'Cable Curl', sets: 3, reps: '10-12', tags: ['rope', 'neutral'] },
      { exercise: 'Face Pull', sets: '2-3', reps: '15-20', tags: ['rope', 'neutral'] },
      { exercise: 'Machine Shrug', sets: 2, reps: '8-10', tags: [] },
    ],
  },
};

const noContextOneADay = {
  day1: [
    { exercise: 'Machine Chest Fly', sets: 2, reps: '12-15', tags: [] },
    { exercise: 'Leg Press', sets: 3, reps: '8-10', tags: ['feet-high'] },
    { exercise: 'Leg Raise', sets: '2-3', reps: '15-20', tags: ['captains-chair'] },
    { exercise: 'Hip Thrust', sets: 3, reps: '8-10', tags: ['machine'] },
    { exercise: 'Incline Barbell Press', sets: 3, reps: '6-8', tags: [] },
    { exercise: 'Cable Lateral Raise', sets: 3, reps: '15-20', tags: ['egyptian', 'handle'] },
    { exercise: 'Cable Overhead Tricep Extension', sets: '2-3', reps: '10-12', tags: ['rope', 'neutral'] },
  ],
  day2: [
    { exercise: 'Machine Leg Curl', sets: 3, reps: '8-10', tags: ['seated'] },
    { exercise: 'Tibia Raise', sets: '2-3', reps: '15-20', tags: ['machine'] },
    { exercise: 'Glute Kickback', sets: '2-3', reps: '12-20', tags: ['cable'] },
    { exercise: 'Lat Pulldown', sets: 3, reps: '8-10', tags: ['underhand', 'lat-bar'] },
    { exercise: 'Cable Row', sets: 3, reps: '8-10', tags: ['seated', 'v-grip', 'neutral'] },
    { exercise: 'Dumbbell Curl', sets: 3, reps: '8-10', tags: ['seated', 'incline'] },
    { exercise: 'Face Pull', sets: '2-3', reps: '15-20', tags: ['rope', 'neutral'] },
  ],
  day3: [
    { exercise: 'Bulgarian Split Squat', sets: 3, reps: '8-10', tags: ['dumbbell', 'per-leg', 'glute-bias'] },
    { exercise: 'Standing Machine Calf Raise', sets: 3, reps: '15-20', tags: [] },
    { exercise: 'Back Extension', sets: 3, reps: '10-12', tags: ['glute-bias'] },
    { exercise: 'Machine Incline Press', sets: 3, reps: '8-10', tags: [] },
    { exercise: 'Machine Dip', sets: 2, reps: '8-10', tags: [] },
    { exercise: 'Dumbbell Overhead Press', sets: 2, reps: '8-10', tags: [] },
    { exercise: 'Cable Lateral Raise', sets: 3, reps: '15-20', tags: ['egyptian', 'handle'] },
  ],
  day4: [
    { exercise: 'Leg Extension', sets: 3, reps: '10-12', tags: [] },
    { exercise: 'Machine Ab Crunch', sets: '2-3', reps: '15-20', tags: ['eccentric'] },
    { exercise: 'Glute Kickback', sets: '2-3', reps: '12-15', tags: ['cable'] },
    { exercise: 'Cable Row', sets: 3, reps: '8-10', tags: ['seated', 'v-grip', 'neutral'] },
    { exercise: 'Cable Curl', sets: 3, reps: '10-12', tags: ['rope', 'neutral'] },
    { exercise: 'Face Pull', sets: '2-3', reps: '15-20', tags: ['rope', 'neutral'] },
    { exercise: 'Incline Dumbbell Fly', sets: 2, reps: '12-15', tags: [] },
  ],
};

const buildNoContext = (contributor: string) => ({
  contributor,
  twoADay: Array.from({ length: 4 }, (_, i) => ({
    day: i + 1,
    title: `Workout Day ${i + 1}`,
    am: (noContextTwoADay as any)[`day${i + 1}`].am.map(norm),
    pm: (noContextTwoADay as any)[`day${i + 1}`].pm.map(norm),
  })),
  oneADay: Array.from({ length: 4 }, (_, i) => ({
    day: i + 1,
    title: `Full Body Day ${i + 1}`,
    session: (noContextOneADay as any)[`day${i + 1}`].map(norm),
  })),
});

// ── sonnet5-context (already normalized from the table) ──
const ctx = JSON.parse(await Bun.file('/tmp/ctx.json').text());

const all = [
  { contributor: 'original', twoADay: TWO_A_DAY_SPLITS, oneADay: ONE_A_DAY_SPLITS },
  ctx,
  buildNoContext('gpt-5.6nocontext'),
  buildNoContext('sonnet5-nocontext'),
];

writeFileSync(
  '_reports/splits-comparison.json',
  JSON.stringify({ splits: all }, null, 2),
);
// s11-exempt: one-off build script
  console.log(`written: ${all.length} contributions`);
