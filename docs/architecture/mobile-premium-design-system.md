# MobilePremium Design System

**Canonical location:** `docs/architecture/mobile-premium-design-system.md`
**Kit source:** `components/MobilePremium/`
**Shared layer:** `components/premium/shared/` (motion primitives + atmosphere palettes)
**Status:** Active. This is the kit vellum ships with; consumers extend it.

This doc is the operating manual for the vellum mobile UI: what the kit
is, why it looks the way it does, and how to extend both. It is detailed
because the kit is load-bearing — every consumer screen lands on these
conventions.

When the doc and the source disagree, **the source wins**. Fix the
source, then update the doc in the same change.

---

## 1. Why the kit exists

The kit consolidates UI decisions: one atmosphere, one surface, one
header, one footer, three motion primitives, one button — all sized,
spaced, and animated from a shared budget. Consumers don't reinvent
cards, headers, or transitions per screen; they drop content into the
canonical shell (§4) and inherit the design language.

The kit is **not** a generic design system. It is a tightly-scoped set
of primitives for **light-mode-only, PWA-only, mobile-only** consumer
apps, with hard constraints documented inline. Adding a primitive is
fine; relaxing the constraints is not.

---

## 2. Design philosophy

Four pillars, in priority order.

### 2.1 Calm air

Every screen has a `MobileAtmosphere` behind it — two or three soft
color fields, slowly drifting, never busy. The atmosphere is the thread
that ties the whole app together visually. It costs zero vertical space
because it lives behind content.

> Reads as "expensive ambient lighting." — `MobileAtmosphere.tsx`

### 2.2 Considered motion

Three motion primitives cover every animation:

- **Enter** (`FadeIn`) — content arrives on mount.
- **Transition** (`Crossfade`) — content swaps while the shell stays.
- **Respond** (`usePressedStyle`, `useFocusRing`) — micro-feedback on tap and focus.

Plus a `Shake` variant for error feedback. **No bespoke hero animations
per screen.** If you reach for `Animated.timing` outside the motion
primitives, you are almost certainly reinventing something that already
exists.

### 2.3 Material surfaces

`MobileSurface` is the single material treatment per screen: a subtle
vertical gradient, a hairline inner border, a soft outer glow, and a
faint accent tint. The surface's color identity comes from the
atmosphere behind it and the tint — **no thick accent bars.**

One surface per screen. `maxWidth: 420`, `borderRadius: 20`. Centered.

#### 2.3.1 Light-mode surface mechanics

The light surface reads as "soft porcelain" — a near-white card with
a hairline dark border at low opacity (~8%), a top-down luminance
gradient (~3% darker at top suggesting directional light from above),
and an outer glow at low opacity (~8%). The tokens live at
`constants/theme.ts` → `theme.colors.light.mobilePremium`:

