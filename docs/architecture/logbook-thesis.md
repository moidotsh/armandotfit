# The Logbook Thesis — the 2026 redesign (RETIRED)

**Status:** Retired by `signal-thesis.md` (the 2026-10 blank-slate
redesign). Kept as the historical record of the logbook system; its
taste is rescinded, its §7 map served as the feature inventory for the
SIGNAL rebuild. `constants/theme.ts` and the showcase now carry the
SIGNAL tokens; when that doc and the tokens disagree, the tokens win.

---

## 1. The point of view

A gym logbook is not an app. It is a sheet of paper with **huge numbers
where the work goes** and small print for everything else. This app's
screens today are cards of equal-weight 12–15px text with the work buried
inside; the redesign inverts that: **the numbers are the architecture**.
Every screen states its one fact at logbook scale — the day, the load,
the streak, the elapsed clock — in a display face; the facts around it
set in a monospaced ledger face; the words stay in the platform sans.
Hierarchy comes from type first, surface second, color third. The ink
dialect's best existing moments (the curtain, the chit, the drawer plate)
stop being confined to chrome: the plate becomes a screen-level device
exactly where a decision or a datum deserves the loudest treatment the
language has. Restraint everywhere else: paper, hairline rules, and
quiet print. Premium here means every screen can answer its one question
at arm's length, mid-set, in glare — and nothing else shouts.

## 2. The type system

