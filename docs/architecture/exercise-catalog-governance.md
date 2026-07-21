# Exercise Catalog Governance & Seeded Split Design Record

> Canonical owner for exercise-catalog governance (the four-layer model, the
> finite setup-dimension list, free-text notes policy, UI relevance rules,
> and the attachment-vocabulary mismatch) and for the seeded-split design
> record (the existing `ONE_A_DAY_SPLITS` / `TWO_A_DAY_SPLITS` working split
> as already brought into the catalog/schema via the
> `arman-fit-commercial-gym-v1` template seed).
>
> This is a **governance and design-record document**, not a specification
> of newly implemented data. Phase 5 ships the *capture infrastructure*
> (per-session setup fields on `workout_session_exercises`) — that
> infrastructure is not proof that every catalog dimension listed here is
> implemented. The status matrix in §2 makes the implemented-vs-future
> distinction explicit.

## Scope

In scope:

- Define the catalog model Arman Fit is committing to before any further
  exercise-setup or seeded-program expansion.
- Record the existing seeded split (one-a-day + two-a-day) as the working
  split brought into the catalog/schema, including slots flagged for future
  programming review.
- Document the known attachment-vocabulary mismatch with explicit
  non-normalization in this scope.
- State the non-negotiable rules for any future seed update.

Out of scope (explicit non-goals, restated in §7):

- Editing application source, catalog seeds, migrations, schema,
  repositories, services, stores, routes, or tests.
- Normalizing attachment vocabulary.
- Adding new structured setup dimensions to the catalog.
- Any medical, injury-prevention, or individualized coaching claim.

## Part 1 — Catalog Governance

### 1.1 The four-layer model (rejecting exhaustive enumeration)

The exercise catalog is committed to a four-layer model. We **explicitly
reject** the exhaustive "one exercise record per possible
grip / attachment / width / station / side combination" approach — it
explodes the canonical row count, fragments history, and breaks
progression comparison.

| Layer | What it is | Schema home | Status |
|---|---|---|---|
| 1. Movement family | Broad movement intent (vertical pull, knee flexion, elbow flexion, …) used to connect sibling exercises for substitution and discovery. | `exercise_families` (slug UNIQUE, name, display_name) — 20 slugs seeded | Implemented + seeded |
| 2. Canonical exercise | The stable identity used by program slots, saved workout history, and eventual progression comparison. | `exercises` (slug UNIQUE, `movement_pattern_id` FK → `exercise_families`) — 43 system exercises seeded | Implemented + seeded |
| 3. Catalog-declared optional setup dimensions | Optional context declared **per canonical exercise** by the catalog. NOT a globally available control. Today: grip + attachment only. Future: gripOrientation / gripWidth / attachment / executionMode (see §2). | `exercise_grip_options` (grip_slug NOT NULL, attachment_slug nullable, per exercise_id) | Implemented for grip + attachment only |
| 4. Free-text equipment/station notes | The long-tail escape hatch — machine location, manufacturer, seat/lever reminder, gym-specific context. | `workout_session_exercises.user_equipment_notes` (per-session free text) | Implemented (active + read-only) |

Layer-3 capture at session-save time also lives on
`workout_session_exercises`: `user_grip` (free text, pre-existing),
`attachment_slug` (Phase 5 nullable TEXT), `per_side` + `slot_notes`
(Phase 4 prescription snapshot from `program_slots`).

### 1.2 Movement family

A **movement family** is a broad movement intent. It is the substitution-intent
backbone: when a future substitution engine walks the
`exercise_alternatives` graph (already seeded as the directional
direct / close / fallback tiered graph), family membership is one signal
for "is this a reasonable swap?".

The 20 movement-family slugs seeded today (verbatim from
`20260721000002_seed_catalog_and_programs.sql`):

