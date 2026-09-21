# Handoff — Full Premium UI/UX Redesign, armandotfit

You are picking up the next pass on **armandotfit**, a personal fitness PWA at
`/Users/koba/Documents/Code/arman/armandotfit/`. The previous pass was
*corrective* — it fixed bugs, removed noise, and established receipt-like
patterns screen by screen (git range `9295c1b3a..96194930a`, 11 commits). Your
mandate is *generative*: a full premium redesign of the presentation layer,
executed as a faithful consumer of the arqavellum starter shell.

Read this whole document before touching anything. Then re-derive truth from
the repo — UI states drift, docs age, this file was written by an agent that
only thinks it remembers everything.

---

## 1. The product, in one breath

armandotfit is the AM/PM hypertrophy program as a PWA: four workout days,
AM and PM sessions as separate rows, coarse exercise identities refined by
free-text tags, sets as raw facts (`logged_sets` rows ARE completed sets), and
every progression number computed at read time — nothing derived is ever
stored. The theme is **ember ink on warm paper**: the shell's `ink` dialect
wearing armandotfit's own palette (`DIALECT = 'ink'` in `constants/theme.ts`).

The data layer — schema, repositories, services, stores — is **done and
stable**. It is not your target. UI + hooks that read existing services are
yours; stores/services/schema changes require owner sign-off (the last pass
added exactly one hook, `useRecentSessionDetails`, reading an existing service
method — that is the sanctioned depth).

## 2. Non-negotiables (owner taste, verbatim where quoted)

- The substitution trigger is a tiny `⇄` glyph opening a bare sheet —
  **"mostly invisible, obvious to open."** Five prior iterations were rejected.
  Never touch the glyph, never add "Swap"/"Change" labels, never restyle the
  sheet into chrome. It is exactly as loud as the owner wants it: not.
- **"If you're unsure whether something is 'too noisy,' it is. Remove it."**
- One primary action per screen. Quiet everything else.
- Every number that changes renders `fontVariant: ['tabular-nums']`.
- 44×44pt minimum touch targets (hitSlop counts), `accessibilityRole` +
  labels on every interactive element, reduced-motion respected.
- **S7:** no hardcoded hex anywhere in UI code — every color through
  `theme.colors.*` via `useAppTheme()` or constants. No second accent slot.
- **No new dependencies.** Bun only — never commit `package-lock.json`.
- Don't break the 490px height budget (iPhone SE, primary action visible
  without scrolling). The audit grid and tests carry this.
- The 627-test suite is the baseline; it must stay green. If a redesign
  legitimately changes what a test asserts, update the test in the same
  commit and say why — never weaken it silently.

## 3. The consumer contract (this is what "faithful" means)

arqavellum (`../arqavellum/`, public at `github.com/moidotsh/arqavellum`) is
the starter shell; armandotfit is a direct-copy consumer. The division:

**Shell-owned (don't fork locally — change it in armandotfit, then port the
same fix back to arqavellum in the same change window):** everything under
`components/MobilePremium/`, `components/premium/shared/`, `utils/`
foundations, `context/`, provider stack in `app/_layout.tsx`, audit scripts,
PWA plumbing. Last pass's worked example: `FilterChipGroup`'s flex fix landed
as `e76ec52a2` here and `16cae96` there, same change window.

**Consumer-owned (yours to redesign):** `app/*` routes, `components/composed/`
(WorkoutSessionItem, TagChips, EditableSetRow, SetRow, SplitExerciseRow,
ExerciseListItem, InkRail, ScreenScaffold, AppShellHeader, …), `hooks/`,
`constants/` (theme VALUES, displayName, layout), brand assets.

Before editing any `MobilePremium/` file, diff it against arqavellum's copy —
consumer copies may have deliberately diverged (ember palette values only,
structurally identical). Protocol: port the shell-owned part back as its own
commit in arqavellum's repo, domain-neutral commit message, **no sibling
repository names, no private paths, no consumer context in anything public**.
Consumer-side lands first; never block the consumer on the port.

Push protocol (workspace CLAUDE.md): commits are free; push each validated
commit as a **separate command** (never `git commit && git push` chained);
schema/migration/config pushes are approval-gated — you should have none.
Run git only inside the child repo, always with an explicit `cd` in the same
command.

