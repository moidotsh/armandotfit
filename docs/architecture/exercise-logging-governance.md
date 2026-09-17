# Exercise Identity & Logging Governance

> Canonical owner for the exercise-identity model, the realization-tag
> mechanism, and the promotion rule that governs when free-form context
> earns database structure. `CLAUDE.md` invariants #4–#8 cross-link here;
> this doc owns the reasoning.
>
> **Supersedes** the 2026-07 catalog-governance model (four-layer catalog,
> setup-dimension matrix, attachment-vocabulary preconditions). That model
> — and the 29 tables it governed — was removed in the 2026-10 greenslate
> rebuild. Git history preserves the old doc and schema.

## Scope

- The three-question identity test and its application.
- Tags as the single realization-context mechanism.
- The tag → structure promotion rule.
- The program's relationship to identity (suggested tags on slots).

Out of scope: the schema itself (the greenslate migration file is
canonical), the palette (`constants/theme.ts`), the program's content
(`shared/exercises/splits.ts` is the source, not a doc).

## 1. Identity vs. realization — the three-question test

A variation earns its own row in `exercises` only when **all three**
answers are "yes":

1. **Was the distinction decided before arriving at the gym?** (It's in
   the program, not a rack-side choice.)
2. **Would you say a different name when logging, without thinking?**
   ("Incline barbell press" vs "flat barbell press" — yes. "Pulldown…
   with the rope today" — no.)
3. **Would mixing its numbers into the other's history be actively
   misleading**, not merely noisy? (Two calf-raise machines with
   different resistance curves — yes, misleading. Same machine, window
   seat vs door — no.)

Any "no" → the detail is **realization context**: a tag on the
`logged_exercises` row.

The reasoning behind the test: identity is *enforced at write time* (the
picker), context is *optional at write time*. Only distinctions whose
absence would corrupt the default "last session / progression" view
deserve write-time enforcement. A missing tag makes one row less
detailed; a wrong identity makes every chart silently wrong.

**Established applications** (decided 2026-10, re-litigate explicitly if
ever revisited): equipment class and body angle live in the NAME when a
lifter would name them unprompted (`Incline Barbell Press`, `Machine
Chest Fly`, `Cable Row`) but NOT when the program explicitly allows
either (`Shoulder Press`, `Tibia Raise` — machine is merely the default
tag). `Leg Press Calf Raise` and `Standing Machine Calf Raise` are two
identities (3-for-3 on the test); grip/attachment/style are always tags
(`Lat Pulldown` + `underhand`, `Machine Ab Crunch` + `eccentric`,
`Face Pull` + `rope`).

Moving the boundary is cheap in both directions (split = insert + update
by tag; merge = read-time union) but still a decision, not a refactor.

## 2. Tags — the single context mechanism

`logged_exercises.tags TEXT[]` is the ONLY structured home for
realization context. No per-dimension columns, no catalog-declared
dimension tables, no vocabulary CHECKs.

- **Suggested tags** ride the program slots (`SplitSlot.suggestedTags`)
  and pre-fill the session draft; the user edits freely at log time.
- **Free-form tags** autocomplete from `TAG_VOCABULARY_SEED`
  (`shared/exercises/splits.ts` — folded from the old grip-options seed,
  normalized unprefixed) plus the user's own previously-used tags
  (distinct `unnest` over history).
- Normalization is lowercase-kebab at the input boundary
  (`TagChips.normalizeTag`); the DB stores whatever TS sends, so
  vocabulary extends without migrations.
- Tags never affect identity, eligibility, or progression defaults.
  Progression comparisons MAY filter by tag at read time; they never
  partition silently.

## 3. The promotion rule

A tag (or any free-text distinction) is promoted to a column, registry
table, or structured field only when **both** hold:

- **(a) Consistency:** the same distinction has been captured ≥10 times
  with consistent spelling, AND
- **(b) Demonstrated query need:** the same filter/comparison/grouping
  was actually attempted twice and tag search couldn't answer it (or
  required manual tag-listing).

(a) without (b) is curiosity; (b) without (a) is un-migratable
inconsistency — fix the tagging first. Renames are the hidden long-term
cost of tags (a registry's real payoff); that alone doesn't justify one.

Candidates already anticipated, NONE evidenced yet (2026-10, zero real
usage): a station registry (machine-identity tags), per-tag
PR-exclusion flags, set-level tags for protocols like drop sets, RPE as
a set column. Each has its trigger written in the blank-slate design
record this model came from; don't build ahead of them.

## 3.5 Session-time substitution (the swap)

Swapping a slot's exercise at session time — machine occupied, gym lacks
the equipment, dislike — is a FIRST-CLASS flow, satisfied without the
deleted alternatives graph:

- **Movement families are display-only metadata** (`family?` on
  `data.ts` entries — the historical 20 family slugs, reborn as catalog
  display data). Families never affect identity, history, or
  progression.
- **The swap is ephemeral**: `swapDraftExercise` replaces the draft
  exercise's identity in place (position, Rx label, and logged set rows
  survive; tags reset — the slot's suggested tags belonged to the
  original exercise). The program in `splits.ts` never changes.
- **No alternatives graph, no eligibility engine** — the swap sheet
  lists same-family catalog entries; the empty state (single-entry
  families, custom exercises) points at Remove + Add, which can bring
  in anything, including a typed custom exercise.
- **Remembered overrides are a promotion candidate**, not built: if the
  same swap is made repeatedly (≥3 sessions), a per-slot remembered
  override (client-side preference, program untouched) earns its build.

## 4. The program's relationship to identity

`splits.ts` references identities by `ExerciseKey` (a slug union) but
**persistence joins by NAME** — `data.ts`'s display entry and the seeded
`exercises` row must agree on the exact name string. Adding a split
exercise means, in one change: the `ExerciseKey` union + slot in
`splits.ts`, the display entry in `data.ts`, and (for system identities)
the seed INSERT in the greenslate migration. Browsable extras
(`data.ts`` only) get their `exercises` row lazily on first log
(find-or-create in `WorkoutRepository.resolveExerciseId`).
