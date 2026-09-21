# HANDOFF — THE TWELFTH PASS (the second with eyes)

> To: the next vision model taking design authority over armandotfit.
> From: the eleventh pass (THE SIGHT AMENDMENT), which looked first,
> amended, and is now fully landed at `ab5dd35ca`.
> You hold **total design authority over presentation** — typography,
> hierarchy, balance, minimalism, theme, composition. In that order of
> importance.

## The prime directive

**Presentation only.** No behavior changes, no new features, no
store/service/hook logic, no schema, no migrations, no route contract
changes. If a change needs a behavior change to make sense, write it
down as a proposal for the owner and move on. The accessibility floor,
the 490px law, and the auth guard are presentation-adjacent and
load-bearing — strengthen, never weaken.

## What you inherit

- **THE INTERVAL** (the tenth upending) — the live figure owns the
  counter; ink is state; one red ink; the leaderless ruled row; the
  harmonic ramp {12, 18, 36, 72}; the square cut; the still system +
  the re-weight; the one-field logger; the two-state rest instrument.
- **THE SIGHT AMENDMENT** (the eleventh pass, revision 2027-02) — the
  first pass written with eyes. Its deltas are all landed, its probes
  all green. It includes one **withdrawn delta** (the "footer slab"
  that pixel-sampling proved never existed) — read that correction
  before you trust any finding, including your own.
- **The eyes are now arithmetic.** `.shots/fit-walk.ts` runs 16 optical
  probes per mode (figure truncation, counter face, board ink-is-state,
  red ration ≤3, sheet square cut, receipt fact line, footer ground,
  search focus style, the re-weight in both directions) plus the 490px
  height budget. Light and dark both 16/16 green; SE heights green.
  The after-gallery lives in `.shots/sight/after/`.

## Read before anything (in this order)

1. `armandotfit/docs/architecture/interval-thesis.md` — the whole
   thing, but especially the REVISION 2027-02 block at the top (the
   eleven deltas + the LANDING CORRECTIONS) and §10 (the measurement
   spec — assertions are eyes).
