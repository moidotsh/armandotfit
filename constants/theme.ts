// constants/theme.ts
// armandotfit theme — "THE INTERVAL" (see
// docs/architecture/interval-thesis.md).
//
// The live figure owns the counter: the biggest mark on a screen is
// the figure answering its current question (the rest clock while
// rest runs, the armed expression otherwise), exchanged by REPAINT
// at the two moments the question changes. Ink is state — armed and
// live carry the full ink, settled and unarmed read muted; one
// ground per mode with rules and air for structure (no panels,
// radius 0, zero shadows); one RED INK for records/links/the live
// pulse (furniture never wears it); and THE STILL SYSTEM (content
// never animates). On the shell's `ink` dialect (flat atmosphere,
// chit toasts, curtain transitions — see DIALECT below).
//
//   • COLOR HAS TWO JOBS — the `meter` ramp encodes the GYM'S
//     GEOGRAPHY (the zone ramp: barbell oxide / dumbbell brass /
//     cable blue / machine green / bodyweight violet + steel), and
//     the red ink (the `brand` slot) marks records, links, and the
//     live pulse. Everything else is ink; the verb is the heaviest
//     ink on the page.
//   • THE WIRE (colors.focus.*) — the mode-independent interrupt
//     register for the chit toast and the route curtain only.
//
// Structure + axes (dialect/shapes/fonts/typography/atmosphere/drawer/
// toast/transition + the TypeFaces width axis + the focus register +
// the meter ramp + instrumentShadow) are the shell's, synced from
// arqavellum. Only the palette values, the DIALECT pick, and the
// retuned type ramp are armandotfit's own.

import type { TextStyle } from 'react-native';

// TextStyle-shaped typography tokens. Typing these explicitly avoids the
// `fontWeight: string` widening that breaks spread-into-<Text> calls
// (RN's TextStyle.fontWeight is a union of string literals, not `string`).
type TypographyToken = Pick<
  TextStyle,
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'fontFamily'
  | 'fontVariant'
>;

// ── Type families ───────────────────────────────────────────────────────
// The optional display pair, hoisted so typography tokens can reference
// it inside the same object literal. A consumer whose design language is
// printed matter declares a display face (poster titles, hero figures,
// totals) and/or a mono face (every figure that reads as ledger output —
// prices, stock, dates, metrics, eyebrows); body/UI text stays on the
// platform sans for legibility. All default to undefined — the starter
// renders the platform sans everywhere, and every read below is a no-op
// until a consumer fills them, so declaring the axis never moves the
// default look.
//
// Self-hosting recipe (web): OFL/compatible files in `public/fonts/`
// (woff2 first, TTF fallback), the @font-face block in an id'd <style>
// in `index.html`, restored at runtime from `app/_layout.tsx` (static
// export strips <head> styles), plus <link rel="preload" as="font"
// crossorigin> lines — the build-time injector copies both into every
// exported route. Native extension: load the same files through
// expo-font instead of the <style> block.
export interface TypeFaces {
  /** Display face — poster titles, display figures, totals. */
  display?: string;
  /**
   * Condensed position of the display face — for consumers whose
   * display face carries a width axis. Declared as a second
   * @font-face over the SAME variable file with `font-stretch` pinned
   * (see index.html): one download, two families, and RN code never
   * touches fontStretch (which RN's TextStyle does not carry).
   * THE SCOREBOARD runs no condensed family (the width-axis trick
   * retired with THE GAUGE); the slot stays for shell parity and
   * resolves to the display face itself.
   */
  displayCondensed?: string;
  /** Mono face — ledger figures: prices, stock, dates, metrics, eyebrows. */
  mono?: string;
  /**
   * Condensed cut of the SAME mono variable file — the counter rank's
   * width instance (see `mono`): one download, two families, RN code
   * never touches fontStretch. THE SIGHT AMENDMENT (interval-thesis
   * §3.2, revision 2027-02): Martian's regular cut at 72 overruns the
   * column and truncated the armed expression; the counter rank alone
   * rides the condensed cut. Figures stay tabular — a monospace's
   * advance is uniform at any width.
   */
  monoCondensed?: string;
}

