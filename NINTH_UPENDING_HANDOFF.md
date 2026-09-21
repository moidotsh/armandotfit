# HANDOFF — THE NINTH UPENDING: TOTAL DESIGN AUTHORITY OVER ARMANDOTFIT

**Audience:** the next model, fresh, equal to the one that built what
you inherit. **Mandate:** a massive UI/UX design upgrade of the
entire app — **presentation only**. This pass changes NO behavior,
adds NO features, and touches NO data: the functional window that
just landed (predictive arming, the earned step, per-exercise rest
memory, the deload week, program eras, the tag features) is
load-bearing FUNCTION — its presentation is yours to recompose, its
mechanics are not. You are a **non-vision model** — you will never
see a pixel of what you build, so the design must be so principled
that arithmetic and assertions can carry your eyes. Priorities, in
order: **typography, balance, visual hierarchy, minimalism.**

**You hold full executive control over the presentation.** THE
SCOREBOARD — the current design system — is **not law anymore**. It
is the incumbent: read it, beat it, and kill any part of it that
survives only by precedent. Its cleverest parts — the register line,
the leader dots, the harmonic ramp {12, 18, 36, 72}, the square cut,
the one-field logger, THE STILL SYSTEM, the red ink — are exactly
the parts most tempting to revere. Do not justify the existing code.
Sunk cost is not an input.

## 1. The succession — every thesis dies by argument

`logbook` → `signal` → `count` → `broadsheet` → `quiet-page` →
`board` → `gauge` → `scoreboard` → **yours**. Each successor killed
most of its predecessor's cleverest parts anyway. Read
`docs/architecture/succession-invariants.md` FIRST — it is the core
that survived all nine theses (the armed-set model, one-tap logging,
computed-at-read, one-statement budgets, caps furniture, the 490px
law, math-before-pixels, deletion-answers-drift). Kill from it only
on an argument that answers its three facts better: one user,
mid-set, at arm's length. Then read
`docs/architecture/scoreboard-thesis.md` LAST, deliberately: it is
the thing to beat, not the thing to obey.

## 2. What you inherit — green, gated, and live

13 structural audits + `tsc` + **677 tests** passing; light + dark +
SE walks probe-verified as of the last commit; a live owner using it
in the gym. Two NEW gates exist and will bite you — read §4.