```
chest-press-incline                 → "Incline Press"
chest-fly                           → "Chest Fly"
overhead-press                      → "Overhead Press"
lateral-raise                       → "Lateral Raise"
face-pull                           → "Face Pull"
elbow-extension-overhead            → "Overhead Triceps Extension"
elbow-extension-press               → "Dip / Press Triceps"
elbow-flexion                       → "Bicep Curl"
vertical-pull                       → "Vertical Pull"
vertical-pull-straight-arm          → "Straight-Arm Pulldown / Pullover"
horizontal-pull                     → "Horizontal Row"
scapular-elevation                  → "Shrug"
knee-dominant-bilateral             → "Bilateral Squat / Leg Press"
knee-dominant-unilateral            → "Unilateral Squat / Lunge"
knee-flexion                        → "Leg Curl"
hip-hinge-spinal-extension          → "Hip Hinge / Back Extension"
plantar-flexion                     → "Calf Raise"
dorsi-flexion                       → "Tibialis Raise"
vertical-leg-raise                  → "Vertical Leg Raise"
trunk-flexion                       → "Ab Crunch"
```

`exercise_families` is intentionally distinct from `muscle_categories`
(anatomical). A family says "what movement intent"; a muscle category says
"what tissue crosses this joint". A sister canonical exercise may share a
family with a sibling while primary muscles differ slightly.

### 1.3 Canonical exercise

The **canonical exercise** is the stable identity used by:

- `program_slots.exercise_id` (FK, RESTRICT — template edits can't strip
  user plans),
- `user_program_plan_slots.chosen_exercise_id` (FK with resolution + an
  immutable `prescription_snapshot`),
- `workout_session_exercises.exercise_id` (FK, RESTRICT),
- eventual progression comparison (history-grouping + progression
  trajectory keyed on this id).

**Create a separate canonical exercise only when at least one of these is
true:**

1. The variation should be **prescribed independently** — e.g. machine
   lat pulldown vs cable lat pulldown land on different days or different
   slots in a plan.
2. The variation should **substitute differently** — its
   `exercise_alternatives` edges (direct / close / fallback) genuinely
   differ from its sibling's.
3. The variation should be **compared separately in history** — the user
   tracks progression for it on its own trajectory.
4. The variation has a **different equipment-loading path** that affects
   plan eligibility (different `exercise_equipment_requirement_paths`).

When none of these are true, the variation belongs as **setup context on
one canonical exercise**, not as a new canonical row. A grip change, an
attachment swap, or a station relocation is setup context — not a new
exercise.

### 1.4 Setup dimension

A **setup dimension** is optional context declared **by the catalog for
one canonical exercise**. It is not a globally available control.

Today, only two setup dimensions are catalog-implemented: **grip** (via
`exercise_grip_options.grip_slug`, free-form kebab string, NOT NULL) and
**attachment** (via `exercise_grip_options.attachment_slug`, free-form
kebab string, nullable). The shape — per-exercise rows pairing grip with
optional attachment — generalizes cleanly to additional dimensions
without a schema change *as long as the dimension fits the same
(grip × attachment) pair shape*. A dimension that needs its own column
shape (e.g. gripWidth as a separately-typed enum) requires a migration.

#### 1.4.1 UI relevance — per-exercise catalog discernment

Future setup controls must render **only when the catalog declares
compatible options for that individual canonical exercise**. **Do not use
global option fallbacks.** This rule is already implemented for grip +
attachment in `components/composed/ExerciseSetupRow.tsx`:

- The Grip control renders iff the exercise has ≥1 catalog row with a
  non-null `grip_slug` OR a legacy `userGrip` is already set on the
  session row.
- The Attachment control renders iff the exercise has ≥1 catalog row with
  a non-null `attachment_slug` OR a legacy `attachmentSlug` is already
  set.
- Equipment Notes always renders (legitimate free-text context for any
  exercise).
- The global `CABLE_ATTACHMENT_OPTIONS` union in
  `constants/equipmentCapabilities.ts` is **never** used as a fallback
  for exercises with no catalog rows.

A fixed machine leg extension or leg press **must not** acquire arbitrary
grip, attachment, width, or laterality controls merely because other
exercises have them. Any new setup dimension that lands in the UI must
inherit this same per-exercise gating rule.