## 4. What the last pass already did (go further, not sideways)

So you don't re-propose finished work: home recent rows are receipt lines with
lifts·sets·tonnage; quick actions are one 2×2 grid; sessions start at "now"
(the 1171-minute timer bug is fixed); the tag editor is active chips + one
bare-text suggestion line + a `+ tag` reveal; read-only sessions are receipts
with a started-time/figures summary card and ledger-style set rows; the
program shows per-day set totals in eyebrows; the library is a SectionList
with sticky category headers and clean category names; exercise detail uses
attribute chips; progression is one summary card with an honest empty state;
analytics uses the kit's SegmentedControl; rest days are compact day tiles;
`APP_DISPLAY_NAME` is overridden. `git log 9295c1b3a..96194930a` has the full
reasoning in commit messages.

## 5. The redesign mandate — what "full premium" means here

Premium in this design system is **not** gloss. The ink dialect is flat paper,
warm ink, one ember accent, print-like restraint. Premium means:

1. **Typographic confidence.** A real type scale used with intent — display
   figures that command, eyebrows that orient, body that breathes. Much of the
   app still carries ad-hoc `fontSize` literals; migrate them to named tokens
   in `theme.typography` (extend the scale where justified — the discipline is
   "pick named styles, retune values in one place", never per-callsite tuning).
2. **One figure language.** Home's streak hero, the session stats strip,
   progression's figures, and receipt values are currently four ad-hoc stat
   treatments. Consider one composed `Figure`/`StatBlock` pattern so every
   number in the app sits in the same visual grammar. If it graduates to a
   kit primitive, it ships to the showcase + design-system doc + arqavellum.
3. **Motion with intent.** Curtain route transitions are wired (ink preset);
   `usePressedStyle` exists. Audit every interactive surface for
   pressed/disabled/loading completeness; add restrained entrance choreography
   where it aids hierarchy. Everything collapses under reduced motion.
4. **Honest states, everywhere.** Loading → skeleton (not just spinners),
   empty → inviting EmptyState with an action, error → quiet inline alert.
   Every query-backed surface, every list.
5. **Composition, not chrome.** Rethink each screen's hierarchy from the
   user's question at that moment ("what do I do right now?" / "how did
   September go?" / "what did I do last Tuesday?"). Keep the structural
   skeleton — `SafeAreaView` + `MobileAtmosphere` + `MobileHeader` +
   `SCREEN_BODY_STYLE` body + `MobileActionFooter` (SB1 enforces the body
   policy) — and redesign what lives inside it.
