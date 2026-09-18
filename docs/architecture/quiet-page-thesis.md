# THE QUIET PAGE — reduction as the design language

> The fifth upending (2026-12). This document is the compass: the
> point of view, the pillars, the shrunken type inventory, the air
> law with numbers, the element budget, the per-screen map with its
> sentences, and the measurement spec that proves every pillar
> mechanically. `constants/theme.ts`, the MobilePremium kit, and the
> routes build to THIS doc. It supersedes `broadsheet-thesis.md`
> (retired with thanks — whatever survives below survives on its own
> argument, not on the BROADSHEET's authority).

## 1. The point of view

THE BROADSHEET proved the app can speak with one voice. It still says
too much at once. Every Desk page opened with three or four layers of
framing — kicker, nameplate headline, deck, section eyebrow — before
any information arrived. Metadata shouted about itself ("COMPUTED AT
READ · NOTHING STORED"). Hairlines divided everything. The record book
stacked a hero, side facts, totals, and ten PB rows on one screen.

The QUIET PAGE's move is **subtraction**: every screen reduced to the
fewest elements that still answer its question, held together by air,
type, and placement instead of structure, rules, and labels.

Why less is more information *here*: this app is read standing under a
bar, in 30–90 second windows, one thumb, sweat, glare. In that room,
attention is the only budget, and every element spends it. A quiet
page is faster to read at arm's length because nothing competes with
the one answer the screen owes. On the couch, the same page is calm
instead of filing. Density was THE BROADSHEET's virtue; **silence is
this pass's**.

**The retention test (the law of the budget):** an element stays only
if it answers the screen's one question or offers its one action.
Deletion is the default; retention needs the argument. A screen is
done when it can lose any single element and get worse — and there is
almost nothing left that can be lost.

**Quiet is not vacant.** The reduction removes framing, not facts.
The nameplate sandwich dies; the streak number stays. A page that has
been emptied of information is not quiet, it is unpopulated — the
failure mode this pass guards against as firmly as against clutter.
Every block keeps its one FACT (the caption on a row, the window in a
lede, the count on a measure), carried in one line instead of a
stack. Density of meaning, sparseness of marks: air is spent AROUND
content, never instead of it.

## 2. The pillars

1. **The content is the statement.** Page names die. The loudest thing
   on the program page is its first day's title; on the library, the
   search field itself; on the record book, the streak number. Where a
   page's name still helps, it survives as a 12px folio whisper — or
   lives only in the route curtain's stamp (motion, not chrome) and
   the document title.
2. **Air is the structure.** Rules mostly die. Proximity groups;
   whitespace separates. A gap you can measure replaces a hairline you
   must read.
3. **Fewer, chosen.** Three items chosen well beat ten truncated.
   Curation and progressive disclosure are owned IA: totals live one
   tap deeper when the screen's sentence doesn't need them.
4. **One verb.** Exactly one primary action per screen, at accent
   scale; everything else is a row or a whisper link.
5. **Metadata whispers once.** At most one quiet metadata line per
   block, and only when it answers the question. Metadata that
   describes the app instead of the athlete ("THE CATALOG IS LOCAL")
   is deleted outright.

## 3. Type system

### 3.1 The faces — unchanged

**Rokkitt** (statements), **Azeret Mono** (every changing, aligned, or
ledger figure — tabular by construction), **platform sans**
(reading). The pair was never the density problem; the size inventory
was.

### 3.2 The inventory — five sizes, four per screen, three on a Desk page

The BROADSHEET ramp ran 11→72 across 15 tokens and put 6–8 distinct
sizes on one screen. The QUIET PAGE collapses it:

| Size | Token(s) | Face | Carries |
|---|---|---|---|
| **48** | `mobileCounter` | Azeret 700 | THE CALL — the armed weight × reps. The Floor only; the one place agate goes display. |
| **34** | `mobileDisplay` (statement), `mobileTitleCondensed` (station head) | Rokkitt 800 | THE STATEMENT — the screen's answer, in sentence case. Exactly one per screen. |
| **22** | `mobileTitle` | Rokkitt 700 | THE SUBHEAD — later chapter titles, sheet titles. |
| **15** | `mobileFigure` (Azeret 700), `mobileItemTitle` (sans 600), `mobileAction` (Rokkitt 700), `mobileBody` (sans 400), `mobileSubtitle` | mixed | THE ROW and THE VERB label and READING — the working size. |
| **12** | `mobileLedger` (Azeret 500), `mobileEyebrow` (Azeret 600 caps, tracked), `mobileMeta` (sans), `mobileTag`, `mobileFieldLabel` (sans 600) | mixed | THE WHISPER — dates, folio marks, section labels, tags, Rx, every quiet figure. |

Retired ranks: `mobileHero` (72 — nothing shouts anymore; its value
collapses to 34), the deck as a rank (`mobileSubtitle` falls to row
scale), the separate tag/meta/caption sizes. Token **keys** stay (the
shell's structure is synced); their **values** collapse onto the ramp
above. Line-heights still snap to 2 (34/38 · 48/52 · 22/26 · 15/20 ·
12/16).

Case law: **statements speak in sentence case** (the quiet voice);
verbs and whisper caps may uppercase — actions and markings, never
information.

### 3.3 The hierarchy law, sharpened

- **One loudest element per screen** — unique by computed size,
  ≥ 1.4× the next distinct size (34→22 = 1.55; 48→34 = 1.41 on the
  Floor). Unchanged, probe-enforced.
- **One idea per screen** — the map (§6) states the single sentence
  each screen exists to say. If a second idea fights for space, one of
  them moves a tap deeper or dies.
- **One verb**, one record-red fill per screen (the Floor: two — verb
  + next-position mark), ≤ 4 distinct text colors per screen (ink,
  muted, record, on-record).

### 3.4 The air law — whitespace as a material with numbers

| Measure | Value |
|---|---|
| Page gutter | **20** (was 16), consistent ±2 on every route |
| Block rhythm (top-level blocks) | **40** vertical between siblings (was 24) |
| Row rhythm inside a block | **16** between row boxes; row boxes ≥ 48 tall (targets) |
| The halo | the statement's bounding-box moat ≥ **24** to any other element |
| The fold | SE (375×667) law unchanged: the verb never scrolls away |

Air is spent above the fold, never by pushing the verb below it.

## 4. Color law — same values, far less ink

The palettes do not move: **Paper** (light, default), **Evening
Edition** (dark, opt-in), **the wire** (mode-independent interrupt
plate), one RECORD red with its measured companions. The §3.3 contrast
matrix of the BROADSHEET run carries over verbatim because it pins
values, and the values are unchanged — AA holds on every slot both
modes.

What changes is **coverage**: the field dominates every screenshot
(≥ ~85% of pixels), ink coverage falls by deletion (fewer, smaller
elements; no rules), and the record red stays at its three uses —
record mark, primary verb, living pulse. Ink-invert selection survives
(selection is information density, not decoration).

## 5. Motion law — almost nothing

Print physics collapses. What survives:

| Motion | Spec | Why it survives |
|---|---|---|
| **The lockup stamp** | on LOG: value stamps −6→0 + fade, 90ms; the agate row prints 120ms | functional feedback the thumb needs — never blocks the next tap |
| **The curtain** | the wire sweep, destination title stamps — machinery unchanged | it is where page names live now |
| **The pulse** | ticker LIVE dot breathes 1.6s | the only loop; the living edition |

Killed: **the fold** (scroll-compress — smaller statements don't need
compressing), **the record-rule draw** (records are red statically;
no rule draws). Everything transform/opacity, reduced-motion-safe,
never between a thumb and its target.

## 6. The per-screen map — sentence, voices, budget

Per screen: the **sentence** it exists to say, the **loudest** (the
answer), the **second voice**, the **quiet tail**, and the element
budget (visible text nodes / interactive elements — probe-enforced).

| Screen | Sentence | Loudest | Second voice | Quiet tail | Text ≤ | Tap ≤ |
|---|---|---|---|---|---|---|
| **home** | "It's Day 2 tonight — press." | the day title, 34, sentence case | the lede: window + first lift + count | the brand masthead (folio line) · 3 jump rows, each with its one fact as caption · 3 recent edition lines (the latest at figure scale) · settings | 13 | 8 |
| **funnel** (split-selection) | "Which edition?" | the PICKED day title, 34 — restates with the pick | 7 day tiles (whisper weekday + figure) | plan preview lines · GO | 20 | 12 |
| **Floor** (live) | "100 × 10 — log it." | THE CALL 48 | the station name 34 | station marks · set rows · steppers · whisper actions | 16 | 10 |
| **receipt** (saved detail) | "4,230 kg, done." | the tonnage 34 | the date whisper | per-exercise set lines (the immutable receipt) | 24 | 4 |
| **program** | "The rotation, day by day." | the FIRST day title 34 (later chapters 22) | later chapter titles | slot lines, one line per slot · swap marks | 48 | 12 |
| **library** | "Find the lift." | the search field — input text AT 34, the instrument is the statement | first results | section whispers · rows | 24 | 12 |
| **entry** (exercise detail) | "What this lift is." | the exercise name 34 | the muscle measure | instructions (reading) · whisper facts | 20 | 6 |
| **record book** | "The streak is 12." | the streak number 34 in record red | totals figures (one line) | 5 PB lines, name + best set | 16 | 6 |
| **form table** | "24 sessions in 30 days." | the count 34 | the consistency grid (ink cells, today outlined) | weekly bars · range control | 16 | 8 |
| **colophon** | "This is how it's set." | the current theme value 34 — restates with the pick | setting rows | install · version · sign out | 18 | 10 |
| **auth ×3** | "Sign in." / "Create account." / "Reset." | the action sentence 34 | the form fields | one link | 10 | 4 |
| **404** | "Nothing runs here." | `404` 34 | one line of copy | back | 4 | 1 |
| **ticker** (all Desk) | "The floor is live." | the wire plate — exempt from budgets (the interrupt) | | | — | 1 |

Data sprawl resolutions (the subtraction, screen by screen):

- **home**: the edition kicker, "In this app", and the 5-session
  recent list die. The brand masthead stays — quieter (folio line at
  row scale, never competing with the statement); the window moves
  into the lede; the jump rows keep their one fact each as captions
  (the streak lives on the Progress row); recent editions become 3
  one-line rows — the latest at figure scale, the rest whispering.
- **record book**: side facts die; totals collapse to one figure line;
  PB ledger shows 5 rows (name + best set; e1RM column dies).
- **form table**: the nameplate dies; the count is the statement; bars
  keep real weight; range control stays.
- **program**: the nameplate dies; per-day sets figure dies (the slots
  show Rx); window labels become whispers; slot rows lose their
  hairlines and 2px strike bars (a swap marks by a record-red dot on
  the whisper, not chrome).
- **library**: the nameplate + "42 LIFTS · CATALOG IS LOCAL" die; the
  search input is the statement at 34; result-count whispers once.
- **colophon**: the nameplate dies; the email kicker dies (it is
  already a row); the theme statement carries the page.
- **Floor**: the call board keeps its dock and its blank-line counter
  field; Rx + tags murmur in one whisper line; SWAP / ADD survive as
  whisper links in the station block; NOTE moves into the finish flow.

## 7. Navigation & chrome

The stack survives untouched: no tab bar, home is the hub, push and
return, the ticker pins under every Desk header while a session runs,
and **the back law holds** (every pushed route carries a ≥44px back
affordance — P-BACK-1). Pushed Desk pages render a bare back chevron
row; a folio whisper appears only where the content below doesn't name
itself. Page names otherwise live in the route curtain's stamp and
`routeMetadata` titles — declared in motion, not painted in chrome.

## 8. What this thesis keeps, kills, or reworks

Each verdict, one line:

- **The nameplates** ("THE ROTATION" et al.) — KILLED on every screen;
  the content is the statement.
- **Kicker/deck pairs** — KILLED as chrome; one lede line survives on
  home because it answers the question.
- **Jump lines** — KEPT, reduced to label-only rows separated by air.
- **The fold (scroll-compress)** — KILLED (§5).
- **CallBoard's one-line call + blank-line counter field** — KEPT; it
  is the solved mid-set shape.
- **The ticker** — KEPT as the wire (the interrupt; budget-exempt).
- **StationStrip** — KEPT, re-voiced as whisper marks.
- **InkRail (swap bench)** — KEPT, quieted (names + one shared-fact
  whisper; ranks by the body, computed at read).
- **The record red law** — KEPT verbatim (mark / verb / pulse).
- **Ink-invert selection** — KEPT (the funnel tiles, theme rows).
- **The form table's ink cells + today outline** — KEPT (data-viz is
  ink density, not chrome).
- **The measured muscle bars** — KEPT, quieted (they are content).
- **The curtain** — KEPT; it inherits the page names.
- **The boot plate** — KEPT (plumbing, unchanged).
- **The focus ring law** — KEPT (a11y is load-bearing).
- **Rokkitt + Azeret pair, shapes 2/4/2/2/2, the wire register** —
  KEPT (values untouched; see §4).

The data spine, the shell contract, the gates, the accessibility
floor, and the 490px law are untouched (repo CLAUDE.md).

## 9. The measurement spec — minimalism is a budget, not a vibe

The suite lives in `.shots/vision2/` (gitignored, outside the repo),
runs the static export through Playwright WebKit with the seeded
program-aligned mock layer, both modes + SE. Every pillar is provable;
**"measured within spec" is the only done.**

Kept green from the BROADSHEET suite: **P-HERO-1** (unique loudest,
≥1.4×, ≥34; FOLD/ARC placement), **P-TNUM-1**, **P-CLIP-1**,
**P-OVERFLOW-1**, **P-TARGET-1**, **P-ACCENT-1**, **P-FOCUS-1**,
**P-REDUCED-1**, **P-INTERACT-1**, **P-FOLD-1** (SE), **P-BACK-1**,
**P-CONTRAST-1** (values unchanged → matrix carries over),
**P-PIXEL-1** (bounds retuned), **P-STICKY-1**.

Amended: **P-TYPE-1** — any text > 16px rides Rokkitt (statements) or
Azeret at exactly the counter size (the call); mono elsewhere ≤ 15.
Sans never exceeds 16. This enforces the inventory from below as well
as above.

New budget probes (they must FAIL loudly against the current
BROADSHEET screens in Phase 1 — that failure list is Phase 2's map):

- **P-COUNT-1 (element budget)** — per route, visible text nodes ≤
  the §6 cap; visible interactive elements ≤ the §6 cap.
- **P-VOICE-1 (size/color inventory)** — per route, distinct computed
  font sizes ≤ 4; distinct computed text colors ≤ 4.
- **P-AIR-1 (the air law)** — vertical gaps between top-level sibling
  blocks ≥ 36; the statement's bounding-box moat ≥ 24; page gutter
  consistent ±2 of 20.
- **P-RULE-1** — hairline separators per screen ≤ 3 (Floor ≤ 1);
  structure earns its lines.
- **P-INK-1 (pixel census)** — non-field ink coverage per screenshot
  ≤ the declared ceiling (calibrated once in Phase 1 against the
  BROADSHEET baseline, then enforced; captures at native scale).

Visibility filtering is part of the spec: expo-router keeps prior
screens mounted-but-hidden, so every count honors `offsetParent` and
positive rects — hidden pages never pollute a budget.