### 1.5 Free-text notes

Free-text equipment/station notes remain the **long-tail escape hatch** for
details such as:

- machine location ("window-side machine", "cable column 3"),
- manufacturer / unit identity ("Hoist HD-12", "Cybex Eagle"),
- seat or lever reminder ("seat 6, footplate 3"),
- gym-specific context ("rack was taken, used dumbbells instead").

These details are **not** grounds to create a new structured field unless
a recurring product need is demonstrated. A structured field is justified
only when:

1. The same dimension recurs across multiple exercises and users,
2. The dimension drives a product behavior (filtering, summary,
   grouping, or progression), AND
3. Free-text search or display is insufficient to satisfy that behavior.

Until all three are true, the detail belongs in `user_equipment_notes`.

## Part 2 — The Four Future Setup Dimensions

The future setup dimensions under consideration, with status. **This list
is deliberately finite and extensible.** It is not a claim that every
dimension is implemented now.

| Dimension | Values under consideration | Meaning | Scope | Status |
|---|---|---|---|---|
| `gripOrientation` | `overhand`, `underhand`, `neutral` | Hand orientation relative to the body / bar path | Per canonical exercise, catalog-declared | **Partially implemented** — `exercise_grip_options.grip_slug` is free-form TEXT and the 8 seeded rows carry `underhand` / `neutral` values, but there is no typed enum or per-exercise declared orientation set distinct from grip. Future work would formalize this as its own dimension. |
| `gripWidth` | `narrow`, `standard`, `wide` | Distance between hands on a bar / handle | Per canonical exercise, catalog-declared | **Not implemented.** No schema column, no catalog rows, no UI. Future work. |
| `attachment` | `rope`, `straight bar`, `EZ-bar`, `V-bar`, `lat bar`, `single handle` | Cable-station attachment (or analogous removable implement) | Per canonical exercise, catalog-declared | **Partially implemented** — `exercise_grip_options.attachment_slug` exists; `EZ-bar` is **not** in the current vocabulary; the catalog seed uses prefixed slugs (`cable-rope`, `cable-v-bar`, `cable-lat-bar`, `cable-handle`) that don't all match the TS union (`rope`, `straight-bar`, `v-bar`, `lat-bar`, `handle`). See §4. |
| `executionMode` | `bilateral`, `unilateral`, `alternating` | Laterality of execution within a set | Per canonical exercise OR per program slot | **Partially captured, not modeled as a setup dimension.** `exercises.laterality` is a CHECK-constrained column (`bilateral` / `unilateral` / `either`, nullable). `program_slots.per_side` is a boolean prescription flag. Neither is a per-session, per-exercise setup dimension. Future work. |

A "future setup dimension" does **not** mean "ship the next attachment
value" or "add a column". It means: a product-level decision that the
dimension recurs across exercises and users, drives a product behavior,
and cannot be satisfied by free-text. §6 sequences the prerequisites.

The current rule stands: **no global option fallbacks.** If the catalog
does not declare a dimension for an exercise, the control does not
render.

## Part 3 — Examples (catalog-governance guidance)

The table below is **catalog-governance guidance**, not newly implemented
data, seed values, UI controls, or migration requirements. Treat each row
as a decision pattern to apply during a future catalog review.

