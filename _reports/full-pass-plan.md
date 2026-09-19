# The full pass — findings and execution plan

> Decision record for the 2027-01 full improvement sweep mandated by
> `FULL_PASS_HANDOFF.md`. Every finding below carries the evidence
> actually run to discover it. Ranked by felt-value ÷ risk. The code
> is the deliverable; this file is the map.
>
> **OUTCOME (appended at close):** every finding executed except the
> items marked DEFERRED in §5. 12 commits in this repo + 3 shell
> ports in arqavellum, all pushed. Tests 680 → 707 (+4 schema-truth
> goldens, +4 draft persistence, +5 save queue, +6 derivation
> invariants, +3 music URL/volume/notice, −3 with the dead
> AppShellHeader test). Final walks light + dark + SE green (the one
> walk FAIL was the harness asserting the retired 48px compress-bar
> law — updated to 4cc141bec's inline-row law). The owner's three
> mid-pass asks (no station, entity-decoded titles, link-in-search +
> mini player) shipped as first-class commits.

## 0. Baseline (verified this window)

- Working tree clean at `60a7d53e2` (only untracked `*HANDOFF*.md`
  prompts). Dev server already serving on :8081.
- `bun run test:run` → **52 files, 680 tests, all passing** (13.4s).
- 13 audit scripts on disk; `lint:structure` chains all 13 (see
  finding F9 for the pre-commit gap).
- Live project probed **read-only with the anon key** (PostgREST
  validates query shape before privileges, so shape/column drift is
  observable without auth). Results in F1/F12.

## 1. Findings

### F1 — LIVE BUG: 400 on `logged_exercises` (the last-tags prefill) — ROOT-CAUSED

**Evidence.** The owner's console shows
`findLastTagsByExerciseNames failed: Unknown error`. Probing the live
project (`mfeyywnwbjejzzbqzmop`) reproduces it without auth:

```
GET /rest/v1/logged_exercises?select=tags,created_at,exercise:exercises(name)&limit=1
→ 400 {"code":"42703","message":"column logged_exercises.created_at does not exist"}
```

Column-by-column probe of every repo-expected column:

| Table | Missing on live |
|---|---|
| `sessions` | `created_at` |
| `logged_exercises` | `created_at` |
| `logged_sets` | `created_at` |
| `exercises` | — (id, user_id, name ok) |
| `music_picks` | — (id, user_id, video_id, title, artist, picked_at ok — **the migration IS applied**) |

**Root cause.** The canonical greenslate migration defines
`created_at` on `users` + `exercises` only — **never on the three
history tables** (grep: 2 matches, L92/L128). The live DB is CORRECT.
`WorkoutRepository` is wrong: its row interfaces declare
`created_at: string` on all three history tables (L42/L52/L64), the
last-tags query selects + orders it (L361-362) → PostgREST 400. Tests
pass because fixtures fabricate the column. Everything else uses `*`
wildcards, so only this call fails.

**Fix (proven against live before writing it).** Order by the parent
session's `started_at` via embed — probe returns 42501 (shape valid,
anon privilege-denied as expected):

```
GET /rest/v1/logged_exercises?select=tags,exercise:exercises(name),sessions(started_at)&order=sessions(started_at).desc&limit=300
→ 401 42501 (valid shape, privileges deny anon — authenticated has grants)
```

Also remove `created_at` from the three history row shapes +
`shared/types/workout.ts` (`createdAt` on `TrainingSession`/
`LoggedExercise`/`LoggedSet` is written-but-never-read dead weight;
the only reader is the optimistic-update synthesizer). No schema
change; no migration; the live DB stays untouched.

### F2 — The session draft dies with the tab (offline resilience, D4 unwired)

