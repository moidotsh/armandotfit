# armandotfit

> A personal fitness PWA — the AM/PM hypertrophy program, five-table workout logging with tag-based setup context, and computed-at-read progression. Built on [arqavellum](../arqavellum) (public starter shell). Theme: **ember ink on warm paper**.

## What armandotfit is

A gym logbook for one to a few serious lifters. You train a fixed 4-day AM/PM full-body hypertrophy split; the app suggests the day's sessions, you log sets in seconds, and progression/streaks/analytics are computed from raw history — never precomputed or stored.

- **Five tables, raw facts only** — `users`, `exercises` (coarse identities), `sessions`, `logged_exercises` (with free-form `tags`), `logged_sets` (a logged row is a done set).
- **Coarse identity + tags.** "Lat Pulldown" is one exercise; underhand grip, rope attachment, which machine — those are tags, filterable at read time. Suggested tags ride the program slots.
- **The program is TypeScript** (`shared/exercises/splits.ts`) — 4 days × AM/PM × 4 slots with programmed sets/reps ranges, plus a one-a-day compression. Never modeled in the database.
- **Ember ink theme** — the shell's ink dialect (flat air, ink-panel drawer, chit toasts, curtain route transitions, pre-JS boot plate) wearing armandotfit's measured-AA palette: ember `#E8590C` on warm paper, warm-ink plates, dark mode on a warm night.
- **PWA-first** — installable from the browser (per-route injected manifest/fonts), native export is a consumer extension.
- **Email/password auth**, guard on — history is per-user.

## Quickstart

```bash
bun install
cp .env.local.example .env.local   # fill in Supabase URL + anon key
bunx supabase db push              # applies the single greenslate migration
bun run web                        # → localhost:8081
```

Register → land on the home dashboard → **Start workout** → pick split/day/AM-or-PM → log sets → save. Visit `/dev/premium` (dev only) for the design-system showcase.

## The architecture, in 30 seconds

```
Route (app/) → Hook (hooks/) → Service (services/) → Repository (utils/supabase/repositories/) → Supabase
                   ↑
              Zustand store (stores/) for client state
              React Query for server state
```

Session start hydrates the draft **locally** from the program data (no round-trip); save resolves exercise names find-or-create and inserts the session → exercises → sets chain (session row deleted on downstream failure). Progression, streaks, and analytics read raw sessions and compute client-side.

The full 47-pattern constitution lives in `ARCHITECTURE.md`. The 13-audit pre-commit gate is documented in `CLAUDE.md` → "Pre-commit checks".

## Domain shape

| Concern | Where it lives |
|---|---|
| The AM/PM program (slots, Rx, suggested tags) | `shared/exercises/splits.ts` |
| Exercise catalog (display source, 42 entries) | `shared/exercises/data.ts` |
| Active session state (draft, tags, set CRUD) | `stores/workoutStore.ts` |
| Logging write/read paths | `WorkoutRepository` + `workoutService` + `hooks/mutations/useLogWorkout.ts` |
| Progression / streaks / analytics (computed at read) | `services/{progressionService,analyticsService}.ts` |
| Day-of-split + rest-day picker logic | `constants/workoutSplits.ts` |
| Schema (five tables + seed) | `supabase/migrations/20261001000000_greenslate_rebuild.sql` |

## Routes

| Route | Role |
|---|---|
| `/` | Home — streak, this week, recent sessions, quick actions |
| `/split-selection` | Pick split (one-a-day / AM-PM) + day + AM/PM → start session |
| `/workout-detail` | Active session (live draft) or read-only detail (`?id=`) |
| `/exercise-database`, `/exercise-detail` | Browse + catalog detail (slug-keyed) |
| `/progression`, `/analytics` | Computed totals + consistency grid |
| `/login`, `/register`, `/forgot-password`, `/settings` | Shell auth + preferences (rest days, install) |
| `/dev/premium` | Design-system showcase (dev only) |

## Reference docs

| Doc | What it owns |
|---|---|
| `CLAUDE.md` | Repo operating context (invariants, 13-audit gate, shell-sync procedure). Auto-loads. |
| `ARCHITECTURE.md` | The 47-pattern constitution. |
| `docs/OWNERSHIP.md` | Claim-type → canonical-owner map. |
| `docs/architecture/exercise-logging-governance.md` | Identity test, tags, promotion rule. |
| `docs/architecture/mobile-premium-design-system.md` | The MobilePremium kit. |
| `docs/architecture/pwa-installability.md` | PWA delivery contract. |

## Stack

Expo SDK ~54 (web static export) · React Native 0.81 · React 19 · TypeScript strict · Expo Router · Reanimated ~4.1 · Supabase JS ^2.79 · Zustand ^5 + React Query ^5 · Bun · tests under `__tests__/` (run with `bun test`)

## License

MIT.