| Scenario | Recommended catalog treatment |
|---|---|
| Machine lat pulldown vs cable lat pulldown | Sibling canonical exercises within the `vertical-pull` family when their equipment / loading path matters for programming or substitutions. Today only `lat-pulldown-reverse-grip` exists in the seed; a sibling machine-driven row would be a new canonical exercise, not a setup variant. |
| Bilateral vs intentionally programmed single-arm cable pulldown | Separate canonical exercises when independently prescribed or progressed. The bilateral / unilateral / alternating distinction is a future `executionMode` dimension candidate (§2); until that dimension ships, distinct prescription is the canonical-exercise boundary. |
| Underhand vs wide-overhand lat pulldown | One canonical exercise with catalog-declared `gripOrientation` + `gripWidth` where the product needs them. Today: `lat-pulldown-reverse-grip` carries `grip_slug='underhand'`; a wide-overhand variant does not require a new canonical row. |
| Dumbbell curl vs hammer curl | Usually separate canonical exercises. The grip distinction (supinated vs neutral) is meaningful for progression and the equipment/loading path differs in practice. The seed today has `dumbbell-curl-seated-incline` and `cable-rope-curl`; a hammer-curl canonical row would be a new exercise. |
| Straight-bar vs EZ-bar cable curl | Usually attachment context on the applicable cable-curl exercise, **unless** product rules require independent progression. Today: `EZ-bar` is not in the attachment vocabulary (§4). Adding it requires the vocabulary-normalization prerequisite in §6. |
| Window-side vs door-side fixed machine | Free-text `user_equipment_notes`. Not a new exercise, not a station registry, not a structured field. The two locations are the same canonical exercise with the same equipment path; location is gym-specific long-tail context. |

## Part 4 — Attachment Vocabulary Mismatch (current state, no normalization)

### 4.1 The mismatch (verifiable today)

- **Catalog seed** `exercise_grip_options.attachment_slug` (in
  `20260721000002_seed_catalog_and_programs.sql`) uses prefixed values:
  - `cable-rope`
  - `cable-v-bar`
  - `cable-lat-bar`
  - `cable-handle`
- **TypeScript union** `CableAttachmentSlug` in
  `constants/equipmentCapabilities.ts:80` uses unprefixed values:
  - `rope`
  - `straight-bar`
  - `v-bar`
  - `lat-bar`
  - `handle`

The two vocabularies are disjoint on every cable-attachment slug except
by accident of prettifier output.

### 4.2 What Phase 5 does about it (already shipped, unchanged)

Phase 5 **preserves** catalog values as-is and resolves display labels
through a safe two-step fallback:

1. Try `CABLE_ATTACHMENT_OPTIONS` lookup (handles TS-union slugs).
2. Fall back to a sentence-case prettifier for catalog-vocabulary slugs
   that don't match the union (e.g. `cable-rope` → `Cable rope`).

This does **not** affect eligibility, plan generation, or history
persistence. The runtime fields are passive metadata only.

### 4.3 What this task does about it

**Nothing.** No normalization, no data rewrite, no new mapping table, no
catalog migration is authorized in this scope.

### 4.4 Preconditions for any future normalization

A future dedicated catalog migration must **choose and document** all
four before broadening setup options (e.g. before adding `EZ-bar`):

1. **One canonical vocabulary** — either prefixed or unprefixed, applied
   uniformly across the TS union, the catalog seed, the historical
   `workout_session_exercises.attachment_slug` rows, and the display
   resolver.
2. **Migration strategy** — for historical rows, for active user-program
   plans, for the catalog seed, and for any in-flight session drafts.
3. **Compatibility behavior** — display fallback for any value that
   predates the normalization (legacy rows must stay readable).
4. **Test plan** — covering migration text-parse, repository read/write
   round-trip, hook data shape, component label resolution, and screen
   integration for both union and non-union slugs.

Until all four are settled, attachment vocabulary is frozen at the
Phase 5 state.

## Part 5 — Seeded Split Design Record

> **Framing.** The split recorded here is the **existing** working split
> already in the app — `ONE_A_DAY_SPLITS` and `TWO_A_DAY_SPLITS` in
> `shared/exercises/splits.ts` — already mirrored into the catalog/schema
> via the seeded `arman-fit-commercial-gym-v1` program template + its
> `one-a-day` and `two-a-day` variants in
> `supabase/migrations/20260721000002_seed_catalog_and_programs.sql`.
> This section is a **design record of what is already seeded**, with
> the slots flagged for future programming review identified per slot.
> It is not a proposal for a new split.

### 5.1 Source of truth (canonical + runtime)

