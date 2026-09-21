# HANDOFF — THE EIGHTH UPENDING: TOTAL DESIGN AUTHORITY OVER ARMANDOTFIT

**Audience:** the next model, fresh, equal to the one that built what
you inherit. **Mandate:** a massive UI/UX design upgrade of the entire
app. You are a **non-vision model** — you will never see a single
pixel of what you build, so the design must be so principled that
arithmetic and assertions can carry your eyes. Priorities, in order:
**typography, balance, visual hierarchy, minimalism/simplicity.**

**You hold full executive control over the presentation.** THE GAUGE —
the current design system — is **not law anymore**. It is the
incumbent: read it, beat it, and kill any part of it that survives
only by precedent. Do not justify the existing codebase. If a
structure is wrong, replace it. If a whole figure language is wrong,
delete it. Sunk cost is not an input.

What you inherit is green: 13 audits + tsc + **707 tests** passing,
light + dark + SE walks probe-verified as of the last commit, a live
owner using it in the gym — and an owner whose recent asks all pull
one direction: **less content, smaller surfaces, one field instead of
two, a minimal player instead of a busy sheet.** Read that drift. It
is your brief.

## 1. The succession — every thesis dies by argument

`signal-thesis` → `quiet-page-thesis` → `board-thesis` → `gauge-thesis`
→ **yours**. Each one considered its predecessor's cleverest parts
load-bearing, and each successor killed most of them anyway. Read
`docs/architecture/gauge-thesis.md` last, deliberately: it is the
thing to beat, not the thing to obey. Its pin rails, odometers, flip
tiles, enamel-on-concrete material, and mechanical motion family are
all candidates for the scrap heap — keep any only on their own
argument.

## 2. Orientation — do this first

- Workspace: `/Users/koba/Documents/Code/arman`. Child repos:
  `armandotfit/` (the product) and `arqavellum/` (the public starter
  shell it consumes, file-by-file synced). The workspace root is NOT
  a git repo — every git command runs inside a child repo.
- Package manager is **bun**. Dev server: `cd armandotfit && bun run
  web` (port 8081) — **curl it first**; a warm server may already be
  running. If Expo dies with `EPERM` on `~/.expo/...`, that is the
  file sandbox — retry once with your harness's widest sanctioned
  permission.
