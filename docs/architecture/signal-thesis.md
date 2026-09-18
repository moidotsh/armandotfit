# SIGNAL — the two-register instrument system (RETIRED)

**Status:** Retired by `count-thesis.md` (the 2026-11 blank-slate
redesign, the third upending). Kept as the historical record of the
SIGNAL system; its taste is rescinded, its §7 map served as the
feature inventory for THE COUNT rebuild. `constants/theme.ts` and the
showcase now carry the COUNT tokens; when this doc and the tokens
disagree, the tokens win.

> The 2026-10 blank-slate redesign thesis. This document is the compass: the
> point of view, the complete token tables, the measured color law, the
> motion contracts, and the per-screen hierarchy map. `constants/theme.ts`,
> the MobilePremium kit, and the showcase build to THIS doc. It supersedes
> `logbook-thesis.md` (retired with thanks — nothing below is inherited from
> it; whatever survived, survived on its own argument).

## 1. The point of view

A gym app fails two ways: as a **filing system** (calm, complete, and useless
mid-set) or as a **video game** (exciting, and unreadable through sweat). This
app is neither. It is an **instrument** with two registers:

- **The Desk** — everything outside a live session: home, program, library,
  progression, analytics, settings, auth. Cold steel surfaces, near-black ink,
  hairline borders, no shadows, no warmth, no texture. The premium here is
  **calm precision**: reading surfaces that never shout.
- **The Floor** — the live session. A near-black **stage** (the `focus`
  palette, mode-independent: dark even in light mode, because an instrument is
  not a document — it should read like a stopwatch, not a page) showing
  **one exercise at a time — one station** — with the next set **pre-armed**
  at carry-forward weight. Logging the most common set in existence (same
  weight, same reps as the last one) costs **one thumb, one tap** on the armed
  slab's LOG button. Corrections are ± steppers beside numerals big enough to
  read at arm's length through glare.

One **signal** color — a measured safety orange — is the only voice allowed to
interrupt on any screen: it marks THE action (start, resume, log set, save)
and nothing else. Numerals are **Saira**, a variable-width athletic grotesk:
condensed (75%) and black (800) when a number must shout — day-of-split,
tonnage, streak, `100 × 10` — and normal-width when it speaks. Labels are
**Martian Mono**, tracked wide like instrument markings. Body text stays the
platform sans for native legibility and zero font-load cost. Nothing glows,
nothing is textured; **contrast, scale, and position do all the work**.

The structural spine, carried on every screen:

1. **A tab bar with a raised center action** — START before a session,
  RESUME (pulsing) during one. The primary verb of the app is always in the
  thumb arc, on every Desk screen.
2. **The stage** — stations, the station strip, the armed set. The flagship.
3. **Metadata as structure** — the catalog's equipment and muscle data
  organize the library the way the gym is walked (machines / free weights /
  cables), rank swap alternatives, and draw the muscle target bars on the
  exercise page.

Speed is a design property: the mid-set interaction is one tap on a 56px
target; motion is snap (80–240 ms, transform/opacity only, never between a
thumb and its target); the design is complete with motion off.

## 2. Type system

### 2.1 The faces (self-hosted, OFL, variable — one woff2 each)

| Face | Family name | File | Axes | Role |
|---|---|---|---|---|
| Saira | `Saira` | `public/fonts/saira-var.woff2` (99 KB) | wght 100–900, wdth 75–125 | THE voice: titles, display numerals, buttons |
| Saira Cond | `Saira Cond` | same file, second `@font-face` pinned `font-stretch: 75%` | wght 100–900 @ wdth 75 | shouting numerals: heroes, stage figures, station names |
| Martian Mono | `Martian Mono` | `public/fonts/martian-mono-var.woff2` (24 KB) | wght 100–800 | instrument labels: eyebrows, units, timers, tags, ledger meta |
| Platform sans | system | — | — | body paragraphs, field labels, quiet meta |

