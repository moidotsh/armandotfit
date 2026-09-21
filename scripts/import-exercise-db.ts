// scripts/import-exercise-db.ts
//
// THE CATALOG IMPORTER — yuhonas/free-exercise-db (public domain, the
// Unlicense) into shared/exercises/importedData.ts. One-time, offline,
// keyless: read a local clone, map onto OUR schema (the coarse-slug
// law absorbs their vernacular), dedupe against the core catalog
// (ours wins), emit a deterministic file + the image manifest for the
// plate pass (sips resamples to 640px JPEGs in public/exercise-plates).
//
//   bun scripts/import-exercise-db.ts /path/to/free-exercise-db
//
// Laws honored here:
//   - The catalog stays TS, local, sole display source (data.ts
//     composes CORE + IMPORTED — one source of truth, two files).
//   - Coarse identity: their categories filter to the strength family;
//     names colliding with the core catalog are SKIPPED (ours wins).
//   - Muscle vocabulary maps onto OUR 22 slugs; unmapped vernacular
//     (abductors, adductors, neck) is dropped and counted, never
//     invented into new slugs — the promotion rule governs that.
//   - Nothing at runtime: no key, no fetch, no dependency.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const REPO = process.argv[2] ?? '/tmp/fedb';
const EX_DIR = join(REPO, 'exercises');
const OUT_TS = 'shared/exercises/importedData.ts';
const OUT_MANIFEST = '/tmp/plate-manifest.txt';

// ── The maps (explicit, reviewed — the coarse-slug law's absorption layer) ──

const KEEP_CATEGORIES = new Set(['strength', 'powerlifting', 'olympic weightlifting', 'strongman']);

const MODALITY_OF: Record<string, 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'floor'> = {
  barbell: 'barbell',
  'e-z curl bar': 'barbell',
  dumbbell: 'dumbbell',
  kettlebells: 'dumbbell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'floor',
  // The loose implements live on the mats — the gym's geography, not a
  // new zone.
  bands: 'floor',
  'medicine ball': 'floor',
  'exercise ball': 'floor',
  'foam roll': 'floor',
  other: 'floor',
};

const TYPE_OF: Record<string, 'free_weight' | 'cable' | 'machine' | 'calisthenic'> = {
  barbell: 'free_weight',
  'e-z curl bar': 'free_weight',
  dumbbell: 'free_weight',
  kettlebells: 'free_weight',
  cable: 'cable',
  machine: 'machine',
};

// Vernacular → our coarse slugs. 'shoulders' → side-delts (the generic
// delt; any delt rolls into the shoulders GROUP for THE BALANCE).
// Values, NOT keys: every consumer (MUSCLE_DISPLAY_NAMES, THE
// BALANCE's GROUP_OF_MUSCLE) indexes muscles by the slug VALUE
// ('abs', 'upper-back') — emitting keys rendered nothing.
const MUSCLE_OF: Record<string, string> = {
  abdominals: 'abs',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower-back',
  'middle back': 'upper-back',
  quadriceps: 'quads',
  shoulders: 'side-delts',
  traps: 'traps',
  triceps: 'triceps',
};


