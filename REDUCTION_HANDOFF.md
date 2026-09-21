# HANDOFF — THE REDUCTION: make it as minimal as it can possibly be

**To:** GLM-5.3 (non-vision)
**Repo:** `armandotfit` (personal fitness PWA; shell sibling `arqavellum` — see CLAUDE.md)
**You inherit:** a complete, working app in **THE BROADSHEET** design language
(commits `714af04c1..ac45491cb`): warm Paper/Evening palettes, Rokkitt + Azeret
Mono, the headline law, the record red, the wire, a full measured probe suite
(144/144 light+dark), and a test suite green under vitest. It is cohesive,
typographic, and *dense* — a sports desk. **Your job is the opposite move:
subtraction.**

## 0. Your mandate

THE BROADSHEET proved the app can speak with one voice. It still says too much
at once. Your leap is **reduction as the design language**: every screen
reduced to the fewest elements that still answer its question, held together
by **air, type, and placement** instead of structure, rules, and labels. Not
a cleanup pass — a **transformative, qualitative leap in the philosophy**,
declared in writing before any screen changes, audible on every route, in
both modes, at SE height.

The test of done: a screen can lose any single element and get worse — and
there is almost nothing left that can be lost. If an element does not answer
the screen's one question or offer its one action, it is a candidate for
deletion. **Deletion is the default; retention needs the argument.**

Specific symptoms you inherit (fix them as part of the philosophy, not as
patches):

- **The nameplate sandwich.** Every Desk page opens kicker → nameplate
  headline ("THE ROTATION", "THE INDEX", "THE FORM TABLE", "THE COLOPHON") →
  deck → section eyebrow → content. That is 3–4 layers of *framing* before
  any information. In the minimal language, **the content is the headline**:
  the program page's loudest thing is its first day's name, not the page's
  own name; the library's loudest thing is the search field or the first
  results, not "THE INDEX". Page names may survive as small folio markings —
  or die entirely. You decide, in the thesis.
- **Label inflation.** "TODAY · PM EDITION · DAY 2 OF 4", "COMPUTED AT READ ·
  NOTHING STORED", "42 LIFTS · THE CATALOG IS LOCAL" — metadata shouting about
  itself. In the minimal language, metadata whispers once or isn't there.
- **Rule density.** Hairlines divide everything; eyebrows carry rules; rows
  carry rules. Air can do most of that work.
- **Data sprawl.** Home stacks masthead + headline + lede + verb + jump lines
  + week figures + recent editions. Progression stacks hero + side facts +
  totals + 10 PB rows. The minimal page **curates**: fewer items per view,
  more behind one tap (progressive disclosure is IA you own). A list of 3
  chosen well reads more minimal than a list of 10 truncated.

**Fixed before you (keep):** every pushed route now carries a ≥44px back
affordance (`DeskShell onBack`, auth chevrons, MobileHeader "Go back" —
probe **P-BACK-1** enforces it; commit `ac45491cb`). The stack has no tab
bar and no browser chrome on a standalone PWA — **never ship a pushed screen
without its way back.**

## 1. What the app is (function fixed; form is yours)

An in-the-gym workout logger, used daily by its owner: standing under a bar,
30–90 second windows, one thumb, sweat, glare. Mid-session the app answers
three questions at a glance — what am I doing, what did I just lift, what's
next — with exactly one loud action: log the set. Library, split editing,
analytics happen resting or on the couch.

Routes (jobs fixed, presentation yours): `/` today + start/resume + hub ·
`/split-selection` pick day/archetype/window → GO · `/workout-detail` LIVE
(log sets per exercise, navigate stations, finish) and SAVED (immutable
receipt) · `/exercise-database` search/filter/add · `/exercise-detail`
reference · `/progression` streak/totals/PBs · `/analytics` consistency +
weekly bars · `/settings` theme/rest days/install/sign out · `/login`,
`/register`, `/forgot-password` · 404.

Data truths (never redesign the data): a set is a row (immutable once saved);
tags are the only context; AM and PM are separate session rows; rest days
mute the picker; streak/totals/PBs/tonnage computed at read, never stored;
the split is TypeScript (`shared/exercises/splits.ts` + `data.ts`).

## 2. Hard invariants — may not change

- **Bun only.** No `package-lock`/`yarn.lock`. No new runtime dependencies
  without the owner's explicit approval (font/asset files are fine).
- **Schema frozen** — five tables, greenslate. No migrations, no context
  columns, no aggregates.
- **Auth** email/password; guard stays ON.
- **PWA plumbing** load-bearing: `index.html` + `scripts/inject-critical-web.ts`
  + the runtime block in `app/_layout.tsx` stay in three-way sync; run
  `bun run verify:web-build` after touching export plumbing.