**Evidence.** `stores/workoutStore.ts` L1-4: "Ephemeral — NOT
persisted." `ARCHITECTURE.md` SE2 claims "ephemeral workout draft
state" IS persisted — constitution and code disagree. `BaseQueueService`
exists (`services/base/`) with **zero concrete subclasses**; the logger
reserves an `'offlineQueue'` context (`utils/logger.ts` L39) for a
service that was never built. The save path (`useLogWorkout`) is a
single mutation; on network failure the draft survives in memory only.
The root `OfflineBanner` says "sets keep logging, save when back
online" — false across a reload/OS-kill mid-gym.

**Fix.** (a) Persist the draft: zustand `persist` on `workoutStore`,
partialized to `{draft, sessionStartedAt, isSessionActive,
selectedExerciseLocalId}` via `zustandStorage` (SE2-compliant). (b)
Concrete `sessionQueueService extends BaseQueueService` — on
save-failure-while-offline, enqueue the `LogSessionDTO`, toast
"SAVED OFFLINE", reset the draft; flush on reconnect + at boot.
(c) Banner copy tells the truth in both states.

### F3 — Fetch overlap: the nested history payload lives under 4 keys

**Evidence (query-layer audit, this window).** 10 useQuery hooks.
`findRecentWithDetails` (nested sessions+exercises+sets) is cached
under **4 distinct keys at limits 5/10/60/100**; the limit is baked
into the key (`['workouts','recent',N,'details']`). Same-screen
double fetches: Home mounts 5-details AND 10-details (via
`useTopSetsByName`); Exercise-detail mounts 10 AND 60. The
headers-only variant is fetched at limit 200 under three separate
keys (`analytics.summary`, `streaks.current`, `analytics.history,N`)
plus `recent(1)` on split-selection. No shared `history` key. No
`placeholderData` anywhere (analytics range switch = fresh entry +
flash).

**Bonus bug.** `useLogWorkout`'s optimistic update writes
`['workouts','recent',10]` (headers) — the only mounted headers key
is `recent(1)`, so the optimistic preview lands in an entry with zero
observers: a silent no-op today. `useStreaks` is exported but mounted
by no screen. Chart derivations are useMemo'd at call sites ✓;
`computeStreaks`/`computePersonalBests` run inside queryFns.

**Fix direction.** One `history` key at a single generous limit
(single user; computed-at-read law — 100 sessions of raw facts is
small), consumers derive via `select`; `deriveTopSets`,
`personalBests`, trajectory/PR derivations read the same cache;
`keepPreviousData` on the analytics range switch; the optimistic
update targets the key home actually renders.

### F4 — Music surface: no error handling, no Media Session, no volume

**Evidence (music audit, this window).**
- Player = IFrame API in an off-tree 1px host
  (`utils/youtube/playerHost.ts`) — architecture is sound; commands
  diff via store subscription, exactly one imperative command per
  change.
- **`onError` is not registered at all** (`playerHost.ts:76-87`
  registers only onReady/onStateChange): unavailable/embed-blocked
  (101/150) / region-locked videos die silently with the optimistic
  play icon stuck on.
- **Queue exhaustion stops playback** (`musicStore.ts:129-133`,
  test-pinned) — no continue-into-station.
- **Media Session API: zero references repo-wide** — no lock-screen /
  hardware-key controls on a gym app whose screen is off mid-set.
- **No volume path** (interface has no setVolume; transport is
  prev/toggle/next only).
- Search-failure UX is good (honest origin-refusal copy); pick-save
  failure is log-only (acceptable); sheet carries the SB2 spread and
  desktop column correctly.
- `stop()` and `currentTrackMeta()` have no production callers.

**Fix.** Register `onError` → skip-to-next with a honest toast (and
queue-exhaustion → fall into the default station, one-hop continue);
`setActionHandler` for play/pause/next/prev + `MediaMetadata` for
title/artist; a volume slider in the sheet driving `setVolume(0..100)`
+ persisted preference; dead exports removed (F11).

### F5 — Accessibility beyond the floor

