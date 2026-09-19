# THE SCOREBOARD — numerals you read across the room

> The eighth upending (2027-01). This document is the compass: the
> point of view, the pillars, the type law, the color law with its
> computed contrast matrix, the material law, the still-motion
> contract, the rest instrument, and the per-screen map with its
> budgets and measurement spec. `constants/theme.ts`,
> `constants/scoreboard.ts`, the MobilePremium kit, and the routes
> build to THIS doc. It supersedes `gauge-thesis.md` (retired with
> thanks — whatever survives below survives on its own argument, not
> THE GAUGE's authority). The succession: logbook → signal → count →
> broadsheet → quiet page → board → gauge → **scoreboard**.

## 1. The point of view

Every gym solved mid-set legibility a century before apps, and the
answer was not the machines — it is the scoreboard on the wall: huge
fixed numerals, small printed names, a clock that matters, red for
what counts. THE SCOREBOARD makes the app that wall. **Every quantity
in this app is a printed tabular numeral** — no rails, no wheels, no
tiles, no pips, no panels: recognition beats interpretation at arm's
length, and a numeral you expect reads in one fixation while a scale
asks for a ratio judgment. The material is one ground per mode and
the ink on it; structure is **rules and air**, not boxes; exactly one
hue — **red ink** — marks records, links, and the live pulse; and
**nothing moves** — the route curtain and the press state are the
app's only motions. Type is the entire interface: one grotesk for
words, one mono for every figure, a four-size harmonic ramp where
every size divides the counter. The owner's drift — less content,
smaller surfaces, one field, a minimal player — is the
specification, and the scoreboard answers it by deletion: **what can
be a line is never a panel; what can be a number is never a drawing;
what can be silence is never a label.**

Why numerals beat THE GAUGE's instruments HERE: the pin rail, the
odometer, and the flip tile all ENCODE — position, rotation, flip
state — and encoding asks interpretation. Mid-set the task is
CONFIRM ("is the pin where I expect?") and then RECORD; a printed
`62.5 × 8` states the answer with zero decoding, at a size readable
across the room, in a face whose digits never reflow. Compare tasks
(comparing is where drawings earn their keep) live on the Desk, where
aligned tabular lines beat bars for exact lookup. The odometer's
140 ms roll and the tile's 110 ms flip are motion spent during the
exact glance that matters; a numeral that swaps instantly has no
such cost. And the panel — enamel on concrete, radius 2, hairline
steel edge — is chrome around content; a rule under a line does the
same job for free. The gauge was the best instrument in the room;
the scoreboard removes the instrument and prints the reading.

The retention test carries over unchanged and stays law: an element
stays only if it answers the screen's one question or offers its one
action.

## 2. The pillars

1. **THE NUMERAL IS THE FIGURE.** Every load, rep, count, date,
   clock, and total renders as a tabular numeral in the mono face —
   at 72 (the armed expression, the streak), 36 (statement figures),
   18 (row figures), or 12 (whisper figures). Nothing is drawn:
   no rails, no pips, no tiles, no plate stacks, no tallies, no bars.
   Where magnitude must compare, numerals align in columns (the
   register line) — tables beat approximations for exact lookup.
2. **ONE GROUND, RULES AND AIR.** One surface color per mode; a
   "card" is the ground plus a 1px rule (radius 0 everywhere). The
   rule budget: ≤3 hairlines + at most one 2px rule per screen (the
   logger's dock edge usually spends it). **Zero shadows** — nothing
   in the app is lifted; `instrumentShadow` is retired to `none`.
3. **ONE RED INK.** Red marks exactly three things: the RECORD (PRs,
   the streak, the record week, today in the grid), LINKS/selection,
   and the LIVE pulse (the rest countdown while it runs, the live
   armed expression's field rule). The verb does NOT use it — the
   verb is ink. A screen with no record and no live state carries
   ZERO hue.
4. **FURNITURE IS PRINTED CAPS; CONTENT SPEAKS.** Fixed furniture
   (verbs, labels, the window, section marks) is authored in CAPS,
   ≤3 words, mono 12, tracked; content (exercise names, notes,
   program titles) sets sentence case in the grotesk.
5. **THE ONE-FIELD LAW.** The logger arms ONE value at a time. The
   armed expression reads `62.5 × 8` at figure scale; the armed field
   wears the 2px ink underline; one shared stepper pair (− 2.5 +)
   steps the armed field; tapping a field arms it (or opens the
   keyboard). Two fields, one armed instrument, one verb.
6. **THE STILL SYSTEM.** No proprietary content motion. Value
   changes, status changes, and list changes paint instantly. The
   only motions in the app: the shell route curtain, press-state
   opacity, and the sheet slide. Time-driven figures never animate
   (the clock and rest tick by swapping, not moving).
   `prefers-reduced-motion` collapses the curtain and the sheet —
   everything else is already still, so the contract is provable by
   counting animations (there are none to reduce).
7. **MOTION NEVER GATES A TAP.** (Unchanged law.) The logger is
   tappable at frame 1, forever.

## 3. The type law

### 3.1 Faces (self-hosted OFL, one variable file each — two total)

| Face | File | Axes | Jobs |
|---|---|---|---|
| **Space Grotesk** | `space-grotesk-var.woff2` (22 KB) | wght 300–700 | THE STATEMENT, subheads, row names, content, verb labels |
| **Martian Mono** | `martian-mono-var.woff2` (37 KB) | wght 100–800, wdth | EVERY figure at every scale; furniture caps |
| System sans | — | — | long reading text only (instructions, notes) |

No condensed second family, no width-axis tricks — one file, one
family, one job each. Space Grotesk's plain-spoken grotesk caps and
confident display weights speak the scoreboard's words; Martian's
hardware register keeps the digits. The width-axis trick retires
with THE GAUGE (it was its cleverest part).

### 3.2 THE HARMONIC RAMP — four sizes, at most three per screen

| Token | Face | Size/LH | Weight | Tracking | Job |
|---|---|---|---|---|---|
| `mobileCounter` | Martian | 72/78 | 700 | −1.5 | THE ARMED EXPRESSION, the streak |
| `mobileTitleCondensed` (+`Hero`/`Display`) | Space Grotesk | 36/42 | 700 | −0.5 | THE STATEMENT (one per screen); statement-figures also ride here in mono |
| `mobileTitle` | Space Grotesk | 18/24 | 600 | 0 | the second voice, row names |
| `mobileEyebrow` | Martian | 12/18 | 500 | +0.8 | printed furniture (CAPS), whisper figures |

The arithmetic (asserted, not hoped):

- **Every size divides 72**: {72, 36, 18, 12} = 72 × {1, ½, ¼, ⅙} —
  a harmonic ramp; adjacent ranks ≥1.33 apart, no ad-hoc sizes.
- **The line-height law: LH = size + 6, everywhere** (18, 24, 42, 78).
- **Second voice ≥1.4× quieter than the statement**: 36/18 = **2.0**
  (the strongest separation any thesis shipped).
- **≤3 distinct text sizes per screen** (+ the counter where the
  screen's question is a quantity), counted in DOM.
- Retired ranks collapse onto the ramp (shell keys stay): body/rows
  18, meta/whispers 12, row figures 18 mono, ledger lines 12 mono.

### 3.3 Tabular by construction

Every figure sets in the mono face — tabular for free, no reflow when
`9→10`, `99→100`. Platform-sans figures are banned except inside
long reading text. `fontVariant: ['tabular-nums']` rides the tokens
as a belt-and-suspenders assert.

## 4. The color law

### 4.1 The two rooms

| Slot | Light (THE PRINTED CARD) | Dark (THE UNLIT BOARD) |
|---|---|---|
| ground | `#F4F2EE` | `#161412` |
| groundDeep | `#EAE7E1` | `#100F0D` |
| card (= ground + rule) | `#F4F2EE` | `#161412` |
| cardAlt (sheets, inputs) | `#ECE9E4` | `#1E1B18` |
| text (ink/chalk) | `#1B1916` | `#EDEAE4` |
| textSecondary | `#4C4841` | `#C6C1B8` |
| textMuted | `#6B665D` | `#978F85` |
| textTertiary (decor only) | `#9B958A` | `#6E675E` |
| red (fill / text / on-fill) | `#BE2B20` / `#A8241B` / `#F9F1EC` | `#FF6B5E` / `#FF8577` / `#1A0E0C` |
| verb fill / label | `#1B1916` / `#F4F2EE` | `#EDEAE4` / `#161412` |

Both palettes are WARM-neutral — the printed card, not the concrete
wall (every predecessor ran cool or pure white; warmth is the
material signature of this succession). The wire (`colors.focus.*`,
mode-independent interrupt register for the chit and the curtain)
keeps its near-black plate.

### 4.2 The zone ramp (`colors.*.meter`)

Unchanged from THE GAUGE — the zone ramp is DATA ENCODING (the gym's
geography), not identity, and the succession does not repaint the
map: barbell oxide / dumbbell brass / cable blue / machine green /
bodyweight violet / steel. All pass ≥3:1 graphical on both grounds
(matrix below). It colors the library's zone lines and the swap
bench's ranks only.

### 4.3 The computed contrast matrix (`.shots/upend8/math-scoreboard.ts`)

**Light — text on surfaces (AA ≥4.5):**

| Token | ground `#F4F2EE` | cardAlt `#ECE9E4` |
|---|---|---|
| ink `#1B1916` | 15.69 | 14.49 |
| secondary `#4C4841` | 8.13 | 7.51 |
| muted `#6B665D` | 5.10 | 4.71 |
| redText `#A8241B` | 6.40 | 5.91 |

onRed `#F9F1EC` on red fill `#BE2B20`: **5.29** ✓ · verb label
`#F4F2EE` on ink verb `#1B1916`: **15.69** ✓ · status as text on
ground: success 5.79 / warning 5.51 / error 5.85 / info 5.27 ✓ ·
zones as graphical (≥3:1): 5.88 / 4.43 / 5.89 / 5.73 / 5.97 / 3.35 ✓

**Dark — text on surfaces:**

| Token | ground `#161412` | cardAlt `#1E1B18` |
|---|---|---|
| chalk `#EDEAE4` | 15.30 | 14.28 |
| secondary `#C6C1B8` | 10.26 | 9.57 |
| muted `#978F85` | 5.76 | 5.37 |
| redText `#FF8577` | 7.76 | 7.24 |

onRed `#1A0E0C` on red fill `#FF6B5E`: **6.76** ✓ · verb label
`#161412` on chalk verb `#EDEAE4`: **15.30** ✓ · status on ground:
8.72 / 9.66 / 7.05 / 7.88 ✓ · zones graphical: 5.32 / 9.46 / 6.83 /
7.41 / 6.91 / 8.09 ✓

Every pair recomputes from `theme.ts` hexes at probe time; any drift
below its bar fails the probe.

### 4.4 The unit law (unchanged)

`users.weight_unit` is a DISPLAY preference: storage stays kg,
conversion at read via `utils/weight.ts`, steppers step 2.5 kg /
5 lb, the Floor's armed values live in display units and cross into
kg at `addSetToDraft`. Numerals never convert behind the figure.

### 4.5 Red ink's three appearances

(1) The RECORD mark — PR figures, the streak number, the record
week's figure, today in the consistency grid; (2) links and
selection; (3) the LIVE pulse — the rest readout while running. The
armed expression is ink; its ARMED FIELD underline is ink too (red
is not an edit state). The verb is ink.

## 5. The material law — surface, shapes, spacing

- **Shapes: radius 0 everywhere** (`surface`, `sheet`, `control`,
  `tile`, `tag` all 0). A square cut is a decision; a rounded corner
  is a default. No pills, no machined corners.
- **Elevation: none.** `instrumentShadow` = `'none'`; the logger
  docks under the screen's one 2px rule. Portals keep the sheet's
  dim scrim (a scrim is not a shadow).
- **Spacing scale:** {4, 8, 12, 16, 24, 32, 48}. Gutter 20 (the
  350px column). Block gap 32 between a screen's major sections.
  Statement halo: 24 clear below the statement.
- **The register line:** the app's one repeating composition — name
  left, leader dots (mono `·` run, muted, 12), figure right-aligned
  mono. It replaces the panel row, the pin-rail row, and the pip
  row. One line = one entry = one fact.
- **Element budgets (probe-enforced):** ≤1 statement, ≤3 text sizes,
  ≤3 text colors, ≤3 hairlines + one 2px rule, interactives ≤9 per
  screen (Floor ≤12).

## 6. Motion — THE STILL SYSTEM

| Id | Name | What | Trigger | Law |
|---|---|---|---|---|
| S1 | THE CURTAIN | the shell's ink route curtain | navigation | shell machinery, unchanged; reduced-motion → instant |
| S2 | THE PRESS | opacity dips to 0.6 on touch | press | instant in/out; no scale, no color shift |
| S3 | THE SHEET | portal sheets slide | open/close | transform only; reduced-motion → fade/instant |

That is the whole table. **FLIP, ROLL, PIN DROP, and the compress
crossfade are retired with THE GAUGE.** Content never animates:
counters swap, ledgers prepend, boards re-weight, the clock and rest
tick — all by repaint. Probe: no content node's `transform` ever
differs from `none` across a value change; `Animation` imports exist
only in the curtain/sheet machinery.

## 7. The rest instrument (behavior kept, chrome reduced)

Hypertrophy lives on rest intervals. After every LOG SET the rest
countdown runs: default 90 s (persisted UI preference, the Settings
row), ±15 steppers, tap the readout to dismiss, auto-settle at 0.
It reads in ONE place — the logger's rest line, `REST 1:30` in mono,
**red while running, muted when settled** (red is the live pulse;
motion is not required to read as live). The pinned strip's copy of
the readout is deleted (the strip is deleted; the logger never
scrolls away). Nothing joins the schema.

## 8. The per-screen map

Vocabulary carried over (function names, not taste): the **Floor** =
the live session; the **Desk** = reference pages; the **ticker** =
the Desk's live-session strip. Routes are the contract — every
screen keeps its route, data flow, and test surface; only the
presentation rebuilds.

### `/` home — THE CONCIERGE
Question: "what am I walking into today?" Focal: the day's TITLE
(statement, sentence case) under the window whisper (AM/PM, printed
caps). Second: **THE DAY REGISTER** — the day's plan as register
lines (name · leader · prefill weight figure), wearing the screen's
2px rule. Quiet: the START verb (ink, 56), three jump rows
(Program / Library / Progress — the streak figure lives on
Progress), recent sessions as mono lines. Session live: the ticker
pins under the folio (mode-following, behavior unchanged).

### `/split-selection` — THE SELECTOR
Question: "which edition?" Focal: the picked day's title restating
with every pick. Second: the seven-day rail (printed day numerals;
the pick inverts to the ink plate — inversion is selection) and the
AM/PM two-way switch (same inversion). Quiet: the archetype
segmented control, the plan preview as register lines, GO (ink
verb). 490px: GO reachable at SE.

### `/workout-detail` (none) — THE FLOOR (the flagship)
Question mid-set: "what's the load, and log it." Top→bottom:
chromeless header (‹ minimize · elapsed mono clock · MAP chip ·
FINISH furniture) → **THE SESSION BOARD** (every station as a
register line: name + done-count figure right-aligned; the current
row sets bold ink; rows with no sets yet carry no figure; position
IS the order — NOW/NEXT/DONE words are deleted) → THE STATION (name
statement, TARGET whisper, SWAP/REMOVE furniture) → **THE COUNT**
(`2/4` mono figure — done sets over the program's ask; replaces the
pip groups) → THE LEDGER (done sets as register lines: `1 · 62.5 ×
8`, remove per row) → NEXT-STATION whisper → docked **THE LOGGER**
(pillar 5): the armed expression `62.5 × 8` at 72 mono — weight and
reps both figures, the armed field underlined 2px ink — one shared
stepper pair beneath stepping the armed field (− 2.5 / + for the
armed weight, − 1 / + for the armed reps; tap a field to arm it,
tap again to type), the rest line, LOG SET (ink verb 56, full
width). Carry-forward prefill, last-tags prefill, swap bench
(zone-ranked, function unchanged), add-from-library, notes + FINISH
sheet — all function unchanged. The pinned strip is deleted: the
logger never scrolls away, and it carries the rest.

### `/workout-detail?id=` — THE RECEIPT
Question: "what was that?" Focal: tonnage as THE FIGURE (mono 36 —
a figure IS the statement here). Second: the fact whisper (date ·
D# · window · counts) as one mono line. Quiet: per-exercise ledgers
as register lines + tags whisper, the note, delete (two-step, alert
tone).

### `/program` — THE TIMETABLE
Question: "what's the program?" Focal: day 1's title (statement;
later chapters subheads). Chapters air-separated; slots as register
lines (name · leader · Rx figure); a standing substitution reads in
red Rx. Plan-time SWAP rides the bench. (The chapter-head pin
retires — chapters are short; the page is one scroll.)

### `/exercise-database` — THE DIRECTORY
Question: "find a lift." Focal: the search field (statement scale,
one hairline beneath — the page's spent rule). Second: ZONE LINES —
sticky zone heads in zone-hued furniture caps (the gym's geography,
unchanged function). Quiet: recently-logged first when unfiltered;
rows as register lines (name · last figure); muscle filter chips
square-cut, function unchanged; the adder one tap open during a
live session.

### `/exercise-detail?slug=` — THE SPEC SHEET
Question: "what is this lift?" Focal: the NAME (statement). Second:
the number to beat — LAST top set as the register line (weight ×
reps figures + its date), or the type whisper when no history.
Quiet: instructions as one reading block (18); the muscle measure
as two text lines (prime movers / assistants — the ink bars are
deleted; names carry it); equipment whisper; ADD TO SESSION (ink
verb) when a draft is live.

### `/progression` — THE RECORDS
Question: "how strong, how consistent?" Focal: the streak NUMBER —
mono 72 in red (the record mark IS the statement). Second: **THE
BESTS** — the five best lifts as register lines (name · leader ·
`62.5 × 8` in redText figures with its date) — the highest you've
printed. Quiet: totals as one mono line; the consistency grid link.

### `/analytics` — THE LEDGER
Question: "how regular?" Focal: the count ("You trained 24 of 30" —
the figure statement). Second: **THE REGISTER GRID** — day cells as
mono 12 characters: the day's set count (blank = no session), today
in red, rest days `·`; seven columns, tabular by construction —
density reads as digits, the punch rings are deleted. Quiet: weekly
tonnage as register lines (record week's figure in red), the range
pick (segmented).

### `/settings` — THE PANEL
Question: "how is it set?" Focal: the current theme word restating
with each pick (statement). Quiet: theme segmented (ink-invert),
the rest-interval row (mono figures, ±15), rest-day marks, weight
unit, install/version rows, SIGN OUT (the one verb). Dev showcase
link stays.

### `/login` `/register` `/forgot-password` — THE GATE
Question: the action sentence. Focal: "Sign in." / "Create
account." / "Reset." (statement). Plain field on the ground, form
open on it, links in red, verb ink-filled. Same folio masthead as
home.

### `+not-found` — THE DEAD END
Focal: "404" as the figure-statement. One line of copy, one way
back.

### THE MUSIC SURFACE — REMOVED (2027-01, the owner's call)
The hidden player, the sheet, the picks list, and their store/
service/utils are deleted; the `music_picks` table remains in the
schema untouched. The register treatment sketched below never shipped
— kept as the record of the decision: one input taking anything, a
minimal player, register lines, the playing row in red.

## 9. What this thesis keeps, kills, or reworks

**Kept on its own argument:** stack-from-home navigation + the
session ticker; the armed-set store model (draft rows exist only
once logged); one-statement-per-screen + the budget method (tightened:
3/3/9 vs 4/4/10); caps-furniture / sentence-case content; the ink
dialect (flat atmosphere, chit toast, route curtain); one-document
Floor with the board above the station and the logger docked;
skeleton/empty/error patterns (skeletons go STATIC — no pulse);
computed-at-read everything; the weight-unit law; SB1/SB2 width
policy; the mirror trio (PWA + fonts); one-tap pre-armed logging
with carry-forward; the rest countdown BEHAVIOR; the zone ramp as
data encoding.

**Killed:** THE GAUGE's entire figure language — the pin rail (+
its auto-range law and probes), the rolling counters/odometer, the
flip tiles, the set pips, the gauge wall, the punch rings, the
muscle ink bars, the trajectory chart's drawn line; the enamel
material (panels, radius 2, steel hairline edges); the mechanical
motion family (FLIP/ROLL/PIN DROP) and the compress crossfade +
pinned strip; Instrument Sans + the Cond width trick (file deleted);
the 2px instrument face on the day panel (the day register's 2px
rule replaces it); status words NOW/NEXT/DONE·n (position and
figures carry it).

**Reworked:** the load figure (rail → the numeral at its rank); the
set figure (pips → the `2/4` count figure); the logger (two counter
instruments + rail + two stepper rows → ONE armed expression + one
stepper pair); the ledger (rail rows → register lines); the board
(tile rows → register lines); home's day block (panel skyline → the
day register); progression (gauge wall → the bests register);
analytics (punch rings → the register grid); consistency (rings →
digits); the boot plate (concrete + orange rule → card + red rule).

## 10. The measurement spec — assertions are my eyes

1. **Contrast:** the §4.3 matrix recomputed from `theme.ts` hexes at
   probe time; any pair below its bar fails.
2. **The ramp:** every `typography` token's size ∈ {12, 18, 36, 72}
   and divides 72; LH = size + 6 on every token; per-screen DOM
   count of distinct `fontSize` ≤3 text sizes (counter excluded where
   the screen's question is a quantity); statement/second = 2.0.
3. **Computed-style probes** (WebKit, per screen, both modes): face/
   size/weight/tracking of every named token's key nodes — statements
   Space Grotesk 36/700, figures Martian tabular, furniture CAPS at
   12/+0.8 mono, body the system stack; `document.fonts.check('700
   36px "Space Grotesk"')` proves the face landed.
4. **Geometry:** every interactive box ≥44px; the primary verb fully
   visible at 390×667 AND 390×844; desktop 1280×800 — nothing
   straddles the centered 350px column; statement halo ≥24; register
   figures right-align within 1px of the column's figure edge
   (tabularity proves alignment).
5. **The still law:** across a stepper change, a log, and a clock
   tick, no content node's computed `transform` differs from `none`;
   no `Animation` import outside curtain/sheet machinery.
6. **The one-field law:** exactly one armed field (probe
   `data-armed` uniqueness); the stepper pair steps the armed field
   by ITS step; LOG commits both values.
7. **The count law:** the count figure's numerator == logged sets,
   denominator == max(target, logged+1); ledger line count == logged
   sets; every ledger figure parses from the DOM.
8. **The rest instrument:** starts at LOG (readout appears nonzero);
   ±15 changes it; dismiss clears; settle at 0 mutes — all in DOM.
9. **Budgets:** per-route caps (§5) counted in DOM — sizes, colors,
   hairlines, interactives.
10. **Red discipline:** with no record and no live state on screen,
    zero pixels of red (cluster probe); the verb never red.

## 0. Not design territory (restated)

The data spine (six tables, immutable history, computed-at-read,
tags-not-columns, the program in TS, kg storage), the route
contract, the auth guard, PWA plumbing, the accessibility floor, the
13 audits, the 490px law, and the shell sync (arqavellum keeps its
own values; structure ports both ways — any kit fix lands in the
shell domain-neutrally in the same window).