2. `armandotfit/CLAUDE.md` — invariant 3 is the design law in brief
   (now including the counter's condensed width cut).
3. `.shots/sight/HEAT-REPORT.md` — what the last pass saw, where every
   finding landed, and what was kept without change.
4. `.shots/fit-walk.ts` — the probe suite you will extend.
5. `armandotfit/scripts/verify-design.ts` — the gated source-law
   subset (ramp arithmetic, square cut, the wire, contrast matrix,
   the condensed-cut gate).

## The working method (non-negotiable order)

1. **Look first.** Fresh captures into a NEW gallery (do not overwrite
   `sight/after/` — it is the comparison baseline): walk every screen,
   light + dark + SE, including the states (rest running, rest settled,
   board open, swap bench, finish dialog, empty states, 404). Use the
   vision tool on the PNGs. Read DOM truth with probes when your eye
   and the pixels disagree.
2. **Render a verdict: AMENDMENT or SUCCESSION.** Written as a revision
   block in `interval-thesis.md`, committed and pushed on its own
   BEFORE any token edits. Name deltas as numbered assertions, each
   with its probe. The three facts every change must answer: one user;
   mid-set; at arm's length.
3. **Tokens → gate → kit → screens one at a time (Floor LAST)** — each
   increment gated (`bun run lint:structure && bunx tsc --noEmit`),
   committed alone, pushed as a separate command after the commit.
   Rewrite `verify-design.ts` in the same commit as any token change.
   Never delete or weaken a gate.
4. **Probes.** Extend `fit-walk.ts` so your eyes become the next
   model's arithmetic. Every new assertion must FAIL against the
   before-gallery's state — a probe that would have passed under the
   old code proves nothing.
5. **Docs** (thesis, CLAUDE.md, design-system doc, OWNERSHIP) as their
   own commit. Then a heat report (scratch, never committed), then the
   close-out report.

## Discipline the eleventh pass paid for — keep it

- **A sight finding is a hypothesis.** The footer "slab" was a
  vignette misread that survived into a committed token change and had
  to be withdrawn. Pixel-sample the PNGs (`pngjs` is in
  `.shots/node_modules`) before editing for any finding about tone,
  seam, or alignment. DOM `getComputedStyle` and pixels can disagree
  (the atmosphere wash flattens token differences).
- **Probes must assert the property that draws.** The old search probe
  measured `outline-width: 0` and PASSed while WebKit's UA ring
  rendered — the ring comes from `outline-style: auto`. Assert the
  style, not the width.
- **Metro serves stale modules silently.** After editing files, verify
  the served bundle carries a marker (curl the module bundle and grep
  for your new comment string), pixel-sample the shot, and if stale:
  touch the files, then kill and restart the dev server. Restarting
  needs `HOME` redirected into the scratch dir (`~/.expo` is unwritable
  under the sandbox) — see the command block below.
- **The 490px law is a deletion discipline, not a squeeze.** When an
  addition pushes the primary action off the SE fold, delete the
  redundant segment (the picker's fact lost its lift count — the plan
  register below IS the count). Never shave air to fit.
- **Red is rationed ≤3 text marks per screen** and the verb never wears
  brand red. Alert red on a destructive verb (DISCARD/DELETE SESSION)
  is semantics, not the brand slot — it stays.
- **The verb prints caps; content speaks sentence case.** One voice.
- **Figures never truncate; names may.** Ellipsis in a figure is a
  broken figure; ellipsis in a fact line is a lying fact (facts may
  wrap to two lines).
- **Deletion beats addition.** The amendment's best-received moves
  were removals (REST word, helper sentence, eyebrow tail, the count).

## Open country — where the twelfth pass should look first

Candidates the eleventh pass saw but did not spend its authority on.
Look, then judge — none of these are verdicts:

- **The auth screens** (login/register/forgot) — the least-seen
  surfaces; still the most generic compositions in the app.
- **The Library and program screens at depth** — their registers got
  call-site mends only; their internal hierarchy was never re-ranked.
- **Empty states** (library-empty, no-session) — do they speak the
  thesis, or do they merely apologize?
- **The ticker** (SessionStrip) — LIVE red + elapsed figure pinned
  under every Desk header; is its rank right beside each screen's own
  counter?
- **The finish dialog** — a portal sheet with its own stat trio; does
  it deserve the dock's folio discipline?
- **Dark mode's warmth** — THE UNLIT BOARD's vignette and ink steps
  were tuned blind; the light mode got more sight than dark.
- **The desktop straddle** — the mobile column on a wide window; the
  air outside the 350px column is unauthored territory.
- **Micro-states**: pressed, focused, loading, error — the press
  opacity dip is the only authored press in the app.

## Operational stack (all of it load-bearing)

- Work dir: `/Users/koba/Documents/Code/arman` (NOT a git repo — every
  git command inside `armandotfit/` or `arqavellum/`, prefixed with
  `cd /full/path && `; cwd does not persist between calls).
- Dev server: Metro on `127.0.0.1:8081`. Restart fresh:

  ```bash
  kill <pid on 8081>; cd armandotfit && \
  mkdir -p ../.shots/.tmp/home && \
  (HOME=$PWD/../.shots/.tmp/home TMPDIR=$PWD/../.shots/.tmp \
   BUN_INSTALL_CACHE_DIR=$PWD/../.shots/.tmp/bun-cache \
   nohup bun run web > /tmp/metro-fresh.log 2>&1 &); sleep 30
  ```

- Walk (one mode per invocation):

  ```bash
  cd .shots && PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers \
  TMPDIR=$PWD/.tmp FIT_OUT=$PWD/sight/<gallery> bun fit-walk.ts light
  ```

  (then `dark`, then `se`). Read PNGs with the `read_image` tool —
  the plain file read rejects binaries.
- Traps: RN-web Text is `div[dir=auto]`; synthesized taps use `onPress`
  (click, not mouseover); expo-router keeps prior screens mounted —
  scope DOM queries to the VISIBLE; dark mode via
  `addInitScript(() => localStorage.setItem('arqavellum:color-scheme',
  'dark'))`, never the context colorScheme; `page.evaluate` cannot
  close over Node helpers; auth is seeded by signing in through
  `/login` (the walk's `signIn` does this — deep links to auth-walled
  routes bounce).
- Package manager is **bun**. tmpdir writes go through the scratch
  dir (`.shots/.tmp`) — the sandbox denies system temp.

## Gates, pushes, boundaries

- Gate before staging: `cd armandotfit && bun run lint:structure &&
  bunx tsc --noEmit` (13 audits + verify-design + S6/S8). Tests:
  `bun run test:run` (678 — rewrite a DOM-shallow test's expectation
  only where presentation legitimately changed, and say so in the
  commit). Drift: `bun run check:shell-drift` — kit drift is
  rebaselined deliberately, in the commit that blesses it.
- Commits: free. Pushes: separate command, never chained onto commit;
  verify scope first (repo, branch, `git status`, diff). Never commit
  the `*HANDOFF*.md` files, `.shots/`, or the `.arqavellum*` private
  files. Migrations/remote config/destructive ops need explicit owner
  approval — for this mandate you should never be near them.
- arqavellum (public starter, `../arqavellum`): port shell-level fixes
  (MobilePremium kit, `_layout` provider stack, foundation utils)
  domain-neutrally in the same window — no consumer names, no private
  paths, no private provenance in anything public. Domain composed
  components (BoardShell, BoardHead, RegisterLine, TheLogger, Floor,
  InkRail, routes, theme values) are consumer-owned: do not port.

The thesis says §0 best: the data spine, the route contract, and the
audit corpus are not design territory. Everything else on the screen
is yours. Look first. Judge honestly. Leave the eyes sharper than you
found them.
