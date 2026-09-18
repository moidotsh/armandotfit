# THE BROADSHEET — the daily training paper (RETIRED)

**Status:** Retired by `quiet-page-thesis.md` (the 2026-12 reduction
pass, the fifth upending). Kept as the historical record of the
cohesion pass; its §3.3 measured contrast matrix carries over (the
QUIET PAGE keeps the palette values verbatim), and its §7 map fed the
screen inventory for the reduction. `constants/theme.ts` and the
showcase now carry the QUIET PAGE tokens; when this doc and the tokens
disagree, the tokens win.

> The fourth upending (2026-12). This document is the compass: the
> point of view, the complete token tables, the measured color law,
> the motion contracts, the per-screen hierarchy map, and — because
> this pass is executed blind — the **measurement spec** that proves
> every pillar mechanically. `constants/theme.ts`, the MobilePremium
> kit, and the showcase build to THIS doc. It supersedes
> `count-thesis.md` (retired with thanks; nothing below is inherited
> from it — whatever survived, survived on its own argument).

## 1. The point of view

Training has a paper trail. Before apps, a lifter's program was
written on a sheet, the day's work was posted on a board, and the
numbers that mattered were **set in print**: the day's headline, the
small agate of the set list, the record marked in red. Print solved
glance-hierarchy a century before screens — a sports page answers
"what happened" in one sweep because **one thing is huge, one line
explains it, and everything else is small, aligned, and quiet**.

So this app is **a daily paper about one athlete**. Every screen is a
page set by a disciplined sports desk:

- **The AM/PM split maps to editions.** A session is an edition of
  the paper — one row, immutable once printed (the data spine: AM and
  PM are separate session rows; a set is a row; deleting un-logs it).
