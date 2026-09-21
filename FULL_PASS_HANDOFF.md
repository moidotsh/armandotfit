# HANDOFF — THE FULL PASS: A MASSIVE IMPROVEMENT SWEEP OF ARMANDOTFIT

**Audience:** the next model, fresh, equal to the one that built what you
inherit. **Mandate:** a full-strength engineering pass over the ENTIRE
codebase — architecture, robustness, performance, data access, test
depth, accessibility, security, documentation, developer experience —
landing improvements that a working personal product actually feels.
You are NOT doing a visual redesign: the presentation system (THE
GAUGE) shipped one working window ago and was tuned with the owner,
screen by screen, interaction by interaction. Code that SERVES the
design is fully in scope; the design itself is settled law (refine
only with a reason the owner would recognize). Sunk cost is not an
input in the other direction either: if a structure is wrong, replace
it — the invariants below are the fence, not the code.

What you inherit is green and complete: 13 audits + tsc + **680
tests** passing, probe-verified screens, a live owner using it in the
gym. Your job is to make it *materially better*, not to justify it.

## 1. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos:
  `armandotfit/` (the product) and `arqavellum/` (the public starter
  shell it consumes, file-by-file synced). The workspace root is NOT
  a git repo — every git command runs inside a child repo with an
  explicit `cd` (cwd never persists between shell calls).
- Package manager is **bun** everywhere. Dev server:
  `cd armandotfit && bun run web` (port 8081) — CHECK if it's already
  serving before starting another (`curl` it).
- Read, in order: `armandotfit/CLAUDE.md` (repo law — now accurate;
  invariants 3–5 describe the current system), `ARCHITECTURE.md` (the
  47-pattern constitution + the audit codes), then `app/`,
  `components/composed/`, `components/MobilePremium/`, `hooks/`,
  `services/`, `stores/`, `utils/` as a code inventory.
  `docs/architecture/gauge-thesis.md` is the design canon — read it to
  understand what the code must serve, and where its own §10
  measurement spec is not yet fully probed.
- Untracked `*HANDOFF*.md` files in the repo root are prompts from
  prior rounds, never commits. Read `SEVENTH_UPENDING_HANDOFF.md`'s
  §7–8 for the environment realities that remain true (WebKit probes,
  the `.shots/` scratch discipline, the metro-cache rule).

## 2. What the app IS (January 2027)

A personal fitness PWA, one user, used mid-set in the gym. Five-table
logging core + owner-sanctioned `music_picks`. THE GAUGE presentation
(enamel-on-concrete, pin rails, odometers, flip tiles, rest
instrument), weight-unit display conversion (kg storage), trajectory +
volume + PR + muscle-share charts, tag-signature variant filtering,
music surface (hidden YouTube player, station/playlist/search-when-
keyed, persisted picks). Auth email/password, guard ON. Computed-at-
read everything. The design thesis doc and `CLAUDE.md` tell one story.

## 3. The improvement surface — known debt and hunting grounds

Ranked starting points, discovered by the model before you. Verify,
then go beyond.

1. **A live production bug:** the owner's console shows a **400 on
   `logged_exercises`** — `findLastTagsByExerciseNames failed: Unknown
   error` (the last-used-tags prefill on the Floor). Diagnose against
   the real project (`mfeyywnwbjejzzbqzmop`): likely the embedded
   relationship filter shape or a missing grant/RLS edge on the live
   DB. This is the highest-value single fix.
2. **Fetch overlap and query strategy:** home fetches recent details
   (5), analytics (60), trajectory (60), PR timeline (60) — same
   payload fetched under different keys. Consider one shared
   history hook/key with `select` derivations, staleTime tuned for a
   single-user app, and `keepPreviousData` on the analytics range
   switch.
3. **Offline resilience:** the session saves ONCE at the end — a dead
   zone mid-gym loses the whole workout. D4 (`offlineQueueService`,
   `BaseQueueService`) exists in the constitution; check whether the
   log mutation rides it. If not, wire it (or an equivalent
   queued-retry), and make the offline banner honest about drafts.
4. **Music surface hardening:** player error states (unavailable/
   region-locked videos currently just stop), queue exhaustion (stop
   or continue into an RD mix), **Media Session API** for lock-screen
   controls (big win on web), volume, the sheet's desktop-column
   compliance, and a native player path if you can do it without new
   dependencies.
5. **Accessibility depth beyond the floor:** live-region announces
   for "set logged" and rest countdown state, focus order on sheets,
   keyboard navigability of the logger on web, voice-over labels on
   the charts (SVG needs title/desc).
6. **Test depth:** 680 tests are wide but DOM-shallow in places; the
   probe library (`.shots/upend7/`) proves things vitest cannot but
   never runs in CI. Consider an in-repo `scripts/probe-*` harness
   (WebKit, mocked network, runnable on demand) for the load-bearing
   laws, and property-style tests for the derivations (rail ratios,
   e1RM, muscle-share invariants).