// ── CORE PLATES (the hand-reviewed alias table) ─────────────────────────
// Core-catalog lifts matched to their fedb figures BY NAME — every pair
// reviewed by hand (a wrong plate is worse than no plate; containment
// matching produced wrist curls for dumbbell curls and was rejected).
// Unlisted core lifts (Bulgarian Split Squat, Nordic Curl, Tibia Raise,
// the cardio stations…) carry no plate — the instructions carry them.
const CORE_PLATE_ALIASES: Record<string, string> = {
  'Incline Barbell Press': 'Barbell Incline Bench Press - Medium Grip',
  'Incline Dumbbell Fly': 'Incline Dumbbell Flyes',
  'Machine Chest Fly': 'Butterfly',
  'Machine Incline Press': 'Leverage Incline Chest Press',
  'Cable Overhead Tricep Extension': 'Triceps Overhead Extension with Rope',
  'Dumbbell Curl': 'Dumbbell Bicep Curl',
  'Cable Curl': 'Standing Biceps Cable Curl',
  'Cable Lateral Raise': 'Cable Seated Lateral Raise',
  'Shoulder Press': 'Standing Military Press',
  'Dumbbell Overhead Press': 'Dumbbell Shoulder Press',
  'Back Extension': 'Hyperextensions (Back Extensions)',
  'Machine Back Extension': 'Hyperextensions (Back Extensions)',
  'Cable Row': 'Seated Cable Rows',
  'Wide-Grip Cable Row': 'Seated Cable Rows',
  'Lat Pulldown': 'Wide-Grip Lat Pulldown',
  'Machine Shrug': 'Leverage Shrug',
  'Machine Leg Curl': 'Seated Leg Curl',
  'Leg Press Calf Raise': 'Calf Press On The Leg Press Machine',
  'Standing Machine Calf Raise': 'Smith Machine Calf Raise',
  'Leg Raise': 'Hanging Leg Raise',
  'Hanging Knee Raise': 'Hanging Leg Raise',
  'Floor Leg Raise': 'Flat Bench Lying Leg Raise',
  'Overhead Tricep Extension': 'Standing Dumbbell Triceps Extension',
  'Overhead Press': 'Standing Military Press',
  'Lateral Raise': 'Side Lateral Raise',
  'Lying Leg Curl': 'Lying Leg Curls',
  'Pull-up': 'Pullups',
  'Walking Lunge': 'Barbell Walking Lunge',
  'Dumbbell Pullover': 'Straight-Arm Dumbbell Pullover',
  'Bench Dip': 'Bench Dips',
  'Barbell Row': 'Bent Over Barbell Row',
  'Barbell Back Squat': 'Barbell Squat',
  'Dumbbell Goblet Squat': 'Goblet Squat',
  'Dumbbell Romanian Deadlift': 'Stiff-Legged Dumbbell Deadlift',
  'Barbell Overhead Tricep Extension': 'Standing Overhead Barbell Triceps Extension',
  'Dumbbell Rear Delt Fly': 'Reverse Flyes',
  'Cable Chest Fly': 'Flat Bench Cable Flyes',
  'Floor Crunch': 'Crunches',
  'Barbell Split Squat': 'Split Squats',
  'Pistol Squat': 'One Leg Barbell Squat',
  'Barbell Pullover': 'Bent-Arm Barbell Pullover',
  'Barbell Skull Crusher': 'Lying Triceps Press',
  'Cable Tricep Pushdown': 'Triceps Pushdown',
  'Chest-Supported Dumbbell Row': 'Dumbbell Incline Row',
  'Flat Barbell Bench Press': 'Barbell Bench Press - Medium Grip',
  'Flat Dumbbell Bench Press': 'Dumbbell Bench Press',
  'Machine Chest Press': 'Leverage Chest Press',
  'T-Bar Row': 'T-Bar Row with Handle',
  'Machine Seated Row': 'Leverage Iso Row',
  'Arnold Press': 'Arnold Dumbbell Press',
  'Hammer Curl': 'Hammer Curls',
  'Preacher Curl Machine': 'Machine Preacher Curls',
  'Concentration Curl': 'Concentration Curls',
  'Close-Grip Bench Press': 'Close-Grip Barbell Bench Press',
  'Machine Overhead Tricep Extension': 'Machine Triceps Extension',
  'Front Squat': 'Front Barbell Squat',
  'Leg Extension': 'Leg Extensions',
  'Glute Bridge': 'Barbell Glute Bridge',
  'Dumbbell Step-Up': 'Step-up with Knee Raise',
};