The TS-side `shared/exercises/splits.ts` is the **active runtime source**
for the split-selection + active-session surfaces (per CLAUDE.md
invariant #12 — the plan-backed launch path is shipped but the static
arrays remain the live source until a later phase switches callers).

The seeded program template `arman-fit-commercial-gym-v1` carries the
same content through the catalog/schema and is the **canonical record**
for any future plan-backed launch that consumes program_slots directly.
The two are deliberately mirrored: TS for runtime, schema for catalog
governance + future plan-backed launch.

`getDayTitle` outputs:

- `oneADay`: "Full Body Day 1" / "Full Body Day 2" / "Full Body Day 3" /
  "Full Body Day 4"
- `twoADay`: "Workout Day 1" / "Workout Day 2" / "Workout Day 3" /
  "Workout Day 4"

### 5.2 Two-a-day schedule (the working split, per seeded `TWO_A_DAY_SPLITS`)

4 days × (AM + PM) × 4 slots = 32 slots. Each slot's exercise slug is
shown verbatim from `shared/exercises/splits.ts:166-231`. Slot status
classified as:

- **Confirmed existing** — verbatim in seed, no review pending (incl.
  slots confirmed by the 2026-07-20 programming review recorded in §5.3).
- **Approved future seed change** — verbatim in seed today, but a
  programming review has approved a replacement. The seed is unchanged
  in this task; the change lands in the §6 step-3 narrowly-approved
  seed/catalog implementation.

#### Day 1

| Window | # | Exercise slug | Status |
|---|---|---|---|
| AM | 1 | `leg-press-machine` | Confirmed existing |
| AM | 2 | `calf-raise-leg-press-machine` | Confirmed existing |
| AM | 3 | `lower-back-extension-calisthenic` | Confirmed existing |
| AM | 4 | `leg-raise-captains-chair` | Confirmed existing |
| PM | 1 | `barbell-press-incline` | Confirmed existing |
| PM | 2 | `overhead-tricep-extension-cable` | Confirmed existing |
| PM | 3 | `shoulder-press-machine-or-dumbbell` | Confirmed existing |
| PM | 4 | `egyptian-cable-lateral-raise` | Confirmed existing |

#### Day 2

| Window | # | Exercise slug | Status |
|---|---|---|---|
| AM | 1 | `machine-shrug-plate-loaded` | Confirmed existing |
| AM | 2 | `chest-fly-machine` | Confirmed existing |
| AM | 3 | `tibia-raise-machine-or-band` | Confirmed existing |
| AM | 4 | `machine-leg-curl-seated` | Confirmed existing — programming review (2026-07-20) accepted `machine-leg-curl-seated` for the knee-flexion role. |
| PM | 1 | `lat-pulldown-reverse-grip` | Confirmed existing |
| PM | 2 | `machine-ab-crunch-eccentric-emphasized` | Confirmed existing |
| PM | 3 | `dumbbell-curl-seated-incline` | Confirmed existing |
| PM | 4 | `face-pull-cable-rope-grip` | Confirmed existing |

#### Day 3

| Window | # | Exercise slug | Status |
|---|---|---|---|
| AM | 1 | `bulgarian-split-squat-dumbbell` | Confirmed existing — programming review (2026-07-20) accepted `bulgarian-split-squat-dumbbell` for the unilateral lower-body role. |
| AM | 2 | `machine-calf-raise-standing` | Confirmed existing |
| AM | 3 | `straight-arm-cable-pulldown` | **Approved future seed change** — programming review (2026-07-20) approved replacing `straight-arm-cable-pulldown` with `dumbbell-pullover-bridge-position` (same `vertical-pull-straight-arm` family). The seeded row is unchanged in this task; the replacement lands in the §6 step-3 narrowly-approved seed/catalog implementation, after the §6 step-1 vocabulary-normalization discovery and the weekly-volume count are closed. |
| AM | 4 | `leg-raise-captains-chair` | Confirmed existing |
| PM | 1 | `incline-machine-press` | Confirmed existing |
| PM | 2 | `tricep-dip-machine` | Confirmed existing |
| PM | 3 | `dumbbell-overhead-press` | Confirmed existing |
| PM | 4 | `egyptian-cable-lateral-raise` | Confirmed existing |

