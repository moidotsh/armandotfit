# HANDOFF — THE SEVENTH UPENDING: A MASSIVE VISUAL UPGRADE OF ARMANDOTFIT

**Audience:** the next model (GLM-5.3), fresh, **no vision**. **Mandate:** make this app dramatically more beautiful and more usable — a visual upgrade at full strength, designed as if from a blank slate. The app you inherit is coherent, green, and complete — **THE BOARD** (the sixth design): the training-whiteboard language where quantities are drawn, not written (plate stacks for load, tally gates for sets), one flat neutral board per mode, one record-orange, ink verbs, a docked logger as the app's single physical object. It was built by your equal on a deadline and passed every gate. Treat it as **dead weight**: do not justify it, do not inherit it, do not preserve any of it because it is there or because effort went into it. Read the current screens **only to learn what the app does** — never to learn what it should look like. If a decision survives, it survives *your* thesis, not its predecessor's. Sunk cost is not an input. You are designing the best possible gym app.

What you MAY NOT discard is underneath the pixels: the data spine, the route contract, the gates, the accessibility floor, the shell relationship. That is the ground, not the building.

---

## 0. The one rule above all rules

**You are completely uninterested in the current design.** If you catch yourself reasoning from "the plate stack is clever" or "the map-above floor works" — stop. Those are the previous model's taste, and taste is yours to replace wholesale. The only things that bind you are in §4. Everything visual and structural in the presentation layer — tokens, type, chrome, navigation, motion, the drawn-figure language itself, the flat-board metaphor itself — is yours to keep, kill, or invert, provided your replacement is committed at full strength. The BOARD's *functional* lessons (one-tap logging, pre-armed values, computed-at-read everything) are convergent truths you may re-derive; its *aesthetic* is rescinded.

## 1. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos: `armandotfit/` (the product) and `arqavellum/` (the public starter shell it consumes). This directory is **not** a git repo — all git goes inside a child repo with an explicit `cd` every command (cwd never persists).
- Package manager is **bun** everywhere.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariants, the 13 audits, the arqavellum relationship; its invariant 3 describes THE BOARD, the design you are replacing), `armandotfit/ARCHITECTURE.md` (the pattern constitution), then `app/` + `components/composed/` **as a function inventory** (what each screen does, what data flows where — ignore their visual decisions entirely), then `components/MobilePremium/index.ts` + the showcase to know what kit machinery exists. `docs/architecture/board-thesis.md` is the PREVIOUS thesis — read only its §7 per-screen map if you want the feature list in one place; its taste is rescinded by this handoff. The quiet-page and signal theses before it are retired history.
- The codebase is freshly refactored and clean: `app/workout-detail.tsx` is a 61-line dispatcher over `components/composed/Floor.tsx` (the live session, store-direct) + `components/composed/Receipt.tsx` + `hooks/useFloorSession.ts` (the composite session hook). Respect that separation while you reskin — it cost a whole window and it is structure, not decoration.
- Untracked handoff docs in the repo root (like this one) are prompts, never commits.

## 2. The product — what this app IS (design for exactly this)

A personal fitness PWA with **one user: the owner**. Used **in the gym**: one hand, sweat, gloves, glare, iPhone SE-class to Pro-Max. The core loop takes ~10 seconds per set, mid-set, at arm's length, often while breathing hard. **Speed of logging and glanceability are the product; everything else serves them.**

**The program.** An AM/PM hypertrophy split in TypeScript (`shared/exercises/splits.ts`): 4 days × {AM, PM} × 4 slots each, plus a one-a-day compression (7 slots/day). Each slot: exercise + suggested tags + programmed Rx (sets range, reps range). The user starts from this pre-set split; the app suggests the next day-of-split from history.

**The catalog.** 42 exercises (`shared/exercises/data.ts`), each with equipment (slug or `{slug, isRequired}` — unwrap via `equipmentSlugs()`), primary/secondary muscles, modality, difficulty, instructions, tips. This metadata is rich and still under-exploited as design material — muscles/equipment/modality structure the gym itself; consider what the UI could do with it. (Past rounds used it for: equipment-zone library browsing, muscle ink-bars on the detail page, ranked swap alternatives with a "why" line, zone-first swap ranking. Those are function ideas, not constraints.)