- **The gate** before every commit: `cd armandotfit && bun run lint:structure
  && bunx tsc --noEmit` (13 audits + structural ESLint + types). Audit
  scripts are canonical. **Tests:** `bunx vitest run` (vitest is the repo's
  runner; `bun test` chokes on RN's flow index — environmental, ignore it).
  Suite stays green; theme-pin tests follow the tokens.
- **arqavellum relationship:** shell-level fixes port back domain-neutrally
  (public repo, publication hooks enforce no private context). Consumer
  values live only in `constants/theme.ts` overrides.
- **Push protocol:** commits are free after the gate; `git push` is a
  separate command, never chained; schema/config/destructive changes are
  approval-gated (none should arise).
- **490px budget:** every screen's primary action fits iPhone SE (375×667)
  without scrolling. **Air must not starve the verb** — breathing room is
  spent above the fold, never by pushing the action below it.
- **Light default, dark opt-in**; AA (≥4.5:1 text, ≥3:1 large) on the darkest
  surface every text-bearing slot rides, both modes — the contrast matrix
  probe regenerates and pins before any palette commit.
- **One accent slot** (`theme.colors.light|dark.brand` + companions). You may
  retune values and re-mean the accent; never add a second accent.
- **The back law:** P-BACK-1 stays in the suite and stays green.

## 3. What you own outright

- **The philosophy.** Write the new thesis FIRST as
  `docs/architecture/<your-slug>.md` (candidate names to react to, not obey:
  *THE QUIET PAGE*, *PAPER & AIR*, *THE SINGLE LINE*). Declare: the point of
  view (why less is *more information* here), the pillars, the type system,
  **the air law and the element budget** (see §4), the hierarchy law, the
  motion law, a per-screen map (loudest / second / quiet tail / *element
  count*), and the measurement spec. Move the canonical pointers
  (CLAUDE.md invariant 3 + docs table, `docs/OWNERSHIP.md`); retire
  `broadsheet-thesis.md` with thanks. Whatever survives BROADSHEET survives
  on its own argument.
- **Typography.** You may keep the Rokkitt + Azeret pair (excellent, 55 KB
  total, already wired through the injector) or swap faces — your call, but
  the pair is not the density problem. **The size inventory is**: shrink it.
  A minimal page uses ~3 distinct text sizes, not 6–8. Rebuild the token
  table accordingly (named styles only; consumers never pick ad-hoc sizes;
  every changing figure stays tabular/agate).
- **The air law.** Whitespace as a first-class material with numbers: page
  gutter, block rhythm (expect it to grow — e.g. 24→40+), intra-block
  leading, and **minimum silence around the loudest element** (a halo no
  other element may enter — measurable as a bounding-box moat).
- **Visual hierarchy as law**, sharpened: one loudest element per screen
  (keep the unique-hero + 1.4× probes), and now also **one idea per screen**
  — the map table states the sentence each screen exists to say.
- **The kit.** Retire/rework primitives as the language needs (showcase +
  design-system doc rows updated per change). Likely candidates to rethink:
  `MobileSectionEyebrow` (rules everywhere), nameplate headers, `Figure`
  densities, `CallBoard` chrome. A11y contracts (roles, states, labels) are
  load-bearing — keep them.
- **Motion.** Less. Print physics may collapse to almost nothing; what
  remains is 80–140ms, transform/opacity, reduced-motion-safe, never between
  thumb and target.
- **Per-screen IA** within fixed routes/functions: curation, progressive
  disclosure, what sits one tap deeper. Navigation paradigm stays a stack
  with back affordances (document it).
- **Color values** (both modes, AA, one accent) and how much of the page the
  field, ink, and accent each get — expect ink coverage to fall a lot.

Existing pieces you may keep, rework, or kill — one line each in the thesis:
the nameplates, kicker/deck pairs, jump lines, the fold (scroll-compress),
CallBoard's one-line call, the ticker, StationStrip, InkRail, the record red
law (record mark / verb / pulse), ink-invert selection, the form table's ink
cells + today outline, the measured muscle bars, the curtain, the boot plate,
the blank-line counter field, the focus ring law.

## 4. Your eyes: the blind-craft method (extend, don't rebuild)

The instrument exists in `.shots/vision2/` (gitignored scratch, outside the
repo): `probe.ts` (route walker + 14 probe classes incl. P-HERO-1, P-TNUM-1,
P-TARGET-1, P-ACCENT-1, P-FOCUS-1, P-BACK-1, P-INTERACT-1, reduced-motion,
SE fold), `contrast.ts` (72-pair matrix), `pixels.ts` (pure-node PNG census),
`geo.ts` (geometry dumps), and a **program-aligned mock layer** in
`fit-walk.ts` (seeded sessions draw from the real split data). Extend the
suite with **minimalism budgets — minimalism is a budget, not a vibe**:

- **P-COUNT-1 (element budget):** per route, visible text nodes ≤ declared
  cap (e.g. ≤ 12 on Desk pages, fewer on the Floor); visible interactive
  elements ≤ cap. Exceeding the budget fails the screen.
- **P-VOICE-1 (size inventory):** per route, distinct computed font sizes ≤
  declared cap (suggest 4); distinct text *colors* ≤ cap (suggest 3).
- **P-AIR-1 (the air law):** vertical gaps between sibling blocks ≥ the
  declared rhythm; the loudest element's moat (nearest other element's
  bounding box) ≥ declared silence; page gutter consistent ±2px.