What the app now IS: a personal fitness PWA. Six tables (five
logging + an orphaned `music_picks` whose surface was DELETED — the
owner plays music elsewhere; the table remains, dropping it is an
owner-gated migration). The AM/PM hypertrophy program in TypeScript
with **eras** (`PROGRAM_ERAS` in splits.ts). The Floor's logger is
THE ONE-FIELD INSTRUMENT: the armed expression `62.5 × 8` at mono
72, one shared stepper pair (hold-to-repeat), **predictive arming**
(the field recent sets were changing), an **earned +2.5 whisper**
(double progression, computed at read), tap-again-to-type. Rest
counts down after every log and **remembers per exercise** (a ±15
tune becomes that station's default); settle haptic-pulses and
brightens NEXT. A **deload week** toggle rests TARGET at the Rx low
end. Settings runs a **promotion audit** line; analytics carries
**THE BALANCE** line (most-neglected group); the spec sheet's
trajectory opens with its trend line; the directory searches tags.

## 3. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos:
  `armandotfit/` (the product) and `arqavellum/` (the public starter
  shell it consumes, file-by-file synced). The workspace root is NOT
  a git repo — every git command runs inside a child repo.
- Package manager is **bun**. Dev server: `cd armandotfit && bun run
  web` (port 8081) — **curl it first**; a warm server may already be
  running. If Expo dies with `EPERM` on `~/.expo/...`, that is the
  file sandbox — retry once with your harness's widest sanctioned
  permission. Transient sandbox glitches (a `cd` failing on an
  existing path, a file-write denied once) happened during the last
  window — plain retry works.
- Read, in order: `armandotfit/CLAUDE.md` (repo law — invariant 3 is
  THE SCOREBOARD you are replacing), this file fully,
  `docs/architecture/succession-invariants.md`, `ARCHITECTURE.md`
  (the pattern constitution + audit codes), `docs/architecture/
  scoreboard-thesis.md` (the incumbent), then the code inventory:
  `app/` (14 routes), `components/composed/` (the app's figures —
  RegisterLine is the signature composition), the MobilePremium kit,
  `constants/theme.ts` + `constants/scoreboard.ts`, `hooks/`,
  `services/`, `stores/`.
- Untracked `*HANDOFF*.md` files in the repo root are prompts from
  prior rounds, never commits. Never commit them.

## 4. THE NEW GATES — they will fail your first token edit, correctly

- **`scripts/verify-design.ts` is chained into `lint:structure` and
  the pre-commit hook.** It asserts the INCUMBENT's law: the ramp
  {12,18,36,72} with LH = size+6, the second-voice ratio, radius 0,
  no shadows, the mode-independent wire, and the full WCAG matrix
  from `theme.ts` hexes. Your thesis replaces these values — so your
  first tokens commit **rewrites verify-design to YOUR law in the
  same change** (never delete it, never weaken it: a design whose
  arithmetic cannot gate was never a design).
- **`scripts/check-shell-drift.ts` + the committed baseline.** If
  you touch kit files (you will), drift fails until you run
  `bun run scripts/check-shell-drift.ts --rebaseline` and commit the
  baseline with the change it blesses. Sync with `../arqavellum` is
  a reviewed act, never silent.

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
  reduced motion respected, WCAG AA computed in both modes. The live
  region and the dialog focus contract stay.
- **Tests stay green. 13 audits + verify-design(yours) + tsc on
  every commit.** Audits are canonical — extend, never weaken.
- **The 490px law:** the primary action fits iPhone SE without
  scrolling. Note: the settings fold-check aims at its FIRST control
  (the theme measure) — Sign Out is a destructive tail where scroll
  is protection; keep that aiming.
- **No new package dependencies without asking the owner first.**
  Fonts are self-hosted OFL woff2 files, not packages.
- **Nothing touches the live Supabase project.**

## 6. Your four priorities, operationalized for a model that cannot see

**Typography is arithmetic.** One or two faces with a reason a math
check can defend; a fixed, ratio-declared ramp (the scoreboard's
{12,18,36,72} divides-72 law is the bar to clear or kill);
tabular figures for every number; authored tracking per rank; a
line-height law. Assert each by computed-style probe on every named
token's key nodes, every screen, both modes.

**Visual hierarchy is countable.** One statement per screen; the
second voice ≥1.4× quieter (the scoreboard shipped 2.0×); hard caps
on distinct sizes and inks per screen, counted in DOM; an
interactive-element budget per screen. Set the numbers in your
thesis, then probe them.

**Minimalism is a deletion discipline.** Every element must answer
the screen's one question or offer its one action — anything else is
deleted, not restyled. The owner's arc is the specification: they
deleted a playback mode, then an entire music surface. When in
doubt, cut. (Cutting PRESENTATION is always yours; cutting FUNCTION
is §5's fence — if the design argues for removing a feature, take
that to the owner instead.)

**Balance is geometry.** One column law (asserted at desktop width —
`MOBILE_CONTENT_MAX_WIDTH` is 420, edges at 430/850 at 1280), a
gutter, a block rhythm, the statement's clear space. Dead space and
crowding are both probe failures: bounding boxes, gaps, and margins
are numbers.

And the umbrella: **contrast is computed, never felt.** Every
text×surface pair in both modes passes AA (4.5:1 text, 3:1
graphical) from `theme.ts` hexes — now also at gate time via
verify-design, recomputed at probe time.

## 7. Executive powers (use them)

You may, without asking: kill the register line and its leader dots;
replace the ramp, the faces (delete old woff2s + their
`@font-face`/preload lines in the same change — mirror trio), the
square cut, the still system, the red ink, the one-field logger's
FORM (its one-tap log behavior is pinned by tests); rebuild the
MobilePremium kit's visual layer and the showcase; restructure any
screen's composition; change every token in `theme.ts`; rename
design vocabulary. You may NOT: change the route contract, break a
behavior pinned by tests, or weaken a gate.

Port every shell-level fix (kit primitives, motion layer, audit
tweaks, plumbing) back to `arqavellum` domain-neutrally in the same
window — public-repo discipline: no consumer names, no private
paths, ever.

## 8. You are visionless — this is how you see (the proven recipe)

1. **Math first:** contrast matrices from hex pairs; ramp ratio
   checks; spacing arithmetic; touch-target geometry. Run these
   BEFORE committing any token.
2. **Computed-style probes** (headless Playwright **WebKit** — Chrome
   is broken here): assert face/size/weight/tracking/color of every
   named token's key nodes per screen, against YOUR spec.
   `.shots/upend8/` holds the last pass's skeletons
   (`math-scoreboard.ts`, `probe-scoreboard.ts` = home, `probe-desk`
   sweep, `probe-floor`, `probe-desktop`) — **recalibrate, don't
   reuse**; inherited assertions verify the incumbent, not you.
3. **Geometry probes:** targets ≥44px, no horizontal overflow,
   primary action visible at 390×667 AND 390×844, desktop 1280×800
   nothing straddles the centered column.
4. **Pixel probes** where color matters (cluster membership over
   PNGs in pure bun — `upend8/heat-report.ts` decodes PNGs and diffs
   galleries).
5. **The harness:** `.shots/fit-walk.ts` walks every screen against
   :8081 with Supabase fully network-mocked; its `installMocks`/
   `makeContext`/`signIn`/`goto` are exported for your probes. It is
   now SCOREBOARD-shaped — its optical probes assert the incumbent;
   **rewrite them to your spec early** (the log path taps are the
   model: `armed-set-weight-tap` → `-tap-input` is
   tap-again-to-type; `armed-set-step-inc/dec` is the ONE pair).
   One mode per invocation (light, then dark, then SE).
6. **Known truths, including the traps that bit the last pass:**
   - RN-web Text is `div[dir=auto]`; Pressable with
     `accessibilityRole="button"` renders a real `<button>`.
   - **`onPressIn` does NOT fire for synthesized WebKit taps** —
     `onPress` does. Press-in/out are enrichment only.
   - **Expo-router keeps prior screens mounted** — home's ticker and
     whisper still paint red in the DOM behind the Floor. Scope
     probe queries to VISIBLE elements (rect intersects viewport) or
     you will chase phantom violations.
   - Dark mode: seed `localStorage['arqavellum:color-scheme']='dark'`
     via `addInitScript`; do NOT also set the context colorScheme.
   - `document.fonts.check('700 36px "Face"')` proves a face landed.
   - Metro misses edits sometimes — `touch` changed files and
     re-request; a surprising FAIL is often a stale bundle.
   - Settings has radio-role controls, not buttons — aim role-based
     checks accordingly.
   - **Captures are evidence for the owner, never verification for
     you.**

## 9. Working method

1. **Baseline FIRST**, before any edit: capture light + dark + SE
   into `.shots/<your-dir>/before/` — the only true before you get.
2. **Thesis before code**, as a doc under `docs/architecture/`, its
   own commit + push: the point of view in one paragraph; the ramp
   with its ratios; the spacing scale; the surface/elevation
   language; the color law with the computed contrast matrix; the
   motion contracts (reduced-motion included); the per-screen
   hierarchy map (focal → second → quiet); your budgets and how
   each is probed. Mark `scoreboard-thesis.md` retired with a
   succession note.
3. **Tokens → kit → showcase → screens.** Rebuild `theme.ts`,
   **verify-design (rewritten to your law)**, the kit, and the
   showcase; gate + commit + push BEFORE touching screens. Then
   screens one at a time (the Floor last — it is the flagship and
   the hardest). No mega-commits.
4. **Gate on the working tree before staging**
   (`cd armandotfit && bun run lint:structure && bunx tsc
   --noEmit`), `bun run test:run` at code milestones, commit, then
   push as a SEPARATE command. Never chain `git commit && git
   push`. Verify `git status` scope before every push; never commit
   captures, probes, scratch, or handoffs.
5. **Prove UX-affecting work in the browser**; re-assert 490px and
   the desktop column after any layout-affecting change.
6. **Update the law with the change:** CLAUDE.md invariant 3 becomes
   YOUR system; the OWNERSHIP row; `check-shell-drift` rebaseline
   for touched kit files.
7. **Close** with: thesis paragraph, per-screen inventory, commits
   (both repos), test-count delta with reasons, a before/after
   changed-region heat report, and an explicit list of what only the
   owner's eyes can confirm. (The scoreboard's own unconfirmed list
   is a fair starting probe: the warm ground, red-as-live with zero
   motion, the 72px expression's confidence, the square cut's
   severity, the boot plate's first frame — the owner liked the
   drift toward it, but no eyes have signed it.)

## 10. Stop and ask when

A dependency seems needed · a schema change or the `music_picks`
drop seems needed · you want to weaken a gate instead of fixing code
· anything would break auth or PWA plumbing · a change would alter
logged data or its meaning · your design argues for REMOVING a
feature rather than restyling it · you want to apply anything to the
live Supabase project.

## 11. Refuse these failure modes

Reverence for THE SCOREBOARD — especially its cleverest parts.
Inheriting a probe assertion without rewriting it to your spec.
Deleting verify-design instead of rewriting it. Decoration you
cannot verify by assertion. Relaxing contrast to hit a vibe.
Deleting tests to pass. Mega-commits. Endless polish instead of
thesis → tokens → kit → screens. Motion that delays a tap. Breaking
function to reach the surface. Presenting captures as verification.

*The app works, it is fast, and its law gates itself. Make it
beautiful by argument — every choice either computes or it's gone.
Leave the owner a better thesis than the one you inherited.*