| Token | Value | Purpose |
|---|---|---|
| `hairlineBorder` | `rgba(15, 23, 42, 0.08)` | 1px precision edge — dark-on-light (inverse of the dark kit's white-on-dark) |
| `surfaceGradientTop` | `rgba(15, 23, 42, 0.03)` | Top of the linear gradient — slightly darker than bottom |
| `surfaceGradientBottom` | `rgba(15, 23, 42, 0.005)` | Bottom of the linear gradient — nearly transparent |
| `surfaceGlow` | `0 8px 32px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)` | Outer elevation shadow (web only) |
| `surfaceBackdropBlur` | `blur(24px) saturate(160%)` | Web backdrop-filter — saturate is safe on light surfaces |
| `androidChromeSurfaceBackground` | `rgba(255, 255, 255, 0.88)` | Android Chrome fallback (no saturate dependency) |
| `androidChromeSurfaceBlur` | `blur(12px)` | Android Chrome fallback blur |
| `atmosphereVignette` | `inset 0 0 160px 60px rgba(15, 23, 42, 0.04)` | Whisper of depth at the edges (web) |
| `railTrack` | `rgba(15, 23, 42, 0.08)` | 2px progress rail background |
| `railFillShadow` | `0 0 8px currentColor` | Soft glow on the progress fill |

The dark-alphas-over-light approach composites correctly because the
dark color (`#0F172A`) at low opacity produces the same visual effect
as a slightly darker shade of the underlying white surface — a
hairline edge, not a visible darkening.

#### 2.3.2 Android Chrome glassmorphism fallback

`MobileSurface` and the nav drawer glass scrim branch on Android Chrome
(both the browser tab and the Android PWA, which renders via Chrome)
and swap to a near-solid background token plus a milder blur with no
`saturate()`. iOS Safari and desktop paths are unchanged.

**Why the branch exists.** Android Chrome renders `backdrop-filter`
weakly, particularly `saturate()`. With only ~4% alpha background to
fall back on, the surface can become invisible.

**Detection.** UA-based, not `@supports` — Android Chrome falsely
reports `backdrop-filter` support via CSS `@supports` even when
`saturate()` rendering is poor. The hook
`hooks/useAndroidChromeBlurFix.ts` mirrors the established regex
(`/Android/.test(ua) && /Chrome/.test(ua)`) and is SSR-safe via
`isWeb` + `hasWindow()` from `utils/platform.ts`. Vellum ships a slim
detection stub; consumers with significant Android traffic should
verify the behavior and tune the threshold if needed.

#### 2.3.3 No accent bars

The legacy "card with a 3px accent bar on top" pattern is rejected.
The surface's identity comes from the atmosphere behind it and the
optional `accentColor` prop on `MobileSurface`, which tints the
background subtly. No thick painted bars.

### 2.4 Reduced motion by default

Every motion primitive honors `prefers-reduced-motion`:

- `FadeIn` collapses to fade-only, ≤200ms.
- `Crossfade` collapses to fade-only.
- `Shake` collapses to no-op.
- Respond's press/focus scale collapses to opacity-only.
- `MobileAtmosphere` halts the drift **and** snaps the palette (no
  crossfade between surface palettes).

The design reads as premium without any animation. This is not a
graceful-degradation afterthought — it's part of the spec.

### 2.5 The 490px test

A load-bearing height constraint referenced inline in `MobileHeader.tsx`
and `MobileActionFooter.tsx`. The full form content of a screen must
fit in roughly 490px of vertical space on iPhone SE (375×667 logical)
after subtracting status bar, safe-area top, Safari chrome, safe-area
bottom, our header, and our footer. This is the constraint that forces
the kit to stay compact.

Budget breakdown (from the kit source):

- `MobileHeader`: 36–48px total including safe-area top.
- `MobileActionFooter`: 76–92px total including safe-area bottom.
- Everything else: form content.

If a screen fails the 490px test, **the screen is wrong, not the
test**. Cut content, collapse a section, or move to a stepped layout.
Do not shrink the header or footer to fit.

---

## 3. Component inventory

All components are exported from `components/MobilePremium/index.ts`.
Same-folder imports go to the relative source (`./MobileHeader`); the
rest of the app imports from the kit barrel (`@components/MobilePremium`
via the path alias, or `../MobilePremium` relatively).

### Motion (from `MobileMotion.tsx`, re-exported from `components/premium/shared/`)

| Primitive | Purpose |
|---|---|
| `FadeIn` | Mount-time fade + slide-up. Collapses to fade-only ≤200ms under reduced motion. |
| `Shake` | Error feedback on a mountable element. |
| `Crossfade` | Content swap while the shell stays put. |
| `usePressedStyle` | Press scale (0.98 + 0.9 opacity); opacity-only under reduced motion. |
| `useFocusRing` | Focus affordance for inputs. |
| `Pressable` | Re-exported RN `Pressable` for convenience. |
| `prefersReducedMotionSync`, `useReducedMotion` | Read the reduced-motion media query. |

### Atmosphere

| Component | Purpose |
|---|---|
| `MobileAtmosphere` | Drifting color-field background. Takes a `surface` prop (see §5). |

### Surface

| Component | Purpose |
|---|---|
| `MobileSurface` | The single material surface. `maxWidth: 420`, `borderRadius: 20`. Optional `accentColor` tints the background. |

### Inputs

| Component | Purpose |
|---|---|
| `MobileInput` | Text input with label, optional helper / error slot, and focus ring. |
| `MobileSelect` | Bottom-sheet selector with a 54px trigger. Takes a `sheetRenderer` slot for the sheet content. |

### Buttons

| Component | Purpose |
|---|---|
| `MobilePrimaryButton` | One per screen. 54px tall. Brand color slot. `loading` swaps the label to "Please wait…". `disabled` dims (no disabled label — surface the reason in `MobileActionFooter.progressText` instead). `variant="ghost"` for low-emphasis secondary actions. |

### Layout

| Component | Purpose |
|---|---|
| `MobileHeader` | 44px header (36–48 total with safe-area top). Back chevron, optional dismiss, compact title, accent dot. Optional `eyebrow` for context labels above the title. |
| `MobileHomeHeader` | Home-screen header that puts the brand on the same row as the menu trigger. 36px brand row (brand text + optional `menuButton` + optional `rightAction`) + optional normal-case `subtitle` below. `paddingHorizontal: 20`, `maxWidth: 420`, `alignSelf: 'center'`. Pairs with `MobileNavDrawer` in cutout mode — when the drawer opens, the transparent cap at the top of the drawer panel lets this header's brand + menu button show through at the same position. The `menuButton` slot is a `React.ReactNode` so the primitive stays shell-level; the composed trigger (`HamburgerButton`) lives in `components/composed/`. |
| `MobileNavDrawer` | Left-side hamburger drawer. Shell-level mechanism (slide / scrim / items / active-highlight / badge) — branding, items, and footer are consumer-supplied. Two brand-persistence modes via the `brandPersistence` prop: **`'slideout'`** (default) — panel covers full screen height; brand lives in the `header` slot. **`'cutout'`** — panel + scrim start below the home header so the brand + hamburger (which the consumer swaps to X) stay visible at the same position (qep-tracker pattern). In cutout mode the panel is transparent in the brand area (the "cap"), with a right hairline that runs the full panel height; the opaque surface starts below the cap so the subtitle (which lives below the brand row on the home header) is covered while the brand stays visible. Two anchor modes via the `anchor` prop: **`'window'`** (default) — panel slides from x=0 of the window. **`'column'`** — panel slides from the left edge of the centered 420pt column (computed from `useWindowDimensions`), so the drawer stays attached to centered content on any viewport. Defaults are picked by `APP_LAYOUT.navDrawerBrandPersistence` and `APP_LAYOUT.navDrawerAnchor` in `constants/layout.ts`. Slides with an iOS-sheet curve (`cubic-bezier(0.32, 0.72, 0, 1)`). Active row gets a 3px brand strip on the left edge + brand-tinted background + bolder label. `prefers-reduced-motion` collapses the slide to instant. |
| `MobileActionFooter` | Sticky bottom action area. Holds the primary + optional secondary. 76–92px total with safe-area bottom. |
| `MobileStepRail` | 2px horizontal progress rail for multi-step flows. Sits between header and content. |
| `MobileSectionEyebrow` | Small uppercase label that leads a section inside a `MobileSurface`. Replaces a card-title row without spending vertical budget on a full title chrome. |
| `MobileSettingsRow` | Shared layout for every settings row: 36×36 accent-tinted iconBox + `flex: 1` text column + optional right element. The `flex: 1` (not `flexShrink: 1`) is load-bearing — it locks the title's x-coordinate at `iconBox.width + 12` regardless of right-element width, description length, or Pressable-vs-View wrapper. Destructive rows render with red title + red-tinted iconBox. |

### Feedback

| Component | Purpose |
|---|---|
| `MobileAlert` | Inline alert with a 24px icon circle. `variant: 'success' \| 'warning' \| 'error' \| 'info'`. |

### Forms

| Component | Purpose |
|---|---|
| `MobileCheckboxItem` | Premium checkbox row with animated check. |
| `MobileSelectionList` | Radio / multi-select row list for wizard steps. Accent tint on selection, hairline border, 44px min tap target. |
| `MobileStepper` | Large-value +/- stepper. |

### Dialogs

| Component | Purpose |
|---|---|
| `MobileDialog` | Canonical general-purpose dialog. Renders inside a react-native `Modal` with `transparent={true}` + `animationType="fade"` — the Modal breaks out of the host's scroll/transform context so the dialog centers on the **visible viewport**, not the full document height. Sits as a **sibling** of the host's `MobileSurface`, never nested (`MobileSurface` has `overflow: 'hidden'` and would clip it). Backdrop tap closes by default. Optional `primaryActionLabel` + `onPrimaryAction`; `destructive` renders the primary action in error color. **Audit note:** the file is in `C2_EXEMPT_FILES` in `audit-component-quality.ts` because the RN `Modal` is the load-bearing primitive, not a violation — see §11. |

### Dev tooling

`showcase.tsx` (mounted at `/dev/premium` via `app/dev/premium.tsx`)
is a dev-only visual review tool that renders every primitive against
a light background in a 490px-tall frame so the visual language can
be reviewed in isolation. **The showcase IS the visual source of
truth** — if a primitive isn't in the showcase, it doesn't exist as
far as a consumer can tell. Update it when a primitive is added or
its visual treatment changes materially.

---

## 4. The canonical mobile screen shell

Every full-screen mobile screen in the app follows this shell. Copy it
verbatim, then fill in the form content.

```tsx
import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MobileActionFooter,
  MobileAtmosphere,
  MobileHeader,
  MobileSurface,
  FadeIn,
} from '@components/MobilePremium';

export function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <MobileAtmosphere surface="auth" />
      <View style={[styles.column, { paddingTop: insets.top }]}>
        <MobileHeader onBack={...} title="My Screen" accentColor={accentColor} />

        <KeyboardAvoidingView
          style={styles.avoid}
          behavior={isIOS ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="always"
          >
            <FadeIn duration={480}>
              <MobileSurface accentColor={accentColor} padding={20}>
                {/* form content */}
              </MobileSurface>
            </FadeIn>
          </ScrollView>
        </KeyboardAvoidingView>

        <MobileActionFooter>
          <MobilePrimaryButton onPress={...} accentColor={accentColor}>
            Save
          </MobilePrimaryButton>
        </MobileActionFooter>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative', backgroundColor: 'transparent' },
  column: { flex: 1 },
  avoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, flexGrow: 1 },
});
```

Conventions:

- `MobileAtmosphere` is the first child of the root `View`, behind everything.
- The root `View` is `flex: 1, position: 'relative'` so the atmosphere can absolute-fill.
- Top safe-area inset is applied to the column **below** the root, not to the root itself — the atmosphere must reach the top of the screen behind the notch.
- Bottom safe-area is handled two ways: (1) `ScrollView` content padding so the last field clears the footer, and (2) `MobileActionFooter`'s internal bottom inset (iOS 34px / Android 16px).
- `KeyboardAvoidingView` is only needed when the screen has text inputs. If your screen only uses buttons and pickers, drop it.
- One `MobilePrimaryButton` per screen. It lives in `MobileActionFooter`, not free-floating in the scroll content.

---

## 5. Atmosphere surfaces

`MobileAtmosphere` takes a `surface` prop. Each surface is a 3-orb
palette defined in `components/premium/shared/atmospherePalettes.ts`.
Vellum ships **light variants** of qep-tracker's 7 dark-tuned
palettes — same semantic mappings, retuned for light backgrounds
(`gray.50` / `gray.100` base) with softer saturation, higher
luminance, and lower orb opacity (~6–10% instead of 10–15%).

The seven surfaces and their intended use:

| Surface | Palette (light variant) | Use for |
|---|---|---|
| `auth` | Soft sky-blue on pale ice | Login, registration, forgot-password |
| `setup` | Cool blue-to-lavender on cream | Onboarding setup phase |
| `training` | Warm peach-to-rose on cream | Active task surfaces (e.g. log-session) |
| `goal` | Teal-to-mint on pale aqua | Goal-setting / progress phase |
| `instructions` | Soft cobalt on pale ice | Instructional content |
| `privacy` | Sage-to-mint on pale aqua | Trust-signal surfaces (privacy consent, data handling) |
| `analytics` | Periwinkle-to-lilac on pale lavender | Analytics / dashboard surfaces |

Picking a surface is a semantic decision, not an aesthetic one. If a
screen's purpose is "user is training," it gets `training` regardless
of what colors look nice that day. New surfaces get added only when a
genuinely new screen-purpose emerges — not because a designer wants a
fresh palette.

The palette values are picked by eye against the light base
(`theme.colors.light.backgroundDeep` — `#F1F5F9`) at 6–10% alpha so
content reads cleanly. See `components/premium/shared/atmospherePalettes.ts`
for the canonical stops.

When a screen transitions between surfaces (e.g. onboarding step
changes), `MobileAtmosphere` crossfades the palettes automatically.
Under reduced motion, it snaps.

### 5.1 Customizing palettes as a consumer

The 7 semantics are domain-agnostic, but the hues are not binding. A
consumer whose brand is warm-toned (e.g. armandotfit's orange) may
prefer warmer orb hues for `training` and `goal`. Edit
`components/premium/shared/atmospherePalettes.ts` directly — the file
is the source of truth, no override mechanism needed (copy-then-customize
model).

---

## 6. Motion language, in detail

The motion primitives live in `components/premium/shared/Motion.tsx`
and are re-exported via `components/MobilePremium/MobileMotion.tsx`
and the kit barrel.

### Enter — `FadeIn`

```tsx
<FadeIn duration={480}>
  <MobileSurface>...</MobileSurface>
</FadeIn>
```

Mount-time fade + slide-up. Default duration 480ms, default slide 8px.
Stagger siblings with `delay`. Under reduced motion: fade-only, ≤200ms,
no slide.

### Transition — `Crossfade`

Used when a shell stays mounted but its content swaps (e.g. onboarding
step content while the atmosphere and footer persist). Crossfades old →
new. Under reduced motion: fade-only.

### Respond — `usePressedStyle`, `useFocusRing`

`usePressedStyle()` returns a style to apply on press. Default scale
0.98 + opacity 0.9. Under reduced motion: opacity-only.

`useFocusRing()` is the input-focus counterpart. Apply to `MobileInput`
— it already wires it internally; reach for the hook directly only if
you're building a new input primitive.

### What's missing on purpose

No `spring`. No `decay`. No `Animated.parallel` outside the shared
layer. If you need motion that doesn't fit Enter/Transition/Respond,
that's a kit-level decision — raise it as a kit extension, not a
screen-local bespoke animation.

---

## 7. PWA-aware gating

> **Upstream concern:** this section assumes the app is **installable**
> in the first place — i.e. the manifest, service worker, and PWA meta
> tags are correctly deployed so that `display-mode: standalone` is
> achievable. The installability prerequisites (Android Chrome criteria,
> Expo Web head-stripping gotcha, runtime tag injection, home-screen
> icon pipeline) live in their own canonical doc:
> [`pwa-installability.md`](pwa-installability.md). Read that first if
> the install flow itself is broken; read this section if you're
> deciding what UI to show once installability is working.

### 7.1 The detection toolkit

Two helpers in `utils/`:

- **`isWeb`** (`utils/platform.ts`) — `Platform.OS === 'web'`. True on both desktop and mobile web. False on iOS/Android native.
- **`detectAppMode()`** (`utils/platformDetection.ts`, consumer-created) — Returns `'standalone'` (PWA) or `'browser'` (regular web tab). Reads `window.matchMedia('(display-mode: standalone)')` plus the iOS Safari `navigator.standalone` fallback.

### 7.2 The load-bearing one-liner

```typescript
const isStandalone = !isWeb || detectAppMode() === 'standalone';
```

Read it as: "this user is in an installed context if they're on native
(`!isWeb` — inherently installed), OR they're on web-PWA
(`detectAppMode() === 'standalone'`)." Everything else is mobile or
desktop browser.

For the compact/full distinction:

```typescript
const displayMode: 'compact' | 'full' = isStandalone ? 'full' : 'compact';
```

### 7.3 When to gate

Vellum ships **no gated screens by default** — all skeleton routes
(login, register, home placeholder, settings) are single-variant. A
consumer gates a screen only when:

1. The audience-segment difference is real (power users on PWA / native
   vs. casual users in a mobile browser tab).
2. The cost of dual variants is justified by frequency × benefit.

The framework in §8 walks through the decision.

---

## 8. Decision framework — when to gate a new screen

Run a new mobile screen through these four questions before writing code.

**Q1. Is the screen ever seen by a brand-new user before their first session?**
- Yes → Don't gate. Single-variant. (Auth, registration, onboarding, landing.)
- No → Continue.

**Q2. Is the screen a daily-driver that power users hit repeatedly?**
- No → Don't gate. The benefit doesn't justify the dual-variant cost.
- Yes → Continue.

**Q3. Does the power-user context (PWA / native) genuinely benefit from more information or richer controls?**
- No → Don't gate. Just build the single best version.
- Yes → Continue.

**Q4. Can the dual variants share a single component with conditional sections?**
- Yes → Gate. Compute `displayMode` at the route level, pass it in, conditionally render. One component, one state hook, two layouts.
- No (the variants are structurally too different) → Split into two components, route decides which to render. Last resort — the cost is high.

### Worked examples

- **Home/dashboard:** Daily-driver, power users see it constantly, the at-a-glance chart pack is exactly the kind of context a power user wants more of. **Gates** when the consumer builds it.
- **Inbox / feed:** Daily-driver, but the item layout doesn't have an obvious "richer" variant. Probably **single-variant**.
- **Settings:** Power-users-only, but low frequency. The audience split is real but the benefit of dual variants is small. Probably **single-variant**, but debatable.

Document the call in the screen's header comment when you make it, so
the next contributor doesn't have to re-derive it.

---

## 9. Accessibility

### 9.1 Reduced motion

Handled at the kit level — every motion primitive collapses to a
sensible non-animated state under `prefers-reduced-motion: reduce`.
You do not need to do anything in screen code.

If you find yourself writing motion outside the kit, you are
responsible for honoring reduced motion yourself. This is one of the
strongest reasons to use the kit primitives exclusively.

### 9.2 Safe-area insets

Always use `useSafeAreaInsets()` from `react-native-safe-area-context`.
Apply `paddingTop: insets.top` to the column inside the root, not to
the root itself (the atmosphere must reach the top of the screen).

The footer handles bottom safe-area internally (iOS 34px / Android 16px
heuristic in `MobileActionFooter`). The `ScrollView` content padding
(`insets.bottom + 24`) ensures the last field clears the footer.

### 9.3 Tap targets

- `MobilePrimaryButton`: 54px tall, full-width inside the footer.
- `MobileHeader` back chevron: 44px tap area (with hit-slop).
- `MobileSelect` trigger: 54px.
- All other tappable elements: minimum 44×44, per Apple HIG.

### 9.4 Contrast

Atmosphere palette stops are 6–10% alpha against `theme.colors.light.backgroundDeep`
(`#F1F5F9`). Foreground text uses `colors.text` (`#0F172A`),
`colors.textSecondary` (`#475569`), `colors.textMuted` (`#64748B`).
The weakest combo (`textMuted` on a dim atmosphere region) is the
floor — if you're tempted to go dimmer, don't.

WCAG AA contrast ratios (computed against the light surface):

| Foreground | On `background` (#FFFFFF) | On `backgroundDeep` (#F1F5F9) |
|---|---|---|
| `text` (#0F172A) | 16.9:1 ✓ AAA | 15.2:1 ✓ AAA |
| `textSecondary` (#475569) | 8.3:1 ✓ AAA | 7.4:1 ✓ AAA |
| `textMuted` (#64748B) | 5.0:1 ✓ AA | 4.5:1 ✓ AA |

### 9.5 Screen-reader labels

The kit carries signal visually that screen readers don't receive by
default — status tints, hero compositions, progress affordances, list
structure. Apply labels at the screen boundary (the Pressable / View /
Surface that forms the logical announce unit), not at every leaf.

- **Composite card labels** — the card-level `Pressable` gets a single
  `accessibilityLabel` that packs title + status + meta.
- **Hero groups** — wrap the icon-chip + title + subtitle row in a
  `View` with `accessible={true}` + `accessibilityRole="header"`.
- **List landmarks** — the grid / stack root gets
  `accessibilityRole="list"` + `accessibilityLabel`.
- **Empty state + skeleton** — wrap each as an accessible group with
  a one-sentence label.
- **Invisible tap zones** — overlay Pressables that exist only to
  capture taps MUST carry `accessibilityRole="button"` +
  `accessibilityLabel` + `accessibilityHint`.

---

## 10. Audit compliance notes

The pre-commit gate enforces 10 structural audits + `tsc --noEmit` +
two structural eslint rules (`S6`, `S8`). Full reference in
`CLAUDE.md` → "Pre-commit checks." The five that bite most often
when writing MobilePremium work:

- **S5 barrels** — Same-folder: import from the relative source (`./MobileHeader`). Cross-folder: go via the kit barrel (`@components/MobilePremium`, never `@components/MobilePremium/MobileHeader`). When flagged, `bun run scripts/audit-barrels.ts --fix` rewrites most of them for you.
- **S7 hex colors** — Never hardcode `'#FFFFFF'` in component code. Pull from `theme.colors.light.*` via a `constants` import (for `StyleSheet.create` static styles) or inline. Atmosphere palette stops and SVG vectors are exempt — see the allowlist in `audit-ui-theme.ts`.
- **C1 router calls** — Never `router.push/replace/back` directly. Vellum ships no `navigation/NavigationHelper.tsx` by default; the consumer creates one (see `CLAUDE.md` → "How to consume"). The `MobileHeader` `onBack` prop takes a `() => void`; wrap async helpers with `() => { void safeGoBack(); }`.
- **C4 ActivityIndicator** — Don't use RN's `ActivityIndicator` directly. `MobilePrimaryButton` already owns its inline loading spinner (`c4-exempt` comment in `MobilePrimaryButton.tsx`); reuse it via the `loading` prop. Consumers create `LoadingSpinner` / `LoadingOverlay` / `AppLoading` as separate primitives that wrap `ActivityIndicator`.
- **C2 RN Modal** — `audit-component-quality.ts` blocks bare react-native `Modal`. **`MobileDialog` is in `C2_EXEMPT_FILES`** because the RN `Modal` IS the load-bearing primitive — `transparent={true}` + `animationType="fade"` is exactly the viewport-centering behavior the kit needs.
- **S6 conditional JSX** — `{expr && <Component/>}` renders `0`/`""` as children when `expr` is a number/string. Use ternary (`isFull ? <X /> : null`) or boolean coercion (`!!expr && <X />`).

For the template-literal color pattern (`${accents.red}26` for
hex+alpha), the S7 regex does **not** flag template literals — only
quoted hex strings. So the pill-background pattern is safe without an
exemption marker.

---

## 11. Extending the kit

### 11.1 Adding a primitive

1. Read `MobileMotion.tsx`, `MobileSurface.tsx`, and `MobileHeader.tsx` first — the conventions (file header doc-comment, prop interface with JSDoc, `as any` cast on `fontWeight`, `theme` import from `../../constants`, named + default export) are load-bearing.
2. New file in `components/MobilePremium/`. Header comment must articulate the design constraint the primitive satisfies (the 490px budget, the reduced-motion contract, etc.).
3. Add the named export **and** default export.
4. Re-export from `components/MobilePremium/index.ts`.
5. **Add it to the showcase** (`components/MobilePremium/showcase.tsx`). The showcase IS the visual source of truth — primitives not in the showcase don't exist as far as a consumer can tell.

### 11.2 Adding an atmosphere surface

1. Add the string literal to `AtmosphereSurface` in `components/premium/shared/atmospherePalettes.ts`.
2. Add the 3-orb palette to the `PALETTES` record with a comment explaining what the surface is for.
3. Use a hue from the existing `LIGHT_HUES` map — do not introduce a new hex.
4. Update the surface table in §5 of this doc.
5. Add a row to the showcase's `SURFACES` array.

### 11.3 Adding a gated screen (consumer-side)

1. Confirm the decision via the framework in §8. Write the rationale in the screen's header comment.
2. Compute `displayMode` at the **route** level (`app/<screen>.tsx`), not inside the component.
3. Build a single component that takes `displayMode: 'compact' | 'full'` as a prop. Conditionally render sections based on `const isFull = displayMode === 'full';`.
4. Both variants share the same hook, the same submit/save contract, the same celebration cascade (if any). Only the view layer differs.
5. Verify the compact variant still passes the 490px test.
6. Update §7.3 of this doc.

### 11.4 Migrating a legacy screen (consumer-side)

1. Read the legacy screen end-to-end. Identify the form state hook (it's almost always reusable as-is — the kit is a view-layer change, not a model-layer change).
2. Replace the legacy top-level layout with the canonical shell from §4.
3. Replace legacy cards/buttons/inputs with their `Mobile*` counterparts one at a time. Run `bun run lint:structure` after each swap to catch audit regressions at the write site.
4. Pick the atmosphere surface by purpose (§5).
5. Run the 490px test mentally or in DevTools at iPhone SE.
6. Run the pre-commit gate (`bun run lint:structure && bunx tsc --noEmit`) before committing.

---

## 12. Future direction

Vellum's MobilePremium kit is the starting point, not the destination.
Consumers will:

- **Add domain primitives** — most consumers add 5–15 domain-specific
  primitives on top of the kit (e.g. armandotfit adds `WorkoutCard`,
  `ExerciseRow`, `ProgressChart` as composed primitives). Composed
  primitives compose kit primitives; they don't bypass them.
- **Override the brand color slot** — single change in
  `constants/theme.ts`.
- **Possibly customize atmosphere palettes** — hues only; the 7
  semantics stay.
- **Add PIN auth primitives** (qep-tracker parity) — see `CLAUDE.md`
  → "When to add PIN auth." This brings `MobilePinInput`,
  `MobileFullPagePinEntry`, `MobilePinReauthSheet`, `_PinKeypad`, and
  the `audit-rpc-auth.ts` script back as consumer-side additions.

The kit is **mobile-only**. Vellum does not ship a desktop kit; the
PWA-only scope means every consumer screen targets a mobile viewport.
A consumer needing a desktop admin surface builds it separately and
does not try to force `MobileSurface` / `MobileHeader` to work at
desktop breakpoints.

---

## 13. Quick reference

| You need to... | Use this |
|---|---|
| Wrap a screen in atmosphere | `<MobileAtmosphere surface="auth" />` as first child of root `View` |
| Center a content card | `<MobileSurface accentColor={...} padding={20}>` |
| Render a screen title + back | `<MobileHeader onBack={...} title="..." accentColor={...} />` |
| Render the save button | `<MobileActionFooter><MobilePrimaryButton onPress={...}>Save</MobilePrimaryButton></MobileActionFooter>` |
| Animate content on mount | `<FadeIn duration={480}>` |
| Open a mobile dialog | `<MobileDialog visible={...} onClose={...} title="..." primaryActionLabel="..." onPrimaryAction={...}>{body}</MobileDialog>` — render as a sibling of your `MobileSurface`, never nested inside |
| Show an inline warning/error | `<MobileAlert variant="warning" title="..." body="..." />` |
| Get theme colors safely (no S7) | `import { theme } from '@constants'; const colors = theme.colors.light;` |
| Get safe-area insets | `const insets = useSafeAreaInsets();` from `react-native-safe-area-context` |
| Static typography tokens in StyleSheet | `theme.typography.mobileEyebrow` (etc.) from `@constants` |

---

## Maintenance

When you change the kit, update this doc in the same commit. The doc
and the source move together. Sections that go stale are worse than
sections that are missing — at minimum, mark changed sections with the
new state.

When you add or change a primitive, **update the showcase in the same
change** (`components/MobilePremium/showcase.tsx`).

When you change the gating logic, update §7 and §8 together.
