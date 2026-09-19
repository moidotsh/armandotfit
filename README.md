# armandotfit

> A personal fitness PWA — the AM/PM hypertrophy program, six-table workout logging with tag-based setup context, computed-at-read progression, and the music surface. Built on [arqavellum](../arqavellum) (public starter shell). Theme: **THE GAUGE — the gym's instrument panel** (`docs/architecture/gauge-thesis.md`).

## What armandotfit is

A gym logbook for one to a few serious lifters. You train a fixed 4-day AM/PM full-body hypertrophy split; the app suggests the day's sessions, you log sets in seconds, and progression/streaks/analytics are computed from raw history — never precomputed or stored.

- **Six tables, raw facts only** — `users`, `exercises` (coarse identities), `sessions`, `logged_exercises` (with free-form `tags`), `logged_sets` (a logged row is a done set), plus `music_picks` (the owner-sanctioned sixth table — the music surface's persisted recents).
- **Coarse identity + tags.** "Lat Pulldown" is one exercise; underhand grip, rope attachment, which machine — those are tags, filterable at read time. Suggested tags ride the program slots.
- **The program is TypeScript** (`shared/exercises/splits.ts`) — 4 days × AM/PM × 4 slots with programmed sets/reps ranges, plus a one-a-day compression. Never modeled in the database.
- **THE GAUGE theme** — loads render as pin rails (a printed tick scale with the pin at the working weight), set counts as pip groups, digits on rolling counters, statuses on flip tiles; the rest countdown is a first-class instrument after every logged set. One signal hue; the verb is the heaviest ink. Light (ENAMEL) default, dark (NIGHT GYM) opt-in.
- **Offline-resilient** — the live session draft persists locally (a reload or OS kill mid-gym loses nothing) and FINISH while offline queues the save, syncing on reconnect.
- **Music surface** — a hidden YouTube player with search-when-keyed, recent picks persisted to `music_picks`, link paste (song or playlist), lock-screen controls (Media Session), and volume. Optional: needs `EXPO_PUBLIC_YOUTUBE_API_KEY` for search; keyless mode still plays pasted links.
- **PWA-first** — installable from the browser (per-route injected manifest/fonts), native export is a consumer extension.
- **Email/password auth**, guard on — history is per-user.

## Quickstart

```bash
bun install
cp .env.local.example .env.local   # Supabase URL + anon key (+ optional YouTube key)
bunx supabase db push              # applies the migration pairs (greenslate + music_picks)
bun run web                        # → localhost:8081
```

Register → land on the home dashboard → **Start workout** → pick split/day/AM-or-PM → log sets → save. Visit `/dev/premium` (dev only) for the design-system showcase.

After applying migrations, `bun run scripts/verify-live-schema.ts` checks the live project's schema against what the repositories query (read-only).

## The architecture, in 30 seconds

```
Route (app/) → Hook (hooks/) → Service (services/) → Repository (utils/supabase/repositories/) → Supabase
                    ↑
               Zustand store (stores/) for client state
               React Query for server state
```

Session start hydrates the draft **locally** from the program data (no round-trip); save resolves exercise names find-or-create and inserts the session → exercises → sets chain (session row deleted on downstream failure). Progression, streaks, and analytics derive client-side from TWO shared cache entries — the nested history (100 sessions) and the activity log (200 headers) — so the payload rides the wire once, not per screen.

The full 47-pattern constitution lives in `ARCHITECTURE.md`. The 13-audit pre-commit gate is documented in `CLAUDE.md` → "Pre-commit checks".

## Domain shape

| Concern | Where it lives |
|---|---|
| The AM/PM program (slots, Rx, suggested tags) | `shared/exercises/splits.ts` |
| Exercise catalog (display source, 42 entries) | `shared/exercises/data.ts` |
| Active session state (draft, tags, set CRUD — persisted) | `stores/workoutStore.ts` |
| Offline session-save queue | `services/sessionSaveQueue.ts` |
| Logging write/read paths | `WorkoutRepository` + `workoutService` + `hooks/mutations/useLogWorkout.ts` |
| Progression / streaks / analytics / charts (computed at read) | `services/{progressionService,analyticsService,chartData}.ts` |
| Day-of-split + rest-day picker logic | `constants/workoutSplits.ts` |
| Schema (five logging tables + seed; music_picks) | `supabase/migrations/` (greenslate pair + music pair) |
| Music playback (hidden YouTube player) | `utils/youtube/{playerHost,mediaSession}.ts` + `components/composed/MusicSheet.tsx` |

## Routes

| Route | Role |
|---|---|
| `/` | Home — the day's plan, streak, recent sessions, quick actions |
| `/split-selection` | Pick split (one-a-day / AM-PM) + day + AM/PM → start session |
| `/workout-detail` | The Floor (live session) or the Receipt (read-only `?id=`) |
| `/program` | The timetable — the full AM/PM split, slots + Rx |
| `/exercise-database`, `/exercise-detail` | The directory (zone lines) + spec sheet (trajectory chart, number to beat) |
| `/progression` | The records — streak, the gauge wall, PR timeline |
| `/analytics` | The ledger — consistency grid, muscle share, weekly volume (7/30/90 ranges) |
| `/login`, `/register`, `/forgot-password`, `/settings` | Shell auth + preferences (theme, weight unit kg/lb, rest default, rest days, install) |
| `/dev/premium` | Design-system showcase (dev only) |

## Reference docs

| Doc | What it owns |
|---|---|
| `CLAUDE.md` | Repo operating context (invariants, 13-audit gate, shell-sync procedure). Auto-loads. |
| `ARCHITECTURE.md` | The 47-pattern constitution. |
| `docs/OWNERSHIP.md` | Claim-type → canonical-owner map. |
| `docs/architecture/gauge-thesis.md` | The active design thesis (THE GAUGE). |
| `docs/architecture/exercise-logging-governance.md` | Identity test, tags, promotion rule. |
| `docs/architecture/mobile-premium-design-system.md` | The MobilePremium kit. |
| `docs/architecture/pwa-installability.md` | PWA delivery contract. |

## Stack

Expo SDK ~54 (web static export) · React Native 0.81 · React 19 · TypeScript strict · Expo Router · Reanimated ~4.1 · Supabase JS ^2.79 · Zustand ^5 + React Query ^5 · Bun · tests under `__tests__/` (run with `bun run test:run`)

## License

MIT.
