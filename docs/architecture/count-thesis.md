# THE COUNT — the tally system

> The 2026-11 blank-slate redesign thesis (the third upending). This
> document is the compass: the point of view, the complete token tables,
> the measured color law, the motion contracts, and the per-screen
> hierarchy map. `constants/theme.ts`, the MobilePremium kit, and the
> showcase build to THIS doc. It supersedes `signal-thesis.md` (retired
> with thanks — nothing below is inherited from it; whatever survived,
> survived on its own argument, not its predecessor's).

## 1. The point of view

Training is counting. Four days, each split AM and PM, each a list of
exercises, each a count of sets, each a count of reps at a weight.
Streaks, volume, personal bests — all of it is a count being kept. So
this app is **a count-keeping instrument**, and its one visual invention
is the oldest counting mark there is: **the tally**.

Every sequence in the app renders as a strip of strokes — **the
measure**. Days of the split, sets of an exercise, sessions of a week,
rest days of a setting: struck marks for what is done, a ghost field
for what is ahead, and **exactly one orange stroke per screen** marking
the next mark to be struck. Logging a set is the literal act of
striking a mark. There is no more honest UI for "I did the set" than
adding a mark, and no faster read of "where am I" than counting
strokes — it needs no numerals, no reading, one glance through glare.

Around the tally sits a **ruled field**: one continuous page — chalk in
the light, iron at night — divided by 1px hairlines into a ledger. No
cards floating on backgrounds, no shadows, no rounded friendliness:
**square-cut surfaces (2–4px radii), hairline rules, and type**. The
premium is the feeling of a precision-marked instrument panel: nothing
accidental, nothing decorative, everything in its measured place.

The structural spine, carried on every screen:

1. **No tab bar.** The Desk is a stack, not a deck. Home is the command
   surface (today's measure, the primary verb, and THE INDEX — three
   ruled rows that lead to Program, Library, Progress); everything
   else pushes and returns. Browsing is linear; chrome does not
   compete with content.
2. **The count board.** The live session is the count at full size:
   one station on screen, its sets as large tallies, the next set
   pre-armed at carry-forward weight — one thumb, one tap, struck.
   The board is docked in the thumb arc and never scrolls away.
3. **The iron interrupt.** Anything that must interrupt — toasts, the
   route curtain, and THE SESSION STRIP (a live iron bar pinned to the
   top of every Desk screen while a session runs, carrying the running
   elapsed count; one tap returns to the stage) — renders as an iron
   plate in both modes. Iron is the interrupt; orange is the strike.

Speed is a design property: the mid-set interaction is one tap on a
56px target; motion is 80–160ms, transform/opacity only, and never
stands between a thumb and its target; the design is complete with
motion off. The stage follows the user's light or dark preference —
the register difference between Desk and Stage is **density and
scale** (ledger-dense vs. one-thing-huge), not a second color scheme;
the only mode-independent surface is the iron interrupt.

## 2. Type system

### 2.1 The faces (self-hosted, OFL, variable — one woff2 each)

| Face | Family name | File | Axes | Role |
|---|---|---|---|---|
| Big Shoulders | `Big Shoulders` | `public/fonts/big-shoulders-var.woff2` (36 KB) | wght 100–900 | THE voice: statements — screen titles, day titles, station names, hero figures, button labels. Condensed and industrial by design (no width axis needed) |
| Azeret Mono | `Azeret Mono` | `public/fonts/azeret-mono-var.woff2` (26 KB) | wght 100–900 | THE markings: eyebrows, units, tags, ledger figures, timers, the armed counter. Mono = tabular by construction — every changing digit holds its column |
| Platform sans | system | — | — | body paragraphs, row titles, field labels, quiet meta |

The division of labor is strict: **Big Shoulders speaks in statements**
(words and static numerals at display sizes), **Azeret Mono keeps the
count** (every figure that changes or aligns), **platform sans does
the reading** (anything longer than a label). Condensed display at
small sizes loses legibility, so no Big Shoulders below 16px, and no
Azeret above 30px except the armed counter (56px — the one place the
count itself is the hero).

### 2.2 The type tokens (`theme.typography`)

Three ramps, interleaved: statements (30 · 44 · 76), mono figures
(14 · 26 · 56), words (11 · 13 · 15 · 16 · 17). A statement is always
one register louder than the figures around it; a figure always
tabular.

| Token | Face | Size/Line | Weight | Tracking | Variant | Carries |
|---|---|---|---|---|---|---|
| `mobileHero` | Big Shoulders | 76 / 78 | 800 | 0 | — | THE number: streak, tonnage, 404 |
| `mobileDisplay` | Big Shoulders | 44 / 46 | 800 | 0 | — | screen titles (words): day title, Library, Progress |
| `mobileTitle` | Big Shoulders | 30 / 32 | 700 | 0 | — | section headers, sheet titles |
| `mobileCounter` | Azeret Mono | 56 / 60 | 700 | −1 | tnum | the armed counter (weight × reps), timer at display size |
| `mobileFigure` | Azeret Mono | 26 / 30 | 700 | −0.5 | tnum | stat figures, PB values, day numerals in strips |
| `mobileAction` | Big Shoulders | 17 / 20 | 700 | +0.4 | — | button labels (uppercased at call site) |
| `mobileItemTitle` | platform | 16 / 22 | 600 | −0.1 | — | row titles: exercise names, settings rows |
| `mobileSubtitle` | platform | 15 / 20 | 600 | 0 | — | subtitles under statements |
| `mobileLedger` | Azeret Mono | 14 / 18 | 500 | 0 | tnum | set rows, Rx strings, dates, session meta |
| `mobileEyebrow` | Azeret Mono | 11 / 14 | 600 | +1.4 | (uppercased at call site) | section labels, strip labels, units |
| `mobileTag` | Azeret Mono | 11 / 16 | 500 | +0.4 | — | tags, chips, markings |
| `mobileBody` | platform | 15 / 22 | 400 | 0 | — | paragraphs, instructions |
| `mobileMeta` | platform | 13 / 18 | 400 | 0 | tnum | quiet meta, hints |
| `mobileFieldLabel` | platform | 13 / 16 | 600 | +0.1 | — | input labels |

Rules: consumers spread named styles; they do not pick ad-hoc
fontSize/fontWeight. Line-heights snap to 2. Figures carry tnum by
construction — and for Azeret it is structural (monospaced), so timers
and counters cannot jitter even while animating.

Retired from the shell's optional axes: `displayCondensed` /
`mobileTitleCondensed` (Big Shoulders is already the condensed
position; the shell keeps its slots for consumers that want a width
axis — this consumer leaves them undeclared).

### 2.3 Spacing & rhythm

4pt grid. Page gutter **16** everywhere (the ruled field runs edge to
edge; a tight gutter is the ledger read). Section rhythm **28**.
Ledger row height ≥ 48 (44+ effective target with margin). Control
heights: buttons 52, the count board's LOG 56, inputs 48, steppers
44. Statement margins: a `mobileDisplay` title always gets ≥ 20 above
(the statement breathes even though the field is tight).

### 2.4 Shapes

| Token | Value | Reads as |
|---|---|---|
| `surface` | 4 | bounded surfaces of data (sheets' inner panels, alerts) |
| `sheet` | 8 | portals (swap bench, finish dialog, sheets) |
| `control` | 3 | buttons, inputs — cut, not machined-round |
| `tile` | 2 | day tiles, selection rows, tallies' feet |
| `tag` | 2 | chips — a marking box, never a pill |

Square-cut is the law; the only non-right angle in the system is the
fifth tally stroke's diagonal.

### 2.5 The tally — spec of the mark

The system's one invented glyph, rendered with Views (no canvas, no
icon font):

- **Stroke (large):** 7 × 44. **Small:** 4 × 22. Corner radius 1.
- **Group:** five counts — four vertical strokes, the fifth count
  rendered AS the diagonal across them (the prison-wall convention;
  sets beyond five start a new group). The diagonal appears only when
  the fifth count of the group is actually struck — a half-filled
  group shows bare verticals, never a premature slash.
- **States:** *struck* — solid content color (ink on chalk, chalk on
  iron); *next* — brand color, solid, with a 2px brand baseline under
  it (the one orange mark on the screen — it is the next strike);
  *ghost* — 1px outline in the decorative tertiary ink (slots ahead,
  from the Rx max — quiet but seeable in both modes; `border`
  strength vanished on iron).
- **Semantics:** a struck mark is a logged set — immutable once
  struck (deleting the set un-strikes it; there is no editing a mark).
- **Accessibility:** the strip is `aria-hidden` decoration — the
  ledger rows and the armed counter carry the same information as
  text. No interaction ever requires reading the tallies.

## 3. Color law

Two palettes — **Chalk** (light, default) and **Iron** (dark,
opt-in) — plus the **iron interrupt** register (mode-independent, the
retuned `focus` slot). Chalk is a warm-neutral white with graphite
ink; Iron is a neutral near-black with chalk text. Neither palette
carries a hue cast: the only colors in the system are the neutrals
and the one strike orange.

| Slot | Chalk (light) | Iron (dark) |
|---|---|---|
| `backgroundDeep` (page) | `#F1F1EF` | `#0C0D0D` |
| `background` | `#F6F6F4` | `#101111` |
| `backgroundAlt` | `#ECECEA` | `#141515` |
| `card` | `#FAFAF8` | `#171818` |
| `cardAlt` | `#EFEFED` | `#1C1D1D` |
| `border` | `#D9D9D5` | `#272928` |
| `text` | `#131514` | `#ECECEA` |
| `textSecondary` | `#3B3F3D` | `#C4C6C3` |
| `textMuted` | `#5C6160` | `#979B98` |
| `textColors.tertiary` (decorative only) | `#8F938F` | `#696D6A` |
| `brand` (the strike, fill) | `#C64100` | `#FF7A2E` |
| `brandText` (small-text companion) | `#A83E00` | `#FF9A5C` |
| `textOnBrand` | `#FFF6EF` (chalk) | `#141514` (ink) |
| `brandOnInk` (on the interrupt) | `#FF8A3D` | `#FF8A3D` |
| `status.success` | `#0E7A4E` | `#3FC98E` |
| `status.warning` | `#8F5B00` | `#E5B54B` |
| `status.error` | `#BB2A1F` | `#F27F72` |
| `status.info` | `#1D5FCC` | `#74ABFF` |

The iron interrupt (`colors.focus.*`, identical in both palettes):
`background #0C0D0D`, `surface #171818`, `surfaceAlt #1D1E1E`,
`border #272928`, `text #ECECEA`, `muted #979B98`, `signal #FF7A2E`,
`onSignal #141514`, `track #222423`, `signalSoft rgba(255,122,46,.16)`.

**The strike law (usage, not just values):** brand orange appears
exactly three ways — (1) the NEXT mark (the tally about to be struck,
the armed counter's accents), (2) the primary verb (START, LOG SET,
FINISH→SAVE, GO) as a fill with its measured text companion, (3) the
living pulse (RESUME's breathing baseline, the session strip's LIVE
dot). It never decorates, never labels, never fills a second thing on
one screen. `tertiary` text is decorative only (3.2:1 on card) —
placeholders and watermarks, never information. Hierarchy on a brand
fill comes from size and face, not alpha: one paint per plate.

### 3.3 The measured matrix (computed, not hoped)

Every text-bearing slot × every surface it rides, computed from the
hex pairs (`.shots/redesign3/contrast3.ts`; regenerate before any
palette change). Reading: chalk/iron, both ≥ WCAG AA.

- text: **16.2 / 15.0** on card · secondary **10.2 / 10.4** ·
  muted **5.5–6.0** on page+card+cardAlt both modes
- brand as fill: **4.47 / 7.48** on page (**4.83 / 6.84** on card) —
  clears 3:1 UI-component with headroom
- brandText: **5.54 / 9.29** on page · textOnBrand on the fill:
  **4.73 / 7.04** (chalk on the burnt orange; ink on the bright one —
  the paint flips with the plate, both measured)
- status quartet as text on page+card: light **4.75–5.80**, dark
  **6.82–10.23**
- iron interrupt: text **16.5 / 15.0** on bg/surface, muted 6.3,
  signal-as-text 6.84, onSignal 7.04
- brandOnInk on the interrupt bg: **8.30**

## 4. Surface & elevation language

Flat. The page is one field; **1px hairlines divide it** —
`rgba(text, 0.10)` light, `rgba(text, 0.10)` dark (relative to each
palette's text). Elevation is declared three ways, never by shadow:

1. **Rule** — a hairline separates ledger rows and sections (the
   default; the field stays continuous).
2. **Tint step** — a surface one step off the page (`card`,
   `cardAlt`) for bounded data (sheets, the count board, alerts).
3. **Iron** — the interrupt plate (toast, curtain, session strip):
   the darkest surface in the system in both modes; it interrupts by
   being the heaviest thing on screen.

The count board is the one docked surface: tint step + top hairline;
no shadow. Portals (sheets/dialogs) use `sheet` radius + scrim; their
inner panels use `surface` radius. Nothing else floats.

## 5. Motion & scroll choreography

Motion exists to mark **the count changing** — nothing else moves.

| Motion | Spec | Contract |
|---|---|---|
| **The strike** | the next tally fills: scaleY 0→1 from its baseline, 120ms ease-out; the ledger row slides in (x −8→0 + fade, 120ms); counter value dips 80ms while carrying forward | never blocks the next tap (LOG stays live throughout; each strike owns only its new elements) |
| **Station change** | the station block slides x ±16 + fades, 160ms | content never leaves the screen rectangle |
| **Ruler-compress** | scroll-driven: mastheads and chapter heads compress under scroll (scale toward 0.6, translateY up, the compact marking fades in), transform/opacity only | scrubbed by `onScroll`, never springs; static under reduced motion |
| **Route curtain** | the iron sweep with a 2px signal leading edge, destination title stamped in Big Shoulders 800 | the shell's curtain machinery, reading the iron register |
| **The living pulse** | RESUME baseline / LIVE dot breathes opacity 1→0.5, 1.6s loop | the only loop in the system; off under reduced motion |

`prefers-reduced-motion`: every row above collapses to its final
state instantly (tallies render struck, curtains cut, pulses hold
full opacity). The design is complete without motion — the tally
language carries the information statically.

Scroll rails: transform/opacity only, 60fps, zero layout reads in the
gesture path; choreography never delays a tap (listeners only drive
styles; hit targets stay live mid-scroll).

## 6. Navigation & chrome

- **No tab bar.** `MobileTabBar` stays in the kit + showcase (shell
  primitive) but no app route mounts it. The Desk navigates by push
  from THE INDEX on home; back returns. The funnel pushes from home's
  primary verb and from the empty state.
- **The session strip** (`components/composed/SessionStrip.tsx`):
  while a session is active, an iron bar pins under every Desk
  header — LIVE dot (pulsing) · elapsed mono count · "RETURN →" —
  full-width tap target ≥44px straight to the stage. The session is
  never more than one tap away, on every screen, without a tab bar.
- **The stage is chromeless.** No strip, no tabs, no drawer: header
  (‹ · elapsed · FINISH), station rail, station, ledger, count board.
  Leaving forward is FINISH (dialog → save once, at the end); leaving
  backward asks.
- **The drawer primitive** stays synced-but-unwired (shell parity).
- Route contract unchanged: same routes, same params. The curtain
  seam (`NavigationHelper`) is untouched.

## 7. Screen-by-screen hierarchy map

Per screen: **focal → second read → quiet tail**, with the reason.

| Screen | Focal (loudest) | Second | Quiet tail | Why |
|---|---|---|---|---|
| **Home** | The day statement: measure strip (4 day-marks, today = the orange next) above the day title `mobileDisplay` + first lift + START (primary, full width) | THE INDEX: three ruled rows — PROGRAM / LIBRARY / PROGRESS — each with a mono count caption (`4d · am/pm`, `42 lifts`, `12d streak`) | This-week figures (mono row: streak · sessions · sets) + recent ledger (hairline rows: day mark, title, sets × tonnage mono) | Home answers "what am I walking into?" and is the whole Desk's hub — the day is the statement, the index replaces the tab bar |
| **Funnel (split-selection)** | The day measure: 7 tiles, each weekday mono + day-of-split numeral; the picked tile INVERTS (ink plate on chalk / chalk plate on iron — inversion is selection) | Archetype + window markings; the plan preview: numbered ruled rows (index mono, name, Rx right) | GO (primary) pinned in the footer | The choice being made is the content; three picks then GO, all visible in one column |
| **Stage (live session)** | THE COUNT BOARD, docked: the exercise's tally strip (struck/next/ghost) + the armed counter (`100` `×` `10` at `mobileCounter`, ± steppers 44; an unset counter is a ruled empty field — an underline on paper, never a glyph at counter scale) + LOG SET 56 | The station: name `mobileDisplay`, Rx + tags as marking chips; the station rail (01·02·03·04 marks) under the header; running session count (set N · tonnage mono) | The set ledger (mono rows, remove per row); SWAP / ADD / NOTE ruled actions | Mid-set the question is "what's next" — the board answers in marks + digits + one verb; everything else waits its turn |
| **Receipt (workout-detail?id=)** | Tonnage as `mobileHero` + date/day eyebrow | Per-exercise blocks: name + the session's tally group (sets as struck marks) + mono set rows | Note; delete (two-step, error-toned) | A receipt sums itself; tonnage is the headline of history, the tallies are its shape |
| **Program** | Day chapters: `DAY 01` mono eyebrow + title `mobileDisplay` + planned-sets `mobileFigure`; heads pin + ruler-compress under scroll | Slot ledger rows — the same numbered slot language as the funnel preview (one slot language everywhere) | Standing-substitution marks (2px strike left rule) + reset | The program is a document; days are chapters; the pin keeps the reader oriented |
| **Library** | The search field (48 — the screen's instrument) + equipment zone markings (BB · DB · MACHINE · CABLE · BW — the gym walked as zones) | Recently-logged rail + category sections with sticky mono headers; ruled rows (name + primary muscle + modality) | Result counts; custom-name adder (during a session) | Browsing is scanning; equipment is how the room is actually arranged |
| **Exercise detail** | The name `mobileDisplay` + type eyebrow; **muscle strokes**: primary muscles = 4 struck strokes, secondary = 2 ghost — the tally as data-viz | Instructions `mobileBody`; tip line | Equipment markings; add-to-session (primary, footer, during a session) | A reference page: the name anchors, the strokes tell you what it trains at a glance |
| **Progression** | Current streak as `mobileHero` in the strike tone + the streak measure beneath it | Totals as mono figures row | PB ledger (name + best set mono, hairline rows); link to Analytics | The streak is the emotional number; the rest is evidence |
| **Analytics** | The consistency field (square-cut cells, 4 levels: ghost → ink, today outlined) + tnum mono axis | Weekly volume bars at real bar weight, mono values | Range segmented control; counts | The field is the story; bars stop apologizing |
| **Settings** | Section eyebrows (mono) + ruled rows | Theme trio; rest days as a 7-mark measure (rest days struck orange) | Install row; version; sign out | Nothing here needs to win — but the rest-day strip speaks the system |
| **Auth (3 screens)** | The wordmark `ARMANDOTFIT` in Big Shoulders 800 + screen title `mobileDisplay` | The form (fields on the field, hairline-bounded) | Links, help lines | The brand speaks once: cut, industrial, confident |
| **Not-found** | `404` as `mobileHero` + one line of copy | Back button | — | Even the dead end is a count that isn't there |
| **Swap bench (sheet)** | Alternatives: names + ranked "why" lines in mono (shared muscles/equipment) | "Restore programmed" row (strike tone) | Weakest matches muted | The bench ranks by the body: shared equipment + muscles, computed at read |
| **Session strip (all Desk screens)** | Iron bar: LIVE dot (pulsing) + elapsed mono + RETURN → | — | — | The living count never hides while a session runs |

## 8. What this thesis replaces

Everything visual from SIGNAL is rescinded: the cold blue-steel
palette, the mode-independent near-black focus stage, the tab bar
with the raised center action, Saira/Saira Cond + Martian Mono, the
armed slab as ink-on-ink cave, machine-cut 8–10px radii. The data
spine, the shell contract, the gates, the accessibility floor, and
the 490px law are untouched (see repo CLAUDE.md). The focus register
SURVIVES as a slot but is retuned to THE COUNT's iron interrupt
values and its role shrinks to: toast, curtain, session strip. The
pre-armed one-tap commit survives on its own argument (it is the
10-second loop), re-rendered as the count board. The tab bar is
retired from chrome (the primitive stays shell-synced, unwired).

## 9. Verification hooks (the blind agent's eyes)

- Contrast matrix regenerated from `theme.ts` values before any
  palette commit (§3.3 numbers must hold — `.shots/redesign3/contrast3.ts`).
- Computed-style probes per screen assert §2.2's token table on key
  nodes: family, size, weight, tracking, tnum, color — light, dark,
  and on the count board in both modes.
- Geometry probes: ≥44px effective targets (measured boxes; hitSlop
  does not count), no horizontal overflow, primary action above the
  fold at 390×667 and 390×844, the mobile column respected at
  1280×800 (nothing straddles the centered 420px column), scroll
  states change computed transforms.
- The count board's one-tap log is proven by interaction probe: tap
  LOG → ledger row count +1, a tally strikes, armed values carry
  forward, no focus loss.
- Font probes: Big Shoulders weight axis live (ink coverage at 400 vs
  800), Azeret tnum exact ("1111" ≡ "9999" width), both families
  applied on key nodes.
- Pixel probes calibrated to this palette: light pages neutral
  (|b−r| ≤ 3 per channel cluster mean), iron pages dark + neutral,
  brand fills cluster near `#C64100` / `#FF7A2E`, iron interrupt
  surfaces dark in both modes.