**Evidence (grep).** `TrajectoryChart`, `TrainingConsistencyGrid`,
`WallGauge`, `PinRail` — zero `accessibilityRole="img"`, zero
title/desc; charts are silent to voice-over. No live-region
announcement of "set logged" (Floor deliberately does not toast on
LOG SET — correct mid-set; a polite `accessibilityLiveRegion` line is
the missing channel) and no announcement of rest state transitions
(started/settled), only static labels. `MobileDialog` has no focus
trap/autoFocus. TheLogger/SessionStrip labels are good.

### F6 — Test depth

680 tests are green (baseline). Rail math (`railMaxFor`/`pinRatio`)
already has monotone/proportional sweeps. Gaps: no property-style
invariant tests for muscle-share (sums to 100%), e1RM edge cases,
volume derivations over generated histories; the WebKit probe library
proves what vitest can't but never runs in CI (see F10 scripts).

### F7 — Performance (to be measured during F3 work)

Re-derivation cost of chart data on 60-session payloads; memo hygiene
on the Floor; SectionList tuning in the library; two variable woff2
payloads (56+37 KB — fine); boot plate first paint. Measure before
changing; fix only what measures hot.

### F8 — Docs truth pass (COMPLETE — audit run this window)

- `ARCHITECTURE.md` L168 + L353 say "12 audits" (13 exist); L167
  describes the hook as `lint:structure` (it enumerates audits
  individually); L347 "The light theme" contradicts S7 (both palettes
  ship).
- `.husky/pre-commit` **omits `audit-shim-sync.ts`** — runs 12 of 13;
  header self-describes as 12. CLAUDE.md L37 says 13 run on commit.
  → fix the hook (strengthen the gate, allowed) + the docs.
- `README.md`: theme described as retired "ember ink on warm paper"
  (L3/L12); "five tables" (L9/L50) — six since 2027-01; "single
  greenslate migration" (L21) — four files; missing
  `EXPO_PUBLIC_YOUTUBE_API_KEY` (L20 + `.env.local.example`);
  `/program` route missing from the routes table; analytics described
  pre-chart-suite; "run with `bun test`" (L77) — the runner is vitest
  (`bun run test:run`).
- `docs/OWNERSHIP.md` still names the retired quiet-page thesis as
  active.
- CLAUDE.md's doc-maintenance table has no README row (why it drifted).

### F9 — Gate gap: shim-sync not in pre-commit (fix with F8)

`.husky/pre-commit` runs 12 audits; `lint:structure` runs 13. Adding
`audit-shim-sync.ts` to the hook strengthens the gate — sanctioned
("never weaken" cuts the other way).

### F10 — Supabase drift tooling (owner surface)

The handoff believed `music_picks` unapplied; the probe shows it
applied and matching. The actual drift is F1's columns — and the only
reason it survived to production is that nothing verifies live schema
against the repo's canonical migrations. Build
`scripts/verify-live-schema.ts` (read-only anon probes, same trick as
F1: 42501 = exists, 42703 = missing column, 42P01 = missing table;
assert every column the repositories name + grants present for
`authenticated` via a probe with anon expecting 42501) so the owner
can run it after any apply.

### F11 — Dead and drifted code (inventory complete)

**Consumer-owned DEAD (removable):** `components/composed/EditableSetRow.tsx`
(170 ln, zero importers), `SplitExerciseRow.tsx` (85 ln, zero
importers), `AppShellHeader.tsx` (85 ln, zero importers — sole
consumer of three kit primitives that are themselves kit-owned and
stay); their three barrel lines.

**Production-dead, verify shell ownership before deleting:**
`utils/supabase/realtimeTable.ts` (only importer is its own test);
`stores` barrel's `useUIStore`/`getNetworkStore`/`getNetworkStatus`
names; `useAiPayload`. Rule: if the file also exists in
`../arqavellum` (shell-synced), it stays — deleting shell-synced
surfaces here breaks the file-by-file sync; only consumer-owned dead
code goes.

**Deliberate drift (KEEP, do not "clean"):** 36 unwired kit
primitives (kit ships whole per CLAUDE.md), the showcase + dev route
(stubbed in prod, gates on `EXPO_PUBLIC_DEV_SURFACES`), the shell
hook bank (~11 unused names — shell-synced), retired-figure names in
prose comments. All icon/manifest references resolve; no dangling
imports anywhere; the composed barrel fully resolves.