7. **Performance audit:** re-derivation cost of chart data on 60-
   session payloads, SectionList tuning in the library, memo hygiene
   on the Floor, bundle size and font payload (two variable woff2s —
   fine, but measure), and the boot plate's first-paint.
8. **Docs truth pass:** `README.md` (likely stale), `ARCHITECTURE.md`
   S20 row (still says 12 audits?), the design-system doc vs the
   GAUGE kit reality, `docs/OWNERSHIP.md`, governance doc. One owner
   per claim; cross-link, don't restate.
9. **Security posture:** SE2's noted gap (localStorage unrestricted
   by audit — review-enforced today) could become audit #14 if you
   can scope it without false positives; the YouTube key is
   referrer-restricted and lives only in env; verify no `EXPO_PUBLIC_`
   secret-shaped values beyond it.
10. **Dead and drifted code:** `EditableSetRow` (used?), retired
    figure imports, the showcase vs the GAUGE kit (the showcase is
    the shell's — it demos primitives, not the consumer's design;
    confirm it still renders), icon surfaces still on-system.
11. **Arqavellum sync:** verify file-level sync of shell-owned
    surfaces (kit, audits, plumbing, hooks) and port back any
    shell-level fixes you make, domain-neutrally (public-repo
    discipline — local hooks enforce it, correctly).
12. **Supabase drift:** `music_picks` migration exists in the repo
    but is NOT applied on the live project (owner step — surface it,
    don't do it). Build a `scripts/verify-live-schema.ts`-style
    check the owner can run after applying.

## 4. Non-negotiables — repo law that survives every pass

- **No new package dependencies without asking the owner first.**
- **The data spine is not design territory.** Six tables (see
  invariant 4), history immutable, computed-at-read, tags-not-columns,
  the program in TS. A seventh table = owner decision.
- **Auth guard stays ON; PWA plumbing intact** (mirror trio; run
  `bun run verify:web-build` after touching export plumbing).
- **Accessibility is floor:** roles/labels, 44×44 DOM-measured,
  reduced-motion, WCAG AA computed in both modes.
- **Tests stay green.** Rewrite expectations where behavior
  legitimately changes and say so; never delete to pass.
- **The audits are canonical** — extend them (a new audit with tests
  is an improvement; teach SB1 any new scaffold name), never weaken
  them.
- **The 490px law** and `theme.ts` as sole token owner (S7).
- **THE GAUGE is the settled presentation.** Structural code behind it
  may be reorganized freely; tokens/faces/laws change only with a
  reason the owner would recognize as a fix, not a re-taste.

## 5. Working method

1. **Inventory + findings first.** Before editing, produce
   `_reports/full-pass-plan.md` (this repo allows reports in
   `_reports/` for durable decision records — commit it): every
   finding ranked by felt-value ÷ risk, the live 400 bug at the top,
   each with the evidence you actually ran (command outputs, not
   guesses).
2. **Milestones, not mega-commits.** One logical improvement per
   commit; gate on the working tree (`bun run lint:structure && bunx
   tsc --noEmit`) BEFORE staging; `bun run test:run` at code
   milestones; commit, then push as a SEPARATE command. Never chain
   `git commit && git push`. Verify `git status` scope before every
   push; never commit captures/probes/scratch/handoffs.
3. **Prove UX-affecting work in the browser:** the `.shots/`
   WebKit harness (see §8 of the seventh handoff) with the mocked
   network; walks in light + dark + SE as separate invocations for
   anything visual; re-assert the 490px budgets and the desktop
   column after layout-affecting changes.
4. **Update the docs with the change, in the same window** (the
   documentation-maintenance table in CLAUDE.md).
5. **Close** with a summary: findings executed vs deferred, test-
   count delta with reasons, commits, and an explicit list of what
   only the owner can confirm or must do (apply migrations, set env).

## 6. Stop and ask when

A dependency seems needed · a seventh table or schema change seems
needed · you want to weaken a gate instead of fixing code · anything
would break auth or PWA plumbing · a change would re-taste the GAUGE
rather than fix it · you want to apply anything to the live Supabase
project.

## 7. Refuse these failure modes

Claiming you ran something you didn't. Fixing a test by deleting it.
"Improvements" that are churn (rename passes, preference swaps) with
no felt value. Rewriting the design system because it's not your
taste. Leaving the findings doc as the only artifact — the code is
the deliverable. Skipping the push-protocol discipline because the
work is "just refactoring." Presenting captures as verification (they
are evidence for the owner, not for you).

*The app works. Make it excellent — and leave the owner a better
repo than the one that shipped.*
