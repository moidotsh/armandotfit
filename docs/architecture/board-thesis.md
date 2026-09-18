# THE BOARD — the training whiteboard

> The sixth upending (2026-12). This document is the compass: the point
> of view, the pillars, the drawn-figure language, the type ramp, the
> color law with its computed contrast matrix, the motion and
> scroll-choreography contracts, and the per-screen map with its
> budgets and measurement spec. `constants/theme.ts`, the
> MobilePremium kit, and the routes build to THIS doc. It supersedes
> `quiet-page-thesis.md` (retired with thanks — whatever survives below
> survives on its own argument, not THE QUIET PAGE's authority), which
> superseded `signal-thesis.md` before it.

## 1. The point of view

Every gym in the world carries the same three marks: the whiteboard
with the day's program written on it, the tally crossed off set by
set, and the colored plate loaded on the bar. THE BOARD makes the app
speak that notation. **Quantities are drawn, not written.** Every load
renders as a plate stack — IWF-hued slabs whose total length IS the
load; every set count renders as tally gates; digits survive only at
the two seams where precision is the point (the thumb's edit field,
the ledger's audit row). The page itself is one flat board per mode —
the white board in daylight, the chalkboard at night — with no cards
and no shadows except the app's single physical object, the docked
logger. Color has exactly two jobs: the plate ramp encodes load, and
one record-orange marks personal bests, links, and the living pulse.
Everything else is ink, and the verb is the heaviest ink on the page.

Why drawn beats written HERE: mid-set, at arm's length, under glare,
reading digits is cognitive work and reading color+length is
preattentive. You do not read "100" — you see two reds and a green,
and after a week in this app the plate code reads like a traffic
light. The picture is also honest to the domain: lifters already read
plates, tallies, and boards; three redesigns proved the words
(hierarchy, budgets, the pre-armed one-tap log) — this one proves the
gym's own figures were the better alphabet all along.

The retention test carries over unchanged from THE QUIET PAGE and
stays law: an element stays only if it answers the screen's one
question or offers its one action. Drawn figures do not add elements —
they replace written ones (a plate stack replaces a digit-pair at
focal scale; a tally replaces a set-list).

## 2. The pillars

1. **QUANTITIES ARE DRAWN.** Load → plate stack (§4); set counts →
   tally gates (§4.3). Digits appear ONLY (a) inside the armed
   logger's editable figures, (b) in ledger rows at row scale, (c) in
   computed summary lines (dates, streaks) where the figure IS the
   content. No focal-scale digits anywhere else.
2. **ONE BOARD, NOT CARDS.** A single flat field per mode. Sections
   are ruled ON the board: THE BOARD block (the day's plan, the
   session map) is framed by a 2px ink rule pair; everything else
   breathes in air with at most three 1px hairlines per screen.
   Elevation exists in exactly two places: the docked logger (the
   one physical object) and portals (sheets/dialogs).
3. **COLOR HAS TWO JOBS.** The plate ramp encodes load; record-orange
   (the `brand` slot) marks PRs, links, and the live pulse. A screen
   with no load and no record carries ZERO hue. Status hues appear
   only in toasts and inline errors.
4. **FURNITURE SHOUTS, CONTENT SPEAKS.** The board's fixed furniture
   (verbs, labels, eyebrows, section marks) is AUTHORED IN CAPS —
   always ≤3 words, Archivo, tracked +0.8; `textContent` IS the caps
   (probed directly — no `textTransform` theater). Content (exercise
   names, notes, program titles) sets with `textTransform: none` and
   keeps its natural capitals ("Bulgarian Split Squat") — the board
   never shouts content.
5. **THE MAP IS ABOVE.** The live session is ONE scrollable document:
   the session map sits above the current station (scroll up to see
   the whole day at once — native scroll, zero JS), the station
   follows, and the logger is docked below it all, never scrolling
   away, tappable at frame 1.
6. **MOTION NEVER GATES A TAP.** Every animation is post-interactive
   (the stamp, the slide), scroll-driven (the compress, the map), or
   the shell's curtain. `prefers-reduced-motion` collapses all of it
   to static/instant and the design is complete without any of it.

## 3. Type system

### 3.1 Faces (self-hosted, OFL, one variable file each)

| Face | File | Axes | Jobs |
|---|---|---|---|
| **Archivo** | `archivo-var.woff2` (90 KB) | wght 100–900, wdth 62–125 | statements, subheads, row names, furniture caps, verb labels |
| **Archivo Cond** | same file, second `@font-face` with `font-stretch: 75%` pinned | wght | THE STATEMENT position (one per screen) |
| **Spline Sans Mono** | `spline-sans-mono-var.woff2` (36 KB) | wght 300–700 | EVERY figure: armed values, ledgers, dates, timers, eyebrows-of-figures. Mono = tabular by construction |
| System sans | — | — | body/reading text only |

The width-axis trick (shell `TypeFaces.displayCondensed`): one
download, two families; RN code never touches `fontStretch`. Proven by
ink-coverage (weight axis) and width-ratio probes; tnum proven by
"1111" ≡ "9999".

### 3.2 The ramp — six sizes, at most four per screen

| Token | Face | Size/LH | Weight | Tracking | Job |
|---|---|---|---|---|---|
| `mobileCounter` | Spline | 56/60 | 700 | −1 | THE ARMED FIGURES (logger digits) |
| `mobileTitleCondensed` | Archivo Cond | 36/40 | 800 | −0.5 | THE STATEMENT (one per screen) |
| `mobileTitle` | Archivo | 22/26 | 700 | −0.2 | the second voice (subheads) |
| `mobileItemTitle` | Archivo | 17/22 | 600 | 0 | row names |
| `mobileBody` | system | 15/22 | 400 | 0 | reading |
| `mobileEyebrow` | Spline | 12/16 | 500 | +1.2 | whisper furniture (CAPS) |

Collapses (shell key structure kept, retired ranks fold onto the
ramp): `mobileHero`/`mobileDisplay` ≡ statement; `mobileSubtitle` ≡
row name; `mobileFigure` = Spline 15/20 600 tnum (row figures);
`mobileAction` = Archivo 15/20 800 +1.2 (verb label); `mobileLedger` /
`mobileTag` = Spline 12/16 500; `mobileMeta`/`mobileFieldLabel` =
system 12/16. Second voice ≥1.4× quieter than the statement (36→22 ✓
checked: 36/22 = 1.64).

## 4. Color law

### 4.1 The two boards + the wire

| Slot | Light (white board) | Dark (chalkboard) |
|---|---|---|
| ground | `#FAFAF7` | `#101113` |
| groundDeep | `#F1F1EC` | `#0C0D0F` |
| card | `#FFFFFF` | `#17191C` |
| cardAlt | `#F4F4EF` | `#1D2023` |
| text | `#16181C` | `#F2F3F0` |
| textSecondary | `#3E4148` | `#C4C7C2` |
| textMuted | `#5C6067` | `#989B95` |
| textTertiary (decor only) | `#9A9DA3` (2.72 on card — never carries info) | `#6A6D68` |
| brand (record orange) | fill `#C24100` / text `#9A3300` / on-fill `#FFF5EC` | fill `#FF7E45` / text `#FF9E6E` / on-fill `#14110C` |

The wire (`colors.focus.*`, mode-independent, interrupts only — chit,
curtain): ground `#0A0B0C`, text `#EDE9DE`, signal `#FF8A4A`.

Both palettes are NEUTRAL (no cream cast, no blue-steel cast): the
board is the neutral ground the plates sing against.

### 4.2 The plate ramp (`colors.*.meter`)

| kg | Hue | Light | Dark | Thickness @ counter (px) | @ row (px) |
|---|---|---|---|---|---|
| 25 | red | `#C0281C` | `#E4604F` | 26 | 9 |
| 20 | blue | `#1E4FB8` | `#6C9EF2` | 22 | 7.5 |
| 15 | yellow | `#D9A62E` | `#F0C64F` | 18 | 6.5 |
| 10 | green | `#23714A` | `#4DB87E` | 14 | 5 |
| 5 | white | `#ECECE5` | `#F5F5F0` | 10 | 3.5 |
| 2.5 | red chip | `#C0281C` | `#E4604F` | 6 | 2 |
| 1.25 | steel | `#8D9299` | `#A9AEB5` | 4 | 1.5 |

- **Decomposition:** greedy over [25, 20, 15, 10, 5, 2.5, 1.25],
  total-load basis. The drawing rounds the load to the nearest 1.25;
  the digit never lies (drawing tolerance ±0.63).
- **Monotonicity law:** thickness is strictly monotone in kg (table
  above). Stack length = Σ thicknesses ⇒ monotone in load — probe it.
- **Rim law:** light-mode slabs carry a 1px ink rim (p5/p15 fail raw
  3:1 on white — the rim carries the edge at 15.0/8.0:1); dark-mode
  slabs need no rim (all ≥5.1:1 raw) and rely on 2px ground gaps.
  Gaps between slabs: 2px counter / 1px row.
- **Stack height:** 40px at counter scale, 14px at row scale, 8px at
  whisper scale (home board rows).
- A bodyweight set (weight 0) draws an empty bar sleeve — two small
  ink end-caps, no slabs.

### 4.3 Tally gates

Sets render as tally marks: verticals 2px wide × 20px tall (counter),
the fifth crossing the prior four (a 45° gate). Done sets: solid ink.
The LIVE gate (the next to log): record-orange with a 2s breath
(opacity 0.65↔1, reduced-motion: static orange). Unstarted gates
within the program's ask: ink at 18% opacity. Program asks draw the
Rx minimum; extra sets append gates. Tally count == set count —
probe it.

### 4.4 The contrast matrix (computed, WCAG 2.1)

**Light — text on surfaces (AA ≥4.5 for text):**

| Token | ground | card | cardAlt |
|---|---|---|---|
| text `#16181C` | 17.00 | 17.77 | 16.11 |
| secondary `#3E4148` | 9.77 | 10.22 | 9.26 |
| muted `#5C6067` | 6.04 | 6.32 | 5.73 |
| brandText `#9A3300` | 7.05 | 7.37 | 6.68 |

onBrand `#FFF5EC` on brand fill `#C24100`: **4.82** ✓ · verb label
`#FAFAF7` on ink verb `#16181C`: **17.00** ✓

**Dark — text on surfaces:**

| Token | ground | card | cardAlt |
|---|---|---|---|
| text `#F2F3F0` | 16.96 | 15.81 | 14.69 |
| secondary `#C4C7C2` | 11.06 | 10.31 | 9.58 |
| muted `#989B95` | 6.71 | 6.26 | 5.81 |
| brandText `#FF9E6E` | 9.33 | 8.70 | 8.08 |

onBrand `#14110C` on brand fill `#FF7E45`: **7.46** ✓

**Plate ramp as graphical objects (1.4.11, ≥3:1 via length + rim):**
light p25 5.64, p20 7.01, p10 5.69, p125 3.00 vs ground — pass raw;
p15 2.13 and p5 1.13 fail raw and are carried by the mandatory ink
rim (7.99 / 14.98 vs the slab fill). Dark: all six ≥5.10 raw. Wire:
text 16.24, signal 8.43. Status (carried, measured): light
success 5.33 / error 6.54 on card; dark 8.36 / 6.76.

### 4.5 Record-orange's three appearances

The brand hue appears exactly as: (1) the RECORD mark — PR rows, the
streak number, today's outline in the consistency grid; (2) links and
selection tints; (3) the LIVING pulse — the live tally gate, the
ticker's breathing dot. The verb does NOT use it (the verb is ink —
pillar 2's heaviest mark).

## 5. Surface, shapes, spacing

- **Shapes:** surface 0 (butt joints — the board is one piece), sheet
  14, control 10, tile 6, tag 4. No pills anywhere.
- **Spacing scale:** {4, 8, 12, 16, 24, 32, 48}. Gutter 20 (the 350px
  column). Block gap 32 between a screen's major sections. Statement
  halo: 24 clear below the statement before any second voice.
- **THE BOARD rule pair:** the framed block (home's today-plan, the
  session map) carries borderTopWidth/borderBottomWidth 2 in ink.
- **Elevation:** flat everywhere; `mobilePremium.instrumentShadow`
  (new token, ported to the shell) lifts ONLY the docked logger;
  portals use the sheet's existing lift.
- **Element budgets (probe-enforced):** ≤1 statement, ≤4 sizes, ≤4
  text colors, ≤3 hairlines + at most one 2px rule pair, interactive
  elements ≤10 per screen (Floor ≤14 — it is the instrument).

## 6. Motion + scroll choreography

| Id | Name | What | Trigger | Duration | Law |
|---|---|---|---|---|---|
| M1 | THE STAMP | a logged set's tally gate stamps in (scale 0.6→1 + the ledger row settle) | post-interactive (LOG tap) | 110ms | transform-only, never gates the next tap |
| M2 | THE SLIDE | a plate slab slides onto the bar end when a stepper changes weight | post-interactive | 90ms | translateX only |
| M3 | THE COMPRESS | a Desk statement compresses under scroll into a 48px pinned bar carrying the page's live figure (mono) | scroll-linked (Animated.event) | scrubbed | transform/opacity only; the pinned bar is `stickyHeaderIndices` (real sticky, no JS pinning); collapses to static under reduced motion |
| M4 | THE MAP | the session map lives above the station in the same ScrollView — pull up to read the whole day | native scroll | — | zero JS; nothing animated |
| M5 | THE CURTAIN | the shell's ink route curtain | navigation | shell | unchanged machinery |

Contracts: (a) transform/opacity only, no layout properties, 60fps;
(b) `prefers-reduced-motion` → M1/M2/M3/M5 instant+static, M4
unaffected (it IS scroll); (c) DOM-test/jsdom-safe — web-only guards,
static fallbacks; (d) no choreography ever delays a tap or keystroke —
the logger is tappable at frame 1.

## 7. The per-screen map

Vocabulary carried over (function names, not taste): the **Floor** =
the live session; the **Desk** = reference pages. Routes are the
contract (§0) — every screen below keeps its route, data flow, and
test surface; only the presentation rebuilds.

### `/` home — THE FRONT OF THE BOARD
Question: "what am I walking into today?" Focal: the day's TITLE
(statement, sentence case) with the window whisper (AM/PM) above it
in record-orange furniture caps. Second: **THE BOARD** — the day's
plan as 4 air-rows (name · Rx whisper · plate stack mini at the
prefill weight — you SEE the session's size before you start),
framed by the 2px rule pair. Quiet: the START verb (ink, 56px),
three jump rows (Program / Library / Progress, each with its one
mono caption — the streak lives on Progress), recent sessions as
mono lines. Session live: the ticker pins under the masthead.

### `/split-selection` — THE FUNNEL
Question: "which edition?" Focal: the picked day's title restating
with every pick. Second: the seven-day measure (weekday caps + big
day-of-split figures in Spline; the pick INVERTS to the ink plate —
inversion is selection). Quiet: archetype + AM/PM segmented controls
(ink-invert selection), the plan preview as the same board rows,
GO (ink verb). 490px: GO reachable at SE (taps the footer).

### `/workout-detail` (none) — THE FLOOR (the flagship)
Question mid-set: "what's the load, and log it." Structure
top→bottom: chromeless header (‹ minimize · elapsed mono · MAP chip ·
FINISH furniture) → **THE SESSION MAP** (above the fold only by
scroll: every station as name + tally + plate mini, current station
inked) → THE STATION (name statement, TARGET whisper, SWAP/REMOVE
furniture caps) → **THE TALLY** (the program's ask drawn; done gates
stamped; live gate breathing orange) → THE LEDGER (done sets:
position figure · plate mini · reps figure; remove per row) →
NEXT-STATION whisper → docked **THE LOGGER**: plate stack (counter
scale) + `×` + reps figures (counter), steppers ±2.5 / ±1 (44px),
tap-a-figure to type, LOG SET (ink verb 56px, the app's one shadow).
Carry-forward prefill, last-tags prefill, swap bench (InkRail —
rebuilt styling, same function), add-from-library, notes + FINISH
sheet (elapsed/sets/tonnage figures + save/discard two-step) — all
function unchanged.

### `/workout-detail?id=` — THE RECEIPT
Question: "what was that?" Focal: tonnage as THE FIGURE (Spline 36
statement scale — a figure IS the statement here). Second: the fact
whisper (date · D# · window · counts). Quiet: per-exercise ledgers
(name + tags whisper + set rows with plate minis), the note, delete
(two-step, alert tone).

### `/program` — THE ROTATION
Question: "what's the program?" Focal: day 1's title (statement;
later chapters subheads). Chapters air-separated; slots as board rows
(name + Rx whisper); a standing substitution reads in record-orange
Rx. Plan-time SWAP rides the bench. M3 compress: chapter heads pin
(verified pattern) and the statement compresses to the pinned bar.

### `/exercise-database` — THE INDEX
Question: "find a lift." Focal: the search field (statement scale,
one hairline beneath — the page's spent rule). Second: **EQUIPMENT
ZONES** — the library's primary axis is the gym's geography (Barbell
/ Dumbbell / Cable / Machine / Bodyweight zones, sticky zone heads in
furniture caps); browsing = walking the floor. Quiet: recently-logged
section first when unfiltered; during a live session the custom-add
adder sits one tap open. Muscle filter chips remain (function), restyled
as furniture.

### `/exercise-detail?slug=` — THE ENTRY
Question: "what is this lift?" Focal: the NAME (statement). Second:
the number to beat (LAST top set) rendered AS A PLATE STACK + figures
(with its date) — or the type whisper when no history. Quiet:
instructions as one reading block; the muscle measure as bare ink
lines (prime movers full-height, assistants 45% height — ink only,
color is load's); equipment whisper; ADD TO SESSION (ink verb) when a
draft is live.

### `/progression` — THE RECORD BOOK
Question: "how strong, how consistent?" Focal: the streak NUMBER in
record-orange (a figure as the statement — Spline 36). Second: the
five best lifts as **the trophy wall**: name + best set drawn as plate
stacks (row scale), ranked — the wall is literally the biggest iron
you've loaded; PRs tick the record mark. Quiet: totals as one mono
line; the consistency grid links to analytics.

### `/analytics` — THE FORM TABLE
Question: "how regular?" Focal: the count ("You trained 24 of 30").
Second: **THE CONSISTENCY GRID** — day cells as tally marks (0–3+
sets = 0–3+ gates drawn small; density is the viz; today outlined in
record-orange). Quiet: weekly tonnage as ink bars (record week in
record-orange), the range pick (segmented).

### `/settings` — THE COLOPHON
Question: "how is it set?" Focal: the current theme word restating
with each pick (statement). Quiet: theme segmented (ink-invert),
rest-day measure (struck marks), install/version rows, SIGN OUT (the
one verb). Dev showcase link stays.

### `/login` `/register` `/forgot-password` — THE GATE
Question: the action sentence. Focal: "Sign in." / "Create account." /
"Reset." (statement). The board metaphor rests: plain field, form
open on it, links in record-orange, verb ink-filled. Same wordmark
masthead as home (folio scale).

### `+not-found` — THE DEAD END
Focal: "404" as the figure-statement. One line of copy, one way back.

## 8. What this thesis keeps, kills, or reworks

**Kept on its own argument** (not inheritance): stack-from-home
navigation + the session ticker (a bar costs ~60px of the 490px
budget and five destinations don't need one; home is one back-swipe
away; the ticker keeps the live session one tap from every Desk
page); the armed-set store model (draft rows exist only once logged —
hydration creates zero rows); one-statement-per-screen + the element
budget method (hierarchy math is taste-independent); the ink dialect
(flat atmosphere, chit toast, route curtain — a board IS flat);
skeleton/empty/error patterns; computed-at-read everything; SB1/SB2
width policy; the mirror trio (PWA + fonts).

**Killed:** the all-typographic expression (digits as the only
figures); the warm-cream paper and its BROADSHEET inheritance
(Rokkitt + Azeret Mono — files deleted, `@font-face`/preloads/boot
plate retimed to the boards); the CallBoard's digit-first instrument
(replaced by the plate logger); the wordmark-scale masthead debates
(the masthead shrinks to a folio whisper — the board's content is the
brand); the station-dot strip (the map + tally replace it).

**Reworked:** the Floor (map-above document + tally row + plate
logger); home's lede (the board block shows the plan AS plates); the
library (equipment zones = gym geography); swap ranking (same-zone
alternatives first — walking distance is a real rank argument — then
shared muscles, with the WHY whisper); the receipt/ledgers (plate
minis per set); progression (trophy wall); analytics (tally grid +
tonnage bars).

## 9. The measurement spec — assertions are my eyes

1. **Contrast:** the matrix in §4.4, recomputed from `theme.ts` hexes
   at probe time (the probe fails if any pair drifts below its bar).
2. **Computed-style probes** (WebKit, per screen, both modes): the
   face/size/weight/tracking/transform of every named token's key
   nodes — statements are Archivo Cond 36/800, figures are Spline
   with tabular figures, furniture is CAPS (`textTransform:
   uppercase`, `textContent` raw), body is the system stack.
3. **Geometry:** every interactive box ≥44px; the primary verb fully
   visible at 390×667 AND 390×844; desktop 1280×800 — nothing
   straddles the centered 350px column; the statement's halo ≥24.
4. **The drawn-figure laws:** slab count × map = load within ±0.63;
   stack length strictly monotone in load (probe a sweep 20…200);
   slab fills ∈ the ramp hexes (cluster-calibrated pixel probes: red
   b≪r, blue b≫r, yellow r≫b, green g≫r≈b, near-neutral boards);
   tally gate count == set count; the live gate is the only orange
   pixel mass on the Floor.
5. **Motion:** M1/M2 land post-interactive (tap→state flip is
   synchronous in DOM); M3 changes computed transform with scroll and
   pins a real sticky head; everything static under
   `prefers-reduced-motion`; M4 needs no JS (scroll position alone
   reveals the map — assert map top < 0 before scroll).
6. **Budgets:** per-route element caps (§5) counted in DOM.

## 0. Not design territory (restated)

The data spine (five tables, immutable history, computed-at-read,
tags-not-columns, the program in TS), the route contract, the auth
guard, PWA plumbing, the accessibility floor, the audits, the 490px
law, and the shell sync (arqavellum keeps its own values; structure
ports both ways — the `meter` ramp, `instrumentShadow`, and any kit
fix land in the shell domain-neutrally in the same window).
