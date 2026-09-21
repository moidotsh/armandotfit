# HANDOFF — THE FIRST SIGHT: TOTAL DESIGN AUTHORITY OVER ARMANDOTFIT, NOW WITH EYES

**Audience:** the vision agent — the first model in this room that can
actually see. **Mandate:** a massive UI/UX design upgrade of the
entire app — **presentation only**. This pass changes NO behavior,
adds NO features, and touches NO data: the functional window that
just landed (predictive arming, the earned step, per-exercise rest
memory, the deload week, program eras, the tag features) is
load-bearing FUNCTION — its presentation is yours to recompose, its
mechanics are not. You inherit an app whose every visual decision
was made by a **blind architect**: the arithmetic is proven, the
gates hold, the probes pass — and **not one pixel of it has ever
been looked at**. You are the eyes. The thesis you inherit literally
ends with a list titled "what only the owner's eyes can confirm" —
your first assignment is that list. Priorities, in order:
**typography, balance, visual hierarchy, minimalism.**

**You hold full executive control over the presentation.** THE
INTERVAL — the current design system — is **not law anymore**. It is
the incumbent: read it, LOOK at it, and kill any part of it that
survives only by arithmetic when sight argues otherwise. Its
cleverest parts — the two-state logger, THE RE-WEIGHT (the clock and
the armed expression exchanging the 72 rank by repaint), the armed
ladder (700-ink + 2px rule vs 400-muted), the leaderless ruled row,
the closed tracking set, the strict red law — are exactly the parts
most tempting to revere. They were designed without eyes; some of
them are probably wrong in ways only you can see. Do not justify the
existing code. Sunk cost is not an input. But know what you are
beating: the system RE-DERIVES itself from three facts — one user,
mid-set, at arm's length — and whatever you kill must answer those
facts better, now by sight AND argument.

## 1. The succession — every thesis dies, now by sight

`logbook` → `signal` → `count` → `broadsheet` → `quiet-page` →
`board` → `gauge` → `scoreboard` → **`interval`** → yours (this
pass may be an AMENDMENT of THE INTERVAL or its successor — you
decide after looking; see §9.2). Each successor killed most of its
predecessor's cleverest parts anyway. Read
`docs/architecture/succession-invariants.md` FIRST — it is the core
that survived ten theses (the armed-set model, one-tap logging,
computed-at-read, one-statement budgets, caps furniture, the 490px
law, math-before-pixels, deletion-answers-drift). Kill from it only
on an argument that answers its three facts better. Then read
`docs/architecture/interval-thesis.md` LAST, deliberately: it is the
thing to beat, not the thing to obey — and it is the first thesis
in the succession written entirely without vision.

## 2. What you inherit — green, gated, and live

13 structural audits + `tsc` + **678 tests** passing; light + dark +
SE walks probe-verified as of the last commit; a live owner using it
in the gym. Two gates exist and will bite you — read §4.

What the app now IS: a personal fitness PWA. Six tables (five
logging + an orphaned `music_picks` whose surface was DELETED — the
owner plays music elsewhere; the table remains, dropping it is an
owner-gated migration). The AM/PM hypertrophy program in TypeScript
with **eras**. The Floor's logger is THE ONE-FIELD INSTRUMENT under
**THE INTERVAL**: **THE LIVE FIGURE owns the counter rank (72)** —
in WORK the armed expression `62.5 × 8` at mono 72 (armed field
700-ink + the 2px rule, unarmed 400-muted), at LOG **THE RE-WEIGHT**
swaps the rest clock into the 72 (red — the live pulse, ±15
steppers flanking, the figure itself the dismiss target) while the
expression demotes to 36 muted, and at settle it swaps back — a pure
repaint, probe-proven still. Rest remembers per exercise; an earned
+2.5 whisper rides the kicker; predictive arming; the deload week
rests TARGET at the Rx low end. The repeating composition is THE
RULED ROW (name · air · right-aligned mono figure — the scoreboard's
leader dots were deleted). **ONE RED INK, strictly three jobs**
(record / link-selection / live) — furniture never wears it (home's
whisper and the 404 lost their red in the last pass). The harmonic
ramp {12, 18, 36, 72} with LH = size + 6 and a CLOSED tracking set
{−1.5, −0.5, 0, +0.8}; radius 0, zero shadows, one warm ground per
mode; Space Grotesk (words) + Martian Mono (every figure); the still
system (no content motion; the re-weight is a repaint). Settings
runs a promotion-audit line; analytics carries THE BALANCE line
(newly restored — it had been computed-but-never-rendered dead
code); the receipt's tonnage and the 404 ride the counter; the spec
sheet's number-to-beat figure is red, its label furniture-ink.