**The logging core.** Five tables (immutable law, see §4): sessions (AM and PM are two rows) → logged_exercises (tags are the only context mechanism) → logged_sets (weight × reps; a row IS a completed set). Progression — streaks, personal bests, weekly buckets — is computed at read, never stored.

**The flow, end to end:** auth (email/password, guard ON) → home (what am I walking into today?) → start funnel (split archetype → which day → AM/PM → plan preview → GO) → **live session** (the screen that matters: per-exercise sets at weight × reps, weight carry-forward, last-used tag prefill, last-session top-set prefill via `useTopSetsByName`, swap mid-workout, add exercises from the library, custom names, notes, elapsed clock, save-once-at-end) → receipt (history view, delete) → program browser (standing substitutions) → library (search/filter/recently-logged) + exercise detail → progression + analytics (consistency grid, weekly volume) → settings (theme light/dark, rest days, install, sign out). Navigation chrome + a not-found page.

**Routes:** `/` (home), `/split-selection`, `/workout-detail` (`?id=` = receipt, none = live), `/program`, `/exercise-database`, `/exercise-detail?slug=`, `/progression`, `/analytics`, `/settings`, `/login`, `/register`, `/forgot-password`, `+not-found`, plus the substitution sheet. You may restructure screens and invent different chrome; the ROUTES are the contract (tests and links ride them).

## 3. Your authority

Everything visual and structural in the presentation layer is yours: theme token values AND structure (within the arqavellum-sync law of §6), every MobilePremium primitive's design (the kit is copy-owned by this consumer), the showcase, every screen's information architecture, navigation patterns (kill the stack-from-home if your thesis says so; the drawer primitive is in the kit, unwired), motion language including scroll-driven choreography, empty/loading/error treatments, data-viz language, iconography, the substitution surface, typography (choose your own faces — see §7 "fonts"). You may delete, replace, or radicalize any presentational component, including THE BOARD's signature pieces (PlateStack, TallyGates, TheLogger, BoardHead — all in `components/composed/`). The store's "armed-set model" (draft set rows exist only once logged; hydration creates zero rows — tests document it) is UI-state law you MAY adapt, not data-spine law.

