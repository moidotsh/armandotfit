# HANDOFF — BLANK-SLATE REDESIGN OF ARMANDOTFIT (THE THIRD UPENDING)

**Audience:** the next model, fresh, no vision. **Mandate:** design this app as if nothing exists. The app you will inherit is coherent, green, and complete — the SIGNAL system (cold steel surfaces, one signal orange, a near-black "focus register" stage with a pre-armed one-tap set logger, a bottom tab bar with a raised START/RESUME action, Saira/Martian Mono type). It was built by your equal, from scratch, on a deadline, and it passed every gate. Treat it as **dead weight**: do not justify it, do not inherit it, do not preserve any of it because it is there or because effort went into it. Read the current screens **only to learn what the app does** — never to learn what it should look like. If a decision survives, it survives *your* thesis, not its predecessor's. Sunk cost is not an input. You are designing the best possible gym app from a blank slate.

What you MAY NOT discard is underneath the pixels: the data spine, the shell contract, the gates, the accessibility floor. Those are the ground, not the building.

---

## 0. The one rule above all rules

**You are completely uninterested in the current design.** If you catch yourself reasoning from "the tab bar works" or "the armed set is clever" — stop. Those are the previous model's taste, and taste is yours to replace wholesale. The only things that bind you are in §4. Everything visual and structural in the presentation layer — tokens, type, chrome, navigation, motion, the two-register split itself — is yours to keep, kill, or invert, provided your replacement is committed at full strength.

## 1. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos: `armandotfit/` (the product) and `arqavellum/` (the public starter shell it consumes). This directory is **not** a git repo — all git goes inside a child repo with an explicit `cd` every command (cwd never persists).
- Package manager is **bun** everywhere.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariants, the 13 audits, the arqavellum relationship; its invariant 3 describes SIGNAL, the design you are replacing), `armandotfit/ARCHITECTURE.md` (the pattern constitution), then `app/` + `components/composed/` **as a function inventory** (what each screen does, what data flows where — ignore their visual decisions entirely), then `components/MobilePremium/index.ts` + the showcase to know what kit machinery exists. `docs/architecture/signal-thesis.md` is the PREVIOUS thesis — read only its §7 hierarchy map if you want the feature list in one place; its taste is rescinded by this handoff. The logbook thesis before it is retired history.
- Untracked handoff docs in the repo root (like this one) are prompts, never commits.

## 2. The product — what this app IS (design for exactly this)

A personal fitness PWA with **one user: the owner**. Used **in the gym**: one hand, sweat, gloves, glare, iPhone SE-class to Pro-Max. The core loop takes ~10 seconds per set, mid-set, at arm's length, often while breathing hard. **Speed of logging and glanceability are the product; everything else serves them.**

**The program.** An AM/PM hypertrophy split in TypeScript (`shared/exercises/splits.ts`): 4 days × {AM, PM} × 4 slots each, plus a one-a-day compression (7 slots/day). Each slot: exercise + suggested tags + programmed Rx (sets range, reps range). The user starts from this pre-set split; the app suggests the next day-of-split from history.

**The catalog.** 42 exercises (`shared/exercises/data.ts`), each with: **equipment** (one or more), **primary muscles**, **secondary muscles**, modality, difficulty, instructions, tips. This metadata is rich and still under-exploited as design material — muscles/equipment structure the gym itself (machines vs free weights, push vs pull); consider what the UI could do with it. (The previous round used it for: equipment-zone library filters, muscle target bars on the detail page, ranked swap alternatives with a "why" line. Those are function ideas, not constraints.)

**The logging core.** Five tables (immutable law, see §4): sessions (AM and PM are two rows) → logged_exercises (tags are the only context mechanism) → logged_sets (weight × reps; a row IS a completed set). Progression — streaks, personal bests, weekly buckets — is computed at read, never stored.