## 3. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos:
  `armandotfit/` (the product) and `arqavellum/` (the public starter
  shell it consumes, file-by-file synced). The workspace root is NOT
  a git repo — every git command runs inside a child repo.
- Package manager is **bun**. Dev server: `cd armandotfit && bun run
  web` (port 8081) — **curl it first**; a warm server may already be
  running. If Expo dies with `EPERM` on `~/.expo/...`, that is the
  file sandbox — retry once with your harness's widest sanctioned
  permission.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariant 3 is
  THE INTERVAL you are superseding or amending), this file fully,
  `docs/architecture/succession-invariants.md`, `ARCHITECTURE.md`
  (the pattern constitution + audit codes), `docs/architecture/
  interval-thesis.md` (the incumbent, written blind), then the code
  inventory: `app/` (14 routes), `components/composed/` (Floor +
  TheLogger are the flagship; RegisterLine is the one repeating
  composition), the MobilePremium kit, `constants/theme.ts` +
  `constants/interval.ts`, `hooks/`, `services/`, `stores/`, and
  `scripts/verify-design.ts` (the gate you must keep honest).
- Untracked `*HANDOFF*.md` files in the repo root are prompts from
  prior rounds, never commits. Never commit them.

## 4. THE GATES — they will fail your first token edit, correctly

- **`scripts/verify-design.ts` is chained into `lint:structure` and
  the pre-commit hook**, and it is STRONGER than it was: besides the
  ramp/LH/tracking/mono/contrast-matrix/square-cut/wire arithmetic,
  it **scans source** — no ad-hoc `fontSize`/`letterSpacing` literal
  anywhere in `app/`, `components/composed/`, `components/primitives/`,
  or the nine kit primitives this app renders (EmptyState, FilterChip,
  MobileActionFooter, MobileAlert, MobileHeader, MobileInput,
  MobilePrimaryButton, MobileSheet, SegmentedControl — they read
  typography tokens now). If your thesis changes token values or
  tracking, your first tokens commit **rewrites verify-design to
  YOUR law in the same change** (never delete it, never weaken it:
  a design whose arithmetic cannot gate was never a design).
- **`scripts/check-shell-drift.ts` + the committed baseline** (41
  standing reviewed differences). If you touch kit files, drift
  fails until you run `bun run scripts/check-shell-drift.ts
  --rebaseline` and commit the baseline with the change it blesses.
  Sync with `../arqavellum` is a reviewed act, never silent.

## 5. Non-negotiables — the fence, not the taste

- **Presentation only.** No behavior changes, no new features, no
  store/service/hook logic, no schema, no migrations. Rewrite a
  DOM-shallow test's expectations only where presentation
  legitimately changed, and say so in the commit. Never delete to
  pass.
- **The data spine is not design territory.** Six tables, history
  immutable, computed-at-read, tags-not-columns, the program in TS,
  kg storage with display-unit conversion at `utils/weight.ts`.
- **Auth guard stays ON; PWA plumbing intact** (the mirror trio:
  `index.html`, `scripts/inject-critical-web.ts`, the runtime block
  in `app/_layout.tsx` — fonts, boot plate, theme-colors all ride
  it; the service worker precaches the faces at install). Run
  `bun run verify:web-build` after touching export plumbing.
- **Accessibility is floor:** roles/labels, 44×44 DOM-measured,
  reduced motion respected, WCAG AA computed in both modes — and
  note the 490px fold-check aims at settings' FIRST control (the
  theme measure); Sign Out is a destructive tail where scroll is
  protection.
- **Tests stay green. 13 audits + verify-design(yours) + tsc on
  every commit.** Audits are canonical — extend, never weaken.
- **The 490px law:** the primary action fits iPhone SE without
  scrolling — **including the Floor's REST state** (the clock block
  grows the logger; the scroller absorbs it; a probe proves it —
  keep proving it).
- **No new package dependencies without asking the owner first.**
  Fonts are self-hosted OFL woff2 files, not packages.
- **Nothing touches the live Supabase project.**

## 6. Your four priorities, operationalized for a model with eyes

**Typography is arithmetic PLUS rhythm.** The ramp {12,18,36,72},
LH+6, the closed tracking set, tabular mono figures — all gated.
What only you can judge: whether Martian Mono at 72 reads confident
or merely wide; whether Space Grotesk statements sit well at 36
sentence-case; whether the furniture caps at 12/+0.8 whisper or
squint; the vertical rhythm of a board of ruled rows. If you change
a token, the gate changes in the same commit.