Both variable files are probe-verified: weight axis live (ink coverage
1132→2284 for Saira 300→800), width axis live (75% = 74% of the 100% width),
`tabular-nums` exact (1111 ≡ 9999 in both faces). One file serves both Saira
families — the browser fetches the URL once.

Why condensed heroes: a condensed black numeral at 80px is a stadium-clock
read — it fits `128` and `00:42` on a 390px screen with room for its unit,
and it is unmistakably not-body-type. Desk titles stay normal-width so words
never squeeze.

### 2.2 The type tokens (`theme.typography` — named styles, values retuned)

Words ramp 11 · 13 · 15 · 16 · 18 · 30. Figures ramp 30 · 56 · 80 (always
condensed, always tabular). A number is always one register louder than the
words around it.

| Token | Face | Size/Line | Weight | Tracking | Variant | Carries |
|---|---|---|---|---|---|---|
| `mobileHero` | Saira Cond | 80 / 84 | 800 | −1 | tnum | THE number on a screen: day-of-split, streak, 404 |
| `mobileDisplay` | Saira Cond | 56 / 60 | 800 | −0.5 | tnum | armed-set numerals, receipt tonnage |
| `mobileFigure` | Saira Cond | 30 / 34 | 800 | −0.25 | tnum | stat figures, day-chapter counts, PB values |
| `mobileTitle` | Saira | 30 / 34 | 700 | −0.5 | — | screen titles, desk headings |
| `mobileItemTitle` | Saira | 18 / 24 | 700 | −0.2 | — | row titles: exercise names, settings rows |
| `mobileAction` | Saira | 16 / 20 | 700 | +0.1 | — | button labels |
| `mobileSubtitle` | Saira | 16 / 22 | 600 | 0 | — | subtitles under titles |
| `mobileLedger` | Martian Mono | 15 / 20 | 500 | 0 | tnum | Rx strings, dates, timers, meta numbers |
| `mobileEyebrow` | Martian Mono | 11 / 14 | 600 | +1.2 | (uppercased at call site) | section labels, strip labels |
| `mobileTag` | Martian Mono | 12 / 16 | 500 | +0.4 | — | tags, chips |
| `mobileBody` | platform | 15 / 22 | 400 | 0 | — | paragraphs, instructions |
| `mobileMeta` | platform | 13 / 18 | 400 | 0 | tnum | quiet meta, hints |
| `mobileFieldLabel` | platform | 13 / 16 | 600 | +0.1 | — | input labels |

Rules: consumers spread named styles; they do not pick ad-hoc
fontSize/fontWeight. Line-heights snap to 2. Figures carry tnum by
construction — a call site cannot forget it.

### 2.3 Spacing & rhythm

4 pt grid. Section rhythm 32. Ledger row height ≥ 52 (44+ effective target
with center margin). Page gutter **20** (Desk) / **16** (Floor — the stage
wants its numbers closer to the edges). Control heights: buttons 52, armed
slab LOG 56, inputs 48, steppers 44. `theme.spacing` keeps its structural
keys; the rhythm above is how they are spent.

### 2.4 Shapes

| Token | Value | Reads as |
|---|---|---|
| `surface` | 10 | cards, bounded sheets of data |
| `sheet` | 14 | portals (the swap bench, finish dialog) |
| `control` | 8 | buttons, inputs — machine-cut, not friendly-round |
| `tile` | 6 | day tiles, selection rows |
| `tag` | 999 | chips only — a pill marks metadata, never an action |

## 3. Color law

Two palettes (light default, dark opt-in — both ship, resolved by
`useAppTheme()`) plus the **focus register**: a small, mode-independent
family for the live session that lives inside both palettes as
`colors.focus.*` (identical values in `light` and `dark` — the Floor does not
care how you keep your Desk).

### 3.1 The law

1. **One signal.** The `brand` slot (with `brandText` / `textOnBrand`
   companions) is the only accent. It marks THE action per screen and
   progress-alive states. Nothing else may wear it.