### F12 — Arqavellum sync state

12 of 13 audit scripts byte-identical to the shell;
`audit-screen-body.ts` differs consumer-legitimately (accepts this
consumer's `DeskShell`/`BoardShell` scaffold names — consumer
vocabulary, not port-worthy). Kit/primitives/hooks sync to be
re-checked after this pass's shell-level fixes (any MobilePremium/
utils/audit fix ports back domain-neutrally).

## 2. Execution order (milestones)

| # | Milestone | Finding | Risk |
|---|---|---|---|
| 1 | Fix the live 400: rewrite last-tags query to the embedded-`sessions(started_at)` shape; remove phantom `created_at` from history row shapes + types; update fixtures | F1 | low (shape proven against live) |
| 2 | Draft persistence + queued save + honest banner | F2 | medium (touch the live path; probe after) |
| 3 | Shared history key + `select` derivations (kills F3 overlap) | F3 | medium |
| 4 | Music hardening (error states, queue exhaustion, Media Session, volume) | F4 | medium |
| 5 | A11y: chart titles/desc + role=img, set-logged + rest live regions, sheet focus | F5 | low |
| 6 | Docs truth pass + pre-commit gate fix + README row in CLAUDE.md table | F8/F9 | low |
| 7 | `verify-live-schema.ts` owner tool | F10 | low |
| 8 | Test depth: derivation invariants | F6 | low |
| 9 | Perf measurements → targeted fixes | F7 | low |
| 10 | Dead code removal (after F11 lands) | F11 | low |
| 11 | Arqavellum ports of shell-level fixes | all | low |

Each milestone: gate (`bun run lint:structure && bunx tsc --noEmit`)
→ `bun run test:run` at code milestones → WebKit probes for anything
UX-affecting → commit (code only) → push (separate command) → docs
commit → push. Supabase/live changes: none (owner-only, listed in §4).

## 3. Non-goals (this pass)

No visual redesign; THE GAUGE is law. No new dependencies (Media
Session API and YouTube IFrame API are platform APIs, not packages).
No schema changes (F1 is code-side; live DB is correct). No seventh
table. No weakening of any gate.

## 4. Owner-only items surfaced by this pass

1. Nothing to apply — the live schema is CORRECT per canonical
   migrations (the F1 bug was client-side). `scripts/verify-live-schema.ts`
   (milestone 7) is offered to make future applies verifiable.
2. Confirm the offline banner copy (milestone 2) reads right in the
   gym.
3. YouTube Data API key remains referrer-restricted; verify the
   restriction covers the deployed origin after this pass deploys.

## 5. Deferred (with reasons)

- **Probe library as in-repo `scripts/probe-*` harness (F6):** the
  `.shots/` WebKit harness stays scratch (the workspace CLAUDE.md
  discipline); porting it in-repo would commit captures-adjacent
  tooling. The load-bearing invariants instead landed as vitest
  property tests; the probes that ran this pass are enumerated in the
  commit messages.
- **SE2 → audit #14 (localStorage scope):** SE2's gap remains
  review-enforced; a false-positive-free audit needs a storage-key
  allowlist design the owner should weigh in on.
- **Bundle splitting:** single 2.0 MB entry JS measured; for a
  single-user PWA behind a warm service worker, splitting is churn.
  Revisit if cold-load measurably hurts.
- **Kit design drift (flat verb button, ink curtain, tile shapes):**
  deliberate GAUGE overrides of shell files — documented, not synced;
  flattening the public shell's button is a shell design decision.

## 6. Commit-scope slip (recorded)

`965a23116` carries the docs-truth + pre-commit-hook changes under
the verify-live-schema message — files staged by an earlier
commit-blocked attempt rode the next successful commit. All content
was gate-validated (13 audits + tsc + full suite over exactly those
contents); only the message under-describes. Recorded here rather
than rewriting pushed history.