**The flow, end to end:** auth (email/password, guard ON) → home (what am I walking into today?) → start funnel (split archetype → which day → AM/PM → plan preview → GO) → **live session** (the screen that matters: per-exercise sets at weight × reps, weight carry-forward, last-used tag prefill, swap mid-workout, add exercises from the library, custom names, notes, elapsed clock, save-once-at-end) → receipt (history view, delete) → program browser (standing substitutions) → library (search/filter/recently-logged) + exercise detail → progression + analytics (consistency grid, weekly volume) → settings (theme light/dark, rest days, install, sign out). Navigation chrome + a not-found page.

**Routes:** `/` (home), `/split-selection`, `/workout-detail` (`?id=` = receipt, none = live), `/program`, `/exercise-database`, `/exercise-detail?slug=`, `/progression`, `/analytics`, `/settings`, `/login`, `/register`, `/forgot-password`, `+not-found`, plus the substitution sheet. You may restructure screens and invent different chrome; the ROUTES are the contract (tests and links ride them).

## 3. Your authority

Everything visual and structural in the presentation layer is yours: theme token values AND structure (within the arqavellum-sync law of §6), every MobilePremium primitive's design (the kit is copy-owned by this consumer), the showcase, every screen's information architecture, navigation patterns (kill the tab bar if your thesis says so — the drawer primitive is still in the kit, unwired), motion language including **scroll-driven choreography**, empty/loading/error treatments, data-viz language, iconography, the substitution surface, typography (choose your own faces — see §7 "fonts"). You may delete, replace, or radicalize any presentational component. The store's current "armed-set model" (draft set rows exist only once logged; hydration creates zero rows — tests document it) is UI-state law you MAY adapt, not data-spine law.

