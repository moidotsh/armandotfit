# HANDOFF — THE COHESION PASS: re-imagine this app from zero

**To:** GLM-5.3 (non-vision)
**Repo:** `armandotfit` (personal fitness PWA; shell sibling `arqavellum` — see CLAUDE.md)
**You inherit:** a working app with a finished design philosophy ("THE COUNT") that you are licensed — required — to upend.

## 0. Your mandate

Do **not** justify the existing codebase's design. THE COUNT (tally strokes, chalk/iron
field, Big Shoulders + Azeret Mono, square-cut shapes) was one answer. Your job is to
sit down, think from the lifter's actual moment of use, and imagine the **best possible
version of this app** — then implement it end to end as **one cohesive piece**.

Cohesive means: one design philosophy, declared in writing before any screen changes,
audible in every route, every state (empty/loading/error), both color modes, and every
pixel between. If a screen can't state its loudest element in one sentence, it isn't
done.

WOW means **typography and visual hierarchy first** — not decoration, not gradients,
not glass. The numerals a lifter reads between sets, the statement a screen opens with,
the disciplined silence around them. Earn the wow through scale relationships, weight
contrast, tracking, alignment, rhythm, and restraint. You have full authority over the
type system: faces, scale, roles, figures.

**You are non-vision.** You cannot look at screenshots. Your craft is therefore specs +
instruments: encode every visual judgment as a **measurable invariant**, assert it in a
probe suite, and treat "measured within spec" as the only "looks right" you get. This is
the core discipline of the whole pass — §4 is not optional.

## 1. What the app is (function — fixed; form — yours)

An in-the-gym workout logger, used daily by its owner. The truth of the moment of use:
standing under a bar, 30–90 second windows between sets, one thumb, sweat on the screen,
phone propped on a bottle or dropped on the platform. Mid-session the app must answer
three questions at a **glance**: what am I doing, what did I just lift, what's next —
and offer exactly one loud action: log the set. Library, split editing, and analytics
happen standing around resting or on the couch afterwards.

Routes and their jobs (function is fixed; the form is yours to re-imagine):

- `/` — today at a glance + start/resume + the hub (program, library, progress)
- `/split-selection` — the funnel: pick day, split archetype, AM/PM → GO
- `/workout-detail` — **two modes**: LIVE (log sets per exercise, navigate stations,
  finish) and SAVED (immutable history receipt)
- `/exercise-database` — the library: search, equipment-zone filters, categories,
  recently logged; add-to-session during a live session; custom-name adder
- `/exercise-detail` — the reference page: exercise type, muscles worked
  (primary/secondary), equipment, instructions/tips, last performance
- `/progression` — streak, totals, personal bests with estimated 1RM
- `/analytics` — training-consistency grid, weekly session bars, history ledger
- `/settings` — theme (light/dark/system), rest days, install, version, sign out
- `/login`, `/register`, `/forgot-password` — email/password auth

Data truths to design around (never redesign the data): a **set is a row** (immutable
once saved; deleting un-logs it); **tags are the only context** on a logged exercise
(grip, stance, machine…); **AM and PM are separate session rows**; rest days are a
profile list that mutes the day picker; streak/totals/PBs/tonnage are **computed at
read**, never stored; the training split is **TypeScript** (`shared/exercises/splits.ts`
+ `data.ts`, the sole display source), not database rows.

## 2. Hard invariants — may not change

- **Bun only.** No `package-lock`/`yarn.lock`. No new runtime dependencies without the
  owner's explicit approval (font/asset files are fine; npm packages are not).
- **Schema is frozen.** Five tables, greenslate rebuild; migrations are approval-gated.
  No context columns, no aggregate tables, no cached progression.
- **Auth** is email/password; the guard stays ON.
- **PWA plumbing** is load-bearing: `index.html` + `scripts/inject-critical-web.ts` +
  the runtime block in `app/_layout.tsx` must stay in three-way sync; run
  `bun run verify:web-build` after touching export plumbing.