6. **Density as taste.** Receipt quietness over card sprawl. Cards should
   earn their borders; lists read as ledgers; eyebrows do the grouping work
   (the library's sticky headers are the model).

Palette rebrands, dialect changes, route renames, new dependencies, and
anything touching stores/services/schema are **owner-decision territory**:
prepare a one-screen proposal with before/after mock shots, then stop.

## 6. Candidate work program (hypotheses — verify on-screen first)

Order is suggestion, not gospel. Each item = verify the current state with
shots, redesign, gate, commit, push.

- **Typography migration, app-wide** — sweep every screen + composed component
  for raw font values; land the scale in `theme.typography`; tabular figures
  systematic. This is the highest-leverage single change.
- **The figure/stat language** (above), then re-render home/progression/
  session/analytics through it.
- **Home as a daily brief** — today's split day and next planned exercise are
  derivable from existing reads (`suggestNextSplitDay`, split data); the
  launcher could name today's first lift. Keep it to one card's worth of idea.
- **Session logging ergonomics** — the logging flow is stable; improve the
  *feel*: target-Rx proximity (pre-filled hints), weight carry-forward
  (exists), row completion feedback, big-number logging inputs. No store
  changes without sign-off.
- **Library** — recently-logged section (deferred from last pass; data is one
  existing nested read away), denser browse rows, search/chips chrome.
- **Progression** — volume trend from existing computed reads
  (`AnalyticsService.bucketWeekly`, `progressionService`); PB rows could grow
  per-exercise history from `findRecentWithDetails` data already fetched.
- **State completeness sweep** + **a11y sweep** (roles, labels, targets) as
  closing passes across all screens.
- **Showcase parity** — `app/dev/premium.tsx` is the visual source of truth in
  dev; any kit-level change lands there in the same commit.

## 7. Operating environment (verified commands)

- **Dev server:** `cd armandotfit && bun run web` → localhost:8081. Check
  `lsof -i :8081` first — a prior session's server may still hold the port
  (a second `bun run web` exits 1 and the port prompt hangs non-interactive;
  if a healthy server is running, use it). Metro compiles on demand; **its
  watcher sometimes misses edits — `touch` the changed files and re-shoot, or
  you will screenshot stale transforms and chase ghosts.**
- **Gate (before every commit):** `cd armandotfit && bun run lint:structure && bunx tsc --noEmit` — 13 audits + structural ESLint + tsc, enforced again
  by husky at commit. `bun run test:run` = 627 tests, all green at handoff.
- **Capture stack:** headless Chrome is broken in this sandbox — use Playwright
  WebKit. Scratch lives at the workspace-root `.shots/` (never committed):

  ```
  cd /Users/koba/Documents/Code/arman/.shots
  PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers TMPDIR=$PWD/.tmp \
    BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun fit-walk.ts light|dark|se
  ```

  Shots land in `.shots/fit/` as `light-NN-<screen>[-full-N].png`; read them
  with the vision-capable `read_image`. `fit-probe*.ts` are DOM-measurement
  probes from the last pass (search chips, layout boxes) — keep, extend,
  ignore. `FIT_MOCK_LOG=1` logs mock request routing.
- **Auth is fully mocked at the network layer** — the real Supabase project
  cannot be used (email confirmation is ON; the test account is unconfirmed).
  `fit-walk.ts` intercepts `**mfeyywnwbjejzzbqzmop.supabase.co/**`, signs in
  via the mocked `/auth/v1/token`, and serves a deterministic 31-session
  fixture history (USER_ID `u-11111111-2222-3333-4444-555555555555`, real
  catalog names). Mock quirks already fixed: table parsed at path index 3,
  `limit` respected. Sign-in flow: `/login` → fill
  `input[placeholder="you@example.com"]` + `input[placeholder="••••••••"]` →
  click "Sign In" → AuthGuard routes home.
- **Dark mode:** seed before page scripts —
  `addInitScript(() => localStorage.setItem('arqavellum:color-scheme','dark'))`
  — and do NOT set context `colorScheme` (it reproducibly renders light).
  Viewport 390×844 @2x, always; never widen to "see more".
- **Walk quirks:** the login 490px check false-fails after sign-in (the
  AuthGuard redirects the button away); capture the swap sheet by waiting for
  the sheet selector before pressing Escape.

## 8. Reading order

1. `armandotfit/CLAUDE.md` — invariants 1–11, the 13-audit grid, consumer
   relationship, doc-maintenance table (it binds you).
2. `armandotfit/UIUX_HANDOFF.md` (untracked, repo root) — the owner's original
   brief and per-screen focus list.
3. `constants/theme.ts` — the canonical token source; both palettes;
   `DIALECT`, typography, shapes, atmosphere.
4. `docs/architecture/mobile-premium-design-system.md` +
   `docs/architecture/exercise-logging-governance.md`.
5. `app/dev/premium.tsx` (the showcase — run `bun run web`, visit /dev/premium)
   and every screen in `app/`, every file in `components/composed/`.
6. `../arqavellum/CLAUDE.md` + `docs/contributing.md` — the port protocol.
7. `git -C armandotfit log 9295c1b3a..96194930a` — the last pass, with
   reasoning.

## 9. The loop, and what "done" looks like

For each screen: shoot the current state (light + dark) → form the design
judgment → implement → `touch` changed files → re-shoot → gate → tests →
commit (one screen per commit, rationale in the message) → push as a separate
command. Walk every screen in both modes at the end; the 490px checks must
pass; the suite must be green; close with a before/after summary naming each
commit.

Done means: every screen in `app/` (home, split-selection, workout-detail in
both modes, program, exercise-database, exercise-detail, progression,
analytics, settings, login/register/forgot-password, not-found, the drawer,
and the states in between) has been redesigned, verified in light AND dark,
fits 490px, passes all 13 audits + tsc, keeps 627 tests green, and every
shell-owned change it made also lives in arqavellum.

And the standing rule that outranks all of the above: when you are unsure
whether something is too noisy — it is. Remove it.
