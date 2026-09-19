# THE GAUGE — the gym's instrument panel

> The seventh upending (2027-01). This document is the compass: the
> point of view, the pillars, the printed-figure language, the type
> ramp, the color law with its computed contrast matrix, the motion
> and scroll-choreography contracts, the rest instrument, and the
> per-screen map with its budgets and measurement spec.
> `constants/theme.ts`, the MobilePremium kit, and the routes build to
> THIS doc. It supersedes `board-thesis.md` (retired with thanks —
> whatever survives below survives on its own argument, not THE
> BOARD's authority), which superseded `quiet-page-thesis.md`, which
> superseded `signal-thesis.md` before it.

## 1. The point of view

A gym is a room full of instruments. Every machine wears a printed
enamel scale with a steel pin; the wall carries a clock; the tally
counter and the flip board are the gym's own memory. **THE GAUGE makes
the app the best instrument in the room.** The material is two-tier:
a concrete ground with machined enamel panels floating on it (a
hairline steel edge, no shadow). Loads live on **the pin rail** — a
printed tick scale with a steel pin at the working weight; more weight
reads as more engaged rail, monotone by construction, vertical so any
magnitude fits the column. Figures live on **rolling counters** —
odometer digits that roll when the user changes them. Status lives on
**flip tiles** — NOW / NEXT / DONE flip like a departure board. And
the clock is a first-class instrument: the elapsed clock runs in the
chrome, and after every logged set **the rest countdown** runs — the
one instrument no predecessor shipped and the one hypertrophy training
actually asks for. Color has two jobs: one **signal** (safety orange)
marks records, links, and the live pulse; the **zone ramp** (five
equipment hues) colors the gym's geography in the library and the swap
bench. Everything else is ink on enamel, and the verb is the heaviest
ink on the page.

Why instruments beat notation HERE: a whiteboard asks you to read; a
scale asks you to aim. Mid-set, at arm's length, under glare, the pin
on a rail and the digit on a counter are preattentive — you align the
pin the way you align the pin on a stack machine, which the hands
already know. The panel-on-concrete material reads premium without a
single shadow, and the mechanical motion family (flip / roll / pin
drop) gives the app the tactility of hardware without ever delaying a
tap. The rest clock closes the loop the elapsed clock only hinted at:
set the pin, roll the reps, log, and the panel counts your rest like a
lap timer counts recovery.

The retention test carries over unchanged and stays law: an element
stays only if it answers the screen's one question or offers its one
action.

## 2. The pillars

1. **THE PANEL IS THE SURFACE.** Concrete ground, enamel panels
   (radius 2, 1px steel hairline edge), one 2px rule budget per
   screen. Elevation exists in exactly two places: the docked logger
   (the one physical object, the system's one shadow) and portals.
2. **LOAD LIVES ON THE PIN RAIL.** Every load magnitude renders as a
   printed tick scale with the pin at the load and the engaged range
   filled. Three scales: counter (the logger's instrument, labeled),
   row (ledger/board rows), whisper (home plan rows). Vertical ⇒
   monotone by construction and magnitude-proof (no width overflow at
   any load). Digits appear ONLY (a) in the logger's editable
   counters, (b) in ledger rows at row scale, (c) where a figure IS
   the content (dates, streaks, tonnage).
3. **STATE CHANGES ARE MECHANICAL.** Three mechanical verbs only —
   THE FLIP (status tiles, rotateX, 110ms), THE ROLL (odometer digit
   columns, translateY, 140ms), THE PIN DROP (the rail pin slides,
   120ms). All post-interactive; time-driven figures (the clock)
   never animate. `prefers-reduced-motion` collapses all to instant.
4. **THE CLOCK IS AN INSTRUMENT.** Elapsed runs in the Floor chrome.
   After every LOG SET the **rest countdown** runs (default 90s,
   persisted UI preference; ±15s steppers; tap to dismiss). It reads
   on the pinned strip and above the logger. Session UI-state only —
   nothing persists, nothing joins the data spine.
5. **FURNITURE IS PRINTED CAPS; CONTENT SPEAKS.** Fixed furniture
   (verbs, labels, eyebrows, section marks) is AUTHORED IN CAPS, ≤3
   words, tracked; `textContent` IS the caps. Content (exercise
   names, notes, program titles) sets sentence-case with natural
   capitals.
6. **ONE SIGNAL.** Safety orange appears exactly as: the record mark
   (PRs, the streak, today in the grid), links and selection tints,
   and the live pulse (the rest countdown while running, the live
   set pip). The verb does NOT use it — the verb is ink. A screen
   with no record and no live state carries ZERO hue.
7. **MOTION NEVER GATES A TAP.** Every animation is post-interactive,
   scroll-linked, or the shell curtain. The logger is tappable at
   frame 1.

## 3. Type system

### 3.1 Faces (self-hosted, OFL, one variable file each)

| Face | File | Axes | Jobs |
|---|---|---|---|
| **Instrument Sans** | `instrument-sans-var.woff2` (56 KB) | wght 400–700, wdth 75–100 | statements, subheads, row names, furniture caps, verb labels, body UI |
| **Instrument Cond** | same file, second `@font-face` with `font-stretch: 75%` pinned | wght | THE STATEMENT position (one per screen) |
| **Martian Mono** | `martian-mono-var.woff2` (37 KB) | wght 100–800, wdth 75–112.5 | EVERY figure: counters, ledgers, dates, clocks, rest, eyebrows-of-figures. Mono = tabular by construction |
| System sans | — | — | long reading text only |

The width-axis trick (shell `TypeFaces.displayCondensed`): one
download, two families; RN code never touches `fontStretch`. Martian
Mono's hardware register is the point — its digits read like a
machine readout, not a typewriter.

### 3.2 The ramp — six sizes, at most four per screen

| Token | Face | Size/LH | Weight | Tracking | Job |
|---|---|---|---|---|---|
| `mobileCounter` | Martian | 56/60 | 700 | −0.5 | THE ARMED FIGURES (logger counters) |
| `mobileTitleCondensed` | Instrument Cond | 36/40 | 700 | −0.4 | THE STATEMENT (one per screen) |
| `mobileTitle` | Instrument | 21/26 | 600 | −0.2 | the second voice (subheads) |
| `mobileItemTitle` | Instrument | 17/22 | 600 | 0 | row names |
| `mobileBody` | system | 15/22 | 400 | 0 | reading |
| `mobileEyebrow` | Martian | 11/16 | 500 | +1.0 | printed furniture (CAPS) |

Collapses (shell key structure kept, retired ranks fold onto the
ramp): `mobileHero`/`mobileDisplay` ≡ statement; `mobileSubtitle` ≡
row name; `mobileFigure` = Martian 15/20 500 (row figures);
`mobileAction` = Instrument 15/20 700 +1.2 (verb label);
`mobileLedger`/`mobileTag` = Martian 12/16 500; `mobileMeta`/
`mobileFieldLabel` = system 12/16. Second voice ≥1.4× quieter than
the statement (36/21 = 1.71 ✓).

## 4. Color law

### 4.1 The two rooms + the wire

| Slot | Light (ENAMEL) | Dark (NIGHT GYM) |
|---|---|---|
| ground (concrete) | `#EBEDEA` | `#0D0F11` |
| groundDeep | `#E1E4E0` | `#080A0C` |
| panel (enamel) | `#FCFDFB` | `#171A1F` |
| panelAlt | `#F2F4F1` | `#1D2127` |
| text (ink/chalk) | `#12161A` | `#ECEFF1` |
| textSecondary | `#384049` | `#C0C7CD` |
| textMuted | `#57606A` | `#96A0A8` |
| textTertiary (decor only) | `#8A939C` (3.06 on panel — never carries info) | `#656F78` |
| signal (fill / text / on-fill) | `#C23A00` / `#9C3100` / `#FFF4EC` | `#FF8A3D` / `#FFA368` / `#140D07` |
| verb fill / label | `#12161A` / `#FCFDFB` | `#ECEFF1` / `#0D0F11` |

The wire (`colors.focus.*`, mode-independent, interrupts only — chit,
curtain): ground `#0B0D0F`, text `#ECF0F2`, signal `#FF8A3D`.

Both palettes are cool-neutral (no cream cast, no blue-steel cast).

### 4.2 The zone ramp (`colors.*.meter`)

The categorical ramp maps the gym's geography — the equipment zones —
and any categorical future use. Structure is the shell's (six steps +
rim, same keys both repos); armandotfit's values are the zones.

| Zone | Light | Dark |
|---|---|---|
| barbell (oxide red) | `#B02A1C` | `#E4604F` |
| dumbbell (brass) | `#8F6A12` | `#E0B44F` |
| cable (signal blue) | `#2559B7` | `#6C9EF2` |
| machine (enamel green) | `#256B4A` | `#4DB87E` |
| bodyweight (violet) | `#6D44B5` | `#B18CF2` |
| steel | `#7C858E` | `#A5ADB5` |

### 4.3 The pin rail

The load figure: a vertical tick column (steel ticks, major ticks
every 10 kg at counter scale), the engaged range 0→load filled ink
12%, and THE PIN — a 3px steel bar crossing the rail with a small
mono label of the load beside it (counter scale only). Scales:
counter (rail height 128, labeled majors), row (height 28), whisper
(height 20). `railMax = ceil(max(load, 50) / 25) × 25` — the rail
rescales to the day, pin position is always proportional and
monotone; probe it. A bodyweight set (≤0) draws the empty sleeve:
ticks, no fill, the pin parked at 0 with the sleeve mark.

### 4.4 The contrast matrix (computed, WCAG 2.1 — `.shots/upend7/contrast-gauge.ts`)

**Light — text on surfaces (AA ≥4.5 for text):**

| Token | ground | panel | panelAlt |
|---|---|---|---|
| text `#12161A` | 15.44 | 17.81 | 16.43 |
| secondary `#384049` | 8.93 | 10.30 | 9.50 |
| muted `#57606A` | 5.43 | 6.26 | 5.78 |
| signalText `#9C3100` | 6.25 | 7.21 | 6.65 |

onSignal `#FFF4EC` on signal fill `#C23A00`: **4.98** ✓ · verb label
`#FCFDFB` on ink verb `#12161A`: **17.81** ✓

**Dark — text on surfaces:**

| Token | ground | panel | panelAlt |
|---|---|---|---|
| text `#ECEFF1` | 16.63 | 15.10 | 14.00 |
| secondary `#C0C7CD` | 11.24 | 10.21 | 9.46 |
| muted `#96A0A8` | 7.22 | 6.55 | 6.07 |
| signalText `#FFA368` | 9.78 | 8.88 | 8.23 |

onSignal `#140D07` on signal fill `#FF8A3D`: **8.21** ✓

**Zone ramp as graphical objects (1.4.11, ≥3:1 raw):** light
barbell 5.58, dumbbell 4.21, cable 5.59, machine 5.44, bodyweight
5.67, steel 3.18 vs ground — all pass raw; ink rim vs dumbbell 3.67,
vs steel 4.85 where edges need carrying. Dark: all ≥5.05. Wire: text
16.98, signal 8.30. Status (AA as text on panel): light success
5.22 / warning 5.62 / error 6.41 / info 5.78; dark 8.28 / 9.17 /
6.69 / 7.49.

### 4.5 Signal's three appearances

The signal hue appears exactly as: (1) the RECORD mark — PR rows, the
streak number, today's outline in the consistency grid, the
record-week tonnage bar; (2) links and selection tints; (3) the LIVE
pulse — the rest countdown while it runs, the live set pip. The verb
does not use it.

## 5. Surface, shapes, spacing

- **Shapes:** panel 2 (machined corner), sheet 12, control 4, tile 2,
  tag 2. No pills anywhere.
- **Spacing scale:** {4, 8, 12, 16, 24, 32, 48}. Gutter 20 (the
  350px column). Block gap 32 between a screen's major sections.
  Statement halo: 24 clear below the statement before any second
  voice.
- **The panel edge:** enamel panels carry a 1px steel hairline
  (`cardBorder`) and radius 2; the day-plan panel additionally
  carries the screen's ONE 2px ink top rule (the instrument face).
- **Element budgets (probe-enforced):** ≤1 statement, ≤4 sizes, ≤4
  text colors, ≤3 hairlines + at most one 2px rule, interactive
  elements ≤10 per screen (Floor ≤14 — it is the instrument).
- **Elevation:** flat everywhere; `mobilePremium.instrumentShadow`
  lifts ONLY the docked logger; portals use the sheet's existing
  lift.

## 6. Motion + scroll choreography — the mechanical family

| Id | Name | What | Trigger | Duration | Law |
|---|---|---|---|---|---|
| F1 | THE FLIP | a status tile half-flips to its next word (NOW→NEXT→DONE) | post-interactive (state change) | 110ms | rotateX only; tile text swaps at midpoint |
| F2 | THE ROLL | an odometer digit column rolls to the new value | post-interactive (user-driven value change ONLY — clocks never roll) | 140ms | translateY only |
| F3 | THE PIN DROP | the rail pin slides to its new position, the engaged fill re-steps | post-interactive (weight change) | 120ms | translateY only |
| F4 | THE COMPRESS | the Floor's pinned instrument strip — current station + set pips + rest countdown — crossfades in under scroll | scroll-linked (the shell's `useCompressFade`) | scrubbed | transform/opacity only; real sticky head; static under reduced motion |
| F5 | THE CURTAIN | the shell's ink route curtain | navigation | shell | unchanged machinery |

Contracts: (a) transform/opacity only, no layout properties, 60fps;
(b) `prefers-reduced-motion` → F1/F2/F3/F5 instant+static, F4
collapses to the always-on strip; (c) DOM-test/jsdom-safe — web-only
guards, static fallbacks (`useCompressFade` in `premium/shared` is
the worked example); (d) no choreography ever delays a tap or
keystroke — the logger is tappable at frame 1.

## 7. The rest instrument (new)

Hypertrophy lives on rest intervals; the elapsed clock cannot see
them. After every LOG SET the rest countdown starts: default 90 s
(the default is a persisted UI preference in the settings store —
nothing joins the schema), steppers ±15 s, tap the readout to
dismiss, auto-settle at 0 (the settled state persists until the next
log). It reads in TWO places: the pinned strip (F4) and a line above
the logger — both the same mono figure, pulsing signal while running,
muted when settled. Rationale: the rest clock is the only instrument
whose absence the training itself notices; it costs zero schema and
one UI-state field.

## 8. The per-screen map

Vocabulary carried over (function names, not taste): the **Floor** =
the live session; the **Desk** = reference pages. Routes are the
contract — every screen below keeps its route, data flow, and test
surface; only the presentation rebuilds.

### `/` home — THE CONCIERGE
Question: "what am I walking into today?" Focal: the day's TITLE
(statement, sentence case) with the window whisper (AM/PM) above it
in signal furniture caps. Second: **THE DAY PANEL** — the day's plan
as panel rows (name · Rx whisper · pin-rail mini at the prefill
weight — the day's load profile reads as a skyline of pins), wearing
the screen's one 2px rule. Quiet: the START verb (ink, 56px), three
jump rows (Program / Library / Progress, each with its one mono
caption — the streak lives on Progress), recent sessions as mono
lines. Session live: the ticker pins under the folio.

### `/split-selection` — THE SELECTOR
Question: "which edition?" Focal: the picked day's title restating
with every pick. Second: the seven-day rail (printed day keys; the
pick INVERTS to the ink plate — inversion is selection) and the AM/PM
two-way switch (same inversion). Quiet: the archetype segmented
control, the plan preview as the same panel rows with rail minis, GO
(ink verb). 490px: GO reachable at SE.

### `/workout-detail` (none) — THE FLOOR (the flagship)
Question mid-set: "what's the load, and log it." Structure
top→bottom: chromeless header (‹ minimize · elapsed mono · MAP chip ·
FINISH furniture) → **THE SESSION BOARD** (every station as a row:
flip-status chip NOW/NEXT/DONE·n + name + set pips, current station
inked; the board is the screen's ruled panel) → THE STATION (name
statement, TARGET whisper, SWAP/REMOVE furniture) → **THE SET PIPS**
(the program's ask drawn as pip groups of five; done pips solid ink,
the LIVE pip pulsing signal) → THE LEDGER (done sets: position
figure · pin-rail mini · reps figure; remove per row) →
NEXT-STATION whisper → docked **THE LOGGER**: the pin rail (counter
scale, labeled majors) + weight/reps on rolling counters (±2.5 / ±1
steppers, 44px, tap-a-counter to type) + the rest line + LOG SET (ink
verb 56px, the app's one shadow). Carry-forward prefill, last-tags
prefill, swap bench (zone-ranked swap panel), add-from-library,
notes + FINISH sheet (elapsed/sets/tonnage figures + save/discard
two-step) — all function unchanged. The pinned strip (F4) carries
station + pips + rest while scrolled.

### `/workout-detail?id=` — THE RECEIPT
Question: "what was that?" Focal: tonnage as THE FIGURE (Martian 36
statement scale — a figure IS the statement here). Second: the fact
whisper (date · D# · window · counts). Quiet: per-exercise ledger
panels (name + tags whisper + set rows with rail minis), the note,
delete (two-step, alert tone).

### `/program` — THE TIMETABLE
Question: "what's the program?" Focal: day 1's title (statement;
later chapters subheads). Chapters air-separated; slots as panel rows
(name + Rx whisper); a standing substitution reads in signal Rx.
Plan-time SWAP rides the bench. F4 compress: chapter heads pin and
the statement compresses to the pinned bar.

### `/exercise-database` — THE DIRECTORY
Question: "find a lift." Focal: the search field (statement scale,
one hairline beneath — the page's spent rule). Second: **ZONE LINES**
— the library's primary axis is the gym's geography (Barbell /
Dumbbell / Cable / Machine / Bodyweight zones, sticky zone heads in
zone-hued furniture caps); browsing = walking the floor. Quiet:
recently-logged section first when unfiltered; during a live session
the custom-add adder sits one tap open. Muscle filter chips remain
(function), restyled as furniture.

### `/exercise-detail?slug=` — THE SPEC SHEET
Question: "what is this lift?" Focal: the NAME (statement). Second:
the number to beat (LAST top set) rendered AS THE PIN RAIL + figures
(with its date) — or the type whisper when no history. Quiet:
instructions as one reading block; the muscle measure as bare ink
lines (prime movers full-height, assistants 45% height — ink only,
color is the zones'); equipment whisper; ADD TO SESSION (ink verb)
when a draft is live.

### `/progression` — THE RECORDS
Question: "how strong, how consistent?" Focal: the streak NUMBER in
signal (a figure-statement — Martian at counter scale). Second: the
five best lifts as **the gauge wall**: full-width rows, name + best
set as a counter-scale pin rail + the reps figure in the record-mark
read — the wall is literally the highest you've pinned. Quiet:
totals as one mono line; the consistency grid links to analytics.

### `/analytics` — THE LEDGER
Question: "how regular?" Focal: the count ("You trained 24 of 30").
Second: **THE CONSISTENCY GRID** — day cells as punch dots (0–3+
sets = 0–3+ filled rings drawn small; density is the viz; today
outlined in signal). Quiet: weekly tonnage as ink bars (record week
in signal), the range pick (segmented).

### `/settings` — THE PANEL
Question: "how is it set?" Focal: the current theme word restating
with each pick (statement). Quiet: theme segmented (ink-invert), the
rest-interval stepper row (THE REST INSTRUMENT's default, mono
figures), rest-day measure (struck marks), install/version rows,
SIGN OUT (the one verb). Dev showcase link stays.

### `/login` `/register` `/forgot-password` — THE GATE
Question: the action sentence. Focal: "Sign in." / "Create account."
/ "Reset." (statement). Plain field on the concrete, form open on
it, links in signal, verb ink-filled. Same folio masthead as home.

### `+not-found` — THE DEAD END
Focal: "404" as the figure-statement. One line of copy, one way
back.

## 9. What this thesis keeps, kills, or reworks

**Kept on its own argument** (not inheritance): stack-from-home
navigation + the session ticker (five destinations don't need a bar;
home is one back-swipe away; the ticker keeps the live session one
tap from every Desk page); the armed-set store model (draft rows
exist only once logged); one-statement-per-screen + the element
budget method; caps-furniture / sentence-case content; the ink
dialect (flat atmosphere, chit toast, route curtain); the one-document
Floor with the map above the station and the logger docked below;
skeleton/empty/error patterns; computed-at-read everything; SB1/SB2
width policy; the mirror trio (PWA + fonts); one-tap pre-armed
logging with carry-forward (the convergent core — speed IS the
product).

**Killed:** the whiteboard metaphor and its notation — plate stacks,
tally gates, the 2px framed BOARD block, the record-orange exact
hues; Archivo + Spline Sans Mono (files deleted, mirror trio
retimed); TheLogger's plate readout; the trophy wall's drawn stacks;
the ink-bars swap ranking's visual (the FUNCTION — zone-first
ranking — stays, recast on the zone ramp).

**Reworked:** the load figure (bar-and-plates → the pin rail); the
set figure (tally gates → pip groups); status words (plain text →
flip tiles); the compress bar (title restatement → the live
instrument strip); the logger (plate stack + digits → rail + rolling
counters + the rest line); home's day block (framed board → the
day panel with the pin skyline); the library zones (sticky heads →
zone-hued LINE heads); progression (trophy stacks → the gauge wall);
analytics (tally grid → punch rings).

## 10. The measurement spec — assertions are my eyes

1. **Contrast:** the matrix in §4.4, recomputed from `theme.ts` hexes
   at probe time (the probe fails if any pair drifts below its bar).
2. **Computed-style probes** (WebKit, per screen, both modes): the
   face/size/weight/tracking/transform of every named token's key
   nodes — statements are Instrument Cond 36/700, figures are Martian
   with tabular figures, furniture is CAPS (`textTransform:
   uppercase`, `textContent` raw), body is the system stack;
   `document.fonts.check('700 36px "Instrument Cond"')` proves the
   width-pinned second family.
3. **Geometry:** every interactive box ≥44px; the primary verb fully
   visible at 390×667 AND 390×844; desktop 1280×800 — nothing
   straddles the centered 350px column; the statement's halo ≥24.
4. **The mechanical laws:** pin position strictly monotone in load
   (probe a sweep 20…200 at each scale); rail fill height ∝ load /
   railMax; pip count == set count; the live pip is the only signal
   pixel mass on the Floor while rest is settled; the odometer rolls
   ONLY on user-driven changes (probe: elapsed updates do not
   animate the clock's transform); the flip tile's word swaps exactly
   when state changes.
5. **The rest instrument:** starts at LOG (probe the readout appears
   with a nonzero countdown); ±15 steppers change it; dismiss clears
   it; settle at 0 mutes it — all in DOM.
6. **Motion:** F1/F2/F3 land post-interactive; F4 changes computed
   transform with scroll and pins a real sticky head; everything
   static under `prefers-reduced-motion`.
7. **Budgets:** per-route element caps (§5) counted in DOM.

## 0. Not design territory (restated)

The data spine (five tables, immutable history, computed-at-read,
tags-not-columns, the program in TS), the route contract, the auth
guard, PWA plumbing, the accessibility floor, the audits, the 490px
law, and the shell sync (arqavellum keeps its own values; structure
ports both ways — the zone `meter` ramp, `instrumentShadow`, and any
kit fix land in the shell domain-neutrally in the same window).
