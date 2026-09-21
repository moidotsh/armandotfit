# UI/UX Pass — armandotfit

You are taking over armandotfit (personal fitness PWA, solo-user scale) for a thorough UI/UX pass across every screen. The data layer, schema, and core logging flows are done and stable — your job is to make every surface feel as considered as the best ones already do.

## Read these first

- `CLAUDE.md` — repo operating context, 13 invariants, the 13-audit gate. Non-negotiable.
- `docs/architecture/exercise-logging-governance.md` — identity model, tags, substitution.
- `constants/theme.ts` — the ember ink palette (the ONLY color source; S7 bans hardcoded hex).
- `app/dev/premium` (dev only) — the MobilePremium showcase; the visual source of truth for primitives.

## What the app is

A gym logbook for 1–5 serious lifters training a fixed 4-day AM/PM hypertrophy split. The core funnel: **open → launcher card → one tap → picker (pre-configured) → Start session → log sets → Save.** Session-time exercise substitution via a tiny `⇄` glyph → clean bottom sheet with smart-ranked alternatives.

## The design language: ember ink

- **Dialect**: `DIALECT = 'ink'` — flat atmosphere (no orbs), InkPanel drawer (warm-ink plate + print grain + brand edge rule), chit toasts (ink plate, paper type, one status dot), curtain route transitions (cover/stamp/lift).
- **Palette** (all WCAG AA measured): brand fill `#E8590C` (ember), brandText `#A03A08`, warm-ink text/plate `#231B15` on warm paper `#F4F0EA`; dark mode = ember `#F76B1C` on warm night `#1A1511`, bone plate `#F1EAE0`. `textOnBrand` = warm ink (not white).
- **Boot plate**: id'd `<style>` in `index.html` paints the warm ink cover pre-JS; lifted by `markBootReady()`.
- **Typography**: `theme.typography` named styles only (mobileTitle/Subtitle/Body/Action/Eyebrow/FieldLabel). No ad-hoc fontSize values in screens — pick from named styles or the theme's spacing/type scale.

## The user's taste (learned the hard way — respect it)

The owner has been through FIVE iterations of the substitution UI alone. Here is what they rejected and why:

1. **"Swap" text on every row + bottom sheet** — "REALLY ABYSMAL UI/UX. Do better."
2. **Collapse/expand inline list** — "don't like the collapse/expand to select alternative"
3. **Always-visible card rail** (bordered cards with modality labels) — "too noisy"
4. **Bare text snap-scroller** — "i hate it. i want it to be mostly invisible but obvious to open to pick something else"
5. **The keeper**: tiny `⇄` glyph after the name + bare sheet with ranked names. "mostly invisible, obvious to open"

**The pattern they want**: clean surfaces with zero extra UI until needed, then one obvious small affordance opens a focused, minimal picker. Not adventurous for its own sake — *quietly* excellent. Think printed matter: the information is the design.

## Screens and their current state

