# armandotfit

> A fitness PWA — workout splits, exercise library, progression, streak, real-time session logging. Built on [arqavellum](../arqavellum) (sibling repo): the qep-tracker architecture retuned for PWA-first (native export is consumer extension) + email/password auth + light-mode-first.

## What armandotfit is

The first consumer of arqavellum. Arqavellum absorbed the one-time architectural cost (47-pattern constitution, 12-audit pre-commit gate, repository pattern, MobilePremium design system forked to light, PWA runtime-injection block). Armandotfit owns its domain layer on top — the fitness logic that turns the shell into a shipping app.

- **PWA-first.** Static web export is the supported default; installable from the browser. Native iOS/Android export is an intentional consumer extension — armandotfit ships native scaffolding (`icon`, `ios`, `android`, `expo-splash-screen` plugin in `app.config.ts`) + branded PNGs at `./assets/`. Releasing native would require `eas.json`, EAS Build config, the consumer's own iOS bundle ID + Android application/package ID (replacing the `app.armandotfit` starter value), and platform validation.
- **Light is the default; dark is opt-in.** Theme palette ships both modes; the active palette resolves at runtime via `useAppTheme()`.
- **Email/password auth.** Inherited from arqavellum. No PIN primitives.
- **Brand color: armandotfit orange (`#FF9500`)** — overridden from arqavellum's default indigo.
- **Supabase project: `mfeyywnwbjejzzbqzmop`** (created 2026-07-18 for the v2 port).

## Quickstart

```bash
git clone github.com/moidotsh/armandotfit
cd armandotfit
bun install
```

Then:

1. Copy `.env.local.example` → `.env.local`, fill in the Supabase URL + anon key for project `mfeyywnwbjejzzbqzmop`.
2. Apply migrations: `bunx supabase db push` (or run them via the Supabase dashboard).
3. `bun run web`.
4. Visit `localhost:8081`. Register → log in → land on the home dashboard. Visit `/dev/premium` to see the design-system showcase.

## The architecture, in 30 seconds

```
Route (app/) → Hook (hooks/) → Service (services/) → Repository (utils/supabase/repositories/) → Supabase
                   ↑
              Zustand store (stores/) for client state
              React Query for server state
```

- **No direct Supabase calls outside repositories.** `audit-data-layer.ts` (S9) enforces this.
- **No `console.log` outside `utils/logger.ts`.** `audit-logging-errors.ts` (S11) enforces this.
- **No hardcoded hex colors.** `audit-ui-theme.ts` (S7) enforces this — use `theme.colors.{light,dark}.*`.
- **No `setInterval` without `clearInterval`.** `audit-runtime-resilience.ts` (R4a) enforces this.

The full 47-pattern constitution lives in `ARCHITECTURE.md`. The 12-audit pre-commit gate is documented in `CLAUDE.md` → "Pre-commit checks".

## Domain shape

| Concern | Where it lives |
|---|---|
| Workout splits (Full Body / AM-PM) | `constants/workoutSplits.ts` + `shared/exercises/splits.ts` (4-day oneADay + 4-day twoADay assignments) |
| Exercise library (43 system exercises: 26 split + 17 substitution pool) | `shared/exercises/data.ts` (TS-side) + `supabase/migrations/20260718000002_seed_system_exercises.sql` (26 split DB seed) + `supabase/migrations/20260721000002_seed_catalog_and_programs.sql` (17 substitution pool DB seed + alternatives graph) |
| Program templates (5-table hierarchy: template → variant → day → session → slot) | `supabase/migrations/20260721000001_program_templates.sql` (schema) + `20260721000002_seed_catalog_and_programs.sql` (one seeded template, two variants, 60 slots) + `utils/supabase/repositories/ProgramRepository.ts` (read surface) |
| Equipment capability inventory (Phase 2 onboarding model) | `constants/equipmentCapabilities.ts` (27-slug catalog + resolver) + `supabase/migrations/20260722000000_user_equipment_capabilities.sql` (advisory sibling table) + `app/equipment-inventory.tsx` (wizard) + `hooks/{queries,mutations}/use*EquipmentCapabilities.ts` |
| Active session state | `stores/workoutStore.ts` (ephemeral draft) + `hooks/mutations/useLogWorkout.ts` (optimistic flush) |
| Exercise browse filter state | `stores/exerciseStore.ts` |
| Workout history | `hooks/queries/useWorkouts.ts` + `WorkoutRepository` |
| Progression / streaks | `hooks/queries/useProgression.ts` + `ProgressionRepository` + `StreakRepository` (RPC wrapper) |
| Analytics (weekly bucketing) | `services/analyticsService.ts` + `hooks/queries/useProgression.ts` |
| Suggested exercises (split-day hydration) | `hooks/queries/useExercises.ts` → `useSuggestedExercises` |

Routes:

| Route | Role |
|---|---|
| `/` | Home dashboard — streak, weekly goal, recent workouts, quick actions |
| `/split-selection` | Pick split (1-a-day / AM-PM) + day of week → start session |
| `/equipment-inventory` | Phase 2 capability-onboarding wizard (broad selection → detail config → review/save) |
| `/workout-detail` | Active session (live draft) OR read-only detail (with `?id=`) |
| `/exercise-database` | Browse 43 system exercises + user custom |
| `/exercise-detail` | Single exercise with instructions/tips/muscles/equipment |
| `/progression` | Streaks + totals + weekly goal |
| `/analytics` | Range-selectable weekly bucketed workouts |
| `/workout-programs` | Curated templates — relational model landed (one seeded template + two variants); UI still stubbed for a later phase |
| `/login`, `/register`, `/forgot-password`, `/settings` | Inherited from arqavellum |
| `/dev/premium` | MobilePremium showcase — visual source of truth |

## Components (3-tier structure)

- **`components/MobilePremium/`** — primitive kit (copied from arqavellum, brand-overridden). MobileSurface, MobileHeader, MobileInput, MobileActionFooter, etc.
- **`components/primitives/`** — atomic wrappers (LoadingSpinner, Toast, AppLoading).
- **`components/composed/`** — domain-specific rows/cards composed from primitives (WorkoutSessionItem, ExerciseListItem, SetRow).
- **Feature components** live inside their route files (`app/workout-detail.tsx` IS the active-session feature component).

## Reference docs

| Doc | What it owns |
|---|---|
| `CLAUDE.md` | Repo operating context (invariants, pre-commit checks, arqavellum relationship, doc maintenance). Auto-loads in Claude Code sessions at the armandotfit root. |
| `ARCHITECTURE.md` | The 47-pattern constitution. Every architectural decision is grounded here. |
| `docs/OWNERSHIP.md` | Claim-type → canonical-owner map. |
| `docs/architecture/mobile-premium-design-system.md` | The MobilePremium kit (four pillars, primitive inventory, atmosphere palettes, gating policy). |
| `docs/architecture/pwa-installability.md` | The PWA installability contract (manifest, SW, runtime injection). |

## Stack

- Expo SDK ~54.0.x (web-only static export)
- React Native 0.81.x (New Architecture)
- React 19.x
- TypeScript ~5.9.x (strict)
- Tamagui 2.3.x
- Expo Router (latest on SDK 54)
- Reanimated ~4.1.x
- Supabase JS ^2.79.x
- Zustand ^5 + React Query ^5
- Zod ^4
- Vitest
- Bun

## License

MIT.