interface FedEntry {
  name: string;
  category: string;
  level?: string;
  mechanic?: string | null;
  force?: string | null;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// The core catalog's names (ours win on collision).
const coreSrc = readFileSync('shared/exercises/data.ts', 'utf8');
const coreNames = new Set(
  [...coreSrc.matchAll(/^    name: '([^']+)',$/gm)].map((m) => m[1].toLowerCase()),
);
// The legal slug VALUE set, extracted from data.ts's MuscleSlug block —
// the importer hard-fails if a mapped muscle isn't legal (the key/value
// mixup class of bug dies here).
const muscleBlock = coreSrc.match(/export const MuscleSlug = \{([\s\S]*?)\} as const;/)?.[1] ?? '';
const legalMuscles = new Set(
  [...muscleBlock.matchAll(/: '([a-z-]+)'/g)].map((m) => m[1]),
);
if (legalMuscles.size < 20) throw new Error('could not extract the MuscleSlug value set from data.ts');
const assertLegalMuscle = (v: string) => {
  if (!legalMuscles.has(v)) throw new Error(`illegal muscle slug emitted: ${v}`);
  return v;
};


const files = readdirSync(EX_DIR).filter((f) => f.endsWith('.json')).sort();
// The fedb index (by name) — built BEFORE the import loop: the core
// matcher claims the fedb entries that ARE core movements (exact
// plural-tolerant match or the reviewed alias table), and a claimed
// entry is NEVER imported — the match and the entry are the same
// movement (the Leg-Press-Calf-Raise lesson: name-equality alone let
// phantom twins through).
const byName = new Map<string, FedEntry>();
for (const file of files) {
  const e = JSON.parse(readFileSync(join(EX_DIR, file), 'utf8')) as FedEntry;
  byName.set(e.name.toLowerCase(), e);
}
const normTokens = (n: string) =>
  new Set(
    n.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean)
      .map((t) => t.replace(/s$/, '')),
  );
const sameTokens = (a: string, b: string) => {
  const A = normTokens(a), B = normTokens(b);
  if (A.size !== B.size) return false;
  for (const t of A) if (!B.has(t)) return false;
  return true;
};
const corePrettyNames = [...coreSrc.matchAll(/^    name: '([^']+)',$/gm)].map((m) => m[1]);
const claimedFedbNames = new Set<string>();
for (const pretty of corePrettyNames) {
  const alias = CORE_PLATE_ALIASES[pretty];
  if (alias && byName.has(alias.toLowerCase())) {
    claimedFedbNames.add(alias.toLowerCase());
    continue;
  }
  for (const [fedName] of byName) {
    if (sameTokens(pretty, fedName)) { claimedFedbNames.add(fedName); break; }
  }
}

const imported: string[] = [];
const manifest: string[] = [];
const stats = { total: files.length, kept: 0, categorySkip: 0, coreSkip: 0, musclesDropped: 0, noPlate: 0 };
const slugSeen = new Set<string>();
const nameSeen = new Set<string>();