#### Day 4

| Window | # | Exercise slug | Status |
|---|---|---|---|
| AM | 1 | `dumbbell-shrug` | Confirmed existing |
| AM | 2 | `dumbbell-fly-incline` | Confirmed existing |
| AM | 3 | `tibia-raise-machine-or-band` | Confirmed existing |
| AM | 4 | `machine-leg-curl-seated` | Confirmed existing — programming review (2026-07-20) accepted the second weekly `machine-leg-curl-seated` instance for the low-fatigue upper-leg role. |
| PM | 1 | `seated-cable-row-v-grip` | Confirmed existing |
| PM | 2 | `machine-ab-crunch-eccentric-emphasized` | Confirmed existing |
| PM | 3 | `cable-rope-curl` | Confirmed existing |
| PM | 4 | `face-pull-cable-rope-grip` | Confirmed existing |

### 5.3 Programming review outcome for the four flagged slots

The four lower-body / posterior-chain slots flagged in earlier drafts of
this record have been reviewed (2026-07-20). Outcome:

| Slot | Seeded slug | Review outcome |
|---|---|---|
| Day 2 AM 4 | `machine-leg-curl-seated` | Accepted as-seeded — confirmed. |
| Day 3 AM 1 | `bulgarian-split-squat-dumbbell` | Accepted as-seeded — confirmed. |
| Day 3 AM 3 | `straight-arm-cable-pulldown` | Approved for replacement with `dumbbell-pullover-bridge-position`. Implementation is **deferred** to the §6 step-3 narrowly-approved seed/catalog implementation, after §6 step-1 (vocabulary normalization discovery) and the weekly per-muscle volume count are closed. The seed is **not** changed in this task. |
| Day 4 AM 4 | `machine-leg-curl-seated` | Accepted as-seeded — confirmed. |

