// utils/bodyweight.ts
//
// THE BODYWEIGHT LOAD FACTOR — what fraction of bodyweight a
// bodyweight exercise actually moves. Grounded in force-plate
// research (Ebben et al. 2011 for push-up variants; standard
// biomechanics segment tables for the rest). Approximations that
// vary ±5% by body proportions; honest, not vibes.
//
// The factor × the user's latest body-weight entry = the effective
// load for volume/tonnage calculations. Exercises that use bands,
// implements (atlas stones, ropes), or machines carry NO factor —
// their load comes from the equipment, not the body.

/** Force-plate-grounded factors by movement pattern. */
interface FactorRule {
  pattern: RegExp;
  factor: number;
  /** Exclusions — names matching these skip the rule. */
  exclude?: RegExp;
  note: string;
}

const FACTOR_RULES: FactorRule[] = [
  // ── Vertical push (hands plant, torso moves) ─────────────────────
  {
    pattern: /feet.{0,10}elevated.{0,20}push|decline.{0,10}push[-\s]?up/i,
    factor: 0.74,
    note: 'Feet elevated — hands bear more',
  },
  {
    pattern: /incline.{0,10}push|hands.{0,10}elevated.{0,20}push/i,
    factor: 0.45,
    note: 'Hands elevated — hands bear less',
  },
  {
    pattern: /push[-\s]?up/i,
    exclude: /band|weighted|weight/i,
    factor: 0.64,
    note: 'Standard push-up — hands bear ~64% (Ebben 2011)',
  },
  {
    pattern: /pike.{0,10}push/i,
    factor: 0.55,
    note: 'Pike — hips high, more torso on hands than standard',
  },
  {
    pattern: /handstand.{0,10}push/i,
    factor: 0.90,
    note: 'Handstand — near-full bodyweight through the hands',
  },
  {
    pattern: /dip/i,
    exclude: /bench|band|machine|weighted/i,
    factor: 0.70,
    note: 'Parallel-bar dip — body minus feet',
  },
  {
    pattern: /bench.{0,5}dip/i,
    factor: 0.55,
    note: 'Bench dip — feet ground, less torso moves',
  },

  // ── Vertical pull (hands fixed, everything below moves) ──────────
  {
    pattern: /pull[-\s]?up|chin[-\s]?up/i,
    exclude: /band.{0,10}assist|assisted|machine|weighted/i,
    factor: 0.95,
    note: 'Pull-up — everything below the bar moves',
  },

  // ── Leg raise (legs move through hip lever) ──────────────────────
  {
    pattern: /leg.{0,5}raise|hanging.{0,10}leg|knee.{0,5}raise|captain/i,
    exclude: /machine|cable/i,
    factor: 0.35,
    note: 'Leg raise — legs ≈ 35% of bodyweight',
  },
  {
    pattern: /toes.{0,10}bar|toe.{0,5}raise/i,
    exclude: /machine|cable|smith/i,
    factor: 0.35,
    note: 'Hanging toe raise — legs move',
  },

  // ── Spinal extension (torso + arms + head move) ──────────────────
  {
    pattern: /back.{0,5}extension|hyperextension|romanian.{0,5}chair|forty.{0,10}five/i,
    exclude: /machine|cable|band/i,
    factor: 0.55,
    note: 'Back extension — torso + head + arms',
  },

  // ── Bridge / hip thrust (pelvis + partial torso) ─────────────────
  {
    pattern: /glute.{0,5}bridge|hip.{0,5}thrust/i,
    exclude: /barbell|machine|band/i,
    factor: 0.40,
    note: 'Glute bridge — pelvis + partial torso',
  },

  // ── Squat patterns (body minus feet) ─────────────────────────────
  {
    pattern: /bodyweight.{0,5}squat|air.{0,5}squat/i,
    factor: 0.50,
    note: 'Bodyweight squat — body minus planted feet',
  },
  {
    pattern: /pistol|one[-\s]leg.{0,10}squat/i,
    factor: 0.85,
    note: 'Pistol — one leg bears + one leg moves',
  },
  {
    pattern: /sissy.{0,5}squat/i,
    factor: 0.40,
    note: 'Sissy — torso leans back, knees travel',
  },

  // ── Lunge / step patterns (one leg loads) ────────────────────────
  {
    pattern: /lunge|split.{0,5}squat|step[-\s]?up|bulgarian/i,
    exclude: /dumbbell|barbell|smith|machine|band/i,
    factor: 0.65,
    note: 'Lunge — front leg bears most of bodyweight',
  },

  // ── Core (torso from lying — partial mass, partial ROM) ──────────
  {
    pattern: /crunch|sit[-\s]?up/i,
    exclude: /cable|machine|band/i,
    factor: 0.25,
    note: 'Crunch — torso from supine, partial range',
  },
  {
    pattern: /ab.{0,5}wheel|rollout|ab.{0,5}roller/i,
    factor: 0.40,
    note: 'Ab wheel — dynamic, torso + arms through lever',
  },
  {
    pattern: /nordic|hamstring.{0,5}curl/i,
    exclude: /machine|band|dumbbell/i,
    factor: 0.50,
    note: 'Nordic — torso pivots at knee',
  },
  {
    pattern: /plank|side.{0,5}plank|hold/i,
    factor: 0.00,
    note: 'Isometric — no reps, no volume',
  },

  // ── Calf (single leg bears, ankle moves) ─────────────────────────
  {
    pattern: /calf.{0,5}raise/i,
    exclude: /machine|leg.{0,5}press|smith|dumbbell|barbell/i,
    factor: 0.15,
    note: 'Bodyweight calf raise — ankle joint moves small mass',
  },

  // ── Dynamic / full-body ──────────────────────────────────────────
  {
    pattern: /burpee/i,
    factor: 0.80,
    note: 'Burpee — full body, complex multi-joint',
  },
  {
    pattern: /mountain.{0,5}climber/i,
    factor: 0.50,
    note: 'Mountain climber — alternating legs, hands bear torso',
  },
  {
    pattern: /jumping|jump.{0,10}squat|squat.{0,10}jump/i,
    exclude: /box|rope|band/i,
    factor: 0.80,
    note: 'Jump — full body leaves ground',
  },
];