- **P-RULE-1:** hairline/separator count per screen ≤ budget — structure
  earns its lines.
- **P-INK-1 (pixel census):** non-field ink coverage per screenshot ≤
  declared ceiling (the BROADSHEET home will fail this ceiling — that is the
  point; recalibrate once, then enforce).
- Keep green: P-HERO (one hero, 1.4×), P-HERO-FOLD/ARC, P-TYPE, P-TNUM,
  P-CLIP, P-OVERFLOW, P-TARGET, P-ACCENT, P-FOCUS, P-REDUCED, P-INTERACT,
  P-FOLD (SE), P-BACK, P-CONTRAST, P-PIXEL (retuned bounds).

Never claim a visual fact you did not measure. "Looks right" is not available
to you; "measured within spec" is the only done.

## 5. Process

- **Phase 0 — read, decide, declare.** Read `docs/architecture/broadsheet-thesis.md`,
  `constants/theme.ts`, the kit, the routes, CLAUDE.md, and `.shots/vision2/REPORT.md`
  (the last pass's map). Write the new thesis + move pointers. Commit docs;
  push (separate command).
- **Phase 1 — foundation.** Tokens, type inventory, air rhythm, core
  primitives, showcase, and the new budget probes. **The budgets must fail
  loudly against the current screens** — that failure list is Phase 2's map.
- **Phase 2 — screens, worst-first.** Rebuild each route on the new system:
  implement → probes green in light + dark (+ SE) → add that screen's
  assertions → gate → commit (push separate) → doc rows.
- **Phase 3 — edges.** Empty/loading/error states, auth, 404, showcase
  completeness; the one or two remaining signature moments (cheap,
  reduced-motion-safe, never blocking input).
- **Close:** resolution report in `.shots/vision2/` (or a new scratch dir),
  mapping philosophy → screens → probes → commits. Captures and probes are
  never committed.

## 6. Environment + pitfalls (all learned the hard way)

- Workspace root is NOT a git repo — `git -C` or `cd` into `armandotfit` for
  every git command; cwd never persists between calls.
- Dev server on `:8081`. Metro doesn't invalidate reliably: `touch` changed
  files, curl `/` for 200, and expect one stale run after big edits —
  re-run before believing a failure. Transient "No such file" → retry.
- Walker recipe: `cd .shots && FIT_OUT=vision2/out PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers
  TMPDIR=$PWD/.tmp BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun vision2/probe.ts light|dark|se`.
  Run per mode — `all` exceeds one 10-minute call. Dark mode: the walker
  seeds `localStorage['arqavellum:color-scheme']='dark'` (context colorScheme
  never reaches the shell).
- **expo-router keeps prior screens mounted-but-hidden** — DOM audits must
  filter visibility (`offsetParent`, rect > 0) or hidden pages pollute every
  count (this bit hero, accent, and focus probes).
- RN-web traps: hitSlop does not expand DOM hit area; Pressables render real
  buttons (never nest interactive roles); sticky needs explicit z-index; probe
  computed styles, never classes/ARIA; the UA focus outline leaks (the global
  `#global-focus-css` ring law handles it — keep it in sync if you touch it).
- `bunx vitest run` is the test runner. Sanity tests pin theme values —
  update pins with tokens, in the same commit.
- Screenshots: viewport-only (the app scrolls an inner div) — step-scroll;
  settle 1.2s before audits; pixel questions settled at native scale
  (deviceScaleFactor 2), never on downscaled crops.

## 7. The bar

A page so quiet you can hear its one sentence. Every screen answerable as:
*the loudest thing is ___, the second voice is ___, everything else is air
and one verb* — and the element count proves it. The lifter mid-set sees
less and understands more. The owner browsing the couch finds calm, not
filing. Hierarchy you could read through a wall; minimalism you could count.
Both modes, SE height, every probe green. Then it's done.