This closes the slot-level programming-decision layer of §6 step 2. The
**weekly per-muscle volume count** (§5.5 rule #5) is **not** closed by
this review — that count is a separate, prerequisite step before any
slot expansion (adding slots, widening rep ranges, or bumping
`sets_max`) and before the Day 3 AM 3 replacement lands.

### 5.4 One-a-day schedule

`ONE_A_DAY_SPLITS` (`shared/exercises/splits.ts:100-153`) is the same
content compressed to **one combined session per day, 7 exercises per
day**. Each one-a-day day concatenates the corresponding two-a-day AM +
PM and drops one exercise to keep the session at 7:

- Day 1: leg-press-machine, calf-raise-leg-press-machine,
  leg-raise-captains-chair, barbell-press-incline,
  overhead-tricep-extension-cable, shoulder-press-machine-or-dumbbell,
  egyptian-cable-lateral-raise (drops `lower-back-extension-calisthenic`
  vs the AM+PM union).
- Day 2: machine-shrug-plate-loaded, chest-fly-machine,
  tibia-raise-machine-or-band, machine-leg-curl-seated,
  lat-pulldown-reverse-grip, dumbbell-curl-seated-incline,
  face-pull-cable-rope-grip (drops
  `machine-ab-crunch-eccentric-emphasized`).
- Day 3: bulgarian-split-squat-dumbbell, machine-calf-raise-standing,
  straight-arm-cable-pulldown, incline-machine-press, tricep-dip-machine,
  dumbbell-overhead-press, egyptian-cable-lateral-raise (drops
  `leg-raise-captains-chair`).
- Day 4: dumbbell-fly-incline, tibia-raise-machine-or-band,
  machine-leg-curl-seated, seated-cable-row-v-grip,
  machine-ab-crunch-eccentric-emphasized, cable-rope-curl,
  face-pull-cable-rope-grip (drops `dumbbell-shrug`).

Slot status from §5.2 carries over: Day 2 slot 4, Day 3 slots 1 + 3,
and Day 4 slot 4 inherit the review outcomes recorded in §5.3 (three
confirmed as-seeded; Day 3 slot 3 approved for a future seed change to
`dumbbell-pullover-bridge-position`).

### 5.5 Non-negotiable rules for any future seed update

When a future programming review approves a change to any slot, the seed
update must obey these rules. None of them authorize a change in this
task.

1. **The template remains explicit and repeatable.** Every day×window×slot
   position has one chosen canonical exercise. No "or" branches in the
   seed, no in-slot substitution at seed time. (The `or` in
   `shoulder-press-machine-or-dumbbell` is part of the canonical slug's
   *name* — it conveys equipment-eligibility flexibility inside one
   canonical exercise, not a seed-time branch.)
2. **No automatic exercise substitution based only on a predicted
   upcoming rest day.** Rest/readiness is input to a future
   *recommendation* surface, not to the seed itself.
3. **Rest/readiness may later inform a recommendation, but must not
   silently mutate the program.** The saved plan's
   `prescription_snapshot` is immutable; any rest-aware suggestion
   appears as a user-facing choice, not an automatic rewrite.
4. **Lower-body compound / recovery distribution needs a dedicated
   training review before migration or seed work.** The slot-level
   review for the four flagged lower-body / posterior-chain slots is
   closed (§5.3: three confirmed as-seeded, Day 3 AM 3 approved for
   future replacement with `dumbbell-pullover-bridge-position`). The
   **weekly lower-body volume + knee-flexion frequency + unilateral
   compound distribution** count is still required before the Day 3 AM 3
   replacement lands, because the swap touches the same weekly totals.
5. **Direct and indirect shoulder / chest / triceps and lower-body
   volume must be counted before expanding the template.** Adding a
   new slot, widening a rep range, or bumping sets_max all touch
   weekly per-muscle volume. The count precedes the change.
6. **Exercise order should preserve intended compound-lift quality.**
   Compound lifts that the user cares about tracking at high quality
   stay early in their session; smaller isolation slots stay late.
   Seed edits that reorder across this boundary need explicit
   justification.
7. **No medical, injury-prevention, or individualized coaching claims.**
   The template is general-purpose hypertrophy programming context,
   not a prescription for any individual's injury history, mobility
   limits, or rehab needs. Doc, seed, and any future UI copy maintain
   this boundary.

## Part 6 — Future Work Sequence (prerequisite order)

These are deliberately sequenced. Each step's prerequisites are listed;
later steps are out of scope until earlier ones close.

1. **Catalog-vocabulary normalization discovery.** Audit all
   `attachment_slug` values across catalog seed, TS union, historical
   rows, and any UI mock or test fixture. Produce a single canonical
   vocabulary proposal. Resolve the §4 preconditions (canonical
   vocabulary, migration strategy, compatibility behavior, test plan).
   **Output:** a discovery doc, not a migration.
2. **Lower-body and weekly-volume programming review.** Training-side
   review of the four flagged lower-body slots + the
   pulldown-vs-pullover discrepancy + weekly per-muscle volume across
   all 32 two-a-day slots (and the equivalent one-a-day slots). **Status
   (2026-07-20):** the slot-level review is **closed** — three slots
   confirmed as-seeded (Day 2 AM 4, Day 3 AM 1, Day 4 AM 4) and Day 3
   AM 3 approved for replacement with `dumbbell-pullover-bridge-position`
   (§5.3). The **weekly per-muscle volume count** across all 32 slots
   remains **open** and is required before the Day 3 AM 3 replacement
   lands (it touches the same weekly totals).
3. **Narrowly approved seed / catalog implementation.** Only after (1)
   closes and (2)'s weekly-volume count closes, a single migration (or
   a small tightly-scoped set) implements the approved changes. The
   scope includes at minimum the Day 3 AM 3 replacement
   (`straight-arm-cable-pulldown` → `dumbbell-pullover-bridge-position`)
   plus any catalog vocabulary normalization from step 1. This is the
   approval-gated artifact; per the push protocol it requires explicit
   user approval before push or remote apply.
