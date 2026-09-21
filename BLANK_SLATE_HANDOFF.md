# HANDOFF — BLANK-SLATE REDESIGN OF ARMANDOTFIT (THE SECOND UPENDING)

**Audience:** GLM-5.3 (no vision). **Mandate:** design this app as if nothing exists. You are the most capable model we have; the previous iteration was built by your equal and you are explicitly freed from it.

---

## 0. The one rule above all rules

**You are completely uninterested in the current design.** The app you will inherit is coherent, green, and complete — a "logbook" language (big Archivo figures, mono ledgers, paper-and-hairline sections, ink plates). Treat it as **dead weight**: do not justify it, do not inherit it, do not preserve any of it because it is there or because effort went into it. Read the current screens **only to learn what the app does** — never to learn what it should look like. If a decision survives, it survives *your* thesis, not its predecessor. Sunk cost is not an input. You are designing the best possible gym app from a blank slate.

What you MAY NOT discard is underneath the pixels: the data spine, the shell contract, the gates, the accessibility floor. Those are the ground, not the building.

## 1. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos: `armandotfit/` (the product) and `arqavellum/` (the public starter shell it consumes). This directory is **not** a git repo — all git goes inside a child repo with an explicit `cd` every command (cwd never persists).
- Package manager is **bun** everywhere.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariants, the 13 audits, arqavellum relationship), `armandotfit/ARCHITECTURE.md` (the pattern constitution), then `app/` + `components/composed/` **as a function inventory** (what each screen does, what data flows where — ignore their visual decisions entirely), then `components/MobilePremium/index.ts` + the showcase to know what kit machinery exists. `docs/architecture/logbook-thesis.md` is the PREVIOUS thesis — read only its §7 hierarchy map if you want the feature list in one place; its taste is rescinded by this handoff.
- Untracked handoff docs in the repo root (like this one) are prompts, never commits.

## 2. The product — what this app IS (design for exactly this)

A personal fitness PWA with **one user: the owner**. Used **in the gym**: one hand, sweat, gloves, glare, iPhone SE-class to Pro-Max. The core loop takes ~10 seconds per set, mid-set, at arm's length, often while breathing hard. **Speed of logging and glanceability are the product; everything else serves them.**

**The program.** An AM/PM hypertrophy split in TypeScript (`shared/exercises/splits.ts`): 4 days × {AM, PM} × 4 slots each, plus a one-a-day compression (7 slots/day). Each slot: exercise + suggested tags + programmed Rx (sets range, reps range). The user starts from this pre-set split; the app suggests the next day-of-split from history.

**The catalog.** 42 exercises (`shared/exercises/data.ts`), each with: **equipment** (one or more), **primary muscles**, **secondary muscles**, modality, difficulty, instructions, tips. This metadata is rich and currently under-exploited as design material — muscles/equipment structure the gym itself (machines vs free weights, push vs pull); consider what the UI could do with it.

**The logging core.** Five tables (immutable law, see §4): sessions (AM and PM are two rows) → logged_exercises (tags are the only context mechanism) → logged_sets (weight × reps; a row IS a completed set). Progression — streaks, personal bests, weekly buckets — is computed at read, never stored.

**The flow, end to end:** auth (email/password, guard ON) → home (what am I walking into today?) → start funnel (split archetype → which day → AM/PM → plan preview → GO) → **live session** (the screen that matters: per-exercise sets at weight × reps, weight carry-forward, last-used tag prefill, swap mid-workout, add exercises from the library, custom names, notes, elapsed clock, save-once-at-end) → receipt (history view, delete) → program browser (standing substitutions) → library (search/filter/recently-logged) + exercise detail → progression + analytics (consistency grid, weekly volume) → settings (theme light/dark, rest days, install, sign out). Navigation chrome + a not-found page.

**Routes:** `/` (home), `/split-selection`, `/workout-detail` (`?id=` = receipt, none = live), `/program`, `/exercise-database`, `/exercise-detail?slug=`, `/progression`, `/analytics`, `/settings`, `/login`, `/register`, `/forgot-password`, `+not-found`, plus the drawer and the substitution sheet.

## 3. Your authority

Everything visual and structural in the presentation layer is yours: theme token values AND structure, the dialect system's expression, every MobilePremium primitive's design (the kit is copy-owned by this consumer; shell structure syncs — see §6), the showcase, every screen's information architecture, navigation patterns (you may invent different chrome than the drawer), motion language including **scroll-driven choreography**, empty/loading/error treatments, data-viz language, iconography, the substitution surface, typography (choose your own faces — see §7 "fonts"). You may delete, replace, or radicalize any presentational component.