**Visual hierarchy is countable PLUS felt.** The one statement per
screen, the second voice 2.0× quieter, ≤3 sizes + the counter, ≤3
inks, ≤3 hairlines + one 2px rule, interactives ≤9 (Floor ≤12,
repeated-row families counted once) — all probed. What only you can
judge: whether THE RE-WEIGHT lands as an answer or a jolt; whether
the armed ladder reads as "not the stepper's target" or as
"disabled"; whether the demoted expression during rest is still
findable at a bench glance.

**Minimalism is a deletion discipline.** Every element must answer
the screen's one question or offer its one action — anything else is
deleted, not restyled. The owner's arc is the specification: they
deleted a playback mode, then an entire music surface. When in
doubt, cut. (Cutting PRESENTATION is always yours; cutting FUNCTION
is §5's fence — take feature removal to the owner instead.)

**Balance is geometry PLUS optics.** One column law (asserted at
desktop width — `MOBILE_CONTENT_MAX_WIDTH` is 420, edges at 430/850
at 1280), gutter 20, block 32, statement halo 24, register figures
right-aligned within 1px — all probed. What only you can judge:
crowding vs air in the logger's stacked rows, the board's hairline
weight, the swap bench's rhythm, the dark room's warmth.

And the umbrella: **contrast is computed, never felt** — every
text×surface pair in both modes passes AA from `theme.ts` hexes at
gate time; sight may never relax a ratio.

## 7. Executive powers (use them)

You may, without asking: kill the re-weight and give the counter
back to a single permanent figure (argue it); re-rank the ramp's
roles; replace the faces (delete old woff2s + their `@font-face`/
preload lines in the same change — mirror trio); reintroduce or
re-kill the square cut, the still system, the red law; rebuild the
kit's visual layer and the showcase; restructure any screen's
composition; change every token in `theme.ts`; rename design
vocabulary (`constants/interval.ts` is yours to rename). You may
NOT: change the route contract, break a behavior pinned by tests
(one-tap log, the one-field law, the rest countdown's behavior,
per-exercise rest memory), or weaken a gate.

Port every shell-level fix (kit primitives, motion layer, audit
tweaks, plumbing) back to `arqavellum` domain-neutrally in the same
window — public-repo discipline: no consumer names, no private
paths, ever.

## 8. You have eyes — this is how to use them (the proven recipe)

1. **Look BEFORE changing anything.** `.shots/upend9/before/`
   (light: the full incumbent walk; dark: 23 screens) and
   `.shots/upend9/after/` (light + dark + SE of THE INTERVAL) are on
   disk. **Read them with your vision tool first** — you are the
   first agent able to. Then capture fresh baselines of the current
   tree before your first edit.
2. **The capture stack** (scratch lives outside the repos in
   `.shots/` — never commit it): headless **Playwright WebKit**
   (Chrome is broken here), `PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers
   TMPDIR=$PWD/.tmp`, phone-sized 390×844 @2x, SE 375×667 for the
   490px law, desktop 1280×800 for the column. The harness:
   `.shots/fit-walk.ts` walks every screen against :8081 with
   Supabase fully network-mocked (`installMocks`/`makeContext`/
   `signIn`/`goto` exported); `FIT_OUT=... bun fit-walk.ts
   [light|dark|se|all]`. One mode per invocation.
3. **Probes remain the gate; vision directs them.** Computed-style,
   geometry, and pixel probes stay load-bearing (`.shots/upend9/`
   holds the current skeletons: `probe-floor.ts` = the two-state
   flagship, `probe-desktop.ts` = the column + the 404,
   `probe-se-rest.ts` = the rest-state height law, `heat-report.ts`
   = before/after changed regions). When your eyes find a defect,
   write the assertion that would have caught it — the next blind
   agent inherits your eyes as arithmetic. **A finding you can see
   but cannot assert is an opinion; an opinion may drive a change,
   but the change must still compute.**
4. **The unconfirmed list is your spec sheet.** From the incumbent's
   own close (all captures in `.shots/upend9/after/`): (1) the
   rest-state Floor — answer or jolt? (`light-09-set-logged.png`);
   (2) the armed ladder's 400-muted demotion — target-mark or
   disabled-looking?; (3) leaderless ruled rows — do they hold the
   register's charm?; (4) the clock's flanking ±15 steppers at 390 —
   thumb reach; (5) kit retune edges — segmented labels at 12 mono,
   inputs at 18, the finish dialog's figures; (6) the 404 in ink at
   72 — severity without red; (7) the boot plate's stamp at 18 —
   first-frame confidence.
5. **Known truths, including the traps that bit the last pass:**
   - RN-web Text is `div[dir=auto]`; Pressable with
     `accessibilityRole="button"` renders a real `<button>`.
   - **`onPressIn` does NOT fire for synthesized WebKit taps** —
     `onPress` does. Press-in/out are enrichment only (hold-to-repeat
     included: the repeat is enrichment, never the path).
   - **Expo-router keeps prior screens mounted** — home still paints
     behind the Floor. Scope probe queries to VISIBLE elements.
   - Dark mode: seed `localStorage['arqavellum:color-scheme']='dark'`
     via `addInitScript`; do NOT also set the context colorScheme.
   - `document.fonts.check('700 36px "Face"')` proves a face landed.
   - Metro misses edits sometimes — `touch` changed files and
     re-request; a surprising FAIL is often a stale bundle.
   - Settings has radio-role controls, not buttons.
   - RN-web's ScrollView keeps an **identity matrix** transform
     (`floor-scroll`) — the still law asserts transforms do not
     CHANGE across events, not that none exist.
   - `page.evaluate` cannot close over Node-side helpers — inline
     them into each evaluate body.
   - The walk's session flow is START → split picker → **GO** → the
     Floor. The log path taps:
     `armed-set-weight-tap` → `-tap-input` (tap-again-to-type);
     `armed-set-step-inc/dec` is the ONE pair; `armed-set-log`
     starts rest; six × `-rest-dec` settles it.
   - Detached dark/SE walks have stalled under the sandbox before —
     if shot counts stop growing, kill and rerun that mode.
   - **Captures are now YOUR verification too — but the assertions
     are the owner's.** Ship both.

## 9. Working method

1. **Look FIRST**: read the inherited galleries, then capture fresh
   baselines (light + dark + SE) into `.shots/<your-dir>/before/`.
2. **Verdict before code**: after looking, decide AMENDMENT vs
   SUCCESSION. An amendment updates `interval-thesis.md` in place
   (with a dated revision block listing what sight changed); a
   succession writes a new thesis doc and retires the incumbent with
   a succession note. Either way: the point of view in one
   paragraph, the deltas with their arithmetic, the budgets and how
   each is probed — its own commit + push, before any token edit.
3. **Tokens → kit → showcase → screens.** Change `theme.ts`/
   `constants/interval.ts` + **verify-design (rewritten to your law
   in the same change)** + the kit + the showcase; gate + commit +
   push BEFORE touching screens. Then screens one at a time (the
   Floor last — it is the flagship and the hardest). No
   mega-commits.
4. **Gate on the working tree before staging** (`cd armandotfit &&
   bun run lint:structure && bunx tsc --noEmit`), `bun run
   test:run` at code milestones, commit, then push as a SEPARATE
   command. Never chain `git commit && git push`. Verify `git
   status` scope before every push; never commit captures, probes,
   scratch, or handoffs.
5. **Prove UX-affecting work in the browser** — probe it AND look at
   it; re-assert 490px (rest state included) and the desktop column
   after any layout-affecting change.
6. **Update the law with the change:** CLAUDE.md invariant 3 becomes
   YOUR system; the OWNERSHIP row; `check-shell-drift` rebaseline
   for touched kit files.
7. **Close** with: thesis paragraph, per-screen inventory, commits
   (both repos), test-count delta with reasons, a before/after
   changed-region heat report, the list of what you SAW and fixed
   that no assertion could have caught, and — since the owner is
   the final eyes — the honest list of what still needs their
   sign-off.

## 10. Stop and ask when

A dependency seems needed · a schema change or the `music_picks`
drop seems needed · you want to weaken a gate instead of fixing code
· anything would break auth or PWA plumbing · a change would alter
logged data or its meaning · your design argues for REMOVING a
feature rather than restyling it · you want to apply anything to
the live Supabase project.

## 11. Refuse these failure modes

Reverence for THE INTERVAL — especially its cleverest parts (the
re-weight, the ladder, the leaderless row). Using vision as a
substitute for probes — every UX-affecting change still asserts.
Changing what you cannot argue for even after seeing it (sight
proposes, arithmetic disposes). Decoration you can neither assert
nor defend by sight. Relaxing contrast to hit a vibe. Deleting
tests to pass. Mega-commits. Endless polish instead of verdict →
tokens → kit → screens. Motion that delays a tap — the logger is
tappable at frame 1, forever, in both states. Breaking function to
reach the surface. Presenting captures as the only verification.

*The app works, it is fast, and its law gates itself. Its tenth
thesis was built blind and proved by arithmetic. Make it beautiful
by argument AND by sight — every choice either computes, shows, or
it's gone. Leave the owner a better thesis than the one you
inherited — and leave the next agent, blind or sighted, sharper
probes than the ones you inherited.*
