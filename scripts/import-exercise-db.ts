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
const MUSCLE_OF: Record<string, string> = {
  abdominals: 'ABS',
  biceps: 'BICEPS',
  calves: 'CALVES',
  chest: 'CHEST',
  forearms: 'FOREARMS',
  glutes: 'GLUTES',
  hamstrings: 'HAMSTRINGS',
  lats: 'LATS',
  'lower back': 'LOWER_BACK',
  'middle back': 'UPPER_BACK',
  quadriceps: 'QUADS',
  shoulders: 'SIDE_DELTS',
  traps: 'TRAPS',
  triceps: 'TRICEPS',
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

const files = readdirSync(EX_DIR).filter((f) => f.endsWith('.json')).sort();
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
  if (coreNames.has(nameKey) || nameSeen.has(nameKey)) {
    stats.coreSkip += 1;
    continue;
  }
  nameSeen.add(nameKey);

  const modality = MODALITY_OF[e.equipment ?? 'other'] ?? 'floor';
  const exerciseType = TYPE_OF[e.equipment ?? 'other'] ?? 'calisthenic';
  const prim = (e.primaryMuscles ?? []).map((m) => MUSCLE_OF[m]).filter(Boolean) as string[];
  const sec = (e.secondaryMuscles ?? []).map((m) => MUSCLE_OF[m]).filter(Boolean) as string[];
  stats.musclesDropped +=
    (e.primaryMuscles?.length ?? 0) - prim.length + (e.secondaryMuscles?.length ?? 0) - sec.length;

  let slug = slugify(e.name);
  while (slugSeen.has(slug)) slug = `${slug}-x`;
  slugSeen.add(slug);

  const instructions = (e.instructions ?? []).join(' ').replace(/\s+/g, ' ').trim();
  const description = `${e.mechanic === 'isolation' ? 'An isolation lift' : e.mechanic === 'compound' ? 'A compound lift' : 'A strength lift'} for the ${prim.length > 0 ? 'primary movers named below' : 'whole body'}.`;
  const level = e.level === 'expert' ? 'advanced' : (e.level ?? 'intermediate');

  // THE PLATE — the first image, resampled by the manifest pass.
  let image: string | null = null;
  const firstImg = e.images?.[0];
  if (firstImg) {
    image = `/exercise-plates/${slug}.jpg`;
    // Their images[] are '<NameDir>/<n>.jpg' relative to exercises/.
    const rel = firstImg.replace(/^\.\//, '');
    manifest.push(`${slug}\t${join(EX_DIR, rel)}`);
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
      `    primaryMuscles: ['${prim.join("', '")}'],`,
      `    secondaryMuscles: ['${sec.join("', '")}'],`,
      `    equipment: [],`,
      `    defaultSets: 3,`,
      `    defaultReps: [8, 12],`,
      ...(image ? [`    image: '${image}',`] : []),
      '  },',
    ].join('\n'),
  );
  stats.kept += 1;
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
}

export const IMPORTED_EXERCISES: ImportedExercise[] = [
${imported.join('\n')}
];
`;

writeFileSync(OUT_TS, header);
writeFileSync(OUT_MANIFEST, manifest.join('\n') + '\n');
console.log('import stats:', JSON.stringify(stats));
console.log('wrote', OUT_TS, `(${imported.length} entries) and the plate manifest (${manifest.length})`);