for (const file of files) {
  const e = JSON.parse(readFileSync(join(EX_DIR, file), 'utf8')) as FedEntry;
  if (!KEEP_CATEGORIES.has(e.category)) {
    stats.categorySkip += 1;
    continue;
  }
  const nameKey = e.name.toLowerCase();
  if (coreNames.has(nameKey) || nameSeen.has(nameKey) || claimedFedbNames.has(nameKey)) {
    stats.coreSkip += 1;
    continue;
  }
  nameSeen.add(nameKey);

  const modality = MODALITY_OF[e.equipment ?? 'other'] ?? 'floor';
  const exerciseType = TYPE_OF[e.equipment ?? 'other'] ?? 'calisthenic';
  const prim = ((e.primaryMuscles ?? []).map((m) => MUSCLE_OF[m]).filter(Boolean) as string[]).map(assertLegalMuscle);
  const sec = ((e.secondaryMuscles ?? []).map((m) => MUSCLE_OF[m]).filter(Boolean) as string[]).map(assertLegalMuscle);
  stats.musclesDropped +=
    (e.primaryMuscles?.length ?? 0) - prim.length + (e.secondaryMuscles?.length ?? 0) - sec.length;

  let slug = slugify(e.name);
  while (slugSeen.has(slug)) slug = `${slug}-x`;
  slugSeen.add(slug);

  const instructions = (e.instructions ?? []).join(' ').replace(/\s+/g, ' ').trim();
  const description = `${e.mechanic === 'isolation' ? 'An isolation lift' : e.mechanic === 'compound' ? 'A compound lift' : 'A strength lift'} for the ${prim.length > 0 ? 'primary movers named below' : 'whole body'}.`;
  const level = e.level === 'expert' ? 'advanced' : (e.level ?? 'intermediate');

  // THE PLATE PAIR — the concentric (start) frame + the eccentric
  // (end) frame: the source ships two per lift (873 of 876). The
  // second rides as <slug>-b.jpg; both resample via the manifest.
  let image: string | null = null;
  let imageB: string | null = null;
  const firstImg = e.images?.[0];
  if (firstImg) {
    image = `/exercise-plates/${slug}.jpg`;
    // Their images[] are '<NameDir>/<n>.jpg' relative to exercises/.
    const rel = firstImg.replace(/^\.\//, '');
    manifest.push(`${slug}\t${join(EX_DIR, rel)}`);
    const secondImg = e.images?.[1];
    if (secondImg) {
      imageB = `/exercise-plates/${slug}-b.jpg`;
      const relB = secondImg.replace(/^\.\//, '');
      manifest.push(`${slug}-b\t${join(EX_DIR, relB)}`);
    }
  } else {
    stats.noPlate += 1;
  }

  imported.push(
    [
      '  {',
      `    slug: '${slug}',`,
      `    modality: '${modality}',`,
      `    name: '${e.name.replace(/'/g, "\\'")}',`,
      `    category: 'Library',`,
      `    exerciseType: '${exerciseType}',`,
      `    difficultyLevel: '${level}',`,
      `    description: '${description.replace(/'/g, "\\'")}',`,
      `    instructions: '${instructions.replace(/'/g, "\\'")}',`,
      `    tips: '',`,
      // Empty muscle sets emit [] — a join on an empty array would
      // print [''] (one illegal empty slug).
      `    primaryMuscles: ${prim.length ? `['${prim.join("', '")}']` : '[]'},`,
      `    secondaryMuscles: ${sec.length ? `['${sec.join("', '")}']` : '[]'},`,
      `    equipment: [],`,
      `    defaultSets: 3,`,
      `    defaultReps: [8, 12],`,
      ...(image ? [`    image: '${image}',`] : []),
      ...(imageB ? [`    imageB: '${imageB}',`] : []),
      '  },',
    ].join('\n'),
  );
  stats.kept += 1;
}

// ── Core plates: the alias table + plural-tolerant matches computed
// above (claimedFedbNames) — every core match gets its figure.
const plateOf = (fedName: string): { image: string; source: string } | null => {
  const entry = byName.get(fedName.toLowerCase());
  const first = entry?.images?.[0];
  if (!entry || !first) return null;
  // The core plate names the fedb figure's own slug (a claimed entry is
  // never imported, so no reuse question remains).
  const rel = first.replace(/^\.\//, '');
  manifest.push(`${slugify(fedName)}\t${join(EX_DIR, rel)}`);
  return { image: `/exercise-plates/${slugify(fedName)}.jpg`, source: entry.name };
};

const corePlates: string[] = [];
const coreCopy: Array<string> = [];
let corePlated = 0;
for (const pretty of corePrettyNames) {
  let target: string | null = CORE_PLATE_ALIASES[pretty] ?? null;
  if (!target) {
    // plural-tolerant exact token-set match against fedb names
    for (const [fedName] of byName) {
      if (sameTokens(pretty, fedName)) { target = fedName; break; }
    }
  }
  const plate = target ? plateOf(target) : null;
  // THE COPY ENRICHMENT: claimed core lifts also inherit the fedb
  // entry's fuller multi-step instructions (the hand-authored
  // one-liners stay as the description).
  const copyEntry = target ? byName.get(target.toLowerCase()) : undefined;
  const copy = ((copyEntry?.instructions ?? []).join(' ').replace(/\s+/g, ' ').trim()) || null;
  if (plate) {
    corePlated += 1;
    corePlates.push(`  '${slugify(pretty)}': '${plate.image}', // <- ${plate.source}`);
    if (copy && copy.length > 80) coreCopy.push(slugify(pretty) + '\u0000' + copy);
  }
}

const header = `// shared/exercises/importedData.ts
//
// THE IMPORTED CATALOG — generated by scripts/import-exercise-db.ts
// from yuhonas/free-exercise-db (public domain, the Unlicense —
// github.com/yuhonas/free-exercise-db). DO NOT hand-edit: regenerate.
// Coarse identity filtered against the core catalog (ours wins); the
// vernacular muscle vocabulary maps onto our coarse slugs (the mapping
// table lives in the importer); plates resample to
// public/exercise-plates/<slug>.jpg.
//
// Entry count: ${imported.length}. Regenerated: ${new Date().toISOString().slice(0, 10)}.

export interface ImportedExercise {
  slug: string;
  modality: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'floor';
  name: string;
  category: string;
  exerciseType: 'free_weight' | 'cable' | 'machine' | 'calisthenic';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  instructions: string;
  tips: string;
  // Plain slug strings (the muscle vocabulary's VALUES) — data.ts
  // casts the array into SystemExerciseData at composition; no import
  // back into data.ts (the cycle is the enemy).
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: [];
  defaultSets: number;
  defaultReps: [number, number];
  image?: string;
  imageB?: string;
}

export const IMPORTED_EXERCISES: ImportedExercise[] = [
${imported.join('\n')}
];
`;

writeFileSync(OUT_TS, header);
writeFileSync(OUT_MANIFEST, manifest.join('\n') + '\n');
writeFileSync(
  'shared/exercises/corePlates.ts',
  `// shared/exercises/corePlates.ts
//
// THE CORE PLATES — generated by scripts/import-exercise-db.ts: core
// lifts matched to their free-exercise-db figures by exact (plural-
// tolerant) name match or the hand-reviewed alias table in the
// importer. Regenerate, never hand-edit. Plates reuse the imported
// figure files where the target was imported.
//
// Core entries plated: ${corePlated} of ${coreNames.size}.

export const CORE_PLATES: Record<string, string> = {
${corePlates.join('\n')}
};
`,
);
writeFileSync(
  'shared/exercises/coreCopy.ts',
  '// shared/exercises/coreCopy.ts\n' +
  '//\n' +
  '// THE CORE COPY ENRICHMENT — generated by scripts/import-exercise-db.ts:\n' +
  '// core lifts whose matched fedb entries carry richer multi-step\n' +
  '// instructions inherit that copy here (data.ts composes it as the\n' +
  '// reading block; the hand-authored one-liners stay as the description).\n' +
  '// Regenerate, never hand-edit. Entries enriched: ' + coreCopy.length + '.\n\n' +
  'export const CORE_COPY: Record<string, string> = {\n' +
  coreCopy.map((pair) => {
    const i = pair.indexOf('\u0000');
    const slug = pair.slice(0, i);
    const text = pair.slice(i + 1).replace(/'/g, "\\'");
    return "  '" + slug + "': '" + text + "',";
  }).join('\n') + '\n};\n',
);
console.log('core plates:', corePlated, 'of', coreNames.size, '| copy enriched:', coreCopy.length);
console.log('import stats:', JSON.stringify(stats));
console.log('wrote', OUT_TS, `(${imported.length} entries) and the plate manifest (${manifest.length})`);