**What "daring" means here:** a design with a spine — one committed idea carried through every screen at full strength, structural invention (navigation/composition/information architecture we haven't seen), scale and motion used with confidence — **not** decoration bolted onto layouts. Luxury = the feeling that nothing is accidental + speed. Premium = optical discipline + restraint where the moment should be calm + audacity exactly at the focal moment. "Fast" is a design property: the mid-set interaction must feel instant; motion must never make the user wait.

**Scroll-driven envelope (explicitly invited):** this app's screens scroll — push what scroll can DO: headers/composition that transform under scroll, scroll-linked progress and choreography, sticky structures that earn their pinning, scrubbed transitions between content states, physics that feels native. Rails: (a) transform/opacity only, 60fps, zero layout thrash; (b) `prefers-reduced-motion` collapses everything to instant/static — the design must be complete without any motion; (c) DOM-test/jsdom safety (web-only guards, static fallbacks); (d) never let choreography delay a tap or a keystroke.

## 4. Non-negotiables — repo law that survives every redesign

- **No new package dependencies, ever, without asking first.** If one seems required, stop and ask.
- **The data spine is not design territory.** Five tables, no migrations/seeds, history immutable, computed-at-read, exercise identity joins by name, tags-not-columns vocabulary, the program lives in TS. UI-state stores may be adapted; service contracts extend behind existing seams, never break.
- **Auth guard stays ON. PWA plumbing stays intact** (manifest injection, service worker, boot plate; the mirror trio — `index.html`, `scripts/inject-critical-web.ts`, the runtime block in `app/_layout.tsx` — stays in sync, including `theme-color` values and any self-hosted fonts' `@font-face` + preloads).
- **Accessibility is floor:** roles + labels on every interactive element, **44×44 effective touch targets** (measured boxes — see the hitSlop truth in §7), reduced motion respected, WCAG AA in both modes — computed, not hoped.
- **Tests stay green** (624 today). Rewrite expectations where the design legitimately changes them and document removals; never delete a test to pass a gate.
- **The audits are canonical.** 13 structural audits + structural ESLint + `tsc --noEmit` gate every commit. Two live wrinkles: (a) SB1 accepts `ScreenScaffold`, `SCREEN_BODY_STYLE`, **and `DeskShell`** as body-policy carriers in THIS repo's audit — if you replace DeskShell with your own scaffold, teach the audit its name in the same change (and know that arqavellum's audit copy does not know DeskShell; keep the recognition consumer-side); (b) barrel shims must re-export any lucide icon you import — run `bun run scripts/sync-barrel-shims.ts` whenever the shim audit bites.
- **The 490px law:** the primary action reachable without scrolling on 390×667 (iPhone SE). Every screen.
- `theme.ts` stays the canonical token owner; S7 bans hardcoded hex in components.

## 5. What the current build gets right (keep for CONVENIENCE, not by inertia)

The SIGNAL build is fully green (13 audits + `tsc` + 624 tests), probe-verified, and captured — you inherit a working baseline, not rubble. Its galleries and probe library (`.shots/redesign2/`) are yours to reuse; its captures are the "before" for your heat report. The **structure** worth knowing exists:

- `DeskShell` (composed): header slot + scroll body + `MobileTabBar` (raised center action with an ambient resume pulse), all column-constrained; `noScroll` + `stickyHeaderIndices` + `onScroll` passthroughs for scroll choreography and SectionList screens.
- The stage parts: `ArmedSet` (the docked one-tap slab), `StationStrip`, `StageSetRow`, focus-register `TagChips`, the swap bench (`InkRail`).
- `colors.focus.*` — a mode-independent register inside both palettes (shell-synced structure now; see §6). The chit toast and route curtain read it.
- `TypeFaces.displayCondensed` + the `mobileTitleCondensed` token + the second-`@font-face`-pins-the-width-axis trick (one variable file, two families — RN has no fontStretch).
- Sticky-header support on ScrollView works on web (verified twice now); `FadeIn`/Motion primitives are reduced-motion aware.
- Skeletons/EmptyState/QueryErrorNote patterns; Figure-as-token-carrier; the showcase demos every primitive including the tab bar.
- `useRecentSessionDetails` powers computed-at-read extras (armed prefill, "LAST" line on detail) with no new service seams.
- The walker (`.shots/fit-walk.ts`) is SIGNAL-shaped — its assertions and taps (armed-set testIDs, FINISH dialog, tab-bar center, SE login via a fresh signed-out context) match the CURRENT IA. Adapt it to YOUR IA early; it is your instrument, not a fixture.

Use, rebuild, or ignore — your call, your thesis.

## 6. Arqavellum relationship — stay a faithful consumer

- armandotfit is a **direct-copy consumer** of the public shell (github.com/moidotsh/arqavellum). The kit + audits + plumbing sync file-by-file; `theme.ts` structure comes from the shell (values + dialect pick + palette are ours).
- Shell-level structure that now lives on BOTH sides (kept in sync by the SIGNAL round): `TypeFaces.displayCondensed`, `colors.{light,dark}.focus` (the focus register), `mobileTitleCondensed`, `MobileTabBar` (self-constrained via `MOBILE_CONTENT_WIDTH_STYLE`), the chit's focus mapping, Figure's `focus` tone. If your token structure conflicts with the shell's public constitution, stop and ask; if you retire a SIGNAL axis in the consumer, you may leave the shell structure in place unused (values must exist structurally) — do NOT fork silently.
- **Port shell-level work back in the same window**, domain-neutrally: token structure, kit primitives any consumer would want, audit fixes, plumbing. Arqavellum keeps **its own palette values**; it does not adopt our brand. If your token structure conflicts with the shell's public constitution, stop and ask.
- Public-repo discipline: no consumer names, workspace paths, private provenance, or sibling context in arqavellum commits/source/docs. Local publication-safety hooks enforce this — they will block you, correctly.

## 7. You are visionless — this is how you see

1. **Math that needs no rendering.** WCAG contrast is computable from hex pairs — compute it for **every text token × every surface it rides, both modes + any register you invent**, before committing any palette/type color. Spacing rhythm, type-scale ratios, and touch-target geometry are arithmetic — check them.
2. **Computed-style probes.** Headless Playwright WebKit: assert `fontSize`/`fontWeight`/`letterSpacing`/`fontFamily`/`color`/`fontVariant` on key nodes per screen against YOUR token spec. This is your screenshot. The previous round's suites (`.shots/redesign2/probe-{stage,desk,desktop,reduced,content}.ts`) are reusable skeletons — **rewrite their assertions to your spec**; inherited assertions verify the dead design, not yours.
3. **Geometry probes.** Bounding boxes: effective touch targets ≥44, no horizontal overflow, primary action above the fold at 390×667 AND 390×844, **and — new this round — the mobile column respected at desktop width (1280×800): nothing straddles the centered 420px column** (the SIGNAL round shipped exactly this bug; `probe-desktop.ts` is the template). Scroll-driven states actually change computed values.
4. **Pixel probes.** Measure PNGs you cannot see: color-cluster membership calibrated to YOUR palette (SIGNAL's cold tints taught the lesson — write cluster tests from your hexes, e.g. cool pages have b>r; require alpha≈1 when counting "fills"; detect blanks by cluster diversity, not text cores — antialiasing thins them). `.shots/redesign2/pixel-probe.ts` decodes PNGs in pure bun (zlib + unfilter) — recalibrate its clusters.
5. **The gates.** 13 audits + structural ESLint + `tsc` + tests + the 490px walk + `verify:web-build` after touching export plumbing.

**Discovered truths about this stack (proven by probe — trust them):**
- **RN-web `hitSlop` does NOT expand the DOM hit area.** The box itself must clear 44px.
- **A Pressable with `accessibilityRole="button"` renders as a real `<button>`** — never nest one inside another (hydration warnings). Keep interactive trees flat.
- **RN-web `Text` is `div[dir="auto"]`** — probe with that selector; `getByRole`/`aria-label` work fine in WebKit.
- **`stickyHeaderIndices` works on RN-web** — pinning verified twice (program chapters, library sections).
- **Self-hosted fonts:** OFL faces ride the proven plumbing — files in `public/fonts/`, `@font-face` in an id'd `<style>` in `index.html` + preload links, runtime restore in `_layout`, injector copies both into every exported route. Google Fonts css2 returns **variable** woff2 files. **RN's TextStyle has no `font-stretch`** — expose a width axis as a SECOND `@font-face` over the same file with `font-stretch` pinned in the descriptor, then reference it as its own family name. Prove axes with ink-coverage (weight) and width ratios, prove tnum with "1111" ≡ "9999".
- **`textTransform` is CSS-only** — probe `textContent` for the raw string and computed style for the transform.
- **Dark mode:** seed `localStorage['arqavellum:color-scheme']='dark'` via `addInitScript`; do NOT also set the context `colorScheme`.
- **Tab-bar raise:** a raised center action needs its slot `alignSelf: 'stretch'` — a content-height slot at `flex-end` sinks the button into the bar (measured; fixed in the shell, but the trap is general).
- **Walkers over `/login` while signed in redirect** — measure auth-screen geometry from a fresh signed-out context.
- **A navigation mounted in one process can wedge after its first full pass** — run the walk modes as separate invocations (`light`, then `dark`, then `se`), not `all`.

## 8. Environment realities (proven recipe — obey them)

- Dev server: `cd armandotfit && bun run web` (port 8081; sets `EXPO_PUBLIC_DEV_SURFACES=1` — `/dev/premium` renders null without it). **Check if 8081 is already serving this app before starting another** (curl it); a warm server is preferable. It may need `~/.expo/` writes — if the sandbox denies, retry once with your harness's widest sanctioned permission or ask.
- **Headless Chrome is broken here. Use Playwright WebKit.** Tooling lives in `.shots/` (workspace root, gitignored, never committed). The working stack: `cd .shots && PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers TMPDIR=$PWD/.tmp BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun <script>`.
- `fit-walk.ts` (in `.shots/`) walks every screen against :8081 with the Supabase layer fully network-mocked (deterministic seeded history — nothing touches the real project). Usage: `FIT_OUT=<dir> bun fit-walk.ts light|dark|se` — **one mode per invocation** (see §7's last truth). It does the 490px checks and dumps console/page errors; `FIT_OUT` overrides the gallery dir. Redesign its taps when your IA changes them.
- Viewport 390×844 @2x (390×667 for SE). `fullPage: true` is viewport-only (the app scrolls an inner container) — step-scroll.
- Metro sometimes misses edits: `touch` changed files and re-request; the first walk after edits can time out — warm the bundle, raise timeouts, re-run. A blank page during capture is usually a build problem, not a design verdict.
- Every bash command needs its explicit `cd`. Occasional transient "No such file or directory" on a path that exists — retry.

## 9. Working method

1. **Baseline FIRST, before any code edit.** Capture light, then dark, then se (separate invocations) into `.shots/<your-dir>/before` from the untouched tree — this is the only cheap moment to get a true before gallery. If you lose it, the recovery dance works: `git checkout <pre-redesign-sha> -- .` (tree only, HEAD stays), walk, `git checkout HEAD -- .`, then check `git status` — the checkout resurrects deleted files (old fonts) into the index; unstage and delete them.
2. **The thesis first.** Before any code, write the design thesis as a doc under `docs/architecture/` (its own commit + push): the point of view in one paragraph, the complete type-token table, the spacing/rhythm scale, the surface/elevation language, the color law with the computed contrast matrix, the motion/scroll-choreography rules (with reduced-motion contracts), and a screen-by-screen hierarchy map (focal → second → quiet, with reasons). This doc is your compass and the owner's review artifact. Build to it. When you land, update `CLAUDE.md` invariant 3 + the canonical-docs row to YOUR system, and mark the previous thesis retired with a succession note (both predecessors show the pattern).
3. **Tokens, then kit.** Rebuild `constants/theme.ts` and the MobilePremium kit + showcase to your thesis. Gate, commit, push **before** touching screens. If you change fonts, delete the old woff2s and their preload/`@font-face` lines in the same change (mirror trio).
4. **Screens one at a time** (or tight clusters). Rebuild → probes green → captures archived → gate → commit. No mega-commits. The live session screen is the flagship — give it your best and prove it with the hardest probes (interaction probes: the mid-set log path driven end to end, not just static styles).
5. **Port shell-owned work to arqavellum in the same window** (§6).
6. **Close.** Full walks (light + dark + SE, separate invocations), the after gallery, a before/after pixel-diff heat report with changed-region % (`.shots/redesign2/heat-report2.ts` is the template), and a closing summary: thesis paragraph, per-screen inventory, commit list (both repos), test-count delta with reasons, and an explicit list of everything only the owner's eyes can confirm.

## 10. Git discipline

- Gate on the working tree **before staging**: `cd armandotfit && bun run lint:structure && bunx tsc --noEmit` (+ `bun run test:run` for code milestones).
- One logical milestone per commit. Commit, then push **as a separate command**. Never chain `git commit && git push`. Doc edits are their own commits after the code push.
- Never commit from the workspace root; never commit captures/probes/scratch/handoffs. Verify `git status` scope before every push.

## 11. Definition of done

- Every screen rebuilt under your thesis; each verified by probes in light + dark; 490px PASS; desktop-column PASS; 13 audits + `tsc` green; tests green with count changes documented; before AND after captures archived per screen (light + dark + SE).
- `theme.ts`, your thesis doc, and the showcase tell one consistent story.
- Every shell-owned file you changed also lives in arqavellum, domain-neutrally.
- The closing summary is honest about what remains eyeball-only.

## 12. Stop and ask when

A dependency seems needed · a schema/migration/seed change seems needed · you want to weaken a gate instead of changing the design · your token structure conflicts with arqavellum's public constitution · anything would break auth or PWA plumbing.

## 13. Refuse these failure modes

Reverence for the current design — SIGNAL included, and especially its cleverest parts. Decorative noise you cannot see. Relaxing contrast to hit a vibe. Deleting tests. Claiming you looked at anything. Endless polish instead of thesis → tokens → kit → screens. Motion that delays a tap. Presenting captures as verification — they are evidence for the owner, not for you. Inheriting a probe assertion without rewriting it to your spec.

---

*You are blind, so make the design so principled that assertions can carry your eyes — and make it so committed that the owner's first screenshot is a WOW.*