const FONTS = {
  // THE SCOREBOARD pair (docs/architecture/scoreboard-thesis.md §3.1)
  // — Space Grotesk (one variable file, wght 300–700) speaks the
  // scoreboard's words: the statement (one per screen), subheads,
  // row names, verb labels. Martian Mono (one variable file, wght
  // 100–800) keeps EVERY figure at every scale; mono is tabular by
  // construction, and its hardware register reads like a machine
  // readout. Files in public/fonts/, @font-face + preloads in
  // index.html (id'd style), runtime restore in app/_layout.tsx —
  // the injector carries both into every exported route.
  display: 'Space Grotesk',
  displayCondensed: 'Space Grotesk',
  mono: 'Martian Mono',
  monoCondensed: 'Martian Mono Condensed',
} as TypeFaces;

// ── Design dialect ──────────────────────────────────────────────────────
// The ONE family declaration. A consumer's design language is not four
// independent flags that must agree by convention — it is one dialect
// that presets every surface-language point below (atmosphere, drawer,
// toast, transition). Sub-points remain as explicit overrides: writing a
// literal `style` on any of them beats the preset, for consumers whose
// taste mixes deliberately.
//   • 'glass' (default) — the starter's own look: drifting aurora orbs,
//     the glass-scrim sheet drawer, the bordered-card toast, no route
//     transition.
//   • 'ink' — flat air (no orbs), the InkPanel drawer, the ink chit
//     toast, and the ink route curtain. The curtain is
//     consumer-implemented machinery that READS the transition axis
//     below — the shell ships no transition primitive of its own (a
//     future one would read the same declaration).
const DIALECT = 'ink' as 'glass' | 'ink';
const DIALECT_PRESETS = {
  glass: { atmosphere: 'aurora', drawer: 'sheet', toast: 'card', transition: 'none' },
  ink: { atmosphere: 'flat', drawer: 'ink', toast: 'chit', transition: 'curtain' },
} as const;

// THE WIRE — everything that must interrupt renders as the heaviest
// ink in the system, in BOTH modes (the chit toast, the route
// curtain). Identical values in both palettes BY DESIGN; it is a
// surface family (like `glass` / `mobilePremium`), not a third color
// scheme — `useAppTheme()` still resolves exactly two.
const WIRE = {
  background: '#0B0D0F',
  surface: '#131518',
  surfaceAlt: '#1A1D20',
  border: '#232629',
  text: '#ECF0F2',
  muted: '#9AA0A6',
  signal: '#FF6B5E',
  onSignal: '#0B0D0F',
  track: '#1E2124',
  signalSoft: 'rgba(255, 107, 94, 0.16)',
} as const;

// The categorical meter ramp — six steps + the rim that guarantees
// each step's edge on light grounds. Structure is the shell's (same
// keys both repos); armandotfit's values are the ZONE RAMP (thesis
// §4.2): the gym's geography — barbell oxide red / dumbbell brass /
// cable blue / machine green / bodyweight violet / steel (unchanged
// from THE GAUGE — the zone ramp is data encoding, not identity).
// Arqavellum keeps its own (indigo-tinted) values.
const METER_LIGHT = {
  step1: '#B02A1C',
  step2: '#8F6A12',
  step3: '#2559B7',
  step4: '#256B4A',
  step5: '#6D44B5',
  step6: '#7C858E',
  rim: '#1B1916',
} as const;

const METER_DARK = {
  step1: '#E4604F',
  step2: '#E0B44F',
  step3: '#6C9EF2',
  step4: '#4DB87E',
  step5: '#B18CF2',
  step6: '#A5ADB5',
  rim: '#141210',
} as const;

