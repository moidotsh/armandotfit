# HANDOFF — THE VISION PASS ON THE COUNT (eyes, at last)

**Audience:** the next model, fresh, **with working vision**. Your predecessor
built everything you are about to look at while completely blind — `read_image`
was disabled on its model. It designed by thesis, then verified by assertion:
computed styles, geometry boxes, contrast math, pixel-cluster statistics,
interaction probes. Every gate is green. Every number is measured. What nobody
has ever done is **look at it**.

**Your mandate:** be the eyes. Audit every screen of THE COUNT in both modes at
phone size and desktop width, read the captures, walk the app live, find
everything that is visually wrong, unbalanced, ugly, illegible, or off-thesis —
and fix it at craft level. You are a finishing pass with full edit rights: the
optical-quality pass the blind builder could not give it. The result should be
that nothing about the visual execution is accidental — only the taste-level
decisions the thesis already made stay untouchable.

This is **not** an invitation to a fourth upending. Read §2 for exactly how far
your authority reaches.

---

## 0. The one rule above all rules

**Every claim about appearance must cite a capture you actually read.** "The
tally diagonal looks clipped" is only real if you saw it in a PNG or a live
walk. "It looks fine" without having looked is the cardinal failure. You have
what no agent before you had on this codebase — use it on everything, early and
often, and keep re-looking after every fix.

## 1. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos: `armandotfit/`
  (the product) and `arqavellum/` (the public starter shell it consumes). This
  directory is **not** a git repo — all git goes inside a child repo with an
  explicit `cd` every command (cwd never persists). Package manager is **bun**.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariant 3 IS THE COUNT
  now), `docs/architecture/count-thesis.md` (the system's constitution: the
  tally, the ruled field, the strike law, the iron interrupt, per-screen
  hierarchy map — §7 is your checklist of intent), then `constants/theme.ts`
  (canonical tokens), then walk the app.
- The system in one paragraph: training is counting, so every sequence renders
  as **tally strokes** — struck = done, **one orange mark = the next strike**,
  ghosts = ahead. One continuous **ruled field** (chalk light `#F1F1EF` / iron
  dark `#0C0D0D`, hue-cast-free neutrals, 1px hairlines, square-cut 2–4px
  radii, no cards, no shadows). No tab bar: home is the hub (day measure +
  START + THE INDEX rows); while a session runs an **iron session strip** pins
  under every Desk header (LIVE · elapsed · RETURN). The live-session **stage
  follows the mode** at full scale — the **count board** is docked: tally strip
  + mono counter (weight × reps, ± steppers) + LOG SET. Type: **Big Shoulders**
  (statements, condensed by design) + **Azeret Mono** (markings + every
  changing figure) + platform sans for reading. Orange (`#C64100` light /
  `#FF7A2E` dark) appears exactly three ways: the next mark, the primary verb,
  the living pulse.
- Untracked handoff docs in the repo root (like this one) are prompts, never
  commits.

## 2. Your authority — the refinement envelope

**Yours, at full strength:**
- Every optical judgment: spacing rhythm, alignment, baseline pairing, size
  relationships, weight contrast, dead space, crowding, wrapping, truncation,
  mark geometry (stroke widths, the tally diagonal, group gaps), hairline
  visibility at @2x, corner consistency, focus rings, pressed states, empty/
  loading/skeleton treatments, empty-state art, icon sizing, the boot plate,
  the route curtain's pacing, the chit toast's composition.
- Token VALUE retunes (colors within the neutrals+one-orange law; radii within
  square-cut; sizes/line-heights/tracking within the named-token discipline).
  If you change any palette value you MUST regenerate the contrast matrix
  (`.shots/redesign3/contrast3.ts`) and keep every text-bearing slot AA in both
  modes — computed, not hoped — and update the thesis §3.3 numbers.
- Layout repairs anywhere the build betrays its own thesis (a screen that
  isn't a ruled field, a stage that isn't sparse, an orange that decorates).