**What "daring" means here:** a design with a spine — one committed idea carried through every screen at full strength, structural invention (navigation/composition/information architecture we haven't seen), scale and motion used with confidence — **not** decoration bolted onto layouts. Luxury = the feeling that nothing is accidental + speed. Premium = optical discipline + restraint where the moment should be calm + audacity exactly at the focal moment. "Fast" is a design property: the mid-set interaction must feel instant; motion must never make the user wait.

**Scroll-driven envelope (explicitly invited):** this app's screens scroll — push what scroll can DO: headers/composition that transform under scroll, scroll-linked progress and choreography, sticky structures that earn their pinning, scrubbed transitions between content states, physics that feels native. Rails: (a) transform/opacity only, 60fps, zero layout thrash; (b) `prefers-reduced-motion` collapses everything to instant/static — the design must be complete without any motion; (c) DOM-test/jsdom safety (web-only guards, static fallbacks); (d) never let choreography delay a tap or a keystroke. There is precedent in the shell for a rAF scroll engine (`MobileAbsorbBar`) — that machinery-class is available to build on.

## 4. Non-negotiables — repo law that survives every redesign

- **No new package dependencies, ever, without asking first.** If one seems required, stop and ask.
- **The data spine is not design territory.** Five tables, no migrations/seeds, history immutable, computed-at-read, exercise identity joins by name, tags-not-columns vocabulary, the program lives in TS. UI-state stores may be adapted; service contracts extend behind existing seams, never break.
- **Auth guard stays ON. PWA plumbing stays intact** (manifest injection, service worker, boot plate; if `theme-color` values change, keep `index.html`, `scripts/inject-critical-web.ts`, and the runtime block in `app/_layout.tsx` in sync — the mirror trio).
- **Accessibility is floor:** roles + labels on every interactive element, **44×44 effective touch targets** (see the hitSlop truth in §7), reduced motion respected, WCAG AA in both modes — computed, not hoped.
- **Tests stay green** (623 today). Rewrite expectations where the design legitimately changes them and document removals; never delete a test to pass a gate.
- **The audits are canonical.** 13 structural audits + structural ESLint + `tsc --noEmit` gate every commit. Genuine design need for an audit change = arqavellum-protocol change with justification, never `--no-verify`.
- **The 490px law:** the primary action reachable without scrolling on 390×667 (iPhone SE). Every screen.
- `theme.ts` stays the canonical token owner; S7 bans hardcoded hex in components.

## 5. What the current build gets right (keep for CONVENIENCE, not by inertia)

The current design is fully green (gates + 623 tests), captured, and probe-verified — so you inherit a working baseline, not rubble. Its before/after galleries and probe library (`.shots/redesign/`) are yours to reuse. The **structure** worth knowing exists: sticky-header support on ScrollView works on web (verified); the ink-plate/grain/curtain/chit machinery exists; skeletons/EmptyState/QueryErrorNote patterns exist; Figure-as-token-carrier exists. Use, rebuild, or ignore — your call, your thesis.

## 6. Arqavellum relationship — stay a faithful consumer

- armandotfit is a **direct-copy consumer** of the public shell (github.com/moidotsh/arqavellum). The kit + audits + plumbing sync file-by-file; `theme.ts` structure comes from the shell (values + dialect pick are ours).
- **Port shell-level work back in the same window**, domain-neutrally: token structure (new axes/keys), kit primitives any consumer would want, audit fixes, plumbing. Arqavellum keeps **its own palette values**; it does not adopt our brand. If your token structure conflicts with the shell's public constitution, stop and ask.
- Public-repo discipline: no consumer names, workspace paths, private provenance, or sibling context in arqavellum commits/source/docs. Local publication-safety hooks enforce this — they will block you, correctly.

## 7. You are visionless — this is how you see

1. **Math that needs no rendering.** WCAG contrast is computable from hex pairs — compute it for **every text token × every surface it rides, both modes**, before committing any palette/type color. Spacing rhythm, type-scale ratios, and touch-target geometry are arithmetic — check them.
2. **Computed-style probes.** Headless Playwright WebKit: assert `fontSize`/`fontWeight`/`letterSpacing`/`fontFamily`/`color`/`fontVariant` on key nodes per screen against YOUR token spec. This is your screenshot.
3. **Geometry probes.** Bounding boxes: effective touch targets ≥44 (see below), no horizontal overflow, primary action above the fold at 390×667 and 390×844, scroll-driven states actually change computed values.
4. **Pixel probes.** Measure PNGs you cannot see: color-cluster membership in the theme set, blank/failed-render detection, before/after pixel-diff with changed-region % as the owner's change-heat record.
5. **The gates.** 13 audits + structural ESLint + `tsc` + tests + the 490px walk.

**Discovered truths about this stack (proven by probe — trust them):**
- **RN-web `hitSlop` does NOT expand the DOM hit area.** Measured: `elementFromPoint` 2px outside a 36px hitSlop'd box misses. The box itself must clear 44px.
- **A Pressable with `accessibilityRole="button"` renders as a real `<button>`** — nesting one inside another is invalid HTML (hydration warnings). Keep interactive trees flat.
- **RN-web `Text` is `div[dir="auto"]`** — probe with that selector; `getByRole`/`aria-label` selectors work fine in WebKit.
- **`stickyHeaderIndices` works on RN-web** (position: sticky) — verified pinning by measuring rects after scroll.
- **Self-hosted fonts:** any OFL faces ride the proven plumbing — files in `public/fonts/`, `@font-face` in an id'd `<style>` in `index.html` + preload links, runtime restore in `_layout`, injector copies both into every exported route. Google Fonts css2 API returns **variable** woff2 files when the family is variable — one file can cover a weight range (verify with a width-at-weight probe: measure the same string at two weights; also measure "1111" vs "9999" with `font-variant-numeric: tabular-nums` to prove tnum).
- **`textTransform` is CSS-only** — a component may also uppercase in JS; probe `textContent` for the raw string and computed style for the transform.
- **Dark mode:** seed `localStorage['arqavellum:color-scheme']='dark'` via `addInitScript`; do NOT also set the context `colorScheme` (reproducibly renders light).

## 8. Environment realities (proven recipe — obey them)

- Dev server: `cd armandotfit && bun run web` (port 8081; sets `EXPO_PUBLIC_DEV_SURFACES=1` — `/dev/premium` renders null without it). **Check if 8081 is already serving this app before starting another** (curl it); a warm server is preferable. It may need `~/.expo/` writes — if the sandbox denies, retry once with your harness's widest sanctioned permission or ask.
- **Headless Chrome is broken here. Use Playwright WebKit.** Tooling lives in `.shots/` (workspace root, gitignored, never committed). The working stack: `cd .shots && PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers TMPDIR=$PWD/.tmp BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun <script>`.
- `fit-walk.ts` (in `.shots/`) walks every screen against :8081 with the Supabase layer fully network-mocked (deterministic seeded history) — usage: `FIT_OUT=<dir> bun fit-walk.ts light|dark|se|all`. It supports a `FIT_OUT` override for before/after galleries, does the 490px checks, and dumps console/page errors. `redesign/probe-lib.ts` + the probe suites are a reusable toolkit — adapt their assertions to YOUR spec.
- Viewport 390×844 @2x (390×667 for SE). `fullPage: true` is viewport-only (the app scrolls an inner container) — step-scroll.
- Metro sometimes misses edits: `touch` changed files and re-request; the first walk after edits can time out — warm the bundle, raise timeouts, re-run. A blank page during capture is usually a build problem (dev-surfaces flag, stale transform), not a design verdict.
- Every bash command needs its explicit `cd`. Occasional transient "No such file or directory" on a path that exists — retry.

## 9. Working method

1. **Baseline.** Capture the current state (light + dark + SE) into a fresh `.shots/` before-dir via `FIT_OUT` — it is YOUR "before". Skim it only as function confirmation.
2. **The thesis first.** Before any code, write the design thesis as a doc under `docs/architecture/` (its own commit + push): the point of view in one paragraph, the complete type-token table, the spacing/rhythm scale, the surface/elevation language, the color law with the computed contrast matrix, the motion/scroll-choreography rules (with reduced-motion contracts), and a screen-by-screen hierarchy map (focal → second → quiet, with reasons). This doc is your compass and the owner's review artifact. Build to it.
3. **Tokens, then kit.** Rebuild `constants/theme.ts` and the MobilePremium kit + showcase to your thesis. Gate, commit, push **before** touching screens.
4. **Screens one at a time** (or tight clusters). Rebuild → probes green → captures archived → gate → commit. No mega-commits. The live session screen is the flagship — give it your best and prove it with the hardest probes.
5. **Port shell-owned work to arqavellum in the same window** (§6).
6. **Close.** Full walk (light + dark + SE), the after gallery, a before/after pixel-diff heat report, and a closing summary: thesis paragraph, per-screen inventory, commit list, and an explicit list of everything only the owner's eyes can confirm.

## 10. Git discipline

- Gate on the working tree **before staging**: `cd armandotfit && bun run lint:structure && bunx tsc --noEmit` (+ `bun run test:run` for code milestones).
- One logical milestone per commit. Commit, then push **as a separate command**. Never chain `git commit && git push`. Doc edits are their own commits after the code push.
- Never commit from the workspace root; never commit captures/probes/scratch/handoffs. Verify `git status` scope before every push.

## 11. Definition of done

- Every screen rebuilt under your thesis; each verified by probes in light + dark; 490px PASS; 13 audits + `tsc` green; tests green with count changes documented; before AND after captures archived per screen (light + dark + SE).
- `theme.ts`, your thesis doc, and the showcase tell one consistent story.
- Every shell-owned file you changed also lives in arqavellum, domain-neutrally.
- The closing summary is honest about what remains eyeball-only.

## 12. Stop and ask when

A dependency seems needed · a schema/migration/seed change seems needed · you want to weaken a gate instead of changing the design · your token structure conflicts with arqavellum's public constitution · anything would break auth or PWA plumbing.

## 13. Refuse these failure modes

Reverence for the current design. Decorative noise you cannot see. Relaxing contrast to hit a vibe. Deleting tests. Claiming you looked at anything. Endless polish instead of thesis → tokens → kit → screens. Motion that delays a tap. Presenting captures as verification — they are evidence for the owner, not for you.

---

*You are blind, so make the design so principled that assertions can carry your eyes — and make it so committed that the owner's first screenshot is a WOW.*