**What "massive upgrade" means here:** a design with a spine — one committed idea carried through every screen at full strength, structural invention (navigation/composition/information architecture we haven't seen in six redesigns), scale and motion used with confidence — **not** decoration bolted onto layouts. Luxury = the feeling that nothing is accidental + speed. Premium = optical discipline + restraint where the moment should be calm + audacity exactly at the focal moment. "Fast" is a design property: the mid-set interaction must feel instant; motion must never make the user wait.

**Scroll-driven envelope (explicitly invited):** this app's screens scroll — push what scroll can DO: headers/composition that transform under scroll, scroll-linked progress and choreography, sticky structures that earn their pinning, scrubbed transitions between content states, physics that feels native. Rails: (a) transform/opacity only, 60fps, zero layout thrash; (b) `prefers-reduced-motion` collapses everything to instant/static — the design must be complete without any motion; (c) DOM-test/jsdom safety (web-only guards, static fallbacks — `useCompressFade` in `premium/shared` is the worked example); (d) never let choreography delay a tap or a keystroke.

## 4. Non-negotiables — repo law that survives every redesign

- **No new package dependencies, ever, without asking first.** If one seems required, stop and ask.
- **The data spine is not design territory.** Five tables, no migrations/seeds, history immutable, computed-at-read, exercise identity joins by name, tags-not-columns vocabulary, the program lives in TS. UI-state stores may be adapted; service contracts extend behind existing seams, never break.
- **Auth guard stays ON. PWA plumbing stays intact** (manifest injection, service worker, boot plate; the mirror trio — `index.html`, `scripts/inject-critical-web.ts`, the runtime block in `app/_layout.tsx` — stays in sync, including `theme-color` values and any self-hosted fonts' `@font-face` + preloads; run `bun run verify:web-build` after touching export plumbing).
- **Accessibility is floor:** roles + labels on every interactive element, **44×44 effective touch targets measured in the DOM** (RN-web `hitSlop` does NOT expand the hit area — proven), reduced motion respected, WCAG AA in both modes — computed, not hoped.
- **Tests stay green** (629 today). Rewrite expectations where the design legitimately changes them and document removals; never delete a test to pass a gate.
- **The audits are canonical.** 13 structural audits + structural ESLint + `tsc --noEmit` gate every commit. SB1 accepts `ScreenScaffold`, `SCREEN_BODY_STYLE`, **and `BoardShell`** in THIS repo's audit (if you replace BoardShell with your own scaffold, teach the audit its name in the same change; arqavellum's audit copy knows neither — keep recognition consumer-side). Barrel shims: run `bun run scripts/sync-barrel-shims.ts` whenever the shim audit bites.
- **The 490px law:** the primary action reachable without scrolling on 390×667 (iPhone SE) AND 390×844. Every screen.
- `theme.ts` stays the canonical token owner; S7 bans hardcoded hex in components.

## 5. What the current build gets right (keep for CONVENIENCE, not by inertia)

The BOARD build is fully green (13 audits + `tsc` + 629 tests), probe-verified, and captured. Its galleries and probe library (`.shots/upend6/`) are yours to reuse; its captures are the "before" for your heat report. The **structure** worth knowing exists:

- **The Floor/Receipt/dispatcher split** (`app/workout-detail.tsx` → `components/composed/Floor.tsx` + `Receipt.tsx` + `hooks/useFloorSession.ts`) — reskin inside this shape or re-cut it deliberately, but keep data orchestration in hooks.
- **BoardShell** (`components/composed/BoardShell.tsx`): header slot + mode-following ticker (`SessionStrip`) + scroll body + the optional M3 compact bar (scroll-linked restatement, consumes the shell-synced `useCompressFade`). `noScroll` + `stickyHeaderIndices` + `onScroll` passthroughs.
- **TheLogger** (the docked instrument: plate stack + Spline counter digits + ±steppers + ink LOG SET, the system's one shadow via `mobilePremium.instrumentShadow`), `PlateStack`/`TallyGates` (the drawn figures; the plate code + air law live in `constants/board.ts`), `BoardHead` (the statement/fact law), `InkRail` (the swap bench, zone-ranked), `StageSetRow`/`SetRow`, the zone-browsed library.
- **`hooks/queries/useTopSets.ts`** (the one top-set derivation — `deriveTopSets` pure + `useTopSetsByName`), `useLastUsedTags`, `useNowTick`, `composed/parseNumber.ts`. Use these; do not re-hand-roll derivations.
- **Fonts:** Archivo (variable, wght+wdth) + 'Archivo Cond' (the SAME file, second `@font-face` with `font-stretch: 75%` — one download, two families) + Spline Sans Mono, in `public/fonts/` + the mirror trio. Swap freely; delete old woff2s + their preloads/`@font-face` in the same change.
- **theme.ts:** two neutral boards (white board / chalkboard), the `colors.*.meter` ramp (six steps + rim — plate code), `colors.focus.*` (the wire: chit + curtain only), `buttonBackground` = ink (the verb-fill lever — the shell's `MobilePrimaryButton` reads this token), `instrumentShadow`.
- Skeletons/EmptyState/QueryErrorNote patterns; the showcase demos the kit.
- The walker (`.shots/fit-walk.ts`) is BOARD-shaped: its taps (armed-set testIDs, FINISH dialog, GO, START, SE login via a fresh signed-out context) and its seven optical probes assert the CURRENT design. **Rewrite the optical probes to YOUR spec early**; the taps need changing only if your IA changes them.

Use, rebuild, or ignore — your call, your thesis.

## 6. Arqavellum relationship — stay a faithful consumer

- armandotfit is a **direct-copy consumer** of the public shell (github.com/moidotsh/arqavellum). The kit + audits + plumbing sync file-by-file; `theme.ts` structure comes from the shell (values + dialect pick + palette are ours).
- Shell-level structure that now lives on BOTH sides (kept in sync): `TypeFaces.displayCondensed`, `colors.{light,dark}.focus`, `colors.{light,dark}.meter` (categorical ramp — arqavellum keeps its own values), `mobilePremium.instrumentShadow`, `mobileCounter`, the chit's focus mapping, Figure's `focus` tone, `MobileTabBar` self-constraint, `MobilePrimaryButton`'s accent defaulting to the `buttonBackground` token, `ScreenScaffold`'s `compact` prop + `premium/shared/useCompressFade`. If your token structure conflicts with the shell's public constitution, stop and ask; if you retire an axis in the consumer, leave the shell structure in place unused (values must exist) — do NOT fork silently.
- **Port shell-level work back in the same window**, domain-neutrally: token structure, kit primitives any consumer would want, audit fixes, plumbing. Arqavellum keeps its own palette; it does not adopt our brand. Local publication-safety hooks enforce public-repo discipline (no consumer names, workspace paths, private provenance, or sibling context in arqavellum commits) — they will block you, correctly.

## 7. You are visionless — this is how you see

1. **Math that needs no rendering.** WCAG contrast is computable from hex pairs — compute it for **every text token × every surface it rides, both modes + any register you invent**, before committing any palette/type color (a scratch contrast script is the cheap way; `.shots/upend6/contrast-board.ts` is the worked example). Spacing rhythm, type-scale ratios, and touch-target geometry are arithmetic — check them.
2. **Computed-style probes.** Headless Playwright WebKit: assert `fontSize`/`fontWeight`/`letterSpacing`/`fontFamily`/`color`/`textTransform` on key nodes per screen against YOUR token spec. This is your screenshot. `.shots/upend6/probe-{floor,home,desk,modes}.ts` are reusable skeletons — **rewrite their assertions to your spec**; inherited assertions verify the dead design, not yours.
3. **Geometry probes.** Bounding boxes: effective touch targets ≥44, no horizontal overflow, primary action above the fold at 390×667 AND 390×844, **and the mobile column respected at desktop width (1280×800): nothing straddles the centered column** (a past round shipped exactly this bug). Scroll-driven states actually change computed values.
4. **Pixel probes.** Measure PNGs you cannot see: color-cluster membership calibrated to YOUR palette (`.shots/upend6/pixel-board.ts` decodes PNGs in pure bun — recalibrate its clusters to your hexes; require alpha≈1 when counting fills; detect blanks by cluster diversity, not text cores). The heat report template: `.shots/upend6/heat-report.ts`.
5. **The gates.** 13 audits + structural ESLint + `tsc` + tests + the 490px walk + `verify:web-build` after touching export plumbing.

**Discovered truths about this stack (proven by probe — trust them):**
- RN-web `Text` is `div[dir="auto"]`; `getByRole`/`aria-label` work in WebKit. A Pressable with `accessibilityRole="button"` renders a real `<button>` — never nest one inside another.
- **`document.fonts.check('800 36px "Archivo Cond"')` proves the width-pinned second family** — the two-`@font-face`-over-one-file trick works and is provable. Google Fonts css2 returns variable woff2 files; OFL faces ride the proven self-hosting plumbing. RN's TextStyle has no `font-stretch`.
- **RN-web ScrollView `ref.scrollTo({y})` works** (object signature). But `onLayout` fires repeatedly as hydration fills content and fonts settle — never latch a one-shot opening scroll; re-jump on growth, guarded by an `onScrollBeginDrag` user-scrolled flag.
- **SectionList virtualizes**: sticky section heads only mount as you scroll — probes must walk the list stepwise to see them.
- **A surprising probe FAIL is often a stale Metro bundle**: `touch` the changed files and re-run before diagnosing design.
- `data-testid` PREFIX selectors match children (`foo` matches `foo-slab-3`) — count rows with exact regex, not prefixes.
- Inset vignettes and focus rings are not lifts; the atmosphere paints inset shadows, the app paints its own ground (body stays transparent — probe the full-viewport container, not `document.body`).
- `textTransform` is CSS-only; `textContent` proves authored caps vs. transform.
- **Dark mode:** seed `localStorage['arqavellum:color-scheme']='dark'` via `addInitScript`; do NOT also set the context `colorScheme`.
- Functions cannot cross `page.evaluate`'s serialize boundary — read values out, compute node-side.
- Walkers over `/login` while signed in redirect — measure auth-screen geometry from a fresh signed-out context. Run walk modes as separate invocations (`light`, then `dark`, then `se`).

## 8. Environment realities (proven recipe — obey them)

- Dev server: `cd armandotfit && bun run web` (port 8081; sets `EXPO_PUBLIC_DEV_SURFACES=1`). **Check if 8081 is already serving before starting another** (curl it); a warm server is preferable. It may need `~/.expo/` writes — if the sandbox denies, retry once with your harness's widest sanctioned permission or ask.
- **Headless Chrome is broken here. Use Playwright WebKit.** Tooling lives in `.shots/` (workspace root, gitignored, never committed). The working stack: `cd .shots && PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers TMPDIR=$PWD/.tmp BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun <script>`.
- `fit-walk.ts` (in `.shots/`) walks every screen against :8081 with the Supabase layer fully network-mocked (deterministic seeded history). Usage: `FIT_OUT=<dir> bun fit-walk.ts light|dark|se` — **one mode per invocation**. It does the 490px checks and dumps console/page errors. Its mock harness (`installMocks`, `makeContext`, `signIn`, `goto`) is exported — build your probes on it.
- Viewport 390×844 @2x (390×667 for SE). `fullPage: true` is viewport-only (the app scrolls an inner container) — step-scroll.
- Metro sometimes misses edits: `touch` changed files and re-request; the first walk after edits can time out — warm the bundle, raise timeouts, re-run. Occasional transient "No such file or directory" on a path that exists — retry.

## 9. Working method

1. **Baseline FIRST, before any code edit.** Capture light, then dark, then se (separate invocations) into `.shots/<your-dir>/before` from the untouched tree — the only cheap moment for a true before gallery.
2. **The thesis first.** Before any code, write the design thesis as a doc under `docs/architecture/` (its own commit + push): the point of view in one paragraph, the complete type-token table, the spacing/rhythm scale, the surface/elevation language, the color law with the computed contrast matrix, the motion/scroll-choreography rules (with reduced-motion contracts), and a screen-by-screen hierarchy map (focal → second → quiet, with reasons). This doc is your compass and the owner's review artifact. Build to it. When you land, update `CLAUDE.md` invariant 3 + the canonical-docs row to YOUR system, and mark `board-thesis.md` retired with a succession note (three predecessors show the pattern).
3. **Tokens, then kit.** Rebuild `constants/theme.ts` and the MobilePremium kit + showcase to your thesis. Gate, commit, push **before** touching screens. If you change fonts, delete the old woff2s and their preload/`@font-face` lines in the same change (mirror trio).
4. **Screens one at a time** (or tight clusters). Rebuild → probes green → captures archived → gate → commit. No mega-commits. The live session screen is the flagship — give it your best and prove it with the hardest probes (interaction probes: the mid-set log path driven end to end, not just static styles).
5. **Port shell-owned work to arqavellum in the same window** (§6).
6. **Close.** Full walks (light + dark + SE, separate invocations), the after gallery, a before/after pixel-diff heat report with changed-region % (`.shots/upend6/heat-report.ts` is the template), and a closing summary: thesis paragraph, per-screen inventory, commit list (both repos), test-count delta with reasons, and an explicit list of everything only the owner's eyes can confirm.

## 10. Git discipline

- Gate on the working tree **before staging**: `cd armandotfit && bun run lint:structure && bunx tsc --noEmit` (+ `bun run test:run` for code milestones).
- One logical milestone per commit. Commit, then push **as a separate command**. Never chain `git commit && git push`. Doc edits are their own commits after the code push.
- Never commit from the workspace root; never commit captures/probes/scratch/handoffs. Verify `git status` scope before every push. Public-repo discipline for arqavellum is enforced by local hooks.

## 11. Definition of done

- Every screen rebuilt under your thesis; each verified by probes in light + dark; 490px PASS; desktop-column PASS; 13 audits + `tsc` green; tests green with count changes documented; before AND after captures archived per screen (light + dark + SE).
- `theme.ts`, your thesis doc, and the showcase tell one consistent story.
- Every shell-owned file you changed also lives in arqavellum, domain-neutrally.
- The closing summary is honest about what remains eyeball-only.

## 12. Stop and ask when

A dependency seems needed · a schema/migration/seed change seems needed · you want to weaken a gate instead of changing the design · your token structure conflicts with arqavellum's public constitution · anything would break auth or PWA plumbing.

## 13. Refuse these failure modes

Reverence for the current design — THE BOARD included, and especially its cleverest parts (the plate code, the tally, the map-above floor). Decorative noise you cannot see. Relaxing contrast to hit a vibe. Deleting tests. Claiming you looked at anything. Endless polish instead of thesis → tokens → kit → screens. Motion that delays a tap. Presenting captures as verification — they are evidence for the owner, not for you. Inheriting a probe assertion without rewriting it to your spec. Hand-rolling a derivation a hook already owns.

---

*You are blind, so make the design so principled that assertions can carry your eyes — and make it so committed that the owner's first screenshot is a WOW.*