- Read, in order: `armandotfit/CLAUDE.md` (repo law), this file fully,
  `ARCHITECTURE.md` (the pattern constitution + audit codes),
  `docs/architecture/gauge-thesis.md` (the incumbent),
  `SEVENTH_UPENDING_HANDOFF.md` §7–8 (the visionless method +
  environment realities — they remain true), then the code inventory:
  `app/` (14 routes), `components/composed/` (the app's figures),
  `components/MobilePremium/` (the kit), `constants/theme.ts` +
  `constants/gauge.ts` (the incumbent tokens), `hooks/`, `services/`,
  `stores/`.
- Untracked `*HANDOFF*.md` files in the repo root are prompts from
  prior rounds, never commits. Never commit them.

## 3. What the app IS (and what must keep being true)

A personal fitness PWA, one user, mid-set in the gym. Six tables
(five logging + `music_picks`), computed-at-read everything, the
program in TypeScript, auth email/password with the guard ON, PWA
install plumbing. Recent and young: offline draft persistence + a
queued save (`services/sessionSaveQueue.ts`), one shared history
cache (`queryKeys.workouts.history/activity`), a music surface with a
hidden YouTube player, URL-taking search, persisted picks, Media
Session controls, and a mini player with the thumbnail-as-disc.

**These BEHAVIORS survive any redesign** — their tests pin them:
draft persistence, queue flush, derivation invariants, schema-truth
goldens, entity decoding, dialog focus contract, the live region.
Rewrite a DOM-shallow test's expectations only where presentation
legitimately changed, and say so in the commit. Never delete to pass.

## 4. Non-negotiables — the fence, not the taste

- **The data spine is not design territory.** Six tables, history
  immutable, computed-at-read, tags-not-columns, the program in TS,
  kg storage with display-unit conversion at `utils/weight.ts`. A
  seventh table or schema change = owner decision.
- **Auth guard stays ON; PWA plumbing intact** (the mirror trio:
  `index.html`, `scripts/inject-critical-web.ts`, the runtime block in
  `app/_layout.tsx`; run `bun run verify:web-build` after touching
  export plumbing).
- **Accessibility is floor:** roles/labels, 44×44 DOM-measured,
  reduced-motion respected, WCAG AA computed in both modes. The live
  region and dialog focus contract stay.
- **Tests stay green. 13 audits + tsc on every commit.** Audits are
  canonical — extend them, never weaken them.
- **The 490px law:** the primary action fits iPhone SE without
  scrolling.
- **No new package dependencies without asking the owner first.**
  Fonts are self-hosted OFL woff2 files; new faces are files, not
  packages.
- **Nothing touches the live Supabase project.** After any (owner-
  applied) migration, `bun run scripts/verify-live-schema.ts` checks
  the live schema read-only.
- **`constants/theme.ts` stays the sole token owner** (its structure
  is shell-synced; your values replace the incumbent's).

## 5. Your four priorities, operationalized for a model that cannot see

**Typography is arithmetic.** Choose faces with a reason a math check
can defend: one or two families total (plus platform body), a fixed
ramp (define the ratio — e.g. a modular scale — and assert every
size), tabular figures for every number, authored tracking per rank,
a line-height law. Assert each by computed-style probe:
`fontSize`/`fontWeight`/`letterSpacing`/`fontFamily` on every named
token's key nodes, every screen, both modes. A face you cannot
justify in one sentence of arithmetic is decoration.

**Visual hierarchy is countable.** One statement per screen; the
second voice ≥1.4× quieter (size, weight, or color — pick the lever
and hold it); a hard cap on distinct sizes and text colors per screen
(count them in DOM); an interactive-element budget per screen. Set
the numbers in your thesis, then probe them. The incumbent used ≤4
sizes / ≤4 colors / ≤10 interactives (≤14 on the Floor); you may
tighten or replace the budgets, but budgets there will be.

**Minimalism is a deletion discipline.** Every element must answer
the screen's one question or offer its one action — anything else is
deleted, not restyled. Prefer one field over two, one line over a
panel, nothing over a label. The owner's recent behavior is the
specification: they deleted a whole playback mode because it was one
button too many. When in doubt, cut.

**Balance is geometry.** One column law (the mobile column, asserted
at desktop width), a gutter, a block rhythm, the statement's clear
space, optical alignment of figures against labels. Dead space and
crowding are both probe failures: bounding boxes, gaps, and margins
are numbers — audit them per screen.

And the umbrella: **contrast is computed, never felt.** Every
text×surface pair in both modes passes AA (4.5:1 text, 3:1 graphical)
from `theme.ts` hexes, recomputed at probe time. A palette that needs
squinting to pass is a failed palette.

## 6. Executive powers (use them)

You may, without asking: kill any GAUGE figure (the pin rail, the
rolling counters, the flip tiles, the pip groups, the rest
instrument's FORM — though a rest countdown behavior is precious to a
hypertrophy lifter); replace the material metaphor entirely; rebuild
the MobilePremium kit's visual layer and the showcase; restructure
any screen's composition; change every token in `theme.ts`; replace
fonts (delete old woff2s + their `@font-face`/preload lines in the
same change — mirror trio); rename design vocabulary. You may NOT:
change the route contract (paths + their data flow), break a
behavior pinned by tests, or weaken a gate.

Port every shell-level fix you make (kit primitives, motion layer,
audit tweaks) back to `arqavellum` domain-neutrally in the same
window — public-repo discipline: no consumer names, no private
paths, ever.

## 7. You are visionless — this is how you see (proven recipe)

1. **Math first:** contrast matrices from hex pairs; type-ramp ratio
   checks; spacing-scale arithmetic; touch-target geometry. Run these
   BEFORE committing any token.
2. **Computed-style probes** (headless Playwright **WebKit** — Chrome
   is broken here): assert the computed face/size/weight/tracking/
   color/transform of every named token's key nodes per screen,
   against YOUR spec. Rewrite inherited assertions — they verify the
   incumbent, not you.
3. **Geometry probes:** bounding boxes — targets ≥44px, no horizontal
   overflow, primary action fully visible at 390×667 AND 390×844,
   desktop 1280×800 nothing straddles the centered column, budgets
   counted in DOM.
4. **Pixel probes** where color matters: cluster-membership over PNGs
   in pure bun, calibrated to YOUR palette (`.shots/upend6/` and
   `upend7/` hold worked skeletons — recalibrate, don't reuse
   clusters).
5. **The harness:** `.shots/fit-walk.ts` walks every screen against
   :8081 with the Supabase layer network-mocked; its `installMocks`/
   `makeContext`/`signIn`/`goto` are exported for your probes. One
   mode per invocation (light, then dark, then SE). Dark mode: seed
   `localStorage['arqavellum:color-scheme']='dark'` via
   `addInitScript`; do NOT also set the context colorScheme.
6. **Known truths:** RN-web Text is `div[dir=auto]`; Pressable with
   `accessibilityRole="button"` renders a real `<button>` — never
   nest buttons; `document.fonts.check(...)` proves a face landed;
   Metro misses edits sometimes — `touch` changed files and re-run; a
   surprising FAIL is often a stale bundle. **Captures are evidence
   for the owner, never verification for you.**

## 8. Working method

1. **Baseline FIRST**, before any edit: capture light + dark + SE
   into `.shots/<your-dir>/before/` — the only true before you get.
2. **Thesis before code**, as a doc under `docs/architecture/`, its
   own commit + push: the point of view in one paragraph; the type
   ramp with its ratios; the spacing scale; the surface/elevation
   language; the color law with the computed contrast matrix; the
   motion contracts (reduced-motion included); the per-screen
   hierarchy map (focal → second → quiet); your budgets and how each
   is probed. Mark `gauge-thesis.md` retired with a succession note.
3. **Tokens → kit → showcase → screens.** Rebuild `theme.ts`, the
   kit, and the showcase; gate + commit + push BEFORE touching
   screens. Then screens one at a time (the Floor last — it is the
   flagship and the hardest). No mega-commits.
4. **Gate on the working tree before staging**
   (`cd armandotfit && bun run lint:structure && bunx tsc --noEmit`),
   `bun run test:run` at code milestones, commit, then push as a
   SEPARATE command. Never chain `git commit && git push`. Verify
   `git status` scope before every push; never commit captures,
   probes, scratch, or handoffs.
5. **Prove UX-affecting work in the browser**; re-assert 490px and
   the desktop column after any layout-affecting change.
6. **Update the law with the change:** CLAUDE.md invariant 3 becomes
   YOUR system; the OWNERSHIP row; the doc-maintenance table.
7. **Close** with: thesis paragraph, per-screen inventory, commits
   (both repos), test-count delta with reasons, a before/after
   changed-region heat report, and an explicit list of what only the
   owner's eyes can confirm.

## 9. Stop and ask when

A dependency seems needed · a schema change seems needed · you want
to weaken a gate instead of fixing code · anything would break auth
or PWA plumbing · a change would alter logged data or its meaning ·
you want to apply anything to the live Supabase project.

## 10. Refuse these failure modes

Reverence for THE GAUGE — especially its cleverest parts. Inheriting
a probe assertion without rewriting it to your spec. Decoration you
cannot verify by assertion. Relaxing contrast to hit a vibe. Deleting
tests to pass. Mega-commits. Presenting captures as verification.
Endless polish instead of thesis → tokens → kit → screens. Motion
that delays a tap — the logger is tappable at frame 1, forever.
Breaking the spine to reach the surface.

*The app works. Make it beautiful by argument — every choice either
computes or it's gone. Leave the owner a better thesis than the one
you inherited.*