- **The gate** before every commit: `cd armandotfit && bun run lint:structure && bunx
  tsc --noEmit` (13 audits + structural ESLint + types). The audit scripts are
  canonical — if a doc and a script disagree, the script wins. The test suite stays
  green. S7 bans hardcoded hex in components — pull from `theme` via `useAppTheme()`.
- **arqavellum relationship:** the MobilePremium kit and shell files are copies of the
  public shell. Any shell-level fix you make ports back **domain-neutrally** (no
  consumer names, no private context in public commits — publication hooks enforce).
  Consumer values live ONLY in `constants/theme.ts` overrides; kit files stay
  structurally identical to upstream after a port.
- **Push protocol:** commits are free after the gate; `git push` is a **separate
  command**; never chain `commit && push`; schema/config/destructive changes are
  approval-gated (none should arise — schema is frozen).
- **490px budget:** every screen's primary action fits iPhone SE (375×667) without
  scrolling.
- **Light default, dark opt-in.** Both palettes are first-class; every text-bearing slot
  holds AA (≥4.5:1, large text ≥3:1) on the darkest surface it rides, **in both modes**.
- **One accent slot.** `theme.colors.light|dark.brand` (+ companions) is the single
  override point; semantic status colors exist separately. Do not introduce a second
  accent slot. You may retune the VALUES (keeping AA) and change what the accent MEANS.

## 3. What you own outright

- **The philosophy itself.** Retire THE COUNT wholesale if your philosophy serves the
  lifter better: its thesis doc, the tally glyph, the type faces, the shape language,
  the motion, the naming. Write the new philosophy FIRST as
  `docs/architecture/<your-slug>.md` (name the design, declare its pillars, the type
  system, the hierarchy law, the motion law, a per-screen map table, and — critically —
  the **measurement spec**: the exact probe assertions that prove each pillar). Move the
  canonical-doc pointer: update this repo's CLAUDE.md (invariant 3 + the docs table) and
  `docs/OWNERSHIP.md` so the new doc is canonical and the old one is retired.
- **Typography.** Choose and declare faces (self-hosted variable woff2, subset, keep
  each file small; declare them in `theme.fonts` + the loading pipeline). Build the
  scale: named roles with size/line-height/weight/tracking, **tabular figures for every
  changing number**, eyebrow/marking conventions, optical-alignment rules, and the
  hierarchy law (below). Type roles must survive both modes and SE width.
- **Visual hierarchy as law.** Every screen declares: its one loudest element, its
  second voice, its quiet tail — and why (a per-screen map table in the thesis). The
  probe suite must be able to verify this mechanically (see §4).
- **The kit.** Rebuild, add, or retire MobilePremium primitives. The dev showcase
  (`app/dev`, Expo dev-surfaces-gated) is the visual source of truth — every primitive
  demoed or removed there; `docs/architecture/mobile-premium-design-system.md` rows
  updated per change. Keep a11y contracts (roles, states, labels) — they are excellent
  and load-bearing.
- **Motion.** Declare durations, easing, what may animate; reduced-motion collapse is
  mandatory; motion never gates input.
- **Per-screen IA** within the existing routes and functions (nav helper hierarchy may
  be edited; an unwired `MobileTabBar` primitive exists if you want chrome — the drawer
  stays unwired unless you wire it; document whichever navigation paradigm you choose).
- **Color values** (light + dark), atmosphere, shapes, spacing rhythm — as declared
  token values, never literals in components.

Existing pieces you may keep, rework, or kill — but each decision gets one line in the
thesis: TallyStrip, the `mobileCounter` token, `shapes` (surface/sheet/control/tile/
tag), the `colors.focus.*` stage register, SessionStrip, InkRail (swap bench),
StationStrip, the atmosphere system, Figure, the curtain navigation seam.

## 4. Your eyes: the blind-craft method

You cannot see. So everything visual must be **measured**. Build the instrument early
(Phase 1) and extend it with every screen:

1. **DOM probes.** `.shots/fit-walk.ts` (gitignored scratch, outside the repo) walks
   every route in light/dark/SE via Playwright WebKit with a mock sign-in, screenshots,
   and runs assertions. Extend it with a **design-invariant suite derived from your own
   thesis**. Examples of the genre — hierarchy: exactly one element per screen at your
   declared hero scale (count by computed font-size/family, not classes); no clipped
   text (scrollWidth > clientWidth, `text-overflow` states); no horizontal page scroll;
   touch targets ≥44×44; accent-fill element count per screen within your declared
   budget; pinned chrome paints above content (z-index); focus states carry your ring,
   not the UA's (computed `outline-width: 0` + your border/ring active).
2. **Pixel statistics.** You may not look at PNGs, but you can measure them: decode and
   census (working example: `.shots/vision1/count-strokes.ts` — pure-node PNG inflate +
   unfilter + row/column classification at deviceScaleFactor 2). Assert glyph
   arithmetic from pixels: mark counts, bar widths vs data, grid cell counts, that a
   numeral is really where the spec says it is.
3. **Contrast as code.** Compute every text/background pair from the token values in
   both modes and pin the matrix with a test. AA is asserted, never eyeballed.
4. **490px walker.** Every screen's primary action visible on SE (375×667) without
   scrolling — the existing height report continues.

Never claim a visual fact you did not measure. "Looks right" is not a state available
to you; "measured within spec" is.

## 5. Process

- **Phase 0 — read, decide, declare.** Read `docs/architecture/count-thesis.md`,
  `docs/architecture/mobile-premium-design-system.md`, `constants/theme.ts`, the kit,
  the routes, `CLAUDE.md`. Write the new philosophy doc + move canonical pointers.
  Commit docs; push (separate command).
- **Phase 1 — foundation.** Tokens, type system, fonts, core primitives, showcase, and
  the **probe harness** asserting the philosophy. The philosophy must be provable before
  any screen changes.
- **Phase 2 — screens, worst-first.** Rebuild each route on the new system. Per screen:
  implement → walker + probe suite green in light + dark (+ SE where it applies) → add
  that screen's new probe assertions → gate → commit (push separate) → doc rows.
- **Phase 3 — wow + edges.** Your declared signature moments (2–3, cheap to render,
  reduced-motion-safe, never blocking input), then empty/loading/error states, auth
  screens, showcase completeness.
- **Close:** a resolution report in `.shots/vision2/` (captures and probes never
  committed), mapping philosophy → screens → probes → commits.

## 6. Environment + pitfalls (learned the hard way)

- The workspace root is NOT a git repo. `cd /Users/koba/Documents/Code/arman/armandotfit`
  (or `git -C …`) for every git command; cwd never persists between calls.
- Dev server lives on `:8081`. Metro doesn't invalidate reliably: `touch` changed files
  and warm the bundle before captures; transient "No such file or directory" → retry.
- Walker recipe: `cd .shots && FIT_OUT=<dir> PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers
  TMPDIR=$PWD/.tmp BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun fit-walk.ts light|dark|se`.
  Dark mode: seed `localStorage['arqavellum:color-scheme']='dark'` via init script
  (context `colorScheme` never reaches the shell).
- RN-web traps: hitSlop does not expand the DOM hit area; Pressables render real buttons
  (never nest interactive roles); `position: sticky` needs explicit `z-index` or content
  paints over it; ARIA state (`aria-checked`) may not be emitted — probe computed
  styles, not attributes; the UA focus outline leaks through RN inputs
  (`outlineWidth: 0` on the style).
- Screenshots: `fullPage` is viewport-only (the app scrolls an inner div) — step-scroll.
  `sips` crops take (y, x) and clamp silently — verify output dims. Downscaling smears
  thin glyphs into false shapes — settle glyph questions by pixel census at native
  scale.
- Hierarchies are measured by computed style (`getComputedStyle().fontSize /
  fontFamily / backgroundColor`), never by class names or component props.
- Hierarchy "one hero" must survive data: test with the seeded mock sessions (the
  walker's mock layer has long tonnage numbers, many PBs, multi-lift sessions).

## 7. The bar

Typography so disciplined you could read the app's hierarchy through a wall. One
philosophy, audible on every route, in both modes, at SE height. A lifter mid-set
answers what-am-I-doing / what-did-I-lift / what's-next in one glance, and the one
loud thing on the screen is always the thing they came to do. Prove it with probes.
Then it's done.
