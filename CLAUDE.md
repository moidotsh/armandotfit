# armandotfit

> armandotfit is a fitness PWA (workout splits, exercise library, progression, streak, real-time session logging) built on [arqavellum](../arqavellum) — the qep-tracker architecture (47-pattern constitution, 12-audit pre-commit gate, repository pattern, Zustand + React Query, barrel exports) retuned for **PWA-first (native export is consumer extension)** + **email/password auth**. Arqavellum is the starter; armandotfit is its first consumer.

This file is the repo-level operating context for Claude Code sessions at the armandotfit root. It auto-loads. Read the relevant section before landing any armandotfit change.

## Invariants

Load-bearing rules that aren't obvious from the code:

1. **Bun only.** Never commit `package-lock.json` or `yarn.lock`. `audit-pattern-compliance.ts` (S19) enforces this.
2. **PWA-first. Web is the supported default; native Expo export is an intentional consumer extension, with native assets and platform validation required before release.** Native scaffolding ships in `app.config.ts` (`icon`, `ios`, `android`, `expo-splash-screen` plugin) + branded PNGs at `./assets/` (icon.png, splash-icon.png, adaptive-icon.png). `app.json` mirrors `app.config.ts` as a synchronized template; `app.config.ts` is the build-authoritative source. `ios.bundleIdentifier: 'app.armandotfit'` is starter scaffolding — replace it with the production iOS bundle ID and add the Android application/package ID before any native release. Runtime manifest-injection in `app/_layout.tsx` remains load-bearing — Expo Web's static export strips `<link rel="manifest">` from `dist/index.html`, and runtime injection restores it. Don't remove that block without reading `docs/architecture/pwa-installability.md` first. Desktop-shaped layouts (multi-column, sidebar nav) are a consumer extension that adds a sibling `DesktopPremium` kit — see `docs/contributing.md` → "Adding desktop support". PWA-first forbids shipping a native build as a supported target without per-consumer asset + platform work; it does NOT forbid desktop browser layouts.
3. **Light is the default; dark is opt-in.** `constants/theme.ts` ships both `theme.colors.light` and `theme.colors.dark` — structurally identical palettes, retuned for their respective surfaces. The active palette is resolved at runtime by `useAppTheme()` (in `context/ThemeContext.tsx`); components read `colors.*` directly and never index by mode. The user's preference persists across sessions via `zustandStorage` (web localStorage / native AsyncStorage), with `'system'` as the default (defers to OS prefer-color-scheme). `audit-ui-theme.ts` (S7) bans hardcoded hex colors — both modes resolve through `theme.colors[colorScheme].*`.
4. **Email/password auth.** Armandotfit uses email/password (inherited from arqavellum). No PIN primitives ship. If the threat model later requires PIN+device-UUID auth (qep-tracker parity), port the 4 PIN primitives + `audit-rpc-auth.ts` + `verify_session` RPC from qep-tracker.
5. **Brand color is armandotfit orange (`#FF9500`).** Overridden from arqavellum's default indigo in `constants/theme.ts` → `theme.colors.{light,dark}.{brand, brandHover, brandPress, brandMuted, brandSoft, buttonBackground, buttonBackgroundDisabled}` + the `glass.inputFocusBackground` key in each mode. Two icon surfaces are armandotfit-branded: `public/icons/*` (PWA, always required — 192.png, 512.png, 512-maskable.png) and `assets/*` (native extension — icon.png, splash-icon.png, adaptive-icon.png). Before any native release also replace the `ios.bundleIdentifier: 'app.armandotfit'` starter value in `app.config.ts` + `app.json` with the production iOS bundle ID and add the Android application/package ID — `app.armandotfit` is starter scaffolding, not a release identity.
6. **Audit scripts are canonical.** If this file and `scripts/audit-*.ts` disagree, the scripts win. This file is a cheatsheet; the scripts are the load-bearing enforcement.
7. **The 490px height-budget test** (from qep-tracker's mobile design system) carries over. Any new MobilePremium screen must fit at 490px viewport height (iPhone SE compact) without scrolling for the primary action. See `docs/architecture/mobile-premium-design-system.md`.
8. **Supabase project: `mfeyywnwbjejzzbqzmop`.** Created 2026-07-18 for the v2 port (separate from qepler `stykxxzhuakniqcvjsev` and qep-tracker `zkqnenhlrunyvhctsxbv`). Migrations live in `supabase/migrations/`. The squashed baseline (`00000000000000_initial_schema.sql`) is the canonical schema reference — the v1's pre-port `database/*.sql` files are no longer in the working tree (preserved in git history at commit `21303ed5c`); they had divergent/overlapping table definitions that the baseline resolves and should not be consulted going forward.
9. **System exercise library ships as a seed migration, with a TS-side mirror that owns display + planning data.** `supabase/migrations/20260718000002_seed_system_exercises.sql` loads the original 26 system exercises + their muscle/equipment reference data + the slug columns that join them to the TS-side `ExerciseKey` union in `shared/exercises/splits.ts`. `supabase/migrations/20260721000002_seed_catalog_and_programs.sql` extends the catalog with a 17-exercise substitution pool (referenced by the alternatives graph + program-template slots but not placed on any split day) — total catalog is 43. The DB is the source of truth for the exercise *row* (id + slug + existence); `shared/exercises/data.ts` is the source of truth for display attributes (variation, default sets, default reps, primary/secondary muscle slugs, equipment slugs) AND for the `MUSCLE_DISPLAY_NAMES` + `EQUIPMENT_DISPLAY_NAMES` maps that resolve those slugs to UI strings. Adding a new system exercise means landing it in **four** places in the same change: the seed SQL, `splits.ts` ExerciseKey union + day assignments (if it belongs on a day), `data.ts` SYSTEM_EXERCISES array + the display-name maps if a new muscle/equipment slug is introduced. The contract is enforced by review, not by an audit.
10. **Split is surfaced in the UI, not just stored in code.** The day→exercise assignments in `shared/exercises/splits.ts` are surfaced on two surfaces: the **split-selection preview** (`app/split-selection.tsx`) renders a live `SplitExerciseRow` list below the day picker, and the **active session** (`app/workout-detail.tsx`) auto-hydrates the draft from `useSuggestedExercises` once per session via `workoutStore.hydrateSuggestedExercises`. Hydration is idempotent (`hydratedRef` + empty-draft guard) and never overwrites user edits. If you add a day or change a slug, update both surfaces' expectations in the same change. The DB is queried for `id`/`slug` (via `ExerciseRepository.findBySlug`); display data comes from the local `SYSTEM_EXERCISES_BY_SLUG` lookup — no DB round-trip for the preview's attribute chips.
11. **Cycle counter is history-derived; rest days + AM/PM are UI-only.** Three independent concepts that all touch the split-selection flow, deliberately kept separate:
    - **Cycle counter** — the next split-day (1..4) is `getNextSplitDay(lastCompletedDay)` in `constants/workoutSplits.ts`, where `lastCompletedDay` is the most recent `workout_sessions.day` for the current user. Formula: `((lastDay - 1) % 4) + 2`, wrapping 4 → 1, defaulting to 1 for null/0/out-of-range. **No DB anchor** — no `cycle_started_at` column, no per-user cycle state beyond what's already in `workout_sessions.day`. The cycle advances only when a workout is actually logged; skipping a day does NOT advance it.
    - **Rest days** — user-configurable per-profile via `profiles.rest_days INTEGER[]` (migration `20260718000003_user_rest_days.sql`, default empty array, CHECK constraint 0..6 matching JS `Date.getDay()` Sun=0..Sat=6). **UI-only**: they visually deactivate day-of-week slots in the picker (`app/split-selection.tsx` rolling 7-day strip via `getUpcomingWorkoutSlots`) and are configurable in `app/settings.tsx`. The cycle counter does **not** read this column — only the picker does. When changing rest-day display or behavior, don't add logic to the cycle counter or the workout-logging path.
    - **AM/PM (`SessionMode`)** — applies to `twoADay` splits only. Stored on `DraftSession.sessionMode` (planning-time context), threaded through `startSession` → `useSuggestedExercises(split, day, sessionMode)` → active-session header eyebrow. **Not a DB column**: AM and PM are separate `workout_sessions` rows distinguished by their exercises (the day-N AM slug list vs the day-N PM slug list in `shared/exercises/splits.ts` are disjoint). Adding a third session mode (e.g. "lunch") would require extending `SessionMode` in `constants/workoutSplits.ts` + the slug assignments + the AM/PM toggle UI; no schema change.

    The `app/split-selection.tsx` rolling picker renders 7 upcoming days, each labeled with its auto-assigned day-of-split via `getUpcomingWorkoutSlots`. The walk starts at `getNextSplitDay(lastCompletedDay)` and advances the cursor only through non-rest days. Rest-day slots are still tappable for override (rare); the override changes the calendar day but `draft.day` is still whatever split-day that slot shows.
12. **Program templates are a durable relational model; splits.ts remains the active runtime source.** The 5-table hierarchy (`program_templates` → `program_schedule_variants` → `program_days` → `program_sessions` → `program_slots`) lands in `supabase/migrations/20260721000001_program_templates.sql` and ships one seeded template (`arman-fit-commercial-gym-v1`) with two independently-authored sibling variants (`one-a-day`, `two-a-day`) in `20260721000002_seed_catalog_and_programs.sql`. `ProgramRepository` exposes a read-only surface (findTemplateBySlug, findVariantTree, findSlotsForSession); writes are migration-only (RLS denies authenticated writes). The catalog extensions in `20260721000000_catalog_extensions.sql` (exercise_families, exercise_cues, exercise_grip_options, exercise_equipment_requirement_paths, exercise_equipment_requirements, exercise_alternatives) are additive — `exercise_variations` stays untouched (real consumers in `ExerciseRepository.fetchVariationsForExercise` + `app/exercise-detail.tsx`). `program_slots.exercise_id` is a real FK to `exercises.id` with `ON DELETE RESTRICT`. Slot prescriptions are structured (`sets_min`/`sets_max`, `reps_min`/`reps_max`, `per_side`, `slot_notes`) — no `press_block_id` or speculative grouping field. The static `ONE_A_DAY_SPLITS` + `TWO_A_DAY_SPLITS` arrays in `splits.ts` remain the active runtime source for the split-selection + active-session surfaces until a later phase switches those callers to plan-backed session hydration. The TS-side catalog mirror + the seed are verified by `__tests__/shared/exercises-catalog.test.ts` and `__tests__/supabase/program-seed.test.ts`.
13. **Equipment capability inventory is advisory — it never weakens the canonical user_available_equipment relation.** `user_equipment_capabilities` (migration `20260722000000`) is a Phase 2 sibling of `user_available_equipment` that stores user-facing capability selections (e.g. `cable-station`, `bench`, `calf-raise`) plus a JSONB details payload (attachments/heights, positions, variants) the existing schema can't express. **Two-table contract:** `user_equipment_capabilities` captures intent + structured detail; `user_available_equipment` stays the canonical eligibility-driving relation (Phase 3 reads it directly). No foreign keys between them — the capability layer is advisory and a future capability-model change can't invalidate existing user rows. **Reconciliation on save is purely additive:** `ExerciseRepository.replaceAllEquipmentCapabilities` resolves selections to concrete `EquipmentSlug` values via the pure functions in `constants/equipmentCapabilities.ts`, looks up the matching `equipment_type.id` rows, and upserts default rows in `user_available_equipment` (`ON CONFLICT DO NOTHING`). Existing user-managed rows (with non-default quantity or notes) are NEVER deleted or overwritten — the save is idempotent and non-destructive. The TS-side capability catalog (27 slugs across 7 groups; 4 detail-bearing) is the source of truth for the wizard UI (`app/equipment-inventory.tsx`); the DB stores `capability_slug` as TEXT so vocabulary extends without a migration. Adding a new capability means: extending `constants/equipmentCapabilities.ts` (slug union + display metadata + resolver mapping) and the wizard UI. No DB migration unless a new detail shape warrants a CHECK. Adding a new equipment_type that a capability should resolve to also means updating the resolver map. The catalog + resolver are verified by `__tests__/constants/equipmentCapabilities.test.ts`.

## Pre-commit checks (read before committing)

Armandotfit has 12 structural audits + `tsc --noEmit` + structural ESLint that run on every `git commit` via `.husky/pre-commit`. Any failure blocks the commit. Run them on the working tree **before** staging:

    cd armandotfit && bun run lint:structure && bunx tsc --noEmit

**Canonical source:** `scripts/audit-*.ts`. If this section and the scripts disagree, the scripts win.

### The two universal escape hatches

- **`// <check>-exempt`** — suppresses one violation within a 300-char lookback (e.g. `// s7-exempt`, `// c1-exempt`). Use sparingly with a justification; every rule exists because violations have bitten.
- **`git commit --no-verify`** — skips the hook entirely. Reserve for genuine emergencies.

### The 12 audits, in pre-commit order

| # | Script | Codes | Catches |
|---|--------|-------|---------|
| 1 | `audit-barrels.ts` | `[S5-internal]`, `[S5-external]` | Own-barrel imports (circular); direct-path imports when a barrel re-exports the symbol. Only audit with `--fix`. |
| 2 | `audit-data-layer.ts` | `[S9-import]`, `[S9-call]`, `[S13]`, `[D5]` | Direct `supabase.*` in `app/`/`hooks/`/`components/`; inline `queryKey: [...]`; repository methods not returning `RepositoryResult<T>`. |
| 3 | `audit-state.ts` | `[D3]`, `[D10]` | `useMutation` not touching a cache primitive; Zustand stores missing the 5 `// SECTION:` markers. |
| 4 | `audit-security.ts` | `[S12]`, `[SE2]`, `[S10]` | Anchored regex `.test()` in client code; AsyncStorage imports outside the allowlist; `Alert.alert` with raw `error.message`. |
| 5 | `audit-logging-errors.ts` | `[S11]`, `[S10]` | Live `console.*`; raw `throw new Error(...)` outside the carve-out. |
| 6 | `audit-ui-theme.ts` | `[S7]`, `[C3]` | Hardcoded hex colors; `Dimensions.get('window'/'screen')`. **Critical for brand-color enforcement.** |
| 7 | `audit-component-quality.ts` | `[C1]`, `[C2]`, `[C4]` | Direct `router.push/replace/back`; RN `Modal`; `ActivityIndicator` outside loading primitives. |
| 8 | `audit-testing-types.ts` | `[D6]`, `[T1]`, `[T2]` | UI code importing raw `shared/types`; test files outside `__tests__/`; inline `vi.mock()`. |
| 9 | `audit-pattern-compliance.ts` | `[S19]`, `[C10]` | `package-lock.json`/`yarn.lock` in tree; imports of deprecated symbols. |
| 10 | `audit-runtime-resilience.ts` | `[R4a]`, `[R4b]`, `[R1]` | `setInterval` without `clearInterval`; `addEventListener` without `removeEventListener`; async `useEffect` that awaits then setState/navigates without a cancellation guard. |
| 11 | `audit-screen-body.ts` | `[SB1]` | Full-screen route in `app/` (excluding `_layout.tsx`, `+not-found.tsx`, `dev/`) missing `SCREEN_BODY_STYLE`. Suppress with `// sb1-exempt`. Skipped when `CONTENT_WIDTH_MODE = 'fluid'`. |
| 12 | `audit-mobile-content-width.ts` | `[SB2-portal]`, `[SB2-magic-number]` | Portal component (imports RN `Modal` under `components/`) missing `...MOBILE_CONTENT_WIDTH_STYLE` / `...MOBILE_DIALOG_WIDTH_STYLE` spread on its panel style entry; literal numeric `maxWidth` under `components/`. Suppress with `// sb2-exempt`. Skipped when `CONTENT_WIDTH_MODE = 'fluid'`. |

Structural ESLint (`eslint.structure.config.js`) enforces two more:
- **`[S6]`** — `{expr && <Component/>}` render leak.
- **`[S8]`** — raw `fetch()`.

### Content-width policy (`CONTENT_WIDTH_MODE`)

The constrained mobile content column is the current default layout policy, inherited from arqavellum. `CONTENT_WIDTH_MODE = 'constrained'` enables a shared screen-body and portal-panel width system enforced by SB1 and SB2. `CONTENT_WIDTH_MODE = 'fluid'` makes the consumer responsible for its responsive width strategy and intentionally skips only SB1/SB2 width checks.

- **Single source of truth:** `constants/styles.ts` → `CONTENT_WIDTH_MODE`. Runtime styles (`MOBILE_CONTENT_WIDTH_STYLE`, `MOBILE_DIALOG_WIDTH_STYLE`, `SCREEN_BODY_STYLE`) and the SB1 + SB2 audits all read this same binding. Flipping the constant flips both runtime and enforcement in lockstep.
- **Constrained (default):** screen bodies apply `SCREEN_BODY_STYLE`; portal panels (any `components/*.tsx` importing RN `Modal`) spread `...MOBILE_CONTENT_WIDTH_STYLE` or `...MOBILE_DIALOG_WIDTH_STYLE` inside a panel-named StyleSheet entry (`sheet` / `card` / `cardWrapper` / `dialog` / `panel`). SB1 and SB2 actively enforce.
- **Fluid:** SB1 and SB2 print an informational skip and exit 0. Other audits (C2 Modal safety, S7 theme, accessibility, reduced motion, …) remain active. Fluid mode is a repository-level architecture decision (a consumer adopting a real tablet/desktop layout strategy); it is NOT a per-component escape hatch.
- **When to flip:** when this consumer adopts a sibling `DesktopPremium` kit (see `docs/contributing.md` → "Adding desktop support") or otherwise owns a responsive width strategy that conflicts with the centered 420pt column. Don't flip for individual wide screens — use `// sb1-exempt` / `// sb2-exempt` sparingly for those.

### The five that bite most often

1. **S5 barrels** — same-folder imports go to the relative source (`./Foo`); cross-folder imports go through the folder barrel. Run `bun run scripts/audit-barrels.ts --fix` to auto-rewrite.
2. **C1 router calls** — never call `router.push/replace/back` directly outside `navigation/NavigationHelper.tsx` and `hooks/useAuthNavigation.ts`. Extend the helper when adding domain routes.
3. **S9 supabase** — never `import` from `@supabase/supabase-js` or call `supabase.from/auth/rpc/...` in `app/`, `hooks/`, or `components/`. Go through `utils/supabase/*` or `services/*`.
4. **S7 hex colors** — never hardcode `'#FF9500'` in component code. Pull from `theme.colors.light.*` via `useAppTheme()` or a `constants` import. SVG vectors and `constants/theme.ts` are exempt.
5. **S11 console** — never ship `console.log/error/warn`. Use `logger` from `utils/logger`. (`utils/logger.ts` is the only legitimate `console.*` site.)

## Arqavellum relationship

Armandotfit is a **direct-copy consumer** of arqavellum (sibling repo at `../arqavellum/`; public at `github.com/moidotsh/arqavellum`). The shell — design system, audit scripts, PWA plumbing, provider stack, skeleton auth routes — was copied from arqavellum in a-Phase 0. Armandotfit owns its domain layer on top:

- **Domain routes** → `app/` (home dashboard, split-selection, workout-detail, exercise-database, exercise-detail, progression, analytics, workout-programs). Arqavellum's skeleton routes (login, register, forgot-password, settings, dev/premium) carry over.
- **Domain stores** → `stores/` (workoutStore — active draft state, exerciseStore — browse filter state; both ephemeral, not persisted). Arqavellum's cross-cutting stores (authStore, uiStore, networkStore) carry over.
- **Domain repositories** → `utils/supabase/repositories/` (WorkoutRepository, ExerciseRepository, ProgressionRepository, UserProfileRepository, StreakRepository).
- **Domain services** → `services/` (workoutService, progressionService, analyticsService).
- **React Query hooks** → `hooks/queries/`, `hooks/mutations/`. Includes `useSuggestedExercises` which hydrates a split-day's exercise slugs against the DB.
- **Domain types** → `shared/types/` (workout, exercise, progression, analytics, profile).
- **Domain data** → `shared/exercises/` (splits.ts — typed day→exercise-key assignments; data.ts — 43-exercise system library: 26 split-day exercises + 17 substitution pool).
- **Components** → three-tier structure:
  - `components/MobilePremium/` — primitive kit (copied from arqavellum).
  - `components/primitives/` — atomic wrappers (LoadingSpinner, Toast, etc.).
  - `components/composed/` — domain-specific rows/cards composed from MobilePremium primitives (WorkoutSessionItem, ExerciseListItem, SetRow, SplitExerciseRow).
  - Feature components live inside their route files (`app/workout-detail.tsx` IS the active-session feature component).
- **Constants** → `constants/workoutSplits.ts` holds split metadata + day-of-week labels, decoupled from theme for SOC.

When arqavellum ships an update that armandotfit wants (e.g. a new MobilePremium primitive, an audit-script fix), the workflow is: copy the relevant file(s) from `../arqavellum/` into armandotfit, re-apply armandotfit's brand overrides if they touch `constants/theme.ts` or icon assets, commit. No submodule, no npm link — direct file copy with per-file ownership at the armandotfit side. Arqavellum changes that touch `CLAUDE.md` or `ARCHITECTURE.md` may also need to be mirrored here if they affect shared discipline (audit-script behavior, design-system tokens, etc.).

## Documentation maintenance

This is the contract that prevents doc drift. For every change you land in code, the table below says **what triggers a doc update** and **where the update lands**.

| Change you're making | Update this doc | When |
|---|---|---|
| New pattern (S/C/D/SE/T/R code) | `ARCHITECTURE.md` (definition + rationale) + new `scripts/audit-*.ts` if statically-checkable + this file's pre-commit table. | Always. |
| New `scripts/audit-*.ts` | This file's pre-commit table (the 12-audit grid). Run order matters — place it correctly. | Always. |
| Audit exemption / regex tweak | `scripts/audit-*.ts` (canonical source). This file is the cheatsheet. | Always. |
| Visual token change (color, spacing, typography) | `constants/theme.ts` (canonical source) + `docs/architecture/mobile-premium-design-system.md` if it affects the design system. | Always. |
| New MobilePremium primitive | `docs/architecture/mobile-premium-design-system.md` (component inventory) + `app/dev/premium.tsx` (add to the showcase — load-bearing, the showcase IS the visual source of truth). | Always. |
| New animation/utility hook (`hooks/use*.ts`) | `hooks/index.ts` barrel + `app/dev/premium.tsx` (add an interactive demo if the hook has visible output). | Always. |
| New utility (`utils/*.ts` or `shared/utils/*.ts`) | The folder barrel (`utils/index.ts` / `shared/utils/index.ts`). | Always. |
| New navigation route / push-replace helper | `navigation/NavigationHelper.tsx` (extend `NavigationPath` enum + `navigationHierarchy` map). | Always. |
| New PWA-installability change (manifest, service worker, runtime injection, icons) | `docs/architecture/pwa-installability.md`. Runtime injection block in `app/_layout.tsx` and `index.html` (if present) must stay in sync. | Always. |
| New Zustand store | This file is enough for the cross-cutting stores. Add the 5 `// SECTION:` markers per audit D10. | Always. |
| Schema migration | Migration file header (always — multi-line "why"). | Always. |
| Shell-wide architectural decision | `ARCHITECTURE.md` first; cross-link here. | When the decision affects multiple files. |

### Rules

1. **One owner per claim.** If two docs appear to own the same claim, one is canonical and the other cross-links.
2. **Navigation layers don't restate content.** `README.md` and this file's intro paragraphs are navigation surfaces — they point at canonical content; they don't redefine it.
3. **Audit scripts are canonical.** If a doc and the scripts disagree, the scripts win — fix the doc.

## Canonical docs

| Claim type | Canonical owner |
|---|---|
| Repo operating context (invariants, pre-commit checks, arqavellum relationship, doc maintenance) | this file |
| Architecture constitution (47 patterns) | `ARCHITECTURE.md` |
| Project orientation (what armandotfit is, quickstart) | `README.md` |
| Claim-type → owner-doc map (cross-cutting) | `docs/OWNERSHIP.md` |
| MobilePremium design system (four pillars, primitive inventory, atmosphere palettes, 490px test, gating policy) | `docs/architecture/mobile-premium-design-system.md` |
| PWA installability (manifest, SW, runtime injection, icons) | `docs/architecture/pwa-installability.md` |