4. **Additional structured setup dimensions, only after real usage.**
   New dimensions from §2 (`gripOrientation` formalization,
   `gripWidth`, `executionMode`, or attachment vocabulary broadening)
   are considered only after the normalized catalog is in users' hands
   and a recurring product need is demonstrated per the §1.5 bar.

## Part 7 — Non-goals

- **No code or migration edits in this task.** Application source,
  catalog seed migrations, Supabase migrations, schema, repositories,
  services, stores, routes, tests, and dependencies remain untouched.
- **No vocabulary normalization.** The §4 mismatch is documented; no
  canonical-vocabulary decision, mapping, rewrite, or migration is
  authorized here.
- **No new structured setup dimension is shipped.** The §2 dimensions
  are recorded as future work, not implemented.
- **No new EZ-bar attachment value.** Phase 5 vocabulary is frozen.
- **No substitution automation based on predicted rest/readiness.**
- **No medical, injury-prevention, or individualized coaching claims.**
- **Not Phase 6.** This task does not start, scope, or block any phase
  of implementation work. It is a governance and design-record
  checkpoint only.

## Cross-references

- `CLAUDE.md` invariant #9 — system exercise library + four-place edit
  contract (seed SQL, `splits.ts` ExerciseKey union + day assignments,
  `data.ts` SYSTEM_EXERCISES + display-name maps).
- `CLAUDE.md` invariant #12 — program templates (5-table hierarchy) and
  the explicit "static `ONE_A_DAY_SPLITS` + `TWO_A_DAY_SPLITS` arrays
  remain the active runtime source" rule.
- `CLAUDE.md` invariant #13 — equipment capability inventory (advisory;
  canonical eligibility relation is `user_available_equipment`).
- `CLAUDE.md` invariant #14 — user-owned plans snapshot model +
  adoption-completeness + immutable `prescription_snapshot`.
- `CLAUDE.md` invariant #15 — plan-backed workout launch (the path that
  consumes `arman-fit-commercial-gym-v1` program slots at session time).
- `CLAUDE.md` invariant #16 — Phase 5 equipment-setup logging (passive
  per-session metadata) + the per-exercise catalog-discernment rule
  already enforced in `ExerciseSetupRow.tsx` + the attachment-vocabulary
  mismatch (deferred normalization — restated and expanded in §4 here).
- `shared/exercises/splits.ts` — canonical TS-side runtime source for
  `ONE_A_DAY_SPLITS` + `TWO_A_DAY_SPLITS` + `getDayTitle` / `getExercisesForDay`.
- `shared/exercises/data.ts` — canonical TS-side display + planning data
  for 43 system exercises.
- `supabase/migrations/20260718000002_seed_system_exercises.sql` — seed
  for the 26 original system exercises + muscle/equipment reference.
- `supabase/migrations/20260721000000_catalog_extensions.sql` — schema
  for `exercise_families`, `exercise_grip_options`, alternatives,
  equipment-requirement paths.
- `supabase/migrations/20260721000001_program_templates.sql` — schema
  for the 5-table program-template hierarchy.
- `supabase/migrations/20260721000002_seed_catalog_and_programs.sql` —
  seed for 17-exercise substitution pool, 20 movement families, 8 rows
  of `exercise_grip_options`, and the `arman-fit-commercial-gym-v1`
  template + `one-a-day` + `two-a-day` variants.
- `supabase/migrations/20260725000000_workout_setup_snapshot.sql` —
  Phase 5 nullable TEXT `attachment_slug` column (passive per-session
  metadata; no FK, no CHECK, no index, no RLS, no trigger, no RPC).
- `constants/equipmentCapabilities.ts` — `CableAttachmentSlug` union +
  `CABLE_ATTACHMENT_OPTIONS` display list (TS-side cable vocabulary).