- **The live session is the floor report.** One station on screen,
  its name as the headline, the next set **pre-armed at carry-forward
  weight** — the "call" — at figure scale, and exactly one loud verb:
  LOG. Between sets, under a bar, one thumb: the three glance
  questions are answered by the headline (what am I doing), the call
  (what did I just lift / what's next), and the verb.
- **History is the box score.** A saved session renders as the
  immutable summary of a finished game: tonnage as the headline
  figure, per-exercise agate beneath. Progression is the record book
  — streak as the banner, PBs as record rows in red. Analytics is
  the form table. The library is the index. The program is the
  rotation. Settings is the colophon. The 404 is a page that doesn't
  run.

The premium is **editorial confidence**: warm paper, dense ink,
one voice speaking at a time, everything else typeset small and
aligned with absolute discipline. Not industrial (THE COUNT's iron),
not clinical (SIGNAL's steel), not plain big numbers (THE LOGBOOK) —
**a paper with a masthead, a law for what gets to be big, and red
reserved for records**.

The structural spine, carried on every screen:

1. **No tab bar.** The Desk is a stack; home is the front page —
   masthead, the day's headline, the primary verb, and the jump
   lines (Program / Library / Progress) that replace navigation
   chrome. Everything else pushes and returns.
2. **The floor is chromeless.** One station, its headline, the armed
   call, the agate set list, one verb. Leaving forward is FINISH;
   leaving backward asks. The solved mid-set shape — station, armed
   set, one-tap log — is kept and re-voiced, not re-invented.
3. **The wire interrupts.** Everything that must interrupt — the
   ticker (a live session pinned under every Desk header: LIVE dot,
   elapsed count, RETURN), the route curtain, the chit toast —
   renders as the wire: a warm-black plate, identical in both modes,
   the heaviest ink on any screen.

## 2. Type system

### 2.1 The faces (self-hosted, OFL, variable — one woff2 each)

| Face | Family name | File | Axes | Role |
|---|---|---|---|---|
| Rokkitt | `Rokkitt` | `public/fonts/rokkitt-var.woff2` (29 KB, latin subset) | wght 100–900 | THE HEADLINE VOICE: masthead, screen headlines, station names, hero statements, button labels. A slab serif with almanac authority — warm where the last voice was industrial. |
| Azeret Mono | `Azeret Mono` | `public/fonts/azeret-mono-var.woff2` (26 KB) | wght 100–900 | THE AGATE VOICE: kickers, folio markings, tags, every aligned or changing figure, the armed call. Mono = tabular by construction. |
| Platform sans | system | — | — | THE READING VOICE: body paragraphs, row titles, field labels. |

Division of labor (the law): **Rokkitt speaks statements** — words
and static hero numerals at display sizes, never below 16px.
**Azeret keeps the figures** — every number that changes, aligns, or
ledger-reads, at any size. **Platform sans does the reading.**
Nothing else is allowed a fontSize.

### 2.2 The type tokens (`theme.typography`)

Three ramps, interleaved: statements (28 · 34 · 42 · 72), figures
(14 · 26 · 56), words (11 · 13 · 15 · 16 · 17).

| Token | Broadside name | Face | Size/Line | Weight | Tracking | Variant | Carries |
|---|---|---|---|---|---|---|---|
| `mobileHero` | the record | Rokkitt | 72 / 76 | 800 | −1 | — | THE emotional number: streak, receipt tonnage, the 404 |
| `mobileDisplay` | the headline | Rokkitt | 42 / 46 | 800 | −0.5 | — | THE screen statement — exactly one per screen, uppercased at call site |
| `mobileTitleCondensed` | the station head | Rokkitt | 34 / 38 | 800 | −0.2 | — | floor station names, the swap-bench title |
| `mobileTitle` | the subhead | Rokkitt | 28 / 32 | 700 | −0.2 | — | section statements, sheet titles, program day titles |
| `mobileCounter` | the call | Azeret Mono | 56 / 60 | 700 | −1 | tnum | the armed weight × reps, the floor timer — the one place agate goes display size |
| `mobileFigure` | the stat figure | Azeret Mono | 26 / 30 | 700 | −0.5 | tnum | stat strips, PB values, set-list figures, day-of-split numerals — agate keeps every working figure |
| `mobileAction` | the verb | Rokkitt | 17 / 22 | 700 | +0.6 | — | button labels, uppercased at call site |
| `mobileItemTitle` | the row lead | platform | 16 / 22 | 600 | −0.1 | — | row titles: exercise names, settings rows |
| `mobileSubtitle` | the deck | platform | 15 / 20 | 600 | 0 | — | the one line under a statement |
| `mobileLedger` | agate | Azeret Mono | 14 / 18 | 500 | 0 | tnum | set rows, Rx strings, dates, session meta |
| `mobileEyebrow` | the kicker | Azeret Mono | 11 / 14 | 600 | +1.4 | upper (call site) | section labels, folio lines, units |
| `mobileTag` | the tag | Azeret Mono | 11 / 16 | 500 | +0.4 | — | tags, chips |
| `mobileBody` | body | platform | 15 / 22 | 400 | 0 | — | paragraphs, instructions |
| `mobileMeta` | caption | platform | 13 / 18 | 400 | 0 | tnum | quiet meta, hints |
| `mobileFieldLabel` | field label | platform | 13 / 16 | 600 | +0.1 | — | input labels |

Rules: consumers spread named styles; they never write ad-hoc
fontSize/fontWeight. Line-heights snap to 2. Every figure that
changes or aligns rides agate (mono — tabular by construction, so
timers and counters cannot jitter). Rokkitt's lining figures are
verified by probe (P-TYPE-4) before any screen ships them; if the
measured posture were old-style, static hero figures would route to
agate instead — the decision is measured, not eyeballed.

### 2.3 The headline law (hierarchy as law)

Every screen states its **one loudest element** and holds it by
measurement:

- **Exactly one headline per screen.** One element at
  `mobileDisplay`/`mobileHero` (Desk pages) or `mobileCounter`/the
  station head (Floor). Counted by computed font-size — if two
  elements share the loudest size, the screen is wrong.
- **The second voice is ≥ 1.4× quieter.** The next distinct
  font-size below the headline is at most size/1.4 (42→28 across the
  statement gap; 56→28 on the Floor; 72→28 for records). The gap is
  the teeth of the hierarchy — probe-asserted.
- **One red element class per screen** (the record law, §3).
- **The headline sits in the top 40% of the viewport** on Desk
  pages (the fold), and the Floor's call sits in the thumb arc
  (bottom half). Both are geometry-probed.

Optical alignment: the headline, deck, and agate share the column's
left rule (16px gutter). Numerals right-align to the right rule on
tabular figures. Centered type appears only on the masthead wordmark
and the 404. Nothing indents alone.

### 2.4 Spacing & rhythm

4pt grid. Page gutter **16**. Section rhythm **24** (one hairline
rule + 12 above / 12 below the rule's label). Agate row height ≥ 48
(44+ effective target). Control heights: buttons 52, the floor's LOG
56, inputs 48, steppers 44. A headline always gets ≥ 20 above — the
statement breathes before it speaks.

### 2.5 Shapes

| Token | Value | Reads as |
|---|---|---|
| `surface` | 2 | bounded data panels (sheets' inner panels, alerts) |
| `sheet` | 4 | portals (swap bench, finish dialog, sheets) |
| `control` | 2 | buttons, inputs — the corner is a cut |
| `tile` | 2 | day tiles, selection rows |
| `tag` | 2 | chips — marking boxes, never pills |

Print is square-cut: 2px softening only so subpixel edges don't
fizz. The system invents **no glyph** — THE COUNT's tally dies with
THE COUNT (the primitive stays shell-synced in the kit; no app
screen renders it). Sequences render as aligned agate (sets listed,
days numbered in the kicker, weeks as grid cells). The BROADSHEET's
invention is the hierarchy itself.

## 3. Color law

Two palettes — **Paper** (light, default) and **Evening Edition**
(dark, opt-in) — plus **the wire** (the retuned `focus` register,
mode-independent). Both palettes are warm: cream paper and warm
black, never cool gray, never blue-steel.

| Slot | Paper (light) | Evening (dark) |
|---|---|---|
| `backgroundDeep` (page) | `#F2EEE5` | `#100E0A` |
| `background` | `#F6F3EB` | `#14110C` |
| `backgroundAlt` | `#EDE9DE` | `#181510` |
| `card` | `#FBF9F2` | `#1A1710` |
| `cardAlt` | `#F0EDE2` | `#201C14` |
| `border` | `#DFDACE` | `#2C2820` |
| `text` | `#1B1812` | `#EDE9DE` |
| `textSecondary` | `#413D33` | `#CBC6B8` |
| `textMuted` | `#5F5B4E` | `#9C9686` |
| `textColors.tertiary` (decorative only) | `#918D7F` | `#6B665A` |
| `brand` (the record, fill) | `#C24100` | `#FF7E45` |
| `brandText` (small-text companion) | `#9A3300` | `#FF9E6E` |
| `textOnBrand` | `#FFF5EC` (paper) | `#14110C` (ink) |
| `brandOnInk` (on the wire) | `#FF8A4A` | `#FF8A4A` |
| `status.success` | `#1E7A4C` | `#40C98E` |
| `status.warning` | `#8F5B00` | `#E5B54B` |
| `status.error` | `#B3261E` | `#F27F72` |
| `status.info` | `#1D5FCC` | `#74ABFF` |

The wire (`colors.focus.*`, identical in both palettes):
`background #0E0C08`, `surface #16130E`, `surfaceAlt #1C1913`,
`border #27231B`, `text #EDE9DE`, `muted #9C9686`, `signal #FF8A4A`,
`onSignal #14110C`, `track #1F1B14`, `signalSoft rgba(255,138,74,.16)`.

**The record law (usage, not just values):** editorial red appears
exactly three ways — (1) **the record mark**: PB values, record
rows, today's position in a measure, the LIVE state; (2) **the
primary verb** (START, GO, LOG SET, FINISH→SAVE) as a fill with its
measured text companion; (3) **the living pulse** (the ticker's LIVE
dot, RESUME's breathing rule). It never decorates, never labels
quiet information, never fills a second loud thing on one screen.
`tertiary` text is decorative only. One paint per plate: hierarchy
on a red fill comes from size and face, not alpha.

### 3.3 The measured matrix (computed, not hoped)

Every text-bearing slot × every surface it rides, computed from the
hex pairs (`.shots/vision2/contrast.ts`; regenerate before any
palette change — the §3 table is a declaration, this matrix is the
law). Reading: paper/evening, all ≥ WCAG AA. **72 pairs, 0 failures
(2026-12 run):**

- text: **15.3 / 15.9** on page · **16.8 / 14.8** on card ·
  **15.1 / 14.0** on cardAlt
- secondary: **9.4 / 11.3** on page (≥ 8.8 on every surface)
- muted: **5.9 / 6.5** on page · ≥ **5.0 / 5.9** on the darkest
  surface it rides (cardAlt)
- brand as fill: **4.48 / 7.64** on page (**4.92 / 7.09** on card) —
  clears 3:1 UI-component with headroom
- brandText: **6.37 / 9.52** on page · textOnBrand on the fill:
  **4.82 / 7.46** (paper on the record red; ink on the bright one —
  the paint flips with the plate, both measured)
- status quartet as text on page+card: paper **4.60–5.24**, evening
  **7.39–10.14**
- the wire: text **16.1 / 15.3** on bg/surface, muted 6.6,
  signal-as-text 8.4, onSignal 8.1
- brandOnInk on the wire bg: **8.36**

## 4. Surface & elevation language

Flat. One continuous page; **1px hairline rules divide it** —
`rgba(ink, 0.14)` light / `rgba(paper, 0.14)` dark. Elevation is
declared three ways, never by shadow:

1. **Rule** — the default separator of agate rows and sections.
2. **Tint step** — `card`/`cardAlt` for bounded data (panels, the
   call board, alerts).
3. **The wire** — the interrupt plate: warm black in both modes;
   it interrupts by being the heaviest ink on screen.

The call board is the one docked surface on the Floor: tint step +
top rule, no shadow. Portals use `sheet` radius + scrim; inner
panels `surface`. Nothing else floats.

## 5. Motion law — print physics

Motion marks **the record changing** — a set locking in, a record
being set, the clock running. Nothing else moves.

| Motion | Spec | Contract |
|---|---|---|
| **The lockup** | on LOG: the armed value stamps (translateY −6→0 + opacity, 90ms ease-out), the agate row prints (x −8→0 + fade, 120ms), the carried value dips 60ms | never blocks the next tap; LOG stays live throughout |
| **The record rule** | when a logged set is a PB: a 2px record-red rule draws under the figure (scaleX 0→1, 160ms) | static full-width under reduced motion |
| **The fold** | scroll-driven: mastheads compress under scroll (scale toward 0.6, translateY, the compact kicker fades in) — transform/opacity only | scrubbed by onScroll, never springs; static under reduced motion |
| **The curtain** | the wire sweep with a 2px record-red leading edge; the destination title stamps in Rokkitt 800 | the shell's fixed-beat curtain machinery, unchanged timing |
| **The pulse** | the ticker's LIVE dot / RESUME rule breathes opacity 1→0.5, 1.6s | the only loop in the system; off under reduced motion |

`prefers-reduced-motion`: every row collapses to its final state
instantly (agate prints without sliding, curtains cut, pulses hold).
The design is complete without motion — the hierarchy carries
everything statically. Motion never stands between a thumb and its
target; listeners only drive styles.

## 6. Navigation & chrome

- **No tab bar.** `MobileTabBar` stays in the kit + showcase (shell
  primitive), unwired. The Desk navigates by push from the front
  page's jump lines; back returns. The funnel pushes from the
  primary verb and the empty state.
- **The ticker** (`components/composed/SessionStrip.tsx`, restyled):
  while a session runs, a wire plate pins under every Desk header —
  LIVE dot (pulsing) · elapsed agate · RETURN → — a ≥44px full-width
  tap target straight to the Floor. The session is never more than
  one tap away on any screen.
- **The Floor is chromeless.** No ticker, no tabs, no drawer:
  header (‹ · elapsed · FINISH), station marks, the station, agate,
  the call board.
- **The drawer primitive** stays synced-but-unwired (shell parity).
- Route contract unchanged: same routes, same params. The curtain
  seam (`NavigationHelper`) is untouched.

## 7. Screen-by-screen hierarchy map

Per screen: **headline (loudest) → deck (second voice) → agate tail
(quiet)**, with the reason.

| Screen | Headline | Deck | Agate tail | Why |
|---|---|---|---|---|
| **Front page (home)** | The day's headline: kicker (`TODAY · PM EDITION · DAY 02 OF 04`) above the day title at `mobileDisplay`, uppercased | The lede: first lift named + count more; START (or RESUME) the one verb, full width | Jump lines (PROGRAM / LIBRARY / PROGRESS — ruled rows with agate captions); this-week figures; recent editions as agate rows | Home answers "what am I walking into?" — the paper opens with its headline |
| **Funnel (split-selection)** | The edition pick: 7 day tiles (weekday agate + day-of-split figure); the picked tile INVERTS (ink plate on paper / paper on ink) | The archetype + window kickers; the plan preview as numbered agate rows | GO (primary) pinned in the footer | The choice is the content; three picks then GO, one column |
| **Floor (live session)** | THE CALL: the armed `weight × reps` at `mobileCounter` in the docked call board, ± steppers 44; an unset value is a ruled blank line — never a glyph at call scale. LOG SET 56 | The station: name at the station-head scale, Rx + tags as marking chips; station marks (01·02·03·04) under the header; running session count in agate | The set list (agate rows, remove per row); SWAP / ADD / NOTE ruled actions | Mid-set the question is "what's next" — the call answers in digits; one verb |
| **Box score (workout-detail, saved)** | Tonnage as `mobileHero` + date/edition kicker | Per-exercise blocks: name + the session's sets as agate rows | Note; delete (two-step, error-toned) | A finished game summarizes itself; the total is the banner |
| **Rotation (program)** | Day chapters: `DAY 01` kicker + title at the subhead scale + planned-sets figure; heads pin + compress under scroll | Slot ledger rows — the same numbered slot language as the funnel preview | Standing-substitution marks + reset | The program is a document; days are chapters |
| **Index (library)** | The search field (48 — the screen's instrument) + equipment-zone kickers (BB · DB · MACHINE · CABLE · BW) | Recently-logged rail + category sections with sticky agate headers; ruled rows | Result counts; custom-name adder (during a session) | Browsing is scanning; equipment is how the room is arranged |
| **Entry (exercise detail)** | The name at `mobileDisplay` + type kicker; muscle target: primary muscles as filled agate cells, secondary as outlined — the measure as data-viz | Instructions in body; the tip line | Equipment markings; add-to-session (primary, footer, during a session) | A reference page: the name anchors, the target tells you what it trains |
| **Record book (progression)** | Current streak as `mobileHero` in the record tone | Totals as figure rows | PB ledger (name + best set agate, hairline rows); link to Analytics | The streak is the emotional number; the rest is evidence |
| **Form table (analytics)** | The consistency grid (square cells, 4 levels: ghost → ink, today outlined) + tnum axis | Weekly volume bars at real bar weight, agate values | Range segmented control; counts | The field is the story; bars stop apologizing |
| **Colophon (settings)** | Section kickers + ruled rows | Theme trio; rest days as a 7-cell agate measure (rest days struck red) | Install row; version; sign out | Nothing here needs to win |
| **Auth (3 screens)** | The masthead wordmark in Rokkitt 800 + screen title at the headline scale | The form (fields on the field, hairline-bounded) | Links, help lines | The brand speaks once: confident, warm, set |
| **Not-found** | `404` as `mobileHero` + one line of copy | Back button | — | Even the dead end is a page that doesn't run |
| **Swap bench (sheet)** | Alternatives: names + ranked "why" agate lines (shared muscles/equipment) | "Restore programmed" row (record tone) | Weakest matches muted | The bench ranks by the body, computed at read |
| **Ticker (all Desk screens)** | Wire plate: LIVE dot (pulsing) + elapsed agate + RETURN → | — | — | The living edition never hides |

## 8. What this thesis keeps, kills, or reworks

Each decision, one line:

- **TallyStrip** — KILLED on every screen (no glyph survives COUNT);
  the primitive stays shell-synced in the kit and showcase.
- **`mobileCounter` token** — KEPT verbatim (the call is still the
  agate face's one display size; it already ports to the shell).
- **`shapes`** — RETUNED square-cut print (2/4/2/2/2 from 4/8/3/2/2).
- **`colors.focus.*` stage register** — KEPT as the wire (the one
  mode-independent register), re-valued to warm black.
- **SessionStrip** — KEPT as the ticker (re-skinned wire plate).
- **InkRail (swap bench)** — KEPT, re-skinned to the paper field.
- **StationStrip** — KEPT (floor station marks in agate).
- **Atmosphere system** — KEPT flat (ink dialect, unchanged).
- **Figure** — KEPT; it becomes the standard agate stat component.
- **The curtain seam** — KEPT (wire sweep + record edge + Rokkitt
  stamp; machinery untouched).
- **The empty counter field** (ruled blank line) — KEPT from the
  vision pass; it is the blank line in the box score.
- **Ruler-compress** — KEPT as the fold (same machinery, new name).
- **Big Shoulders / `displayCondensed` axis** — RETIRED (Rokkitt
  replaces the statement face; the shell axis stays undeclared).

The data spine, the shell contract, the gates, the accessibility
floor, and the 490px law are untouched (see repo CLAUDE.md).

## 9. The measurement spec (the blind agent's eyes)

Every pillar above is provable. The suite lives in
`.shots/vision2/` (gitignored scratch, outside the repo) and runs
against the static export via Playwright WebKit with seeded mock
data (long tonnage numbers, many PBs, multi-lift sessions — the
hierarchy must survive data).

**P-CONTRAST-1** — the matrix: every text slot × surface pair from
`theme.ts`, both modes, WCAG AA pinned (≥4.5 text, ≥3 large/UI);
§3.3's numbers are filled from this run.

**P-TYPE-1** — roles: per route, key nodes' computed
`fontFamily`/`fontSize`/`fontWeight`/`letterSpacing` match the §2.2
table (Rokkitt on statements, Azeret on figures, sans on reading).

**P-HERO-1** — the headline law: per route, the largest computed
font-size among text nodes is (a) unique — exactly one node at it —
and (b) ≥ 1.4× the next distinct size. Seeded data on. Both modes.

**P-TNUM-1** — figures: every text node whose content is ≥ 50%
digits resolves to `font-variant-numeric` containing `tabular-nums`
or to the mono family.

**P-CLIP-1** — no clipped text: `scrollWidth ≤ clientWidth + 1` on
text nodes; ellipsis only on declared spots.

**P-OVERFLOW-1** — no horizontal page scroll on any route at
390×844.

**P-TARGET-1** — every interactive element's bounding box ≥ 44×44
(hitSlop does not count — DOM boxes only).

**P-FOLD-1** — SE (375×667): each screen's primary action fully
visible without scroll; Desk headlines inside the top 40% of the
viewport; the Floor call board's LOG inside the bottom 55%.

**P-STICKY-1** — pinned chrome (ticker, footers, sticky heads)
paints above content: computed z-index strictly greater.

**P-ACCENT-1** — the record law: count of elements whose computed
background is within tolerance of `brand` ≤ the per-screen budget
(Desk 1 verb; Floor 2 — the verb + the next-position mark).

**P-FOCUS-1** — focused controls show `outline-width: 0` AND the
ring (≥ 2px border/box) in the focus color.

**P-REDUCED-1** — under `prefers-reduced-motion: reduce`: computed
`animation-name: none` and no pending transitions on signature
nodes; the page remains complete (P-HERO-1 still passes).

**P-INTERACT-1** — the one-tap log: tap LOG → set-list rows +1, the
carried values hold, focus never lost, no navigation.

**P-PIXEL-1** — pixel census (native scale, deviceScaleFactor 2):
page clusters match the palette within tolerance (warm: light page
`b > r` bounded; dark page warm-black), brand fills cluster at the
declared hex, hairline rules detectable as 1px runs, the headline
block's ink coverage strictly exceeds the agate tail's.

**P-HEIGHT** — the 490px walker report continues (primary action
per screen within the SE fold).

A visual fact not covered by a probe above is not claimed. "Looks
right" is not available; **"measured within spec" is the only
done** this pass accepts.