| Screen | Route | State | Your focus |
|---|---|---|---|
| **Home** | `/` | Launcher hero + streak stats + recent list + explore row | Streak hero is good (56pt ember figure). Recent sessions are still plain rows — could show day title, exercise count, tonnage. Quick actions row could be tighter. |
| **Split picker** | `/split-selection` | Split toggle, 7-day strip, AM/PM toggle, preview list | Functional but visually dense. The day tiles could breathe more. The preview could use the Rx in tabular figures for scanability. |
| **Active session** | `/workout-detail` (no id) | Stats strip (timer/sets/kg), exercise cards with tags + sets + progress + `⇄`, footer Save/Discard | The money screen. Stats strip and set rows are solid. Tag chips could be visually quieter. The "Add exercise" button at the bottom could be more inviting. Save button could show total sets. |
| **Read-only session** | `/workout-detail?id=` | Notes, exercise list with tags + sets, delete | Bare. No header context (which day? how long?). No summary stats. This is the history surface — make it feel like reviewing a receipt. |
| **My Program** | `/program` | Split toggle, 4 day sections with AM/PM, slot rows with Rx + tags + `⇄` | Functional. Could benefit from per-day volume summary (total sets, exercise count). The one-a-day view is a long flat list — could use session-window eyebrows even there. |
| **Exercise library** | `/exercise-database` | Search, modality chips, category sections, custom-exercise entry | Good structure. The category eyebrows could be sticky. Card density could be tighter — 92 entries means a lot of scrolling. Consider a "recently logged" section at the top. |
| **Exercise detail** | `/exercise-detail` | Instructions, tips, muscles, equipment, add-to-session CTA | Functional but plain. The muscles/equipment sections could use the kit's attribute-chip pattern. The "Add to session" CTA only shows when a session is active — could hint at this state. |
| **Progression** | `/progression` | Totals, personal bests (new), weekly | PB list is new and good. Totals section is still plain rows. Could benefit from a sparkline or trend indicator (computed at read). |
| **Analytics** | `/analytics` | Range selector, consistency grid, weekly bars | The consistency grid (kit's ActivityGrid) is solid. The weekly bars are text-based — could use the kit's SegmentedProgress or a simple bar chart. |
| **Settings** | `/settings` | Email, theme picker, rest days, install, version, sign out | Adequate. The rest-days multi-select could be more visual (day tiles instead of a list). |
| **Auth** | `/login`, `/register`, `/forgot-password` | Shell defaults | Likely untouched by the ember-ink pass. Check they render correctly in the ink dialect (auth screens get the flat atmosphere + the boot plate color). |
| **Not found** | `/+not-found` | Shell default | Should feel ink-branded, not generic. |

## What "thorough" means concretely

### 1. The 490px test (invariant #10)
Every screen's primary action must be reachable without scrolling at 390×844 (iPhone 14) AND 375×667 (iPhone SE). Run the dev server and resize.

### 2. Touch targets (gym context)
Sweaty fingers, one hand, phone in the other. Minimum 44×44pt for every interactive element. The `⇄` glyph and "Remove" text are already tight — verify `hitSlop` covers them.

### 3. Dark mode
Flip to dark in settings. Every surface must read correctly: the ink plate flips to bone `#F1EAE0`, ember brand brightens to `#F76B1C`. Check contrast on EVERY text element. The S7 audit catches hardcoded hex but can't catch "this token is technically correct but looks wrong on this surface."

### 4. Loading and error states
- Every query-backed surface should show a skeleton or spinner while loading (the kit has `SkeletonBlock`, `LoadingSpinner`).
- Every mutation should show its pending state on the button (`loading` prop on `MobilePrimaryButton`).
- Every error should surface via `showToast('error', ...)` — never `Alert.alert` with raw error messages (S10).

### 5. Empty states
- Zero sessions → `EmptyState` on home (already done ✓).
- Zero search results → `EmptyState` in library (already done ✓).
- Zero exercises in session → the "No exercises planned" text could be an `EmptyState` card.
- Zero personal bests (new account) → the PB section should be hidden (already conditional ✓) but the totals section says "0" — could feel more inviting.

### 6. Micro-interactions
- Button press states: opacity 0.6–0.7 on every `Pressable` (most already do this).
- The curtain transition handles route changes (already wired via `withRouteCurtain`).
- Toast chits provide feedback for saves/swaps/deletes (already wired).
- Consider: a subtle scale or ink-fill on the `✓` when a set is completed (the moment of satisfaction).

### 7. Accessibility
- Every interactive element has `accessibilityRole` and `accessibilityLabel` (most do — audit the gaps).
- Screen-reader order should follow visual order (DOM order in RN-web).
- Color is never the ONLY signal (the `✓` on filled sets has position + color; verify similar for other states).

### 8. Typography discipline
- Named styles from `theme.typography` for titles/subtitles/eyebrows (many screens use raw fontSize — migrate).
- Tabular figures (`fontVariant: ['tabular-nums']`) for all numeric data (weights, reps, volume, timer) — already on the stats strip; extend everywhere numbers change.
- The `mobileEyebrow` style (11px, 600, 1.4 letter-spacing) for section headers — some screens use custom sizes.

### 9. Spacing and rhythm
- The kit uses 8px base grid (`theme.spacing`); verify screens follow it.
- Section gaps: consistent 16px between major sections (some are 12, some 16, some 20).
- Card padding: 12–20px depending on density level; verify consistency within each screen.

### 10. The ink dialect surface check
- Every `MobileAtmosphere` uses a surface appropriate to its content (training/setup/instructions/analytics/goal).
- The drawer (InkPanel) renders correctly with the cutout masthead and ledger labels.
- Chit toasts are ink plates with paper type (check `theme.toast.style` is being read by the primitives).
- The boot plate paints on first load (check `index.html` and the `data-boot-ready` handshake).

## What NOT to do

- **Don't touch the schema, repositories, services, or stores** — the data layer is done and tested.
- **Don't restructure the component tree** — the three-tier structure (MobilePremium → primitives → composed) is load-bearing for the audits.
- **Don't add new dependencies** — the kit has everything needed.
- **Don't introduce new colors** — the palette is measured and locked. `theme.colors.*` via `useAppTheme()` or a constants import only.
- **Don't add "Swap" or "Change" labels to any row** — the `⇄` glyph is the affordance. Full stop.
- **Don't make substitution more visible** — it's at the right visibility level. Improve what opens FROM it if needed, not the trigger.
- **Don't pre-build features** — if you find yourself adding something "because it would be nice," stop and flag it as a candidate instead.

## The gate

Every change must pass:

```bash
cd armandotfit && bun run lint:structure && bunx tsc --noEmit
```

And the full test suite:

```bash
bun run test:run
```

Currently 627/627 green. Don't break anything.

## Workflow

1. Start the dev server: `bun run web` → `localhost:8081`.
2. Walk every screen in both light and dark mode.
3. Screenshot everything (the scratch `.shots/` dir at the workspace root is for this).
4. Fix issues screen by screen — commit each screen's fixes separately for reviewability.
5. Run the gate after each screen.
6. End with a before/after summary of what changed on each screen.

## The one rule

If you're unsure whether something is "too noisy," it is. Remove it. The best UI in this app is the exercise row with nothing extra on it.