- Motion feel: durations, easings, the strike animation's snap, the
  ruler-compress scrub — provided nothing delays a tap and reduced-motion still
  collapses to complete static.
- Adding **new probe assertions** for every defect you fix (teach the blind
  instruments what your eyes learned — that is how this repo keeps its vision
  after you leave).

**NOT yours (stop and ask, or don't):**
- A new design thesis, a new IA, a new type system. The COUNT landed whole,
  probe-verified, and heat-reported; your job is its craft, not its successor.
  If your eyes find something CATASTROPHIC (the tally unreadable, the stage
  broken on SE), fix it within the system; if the system itself must change,
  write the case and ask the owner.
- The brand hue family (orange). The `brand` slot stays the single accent; a
  value retune that keeps AA is fine, a second accent is not.
- Anything in §6 (repo law). No new dependencies without asking. No schema,
  no stored aggregates, no gate weakening, no deleted tests, no shell token-
  structure forks.

## 3. Your instruments — how to see

1. **The galleries (read these first):** `.shots/redesign3/after/{light,dark,se}`
   — the current build, 103 shots, every screen + scroll steps.
   `.shots/redesign3/before/…` — the predecessor (SIGNAL) for contrast of
   intent. `read_image` works on your model — read every after-shot before you
   touch code, and build a written findings ledger ranked by severity.
2. **Live walks:** the dev server may already be running on :8081 (curl it
   first; if you must start one: `cd armandotfit && bun run web` in a managed
   background job — it needs `~/.expo` writes; if the sandbox denies, retry
   once with your widest sanctioned permission). The walker
   (`.shots/fit-walk.ts`) walks every screen with the Supabase layer fully
   network-mocked (deterministic seeded history — nothing touches the real
   project): `cd .shots && FIT_OUT=<dir> PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers
   TMPDIR=$PWD/.tmp BUN_INSTALL_CACHE_DIR=$PWD/.bun-cache bun fit-walk.ts
   light|dark|se` — **one mode per invocation** (a navigation mounted in one
   process can wedge after its first pass). It does the 490px checks and dumps
   console/page errors. Its taps match the CURRENT IA (START → GO → armed-set
   testIDs → stage-finish).
3. **The probe library** (all in `.shots/redesign3/`, same env recipe):
   `probe-home`, `probe-stage` (the flagship interaction path — LOG strikes a
   tally, carries values, strip returns to stage, save lands),
   `probe-desk-screens` (faces on every Desk screen), `probe-desktop` (the
   420px column at 1280×800), `probe-reduced` (reduced-motion contract),
   `probe-fonts` (weight axis, tabular figures), `pixel3.ts` (palette clusters
   + neutral-field law), `heat-report3.ts` (before/after diff). Run the ones
   touching your changes; keep them green; extend them with each fix.
4. **Capturing fresh evidence:** screenshot at 390×844 @2x and 375×667 (SE).
   `fullPage: true` is viewport-only (the app scrolls an inner container) —
   step-scroll via the walker's `scrollShots`. Dark mode: seed
   `localStorage['arqavellum:color-scheme']='dark'` via `addInitScript`; do NOT
   also set the context colorScheme.

**Discovered truths about this stack (proven by probe — trust them):**
- RN-web `hitSlop` does NOT expand the DOM hit area — the box itself must
  clear 44px.
- RN-web `Text` is `div[dir="auto"]`; `MobileSectionEyebrow` renders as
  `<h1 role="heading">` (probe with those selectors).
- A `Pressable` with `accessibilityRole="button"` renders a real `<button>` —
  never nest one inside another.
- Playwright `getByRole({ name })` matches SUBSTRINGS — anchor your taps
  (`/^GO$/i` or `'GO'` clicks "Go back" — this bit the walker once).
- Headless Chrome is broken here; use **Playwright WebKit**. Tooling lives in
  `.shots/` (gitignored, never committed).
- Metro sometimes misses edits: `touch` changed files and re-request; the
  first walk after edits can time out — warm the bundle, raise timeouts.
- The nav stack keeps hidden screens mounted (`display:none`) — when querying
  by testID, filter for the VISIBLE instance; duplicate mounted screens also
  mean push-loops grow the stack (that is why minimize/return use `replace*`).
- Fonts ride the mirror trio: `public/fonts/*.woff2` + the id'd `@font-face`
  style + preloads in `index.html`, restored at runtime in `app/_layout.tsx`,
  copied per-route by `scripts/inject-critical-web.ts`. Touch one, sync all
  three, then `bun run verify:web-build`.
- Occasional transient "No such file or directory" on paths that exist — retry.

## 4. The suspicion ledger — what the blind build could NOT verify

Ranked guesses. Confirm or acquit each with your eyes; add your own findings
above these.

1. **The tally diagonal.** `TallyStrip`'s fifth mark is an absolutely-
   positioned, −58°-rotated bar (left −4, top 50%, marginTop −2). Does it
   actually cross the four strokes cleanly at both sizes, in both modes, at
   @2x? Clipped? Floating? Does a full group read as FIVE at a glance?
2. **Ghost-mark legibility.** Ghosts are 1px `colors.border` outlines
   (#D9D9D5 on chalk / #272928 on iron). Too faint to count as "slots ahead"?
   Too present? Do ghosts + next-mark read as a coherent measure strip?
3. **The count board's vertical mass.** Two full-width counter rows + tally +
   LOG ≈ 290px docked. On SE (667) the ledger gets ~200px — does the stage
   feel airless or correct? Is the KG/REPS whisper-unit baseline (a
   paddingBottom hack) optically seated?
4. **Big Shoulders in action.** All-caps wordmark tracking (0.6 at 18px), the
   46px day title's two-line wraps, station names at 38/800, nav titles at
   18/700 — kerning, uppercase spacing, fallback flashes (FOUT from boot
   plate), and whether long exercise names truncate gracefully.
5. **The funnel's inverted tile.** Ink plate on chalk / chalk plate on iron.
   Does inversion read instantly as selection? Are the D-numerals (26/800)
   seated against the weekday/date markings?
6. **Station rail marks.** done=text-fill / current=brand / ahead=hairline.
   In DARK mode, done marks are chalk blocks — do done vs current still
   separate at a glance? Is the rail's underline rule aligned with the
   header's?
7. **Home masthead composition.** lg tally strip (44px strokes) above the 46px
   title — rhythm, the eyebrow's three-part string ("TODAY · PM WINDOW · DAY
   3 OF 4") at 375 width, first-lift line, START button, then THE INDEX —
   does the page open with a WOW and read top-to-bottom in glances?
8. **The iron interrupt moments.** Session strip (LIVE dot breathing, mono
   elapsed, RETURN →), chit toasts, the route curtain sweep on light pages
   (an near-black plate covering chalk — check the destination title stamp in
   Big Shoulders). Dramatic or muddy?
9. **Program chapter heads.** Sticky at 34/800 + mono eyebrow + mono figure.
   Does the PIN stay clean while slots scroll under (web position: sticky)?
   Do the 2px strike rules on substituted slots register?
10. **Analytics.** The least-touched screen: consistency grid + weekly bars on
    the new neutrals. Do the four cell levels separate? Are the bars' square
    cuts + mono values aligned to the field?
11. **Exercise-detail muscle strokes.** 4 struck vs 2 ghost strokes as data-
    viz — do PRIME/ASSIST read instantly? Row alignment against long muscle
    names at 375.
12. **Settings' rest-day measure.** Seven 44px tiles, radius 2, rest days
    orange-filled — does it read as a measure strip or as seven buttons?
13. **Receipt.** Per-exercise tally groups (small strokes) inline with names —
    baseline pairing; tonnage hero at 76/800.
14. **Auth + 404 + boot plate.** ARMANDOTFIT at 21/800 + 0.6 tracking,
    centered; the boot plate's strike rule; 404's hero. Confident or lost on
    the page?
15. **Hairlines at @2x.** 1px rules rendered on 2x screens — crisp or blurry?
    Inconsistent anywhere (StyleSheet.hairlineWidth vs literal 1)?
16. **Empty/loading states.** Skeletons, the ghost-tally empty state on home,
    library's empty search — do they speak the system?

## 5. Working method

1. **Look first.** Read all 103 after-shots + live-walk the three modes
   yourself. Write the findings ledger (severity-ordered, each with the
   capture that shows it). Do not write a line of code before the ledger
   exists.
2. **Fix in small optical commits** — one screen or one mechanism each:
   working-tree gate (`cd armandotfit && bun run lint:structure && bunx tsc
   --noEmit`, plus `bun run test:run` for behavior-touching changes) →
   re-capture the affected screens (both modes) → **re-look with your eyes** →
   extend the relevant probe with an assertion that would have caught the
   defect → commit → push as a separate command. Never `commit && push`.
3. **Doc sync.** Any token-value change updates `count-thesis.md` (and the
   contrast matrix §3.3); any kit-primitive change updates the
   mobile-premium-design-system inventory + showcase, and ports to arqavellum
   domain-neutrally in the same window (public-repo discipline: no consumer
   names, paths, provenance in the shell repo — the local hooks enforce it).
4. **Close:** full walks (light, dark, se — separate invocations) into
   `.shots/vision1/after/…`, a final read of every shot, a findings-ledger
   → resolution report (each finding: the capture, the fix, the after-capture,
   the new assertion), and an explicit list of anything only taste can settle.

## 6. Repo law that survives every pass (condensed — CLAUDE.md is canonical)

- **No new package dependencies without asking.** No schema/migration/seed
  changes. History immutable; progression computed at read; the program lives
  in TypeScript.
- **Auth guard stays ON. PWA plumbing intact** (manifest injection, service
  worker, boot plate; the mirror trio including `theme-color` values).
- **Accessibility floor:** roles + labels, **44×44 measured boxes** (hitSlop
  lies), reduced-motion respected, WCAG AA in both modes — recomputed on any
  color change.
- **Tests stay green** (624). Rewrite expectations where design legitimately
  moves them; never delete to pass. 13 audits + structural ESLint + `tsc` on
  every commit. S7 bans hardcoded hex. The **490px law** (primary action
  reachable unscrolled at 390×667) holds on every screen.
- **Arqavellum:** direct-copy consumer; structure from the shell, values ours;
  shell-level fixes port back domain-neutrally; never fork shell structure
  silently; if a token-structure conflict arises, stop and ask.
- **Git:** one logical milestone per commit; push separate; verify
  `git status` scope; never commit captures/probes/handoffs; never commit
  from the workspace root.

## 7. Definition of done

- Findings ledger fully resolved or explicitly deferred with reasons.
- Every screen re-captured in light + dark (+ SE for home/funnel/stage/
  settings/login), and you have READ each final capture.
- All probes green (extended with your new assertions); walks clean, zero
  console errors; 13 audits + tsc + tests green; 490 + desktop-column PASS.
- Contrast matrix regenerated and AA if any color moved; thesis + kit docs in
  sync; shell ports landed.
- The closing report is honest about what remains taste-only.

## 8. Stop and ask when

A dependency seems needed · a schema/migration change seems needed · you want
to weaken a gate · your fix would change shell token STRUCTURE · you believe
the thesis itself must change · anything would break auth or PWA plumbing.

## 9. Refuse these failure modes

Claiming you looked without citing the capture · redesigining from scratch ·
relaxing contrast to hit a vibe · deleting tests · mega-commits · motion that
delays a tap · inheriting a probe assertion without asking what it asserts ·
presenting measurements as substitutes for looking · leaving the findings
ledger unresolved and unreported.

---

*The blind builder made the design so principled that assertions could carry
its eyes — your job is to make it so finished that the owner's first screenshot
lands as a WOW, and to leave behind probes that keep seeing after you're gone.*