Two faces are declared (self-hosted, OFL, no new packages — they ride the
existing `FONTS` seams and the injector's font-preload machinery):

| Face | Files | Role |
|---|---|---|
| **Archivo** (700, 800) | `public/fonts/archivo-{700,800}.woff2` | The poster voice: hero figures, display figures, titles. A grotesque with athletic authority at 28–72px; tightens as it grows. |
| **IBM Plex Mono** (500, 600) | `public/fonts/plex-mono-{500,600}.woff2` | The ledger voice: set rows, timestamps, Rx, eyebrows, any figure that is a FACT rather than a statement. Mono = tabular by construction. |
| Platform sans | system stack | Everything else — body, labels, buttons. Legibility for free; the identity lives in the two declared faces. |

Loading (web): `@font-face` in an id'd `<style>` in `index.html`, the
matching `<link rel="preload" as="font" crossorigin>` lines, restored at
runtime from `app/_layout.tsx` — the documented mirror trio. The
build-time injector carries both into every exported route.

### 2.1 The token table (canonical values live in `constants/theme.ts`)

Two interleaved ramps — words and numbers. **A number is always one step
louder than the words around it.**

| Token | Size/Weight | LH | Tracking | Face | Case | Role |
|---|---|---|---|---|---|---|
| `mobileHero` *(new)* | 72/800 | 76 | −2.5 | Archivo | as-written | The one hero figure per screen. Day numbers, the 404, the streak. |
| `mobileDisplay` | 44/800 | 48 | −1.5 | Archivo | as-written | Secondary figure: receipt volume, totals. |
| `mobileFigure` | 28/700 | 32 | −0.5 | Archivo | as-written | Stat figures in rows and strips. |
| `mobileTitle` | 28/700 | 32 | −0.8 | Archivo | as-written | Screen titles and day titles. |
| `mobileItemTitle` | 18/700 | 24 | −0.3 | sans | sentence | Row leads: exercise names, list titles. **Was 14/600 — the biggest promotion in the system.** |
| `mobileAction` | 16/600 | 20 | +0.2 | sans | sentence | Buttons and links. |
| `mobileLedger` | 15/600 | 20 | 0 | Plex Mono | as-written | In-row numeric facts: set rows, dates, Rx, PB values. |
| `mobileBody` | 15/400 | 22 | 0 | sans | sentence | Prose. |
| `mobileSubtitle` | 15/400 | 22 | 0 | sans | sentence | Supporting lines (color differentiates from body). |
| `mobileFieldLabel` | 13/600 | 16 | +0.2 | sans | sentence | Input labels. |
| `mobileMeta` | 13/400 | 18 | 0 | sans | sentence | Captions, quiet hints. |
| `mobileTag` | 12/600 | 16 | +0.2 | sans | as-written | Chip text. |
| `mobileEyebrow` | 11/700 | 16 | +1.6 | Plex Mono | UPPER | Section leads and micro labels — the receipt's voice. |

Scale arithmetic: words 11 → 13 → 15 → 18 → 28 (steps 1.18, 1.15, 1.27,
1.47); figures 15 → 28 → 44 → 72 (steps 1.87, 1.57, 1.64). Every figure
token carries `fontVariant: ['tabular-nums']` by construction.

### 2.2 Rhythm law

- **Spacing snaps to 4**: {4, 8, 12, 16, 20, 24, 32, 48, 64}. Two
  exceptions: hairline offsets and optical pair-kerning (2). Section
  separation is **24** (was 16) — sections must read as separate entries
  of the logbook.
- **Line-heights snap to 2** and derive from the token table above —
  call sites never invent one.
- Content column padding is 20; card padding is 16–20; ledger row
  vertical rhythm is 12; touch rows are ≥44 tall.

## 3. Surface and elevation language

Five levels, from recedes to advances:

| Level | Name | Treatment | Use |
|---|---|---|---|
| 0 | **Paper** | The mode background (`backgroundDeep`). No box. | Most content. Sections are typographic blocks led by an eyebrow + hairline rule — not cards. |
| 1 | **Rule** | 1px hairline (`mobilePremium.hairlineBorder`). | Separates ledger rows and sections; the quietest structure there is. |
| 2 | **Sheet** | `MobileSurface` at radius 12 — ONE per screen where a bounded container is semantically load-bearing (input clusters, settings groups, the grid). | Forms, settings, analytics containers. |
| 3 | **Fill** | The brand fill (buttons, active tiles, selected states). | The screen's single action and its live selections. |
| 4 | **Plate** | The ink plate (`colors.text` background, `colors.background` type, print grain) — the dialect's loudest surface. | Drawer, toasts, curtain, the substitution sheet, and exactly one screen-level moment per screen where earned (the picked day, the swap sheet, the 404). |

CornerRadius family (`theme.shapes`): `surface` 12, `sheet` 16,
`control` 10, `tile` 8, `tag` 999. Flatter than before — printed matter
has almost no radius.

**Selection law:** selected = inverted (ink fill, paper type) or brand
fill — never a border-plus-tint. Borders at 8% alpha do not survive
glare.

## 4. The figure language

`Figure` is the only way a number reaches the screen. Sizes
`'hero' | 'display' | 'md' | 'sm'` ride `mobileHero / mobileDisplay /
mobileFigure / mobileLedger`. Additions:

- **`unit`** — a small trailing unit ("kg", "d") at ~0.45× size, mono,
  muted: the logbook convention `72 kg` with the unit whispering.
- **`tone`**: `'ink' | 'brand' | 'plate'` — `plate` is paper-type for
  figures living on an ink plate.
- The label is micro-caps mono (`mobileEyebrow`), muted.

One hero figure per screen is law. The hero is chosen per screen in §7.
Tabular figures everywhere a number can change (elapsed clocks above
all).

## 5. Color law

The ember/paper family survives, tightened. Color is the THIRD
hierarchy device — never the first.

- `brand` (#E8590C light / #F76B1C dark): fills and large-type only
  (≥3:1 verified: 3.58 / 3.15 on paper, 6.10 dark). The primary button,
  active tiles, selected fills, the hero's accent when earned.
- `brandText` (#A03A08 / #F87F3A): brand as small text (5.96–6.98:1).
- `textOnBrand` (#231B15 / #1A1511): type on brand fill (4.73 / 6.10).
- **NEW `brandOnInk`** (#F0A468 light-plate / #B23A08 on the dark bone
  plate): brand-hue accents on the ink plate (8.24 / 5.02). The same
  companion discipline as `brandText`/`textOnBrand` — one hue, adjusted
  for its surface; not a second accent.
- **Ink ladder (light)**: `text #231B15` (16.95 on card) →
  `textSecondary #4E443B` (9.49/8.36) → `textMuted #6E6154` (6.00 on
  card / 5.29 on deep — retuned from #63574B for a wider muted gap) →
  `tertiary #847767` — **decorative only** (placeholders, disabled,
  watermarks; 4.36/3.84, documented non-informative).
- **Ink ladder (dark)**: `text #F4F0EA` (15.96/14.52) → `textSecondary
  #D8CEC2` (11.67/10.62) → `textMuted #9A8E80` (5.65/5.15) →
  `tertiary #7D7061` — decorative only (3.42).
- **Fixes:** light `textMuted` #63574B → #6E6154; light `tertiary`
  #9A8E80 → #847767 with informative uses migrated to `textMuted`; dark
  `tertiary` #64748B → #7D7061 (slate out); dark `backgroundDeep`
  #050810 → **#14100C** (the slate blue-black was a foreign body; the
  night is warm); dark glass tints de-slanted warm.
- Plate type: `colors.background` on a `colors.text` plate, muted
  variants at 0.72 alpha (≥6.3 both modes — computed).

Every text-bearing pair above is computed WCAG AA on the darkest surface
it rides, both modes (worksheet: contrast run archived with the
redesign). Status hues unchanged (all pass).

## 6. Motion rules

The shell's discipline is law, unchanged: `FadeIn`/`Crossfade`/press
respond, reduced-motion honored everywhere, the curtain for routes, no
bespoke hero animations. Additions:

- Hero figures arrive with the section's `FadeIn` — no special dance.
- The plate (drawer, swap sheet) slides with the existing iOS-sheet
  curve; nothing bounces.
- Nothing animates a number except the clock (`tabular-nums` keep the
  digits still while they change).

## 7. Screen-by-screen hierarchy map

Per screen: **focal → second read → quiet tail**, with the reason.

| Screen | Focal (loudest) | Second | Quiet tail | Why |
|---|---|---|---|---|
| **home** | Today block: day-of-split as `hero` figure + day title (`mobileTitle`), first lift at `mobileItemTitle` | The Start button — the only brand fill above the fold | Stat row (streak / week / all-time as `figure`s on paper, no card) + recent sessions as ledger rows under hairlines | The screen answers "what am I walking into?" — the day IS the hero; cards retired. |
| **split-selection** | The picked day: an inverted tile (ink plate) in a 7-day strip; tile date in display scale | The plan preview as numbered ledger rows (index mono, name `mobileItemTitle`, Rx right-aligned mono) | Split archetype + AM/PM as segmented controls, not card lists | The choice being made is the content; inversion (not borders) carries selection. |
| **workout-detail (live)** | The sticky exercise header: name at `mobileItemTitle`, done/total and last set in mono — pinned while its sets scroll | The sets ledger: 48px inputs, mono 17/600, filled sets rendering as ledger text with the ✓ | Stats strip (elapsed · sets · kg) in `mobileLedger`; tags; notes | Mid-set the question is "what's next and what did I just do" — the sticky header answers at arm's length; inputs sized for gloves. |
| **workout-detail (receipt)** | Total volume as `display` figure + the date as eyebrow mono | Per-exercise tables: name `mobileItemTitle` + set ledger rows | Note, tags | A receipt sums itself: the tonnage is the headline of history. |
| **program** | Day headers as typography: "DAY 01" mono eyebrow + title `mobileTitle` + planned sets as right `figure` | Slot rows — the same ledger-row language as split-selection's preview (one slot language everywhere) | Tags, override rules (2px brand left rule) | The program is a document, not a stack of cards; days are its chapters. |
| **exercise-database** | The search field (44px, the screen's instrument) | "Recently logged" + category ledgers; rows are hairline rows, not cards | Modality chips, result counts | Browsing is scanning; rows scan faster than cards. |
| **exercise-detail** | The name in `mobileTitle` + type eyebrow | Instructions as `mobileBody` on paper | Muscle/equipment chips; add-to-session in the footer | A reference page: the name is the anchor. |
| **progression** | Current streak as `hero` | The figure row (week / all-time at `figure`) | PB ledger: mono table rows under hairlines | Streak is the emotional number; the rest is evidence. |
| **analytics** | The consistency grid (the one visual) | Weekly bars at real bar weight, values in mono | Range control, counts | The grid is the story; bars stop apologizing. |
| **settings** | Section eyebrows + rules (utility screen, no hero) | Rows with `mobileItemTitle` labels | Hints in `mobileMeta` | Nothing here needs to win. |
| **auth (3 screens)** | The wordmark in Archivo 800 + screen title `mobileTitle` | The form (one sheet) | Links, help lines | The brand speaks once, quietly confident. |
| **not-found** | "404" as `hero` | One line of copy | Back button | Even the dead end speaks logbook. |
| **drawer** | The ink plate (unchanged language) | Item eyebrows | Sign-out ghost | Survives on merit. |
| **swap sheet (InkRail v2)** | The ink plate list: names at 17/700 paper type, modality in `brandOnInk` mono micro | "Restore programmed" row | Ranked tail | The sheet joins the dialect it lives in. |

## 8. What survives from the old design (re-earned, not inherited)

- The warm paper/ink family and the ember brand — fixed where failing.
- The ink dialect (curtain, chit, drawer plate) — extended into screens.
- Tabular-figure discipline, honest empty/error states, 490px law,
  motion restraint, the showcase-as-truth.

## 9. Build order

1. Tokens (`theme.ts`: fonts, typography, shapes, color fixes) + font
   files + the mirror trio (`index.html`, injector, runtime restore).
2. Kit: `Figure` radicalized, `MobileSectionEyebrow` rule option, button
   label at 16/600, showcase sections for hero/figure/mono. Gate.
3. Screens one at a time: home → split-selection → workout-detail (both
   modes) → program → library → exercise-detail → progression →
   analytics → settings → auth → not-found → swap sheet.
4. Probes per screen (computed styles against this table, geometry,
   touch targets, 490px, both modes) + before/after captures.
5. Port shell-owned structure to arqavellum in the same windows
   (token structure, Figure, eyebrow rule, showcase sections —
   domain-neutral, arqavellum keeps its own values).