export const theme = {
  colors: {
    // ── The printed card (light default) ────────────────────────────
    // ONE warm off-white ground: a "card" is the ground plus a rule,
    // not a surface tier (thesis §5). Warm-neutral by design — the
    // printed card, not the concrete wall. Every MobilePremium
    // primitive defaults to this palette unless the consumer flips
    // `colorScheme` to 'dark'. Measured ladder (thesis §4.3): text
    // ~15.7 on ground → secondary ~8.1 → muted ≥4.7 on the darkest
    // surface it rides.
    light: {
      // UI element colors
      background: '#F4F2EE',
      backgroundAlt: '#EFEDE8',
      card: '#F4F2EE',
      cardAlt: '#ECE9E4',
      border: '#DAD6CE',

      // Panel edge colors — a 1px rule is the only edge a card has.
      cardBorder: 'rgba(27, 25, 22, 0.22)',
      cardBorderHover: 'rgba(27, 25, 22, 0.34)',

      // Text colors. Every informative slot clears WCAG AA (4.5:1) on
      // every surface it rides (matrix in thesis §4.3).
      text: '#1B1916',
      textMuted: '#6B665D',
      textSecondary: '#4C4841',

      // Interactive element colors — the `brand` slot: RED INK.
      // Marks records, links, and the live pulse; appears as a fill
      // only in toasts/tints (measured 5.29 with its on-fill text).
      brand: '#BE2B20',
      brandHover: '#AE271D',
      brandPress: '#9E231A',
      brandMuted: 'rgba(190, 43, 32, 0.08)',
      brandSoft: 'rgba(190, 43, 32, 0.12)',
      // THE VERB IS INK (thesis pillar 3): the heaviest mark on the
      // page is the ground's own ink, not a hue. 15.7:1 with its label.
      buttonBackground: '#1B1916',
      buttonBackgroundDisabled: 'rgba(27, 25, 22, 0.4)',

      // The brand slot's TEXT companion — the same red deepened until
      // it clears WCAG AA (4.5:1) as small text (labels, kickers,
      // links) on the ground and cardAlt.
      brandText: '#A8241B',

      // Brand-hue accent for wire plates (the chit, the curtain) —
      // a brightened red reads on the near-black wire.
      brandOnInk: '#FF6B5E',

      // Semantic status colors. Measured AA as TEXT on ground AND
      // cardAlt (matrix in thesis §4.3).
      status: {
        success: '#1E6B44',
        warning: '#8A5600',
        error: '#B3261E',
        info: '#1D5FCC',
      },

      // Re-export aliases for call sites that read `success` and `alert`
      // at the top level (alternative to `status.success` / `status.error`).
      success: '#1E6B44',
      alert: '#B3261E',

      // Text color for content rendered on top of the ink verb (button
      // labels, the selected check). One paint per plate: ground on ink.
      textOnBrand: '#F4F2EE',

      // Secondary text on ink fills. One paint per plate: hierarchy on
      // an ink fill comes from size/face, not alpha.
      textOnBrandMuted: '#F4F2EE',

      // Deeper background for full-bleed screens — the card's edge tone.
      backgroundDeep: '#EAE7E1',

      // Text color variants. `textColors.muted` and `textMuted` are
      // unified (same value, both names). `tertiary` is DECORATIVE ONLY
      // (fails AA on cardAlt): placeholders, disabled states, watermarks
      // — it never carries information; informative quiet text reads
      // `textMuted`.
      textColors: {
        muted: '#6B665D',
        secondary: '#4C4841',
        tertiary: '#9B958A',
      },

      // Icon background tints (semantic — darker hue on pale tint).
      iconBackground: {
        blue: 'rgba(37, 89, 183, 0.10)',
        green: 'rgba(37, 107, 74, 0.10)',
        purple: 'rgba(109, 68, 181, 0.10)',
        orange: 'rgba(190, 43, 32, 0.10)',
        white: 'rgba(27, 25, 22, 0.06)',
      },

      // Glass tokens (kept for the shell's glass-dialect primitives).
      // On the one-ground system these read as neutral tints.
      glass: {
        background: 'rgba(244, 242, 238, 0.72)',
        backgroundLight: 'rgba(244, 242, 238, 0.55)',
        border: 'rgba(27, 25, 22, 0.22)',
        borderHighlight: 'rgba(27, 25, 22, 0.30)',
        borderHover: 'rgba(27, 25, 22, 0.26)',
        emptyInputBorder: 'rgba(27, 25, 22, 0.34)',
        panelBackground: 'rgba(234, 231, 225, 0.6)',
        inputBackground: 'rgba(27, 25, 22, 0.04)',
        inputFocusBackground: 'rgba(27, 25, 22, 0.07)',
      },

      // Alert background tint for error containers.
      alertBackground: 'rgba(179, 38, 30, 0.08)',

      // ── Mobile premium primitive kit tokens ───────────────────────────
      // THE ROOM HAS NO OBJECTS: one ground, 1px rules, radius 0,
      // ZERO shadows (thesis §5). instrumentShadow is retired to
      // 'none' — the logger docks under a 2px rule, not a lift.
      mobilePremium: {
        // Hairline border (inner) — ink at low opacity.
        hairlineBorder: 'rgba(27, 25, 22, 0.22)',
        hairlineBorderStrong: 'rgba(27, 25, 22, 0.34)',

        // Surface gradient stops — flat; kept for primitives that
        // composite the axis (both stops zero).
        surfaceGradientTop: 'rgba(27, 25, 22, 0.0)',
        surfaceGradientBottom: 'rgba(27, 25, 22, 0.0)',

        // Contact shadow — none. Nothing is lifted.
        surfaceGlow: 'none',

        // THE INSTRUMENT LIFT — retired with THE GAUGE (the one
        // physical object). Nothing uses it; it stays 'none'.
        instrumentShadow: 'none',

        // Backdrop blur for web (saturate is safe on the grounds).
        surfaceBackdropBlur: 'blur(24px) saturate(160%)',

        // Android Chrome fallback — near-solid surface + milder blur.
        androidChromeSurfaceBackground: 'rgba(244, 242, 238, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        // Nav drawer (shell parity; the drawer stays synced but unwired
        // — THE SCOREBOARD has no tab bar and no drawer chrome).
        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'dd',
        navPanelShadow: 'none',

        // Faint vignette to settle the card into its edges (web).
        atmosphereVignette: 'inset 0 0 210px 80px rgba(27, 25, 22, 0.055)',

        // Rail (progress) — fill travels across a 2px track.
        railTrack: 'rgba(27, 25, 22, 0.14)',
        railFillShadow: 'none',
      },

      // ── The meter ramp (see METER_LIGHT above) ────────────────────────
      meter: METER_LIGHT,

      // ── The wire (see WIRE above) ─────────────────────────────────────
      focus: WIRE,
    },

    // ── The unlit board (dark, opt-in) ──────────────────────────────
    // Mirror of `light` with every key retuned for dark surfaces: one
    // warm near-black ground, chalk text, brightened zones. The
    // structural shape MUST match `light` so
    // `theme.colors[colorScheme].*` is type-safe.
    dark: {
      background: '#161412',
      backgroundAlt: '#1A1815',
      card: '#161412',
      cardAlt: '#1E1B18',
      border: '#2B2723',

      // Panel edge colors — chalk rules on the unlit board.
      cardBorder: 'rgba(237, 234, 228, 0.20)',
      cardBorderHover: 'rgba(237, 234, 228, 0.30)',

      // Text colors — measured (thesis §4.3): text ~15.3 on ground,
      // secondary ~10.3, muted ≥5.4 on cardAlt.
      text: '#EDEAE4',
      textMuted: '#978F85',
      textSecondary: '#C6C1B8',

      // The `brand` slot at night: bright red ink — high contrast on
      // the board as fill/large type; `brandText` carries small text.
      brand: '#FF6B5E',
      brandHover: '#FF7B6E',
      brandPress: '#E95F53',
      brandMuted: 'rgba(255, 107, 94, 0.14)',
      brandSoft: 'rgba(255, 107, 94, 0.18)',
      // THE VERB IS INK: at night the ink is chalk — the heaviest mark
      // inverts with the room. 15.3:1 with its label.
      buttonBackground: '#EDEAE4',
      buttonBackgroundDisabled: 'rgba(237, 234, 228, 0.4)',

      // Text companion of `brand` (see `light.brandText`).
      brandText: '#FF8577',

      // Brand-hue accent for wire plates (identical register both
      // modes — see light.brandOnInk).
      brandOnInk: '#FF6B5E',

      // Semantic status colors — brightened for dark contrast (all AA
      // as text on ground and cardAlt; matrix in thesis §4.3).
      status: {
        success: '#40C98E',
        warning: '#E5B54B',
        error: '#F27F72',
        info: '#74ABFF',
      },

      // Aliases matching `light` (kept in sync across both palettes).
      success: '#40C98E',
      alert: '#F27F72',

      // Night ink on the chalk verb — one paint per plate.
      textOnBrand: '#161412',

      // One paint per plate (see light.textOnBrandMuted).
      textOnBrandMuted: '#161412',

      // Page tone for full-bleed screens — the board's edge.
      backgroundDeep: '#100F0D',

      // Text color variants. `tertiary` is DECORATIVE ONLY — never
      // carries information.
      textColors: {
        muted: '#978F85',
        secondary: '#C6C1B8',
        tertiary: '#6E675E',
      },

      // Icon background tints — bright hue on dark tint.
      iconBackground: {
        blue: 'rgba(108, 158, 242, 0.16)',
        green: 'rgba(77, 184, 126, 0.16)',
        purple: 'rgba(177, 140, 242, 0.16)',
        orange: 'rgba(255, 107, 94, 0.16)',
        white: 'rgba(237, 234, 228, 0.08)',
      },

      // Glassmorphism (dark) — smoked ground tints.
      glass: {
        background: 'rgba(22, 20, 18, 0.72)',
        backgroundLight: 'rgba(22, 20, 18, 0.55)',
        border: 'rgba(237, 234, 228, 0.20)',
        borderHighlight: 'rgba(237, 234, 228, 0.28)',
        borderHover: 'rgba(237, 234, 228, 0.24)',
        emptyInputBorder: 'rgba(237, 234, 228, 0.32)',
        panelBackground: 'rgba(16, 15, 13, 0.6)',
        inputBackground: 'rgba(237, 234, 228, 0.05)',
        inputFocusBackground: 'rgba(237, 234, 228, 0.09)',
      },

      // Alert background tint for error containers (dark red wash).
      alertBackground: 'rgba(242, 127, 114, 0.12)',

      // ── Mobile premium primitive kit tokens (dark) ───────────────────
      // Still at night: rules up, no lifts.
      mobilePremium: {
        hairlineBorder: 'rgba(237, 234, 228, 0.20)',
        hairlineBorderStrong: 'rgba(237, 234, 228, 0.32)',

        surfaceGradientTop: 'rgba(237, 234, 228, 0.0)',
        surfaceGradientBottom: 'rgba(237, 234, 228, 0.0)',

        surfaceGlow: 'none',

        instrumentShadow: 'none',

        surfaceBackdropBlur: 'blur(24px) saturate(140%)',

        androidChromeSurfaceBackground: 'rgba(22, 20, 18, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'cc',
        navPanelShadow: 'none',

        atmosphereVignette: 'inset 0 0 210px 80px rgba(0, 0, 0, 0.38)',

        railTrack: 'rgba(237, 234, 228, 0.16)',
        railFillShadow: 'none',
      },

      // ── The meter ramp (see METER_DARK above) ─────────────────────────
      meter: METER_DARK,

      // ── The wire (identical to light — see above) ─────────────────────
      focus: WIRE,
    },
  },

  // Spacing system
  spacing: {
    xxs: 2,
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },

  // Border radius
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    pill: 9999,
  },

  // ── Shape tokens ────────────────────────────────────────────────────
  // Semantic corner radii for the MobilePremium kit. THE SCOREBOARD
  // runs THE SQUARE CUT: radius 0 everywhere — a square cut is a
  // decision, a rounded corner is a default (thesis §5). No machined
  // corners, no pills.
  shapes: {
    /** Cards + section surfaces (MobileSurface, StatCard, alerts). */
    surface: 0,
    /** Portal panels — bottom sheets, calendar/dialog bodies. */
    sheet: 0,
    /** Inputs, buttons, selects — interactive controls. */
    control: 0,
    /** Small tiles — selection rows, option containers, thumbnails. */
    tile: 0,
    /** Chips, tags, badges. */
    tag: 0,
  },

  // ── Atmosphere tokens ────────────────────────────────────────────────
  // The atmosphere-language override point — the same discipline as
  // `shapes`: the consumer declares the background style ONCE here and
  // every MobileAtmosphere (scaffolds, drawers, auth screens) follows,
  // with no per-callsite prop threading. `MobileAtmosphere`'s
  // `showOrbs` prop remains as the explicit per-callsite override
  // (the dev showcase uses it to demo both styles under one theme).
  atmosphere: {
    /**
      * The background style the atmosphere renders.
      * - 'aurora': drifting color-field orbs over the base tint — the
      *   starter's premium read, the glass dialect's preset.
      * - 'flat': base tint + vignette only, no orbs — the ruled-field
      *   read for consumers whose design language wants a continuous
      *   page. Orb drift stops too (nothing left to animate).
      *
      * Defaults to the dialect preset; write a literal to override.
      */
    style: DIALECT_PRESETS[DIALECT].atmosphere,
  },

  // ── Drawer tokens ────────────────────────────────────────────────────
  // The nav-drawer surface language override point — the same
  // discipline as `shapes`/`atmosphere`: declare it once here and the
  // drawer follows, no per-callsite props.
  //   • 'sheet': the glass-scrim iOS sheet this component shipped as —
  //     blur scrim, atmosphere body, hairline edge (the glass dialect's
  //     preset).
  //   • 'ink': the inverted plate (InkPanel) — text-color plate + brand
  //     edge rule, flat dim scrim (no blur), the masthead riding ON the
  //     plate (MobileHomeHeader onPlate). Defaults to the dialect
  //     preset; write a literal to override.
  drawer: {
    style: DIALECT_PRESETS[DIALECT].drawer,
  },

  // ── Toast tokens ────────────────────────────────────────────────────
  // The transient-message surface language, same discipline as the
  // family above. 'card' is the bordered card with colored icons — the
  // glass dialect's default. 'chit' is the interrupt treatment: the
  // iron plate (near-black in both modes), chalk type, one 7px status
  // dot, mono message when `fonts.mono` is declared, flat air (no
  // shadow, no stripe, no icon triad). Defaults to the dialect preset;
  // write a literal to override.
  toast: {
    style: DIALECT_PRESETS[DIALECT].toast,
  },

  // ── Transition tokens ────────────────────────────────────────────────
  // The route-transition axis — the one motion declaration. 'none' (the
  // glass dialect's preset): the curtain machinery stays retired —
  // withRouteCurtain passes straight through and the overlay never
  // mounts. 'curtain' (the ink preset): the shell's RouteCurtain plays
  // — the iron sweep (interrupt-page cover, 2px strike leading edge,
  // destination title stamped in the display face), wired through
  // NavigationHelper. Write a literal to override the preset.
  transition: {
    style: DIALECT_PRESETS[DIALECT].transition,
  },

  // ── Type families ───────────────────────────────────────────────────
  // The same discipline as shapes/atmosphere/drawer: declare the pair
  // ONCE here and every face-aware read (typography tokens, eyebrows,
  // figure styles) follows — no per-callsite fontFamily threading. See
  // the TypeFaces block above for the self-hosting recipe.
  fonts: FONTS,

  // ── Named type styles ─────────────────────────────────────────────────
  // THE HARMONIC RAMP (docs/architecture/interval-thesis.md §3.2):
  // FOUR sizes — {72, 36, 18, 12}, every size an exact divisor of the
  // counter (72 × {1, ½, ¼, ⅙}), every lineHeight = size + 6, at most
  // three on any screen (+ THE LIVE FIGURE where the thesis assigns
  // the counter — on the Floor it is state-dependent: the rest clock
  // while rest runs, the armed expression otherwise). One statement
  // per screen at 36 (the content itself, sentence case — never a
  // page nameplate), second voice ≥1.4× quieter (36/18 = 2.0 ✓).
  // FURNITURE IS PRINTED CAPS (caps, Martian, tracked), CONTENT
  // SPEAKS (sentence case, Space Grotesk). TRACKING IS AUTHORED PER
  // RANK AND EXACT: counter −1.5 · statement −0.5 · row 0 · caps
  // furniture +0.8 · lowercase mono whispers 0. Retired ranks
  // collapse onto the ramp rather than deleting keys (the token
  // structure is the shell's). Consumers import the named style and
  // spread it; they do NOT pick ad-hoc fontSize/fontWeight.
  typography: {
    mobileTitle: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileBody: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
      fontFamily: undefined,
    } satisfies TypographyToken,
    mobileAction: {
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
      letterSpacing: 0.8,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileEyebrow: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0.8,
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileFieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 18,
      letterSpacing: 0,
      fontFamily: undefined,
    } satisfies TypographyToken,
    // ── Figure language ────────────────────────────────────────────────
    // Martian keeps EVERY working figure (anything that changes,
    // aligns, or ledger-reads — at any size; mono is tabular by
    // construction). The counter is the logger's armed expression —
    // `62.5 × 8` at figure scale, the app's most confident mark.
    mobileHero: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 42,
      letterSpacing: -0.5,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileDisplay: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 42,
      letterSpacing: -0.5,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileFigure: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 24,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileItemTitle: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    // THE STATEMENT — one per screen: the display face at full voice.
    // (No condensed second family under THE SCOREBOARD; the key
    // resolves to the display face itself.)
    mobileTitleCondensed: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 42,
      letterSpacing: -0.5,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    // THE ARMED EXPRESSION — the logger's `weight × reps` line and
    // the streak: mono 72, the biggest mark in the system. Under
    // THE INTERVAL the counter rank is STATE-DEPENDENT on the Floor
    // (interval-thesis §7): while rest runs the rest clock owns it
    // and the armed expression demotes to the statement rank —
    // values swap, nothing moves. THE SIGHT AMENDMENT (§3.2): the
    // counter rides the mono face's CONDENSED cut — the regular cut
    // at 72 truncated the expression inside its own boxes; the rank
    // keeps its size, the face gives back its width. Demotions
    // inherit the same family, so the re-weight stays a pure repaint
    // (same glyphs, new rank).
    mobileCounter: {
      fontSize: 72,
      fontWeight: '700',
      lineHeight: 78,
      letterSpacing: -1.5,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.monoCondensed,
    } satisfies TypographyToken,
    mobileLedger: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileMeta: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: undefined,
    } satisfies TypographyToken,
    mobileTag: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0,
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
  },
};

// The two color schemes arqavellum supports. `light` is the default. Type-wide
// so consumers can type their own APIs (`onChangeColorScheme(next: ColorScheme)`).
export type ColorScheme = 'light' | 'dark';

// The atmosphere background styles (`theme.atmosphere.style`). 'aurora' is
// the starter default; a consumer declares 'flat' to turn the orbs off
// app-wide in one place.
export type AtmosphereStyle = 'aurora' | 'flat';

// The toast surface styles (`theme.toast.style`) — the bordered card the
// glass dialect presets vs the iron interrupt chit the ink dialect
// presets.
export type ToastStyle = 'card' | 'chit';

// Convenience aliases — the resolved palette shape for either mode. Both
// `light` and `dark` are structurally identical, so the union collapses to
// a single shape.
export type ColorPalette = typeof theme.colors.light;