/**
 * The bodyweight load factor for an exercise, by name pattern.
 * Returns null when the exercise isn't a recognized bodyweight
 * movement (bands, machines, implements, loaded variants).
 */
export function bodyweightFactorFor(name: string): number | null {
  for (const rule of FACTOR_RULES) {
    if (rule.exclude?.test(name)) continue;
    if (rule.pattern.test(name)) {
      return rule.factor;
    }
  }
  return null;
}

/**
 * The effective working weight for a logged set. When the set carries
 * a real weight (machine/dumbbell/cable), that weight IS the load.
 * When weight is null/0 AND the exercise has a bodyweight factor,
 * the effective load is factor × the user's bodyweight.
 */
export function effectiveSetWeight(
  loggedWeight: number | null | undefined,
  bodyweightFactor: number | null | undefined,
  currentBodyweightKg: number | null,
): number {
  const load = loggedWeight ?? 0;
  if (
    bodyweightFactor != null &&
    bodyweightFactor > 0 &&
    currentBodyweightKg != null &&
    currentBodyweightKg > 0
  ) {
    // ADDITIVE — a bodyweight exercise with added load (a plate on
    // back extensions, a vest on pull-ups) carries BOTH: the body's
    // contribution plus the iron.
    return bodyweightFactor * currentBodyweightKg + load;
  }
  return load;
}

/**
 * Point-in-time bodyweight resolution — the entry closest to (and
 * preferably at-or-before) the given date. The most recent weight
 * KNOWN at the time of the session; falls back to the earliest entry
 * when the session predates every weigh-in (the owner's case: the
 * first weight was logged after the first workout).
 */
export function bodyweightAsOf(
  entries: ReadonlyArray<{ weightKg: number; recordedAt: string }>,
  sessionDate: string,
): number | null {
  if (entries.length === 0) return null;
  const target = new Date(sessionDate).getTime();

  // Entries recorded at or before the session, newest first.
  const eligible = entries
    .filter((e) => new Date(e.recordedAt).getTime() <= target)
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
  if (eligible.length > 0) return eligible[0].weightKg;

  // No entry at-or-before the session — the earliest entry is the best
  // estimate (the session predates every weigh-in).
  const earliest = [...entries].sort(
    (a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  return earliest[0]?.weightKg ?? null;
}