2. **Ink label on signal fill.** `textOnBrand` is near-black ink in every
   mode (7.5:1 on the focus signal) — road-sign discipline; white on orange
   measured 2.6:1 and is banned.
3. **Every text-bearing slot measured.** AA (4.5:1) for text, 3:1 for fills
   and display type, on the darkest surface it rides, both modes + focus.
   `textColors.tertiary` is decorative-only (3.09:1 light) and never carries
   information.
4. **Steel is cold.** Light grays carry a blue cast (#E8EAEE page), dark
   surfaces never go slate-blue at the deep end (#0B0D12 page). No warm
   browns anywhere — warmth was the old language.

### 3.2 Palette values

| Role | Light | Dark | Focus (both) |
|---|---|---|---|
| page (`backgroundDeep`) | `#E8EAEE` | `#0B0D12` | `#0A0C10` |
| background | `#F4F5F8` | `#10131A` | — |
| backgroundAlt | `#ECEEF2` | `#141822` | — |
| card | `#FFFFFF` | `#161B26` | `#12151C` |
| cardAlt | `#F1F3F6` | `#1C2230` | `#181D27` |
| border | `#D3D8E0` | `#2A3140` | `#232B3A` |
| text | `#0B0E13` | `#EDF0F5` | `#F2F5FA` |
| textSecondary | `#39414D` | `#C3CAD6` | — |
| textMuted | `#5B6472` | `#8B95A6` | `#98A2B4` |
| tertiary (decorative) | `#8B93A1` | `#697386` | — |
| brand (signal fill) | `#E8510A` | `#FF7A29` | `#FF7A29` |
| brandText | `#993A05` | `#FF8B47` | — |
| textOnBrand | `#0B0E13` | `#0B0D12` | `#0A0C10` |
| status.success | `#0B7147` | `#3DD68C` | — |
| status.warning | `#8F5B05` | `#E8B44A` | — |
| status.error | `#B52727` | `#F27B7B` | — |
| status.info | `#1D5FD6` | `#6CA6FF` | — |

### 3.3 The measured matrix (computed, all PASS)

Light desk — text 19.33 on card / 16.05 on page; secondary 10.31 / 8.56;
muted 5.98 / 4.97 (5.38 on cardAlt); signalText 7.09 / 5.89; signal-as-fill
3.74 / 3.11; ink-on-signal 5.17; success 6.06 / 5.03; warning 5.73 / 4.76;
error 6.39 / 5.31; info 5.74 / 4.76. Dark desk — text 15.08 / 17.01;
secondary 10.45 / 11.79; muted 5.70 / 6.43 (5.26 on cardAlt); signalText
7.41 / 8.36; signal-as-fill 6.62 / 7.47; ink-on-signal 7.47; statuses
6.48–10.36. Focus register — text 17.91 on page / 16.71 on surface / 15.45
on surfaceAlt; muted 7.61 / 7.10; signal-as-fill 7.52 / 7.02; ink-on-signal
7.52. (Full pair list lives in the probe suite; this matrix is regenerated
by `contrast2.ts` before any palette commit.)

## 4. Surface & elevation language

- **The Desk is flat.** Cards are white (or `cardAlt`) with a 1px hairline
  (`rgba(11,14,19,0.10)` light / `rgba(242,245,250,0.10)` dark) and radius
  10. No outer shadows on Desk surfaces — elevation is declared by the
  border and by tint steps, not by glow. `mobilePremium.surfaceGlow` is
  retuned to a barely-there contact shadow (`0 1px 2px` at 5%).
- **The Floor is flat and layered by tint.** Stage surfaces step
  `#0A0C10 → #12151C → #181D27`; hairlines at `#232B3A`. The ONE shadow in
  the system belongs to the **armed slab** — it docks over content and earns
  a lift (`0 -8px 24px rgba(0,0,0,0.5)`); nothing else on the Floor casts.
- **Signal fills** (buttons, armed LOG, raised tab action, selected
  segments) take the signal at 100% with ink labels. Signal never appears as
  a wash or tint on large surfaces except `brandSoft`/`brandMuted` chips.
- **Atmosphere**: `flat` — page tint + a whisper vignette. No orbs, no
  gradients, no grain.

## 5. Motion & scroll choreography

**Snap, don't glide.** The machine metaphor extends to motion: everything is
fast, short, and confident.

| Class | Duration | Curve | Used for |
|---|---|---|---|
| snap | 80–120 ms | ease-out | press feedback, chip toggles, the set stamp |
| move | 160–240 ms | ease-out | sheets, station slides, curtain sweep |
| settle | ≤ 280 ms | ease-out | masthead compression follow-through |

Rules (auditable):

1. **transform / opacity only.** No layout properties animate, anywhere.
2. **Never between a thumb and its target.** Entrance motion never gates a
   tap: the armed slab is tappable at frame 1; the stamp animation plays
   AFTER the state change (post-interactive), 120 ms.
3. **Reduced motion collapses to static.** With `prefers-reduced-motion`,
   every transition is instant (0 ms), every scrubbed value renders at its
   final state, the curtain and pager swaps are cuts. The design is complete
   without motion — motion only adds confidence, never information.
4. **Scroll choreography** (rAF-driven, transform-only, the absorb-machinery
   class):
   - **Today**: the masthead (eyebrow + hero day figure + title + START)
     compresses under scroll into a slim top bar — the day figure scales to
     its `mobileFigure` size and the section settles under it. Pinned by
     measurement, not sticky hacks.
   - **Stage**: the station strip fills as stations complete; station swaps
     slide horizontally (translateX); the armed slab never moves.
   - **Program**: day-chapter heads pin and compress as the next chapter
     arrives.
5. **Route curtain**: the ink curtain machinery stays (web-only, off under
   reduced motion), restyled as the **signal sweep** — a focus-page cover
     wipes with a 2px signal leading edge and the destination title stamps
     in Saira Cond. ≤ 320 ms total.

## 6. Navigation & chrome

- **MobileTabBar** (new kit primitive, ported to the shell): 5 slots —
  Today · Library · **[START/RESUME]** · Progress · Program. Bar height 56 +
  safe area; labels Martian Mono 10/500 tracked +0.8; active = ink + 2px
  signal top notch; inactive = muted. The center action is a 56px signal
  circle, raised 12px past the bar top, ink glyph; during an active session
  it becomes RESUME with a slow signal pulse (1.6 s opacity breath — the one
  ambient animation, off under reduced motion).
- Desk screens compose `DeskShell` (header + tab bar + atmosphere). The
  drawer is retired from app chrome (the primitive stays in the kit for
  shell parity). Settings rides the Today header; Analytics links from
  Progress.
- **The Floor has no tab bar.** Entering a session covers the chrome; the
  stage's own header (minimize, station strip, Finish) is the whole nav.
  Minimizing returns to the Desk with RESUME pulsing.

## 7. Screen-by-screen hierarchy map

Per screen: **focal → second read → quiet tail**, with the reason.

| Screen | Focal (loudest) | Second | Quiet tail | Why |
|---|---|---|---|---|
| **Today (home)** | The masthead: day-of-split as `mobileHero` (Saira Cond 80, ink) + day title `mobileTitle` + "first up" lift; the START button (signal fill) directly under it | This-week figures row (`mobileFigure`: streak · sessions · all-time) on paper-steel, no cards | Recent sessions ledger (hairline rows) | The screen answers "what am I walking into?"; the day IS the hero, START is the one signal |
| **Funnel (split-selection)** | The picked day: an inverted ink tile in a 7-day strip (selection = inversion, not borders); date numeral condensed | The plan preview: numbered ledger rows (index mono, name `mobileItemTitle`, Rx right `mobileLedger`) | Split archetype + AM/PM segmented controls; the GO button (signal) in the footer | The choice being made is the content |
| **Stage (live session)** | The armed set slab: NEXT SET eyebrow, `100 × 10` at `mobileDisplay`, LOG (signal, 56) — docked bottom, never scrolls | The station: name in Saira Cond 800, Rx line, tag chips, the set ledger above; the station strip (01·02·03·04) under the header | Session strip (elapsed · sets · tonnage in mono); swap ⇄; add exercise | Mid-set the question is "what's next" — the armed slab answers in one tap; everything else waits its turn |
| **Receipt (workout-detail?id=)** | Tonnage as `mobileDisplay` + started-at eyebrow | Per-exercise ledgers: name + set rows (mono, hairline) | Note; delete (two-step, error-toned) | A receipt sums itself; tonnage is the headline of history |
| **Program** | Day chapters: `DAY 01` mono eyebrow + title `mobileTitle` + planned sets as `mobileFigure`, heads pinning + compressing under scroll | Slot ledger rows — the same slot language as the funnel preview (one slot language everywhere) | Standing-substitution marks (2px signal left rule) + reset | The program is a document; days are chapters |
| **Library (exercise-database)** | The search field (48px — the screen's instrument) + equipment chips (BB·DB·Machine·Cable·Bodyweight: the gym walked as zones) | "Recently logged" rail + muscle-category sections, hairline rows (name + primary muscle + modality) | Result counts; custom-name adder (during a session) | Browsing is scanning; equipment is how the room is actually arranged |
| **Exercise detail** | The name `mobileTitle` + type eyebrow; the **muscle target bars** (primary = full signal bar, secondary = 40% steel bar — metadata as data-viz) | Instructions `mobileBody`; tip line | Equipment chips; add-to-session (signal, in footer, during a session) | A reference page: the name anchors, the bars tell you what it trains at a glance |
| **Progression** | Current streak as `mobileHero` (signal tone) | Week / all-time figures row | PB ledger (name + best set mono, hairline rows); link to Analytics | The streak is the emotional number; the rest is evidence |
| **Analytics** | The consistency grid (the one visual — steel-to-signal 4-level cells, tnum axis) | Weekly session bars at real bar weight with mono values | Range segmented control; counts | The grid is the story; bars stop apologizing |
| **Settings** | Section eyebrows (mono) + rows (`mobileItemTitle` labels) | Theme trio; rest-day tiles (7-slot selector) | Install row; version; sign out | Nothing here needs to win |
| **Auth (3 screens)** | The wordmark (Saira Cond 800) + screen title `mobileTitle` | The form (one sheet: card + hairline) | Links, help lines | The brand speaks once, cold and confident |
| **Not-found** | `404` as `mobileHero` | One line of copy | Back button | Even the dead end speaks the system |
| **Swap bench (sheet)** | Alternatives list: names `mobileItemTitle`, "why" line in mono (shared muscles/equipment) | "Restore programmed" row (signal text) | Ranked tail (weakest matches muted) | The bench ranks by the body: shared equipment + muscles, computed at read |

## 8. What this thesis replaces

Everything visual from the logbook system is rescinded: warm paper surfaces,
Archivo/IBM Plex Mono, print grain, ink plates on Desk surfaces, the drawer
as primary chrome, and the long single-scroll live ledger. The data spine,
the shell contract, the gates, the accessibility floor, and the 490px law
are untouched (see repo CLAUDE.md). The focus register, the tab bar, and the
`displayCondensed` face axis are shell-level structure and port to the
starter domain-neutrally.

## 9. Verification hooks (the blind agent's eyes)

- Contrast matrix regenerated from `theme.ts` values before any palette
  commit (§3.3 numbers must hold).
- Computed-style probes per screen assert the token table (§2.2) on key
  nodes: family, size, weight, tracking, tnum, color — in light, dark, and
  on the stage in both modes.
- Geometry probes: ≥44px effective targets (measured boxes, hitSlop does
  not count), no horizontal overflow, primary action above the fold at
  390×667 and 390×844, scroll states change computed transforms.
- The stage's one-tap log is proven by interaction probe: tap LOG → ledger
  row count +1, armed values carry forward, no focus loss.
