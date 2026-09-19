// constants/theme.ts
// armandotfit theme — "THE GAUGE" (see
// docs/architecture/gauge-thesis.md).
//
// The gym's instrument panel: machined enamel panels floating on a
// concrete ground, loads set on a printed pin rail, figures on
// rolling counters, and the clock as a first-class instrument
// (elapsed + the rest countdown). On the shell's `ink` dialect
// (flat atmosphere, chit toasts, curtain transitions — see DIALECT
// below).
//
//   • COLOR HAS TWO JOBS — the `meter` ramp encodes the GYM'S
//     GEOGRAPHY (the zone ramp: barbell oxide / dumbbell brass /
//     cable blue / machine green / bodyweight violet + steel), and
//     the signal hue (safety orange, the `brand` slot) marks
//     records, links, and the live pulse. Everything else is ink;
//     the verb is the heaviest ink on the page.
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
   * THE GAUGE pins Instrument Sans's width axis at 75% as
   * 'Instrument Cond' — the STATEMENT position.
   */
  displayCondensed?: string;
  /** Mono face — ledger figures: prices, stock, dates, metrics, eyebrows. */
  mono?: string;
}

const FONTS = {
  // THE GAUGE pair (docs/architecture/gauge-thesis.md §3.1) —
  // Instrument Sans (one variable file, wght 400–700 + wdth 75–100)
  // speaks the instrument's words: statements (as 'Instrument Cond',
  // the width-pinned second family), subheads, row names, furniture
  // caps, verb labels. Martian Mono (one variable file, wght 100–800
  // + wdth 75–112.5) keeps EVERY figure — counters, ledgers, dates,
  // clocks, rest; mono is tabular by construction, and its hardware
  // register is the point: digits read like a machine readout. Files
  // in public/fonts/, @font-face + preloads in index.html (id'd
  // style), runtime restore in app/_layout.tsx — the injector
  // carries both into every exported route.
  display: 'Instrument Sans',
  displayCondensed: 'Instrument Cond',
  mono: 'Martian Mono',
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
  signal: '#FF8A3D',
  onSignal: '#0B0D0F',
  track: '#1E2124',
  signalSoft: 'rgba(255, 138, 61, 0.16)',
} as const;

// The categorical meter ramp — six steps + the rim that guarantees
// each step's edge on light grounds. Structure is the shell's (same
// keys both repos); armandotfit's values are the ZONE RAMP (thesis
// §4.2): the gym's geography — barbell oxide red / dumbbell brass /
// cable blue / machine green / bodyweight violet / steel. Arqavellum
// keeps its own (indigo-tinted) values.
const METER_LIGHT = {
  step1: '#B02A1C',
  step2: '#8F6A12',
  step3: '#2559B7',
  step4: '#256B4A',
  step5: '#6D44B5',
  step6: '#7C858E',
  rim: '#12161A',
} as const;

const METER_DARK = {
  step1: '#E4604F',
  step2: '#E0B44F',
  step3: '#6C9EF2',
  step4: '#4DB87E',
  step5: '#B18CF2',
  step6: '#A5ADB5',
  rim: '#0C0E10',
} as const;

export const theme = {
  colors: {
    // ── Enamel (light default) ──────────────────────────────────────
    // Concrete ground + machined enamel panels: a cool-neutral two-tier
    // material (no cream cast, no blue-steel cast) whose depth comes
    // from the ground step, never from shadow. Every MobilePremium
    // primitive defaults to this palette unless the consumer flips
    // `colorScheme` to 'dark'. Measured ladder (thesis §4.4): text
    // ~17 on panel → secondary ~10 → muted ≥ 5.4 on the darkest
    // surface it rides.
    light: {
      // UI element colors
      background: '#EBEDEA',
      backgroundAlt: '#E4E6E3',
      card: '#FCFDFB',
      cardAlt: '#F2F4F1',
      border: '#D8DBD6',

      // Panel edge colors — the enamel's 1px steel hairline.
      cardBorder: 'rgba(18, 22, 26, 0.16)',
      cardBorderHover: 'rgba(18, 22, 26, 0.26)',

      // Text colors. Every informative slot clears WCAG AA (4.5:1) on
      // every surface it rides (matrix in thesis §4.4).
      text: '#12161A',
      textMuted: '#57606A',
      textSecondary: '#384049',

      // Interactive element colors — the `brand` slot: THE SIGNAL.
      // Safety orange; marks records, links, and the live pulse;
      // appears as a fill only in toasts/tints (measured 4.98 with
      // its on-fill text).
      brand: '#C23A00',
      brandHover: '#B23400',
      brandPress: '#A12E00',
      brandMuted: 'rgba(194, 58, 0, 0.08)',
      brandSoft: 'rgba(194, 58, 0, 0.12)',
      // THE VERB IS INK (thesis pillar 6): the heaviest mark on the
      // page is the panel's own ink, not a hue. 17.8:1 with its label.
      buttonBackground: '#12161A',
      buttonBackgroundDisabled: 'rgba(18, 22, 26, 0.4)',

      // The brand slot's TEXT companion — the same hue darkened until
      // it clears WCAG AA (4.5:1) as small text (labels, kickers,
      // links) on the panel surfaces.
      brandText: '#9C3100',

      // Brand-hue accent for wire plates (the chit, the curtain) —
      // a brightened signal reads on the near-black wire.
      brandOnInk: '#FF8A3D',

      // Semantic status colors. Measured AA as TEXT on page AND panel
      // (matrix in thesis §4.4).
      status: {
        success: '#1E7A4C',
        warning: '#8F5B00',
        error: '#B3261E',
        info: '#1D5FCC',
      },

      // Re-export aliases for call sites that read `success` and `alert`
      // at the top level (alternative to `status.success` / `status.error`).
      success: '#1E7A4C',
      alert: '#B3261E',

      // Text color for content rendered on top of the ink verb (button
      // labels, the selected check). One paint per plate: panel-ground
      // on ink.
      textOnBrand: '#FCFDFB',

      // Secondary text on ink fills. One paint per plate: hierarchy on
      // an ink fill comes from size/face, not alpha.
      textOnBrandMuted: '#FCFDFB',

      // Deeper background for full-bleed screens — the concrete's edge
      // tone.
      backgroundDeep: '#E1E4E0',

      // Text color variants. `textColors.muted` and `textMuted` are
      // unified (same value, both names). `tertiary` is DECORATIVE ONLY
      // (fails AA on panel): placeholders, disabled states, watermarks —
      // it never carries information; informative quiet text reads
      // `textMuted`.
      textColors: {
        muted: '#57606A',
        secondary: '#384049',
        tertiary: '#8A939C',
      },

      // Icon background tints (semantic — darker hue on pale tint).
      iconBackground: {
        blue: 'rgba(37, 89, 183, 0.10)',
        green: 'rgba(37, 107, 74, 0.10)',
        purple: 'rgba(109, 68, 181, 0.10)',
        orange: 'rgba(194, 58, 0, 0.10)',
        white: 'rgba(18, 22, 26, 0.06)',
      },

      // Glass tokens (kept for the shell's glass-dialect primitives).
      // On the panels these read as neutral tints, not frosted windows.
      glass: {
        background: 'rgba(252, 253, 251, 0.72)',
        backgroundLight: 'rgba(252, 253, 251, 0.55)',
        border: 'rgba(18, 22, 26, 0.16)',
        borderHighlight: 'rgba(18, 22, 26, 0.24)',
        borderHover: 'rgba(18, 22, 26, 0.20)',
        emptyInputBorder: 'rgba(18, 22, 26, 0.28)',
        panelBackground: 'rgba(235, 237, 234, 0.6)',
        inputBackground: 'rgba(18, 22, 26, 0.04)',
        inputFocusBackground: 'rgba(18, 22, 26, 0.07)',
      },

      // Alert background tint for error containers.
      alertBackground: 'rgba(179, 38, 30, 0.08)',

      // ── Mobile premium primitive kit tokens ───────────────────────────
      // The room is FLAT: panels sit on concrete with a hairline steel
      // edge, no glow. Elevation = rule / tint step; the ONE real
      // shadow in the system is instrumentShadow — the docked logger
      // is the app's single physical object (thesis §5).
      mobilePremium: {
        // Hairline border (inner) — steel at low opacity.
        hairlineBorder: 'rgba(18, 22, 26, 0.16)',
        hairlineBorderStrong: 'rgba(18, 22, 26, 0.26)',

        // Surface gradient stops — the panels run flat; the gradient is
        // a whisper, kept for primitives that composite it.
        surfaceGradientTop: 'rgba(18, 22, 26, 0.02)',
        surfaceGradientBottom: 'rgba(18, 22, 26, 0.0)',

        // Contact shadow — a 1px seat, not a glow.
        surfaceGlow: '0 1px 2px rgba(18, 22, 26, 0.05)',

        // THE INSTRUMENT LIFT — the docked logger's shadow (the one
        // physical object; thesis pillar 1). Nothing else uses it.
        instrumentShadow:
          '0 -2px 6px rgba(18, 22, 26, 0.07), 0 -14px 36px rgba(18, 22, 26, 0.14)',

        // Backdrop blur for web (saturate is safe on the panels).
        surfaceBackdropBlur: 'blur(24px) saturate(160%)',

        // Android Chrome fallback — near-solid surface + milder blur.
        androidChromeSurfaceBackground: 'rgba(252, 253, 251, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        // Nav drawer (shell parity; the drawer stays synced but unwired
        // — THE GAUGE has no tab bar and no drawer chrome).
        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'dd',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        // Faint vignette to settle the concrete into its edges (web).
        atmosphereVignette: 'inset 0 0 160px 60px rgba(18, 22, 26, 0.04)',

        // Rail (progress) — fill travels across a 2px track.
        railTrack: 'rgba(18, 22, 26, 0.12)',
        railFillShadow: 'none',
      },

      // ── The meter ramp (see METER_LIGHT above) ────────────────────────
      meter: METER_LIGHT,

      // ── The wire (see WIRE above) ─────────────────────────────────────
      focus: WIRE,
    },

    // ── Night gym (dark, opt-in) ───────────────────────────────────
    // Mirror of `light` with every key retuned for dark surfaces:
    // concrete night ground, lit panels, chalk text, brightened
    // zones. The structural shape MUST match `light` so
    // `theme.colors[colorScheme].*` is type-safe.
    dark: {
      background: '#0D0F11',
      backgroundAlt: '#121417',
      card: '#171A1F',
      cardAlt: '#1D2127',
      border: '#282C32',

      // Panel edge colors — chalk hairlines on the night panels.
      cardBorder: 'rgba(236, 239, 241, 0.15)',
      cardBorderHover: 'rgba(236, 239, 241, 0.24)',

      // Text colors — measured (thesis §4.4): text ~15 on panel,
      // secondary ~10, muted ≥ 6.1 on cardAlt.
      text: '#ECEFF1',
      textMuted: '#96A0A8',
      textSecondary: '#C0C7CD',

      // The `brand` slot at night: bright signal orange — high
      // contrast on the panels as fill/large type; `brandText` carries
      // small text.
      brand: '#FF8A3D',
      brandHover: '#FF9752',
      brandPress: '#E97C30',
      brandMuted: 'rgba(255, 138, 61, 0.14)',
      brandSoft: 'rgba(255, 138, 61, 0.18)',
      // THE VERB IS INK: at night the ink is chalk — the heaviest mark
      // inverts with the room. 16.6:1 with its label.
      buttonBackground: '#ECEFF1',
      buttonBackgroundDisabled: 'rgba(236, 239, 241, 0.4)',

      // Text companion of `brand` (see `light.brandText`).
      brandText: '#FFA368',

      // Brand-hue accent for wire plates (identical register both
      // modes — see light.brandOnInk).
      brandOnInk: '#FF8A3D',

      // Semantic status colors — brightened for dark contrast (all AA
      // as text on page and panel; matrix in thesis §4.4).
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
      textOnBrand: '#0D0F11',

      // One paint per plate (see light.textOnBrandMuted).
      textOnBrandMuted: '#0D0F11',

      // Page tone for full-bleed screens — the night floor's edge.
      backgroundDeep: '#080A0C',

      // Text color variants. `tertiary` is DECORATIVE ONLY — never
      // carries information.
      textColors: {
        muted: '#96A0A8',
        secondary: '#C0C7CD',
        tertiary: '#656F78',
      },

      // Icon background tints — bright hue on dark tint.
      iconBackground: {
        blue: 'rgba(108, 158, 242, 0.16)',
        green: 'rgba(77, 184, 126, 0.16)',
        purple: 'rgba(177, 140, 242, 0.16)',
        orange: 'rgba(255, 138, 61, 0.16)',
        white: 'rgba(236, 239, 241, 0.08)',
      },

      // Glassmorphism (dark) — smoked panel tints.
      glass: {
        background: 'rgba(23, 26, 31, 0.72)',
        backgroundLight: 'rgba(23, 26, 31, 0.55)',
        border: 'rgba(236, 239, 241, 0.15)',
        borderHighlight: 'rgba(236, 239, 241, 0.24)',
        borderHover: 'rgba(236, 239, 241, 0.18)',
        emptyInputBorder: 'rgba(236, 239, 241, 0.28)',
        panelBackground: 'rgba(8, 10, 12, 0.6)',
        inputBackground: 'rgba(236, 239, 241, 0.05)',
        inputFocusBackground: 'rgba(236, 239, 241, 0.09)',
      },

      // Alert background tint for error containers (dark red wash).
      alertBackground: 'rgba(242, 127, 114, 0.12)',

      // ── Mobile premium primitive kit tokens (dark) ───────────────────
      // Flat at night too: hairlines up, the instrument lift softened.
      mobilePremium: {
        hairlineBorder: 'rgba(236, 239, 241, 0.15)',
        hairlineBorderStrong: 'rgba(236, 239, 241, 0.26)',

        surfaceGradientTop: 'rgba(236, 239, 241, 0.03)',
        surfaceGradientBottom: 'rgba(236, 239, 241, 0.0)',

        surfaceGlow: '0 1px 2px rgba(0, 0, 0, 0.4)',

        instrumentShadow:
          '0 -2px 6px rgba(0, 0, 0, 0.35), 0 -14px 36px rgba(0, 0, 0, 0.5)',

        surfaceBackdropBlur: 'blur(24px) saturate(140%)',

        androidChromeSurfaceBackground: 'rgba(13, 15, 17, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'cc',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        atmosphereVignette: 'inset 0 0 160px 60px rgba(0, 0, 0, 0.3)',

        railTrack: 'rgba(236, 239, 241, 0.14)',
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
  // Semantic corner radii for the MobilePremium kit. THE GAUGE runs
  // MACHINED corners: enamel panels barely broken (radius 2), the
  // sheet softens where the thumb lands (12), controls 4, small tiles
  // and tags 2. A pill marks nothing here.
  shapes: {
    /** Cards + section surfaces (MobileSurface, StatCard, alerts). */
    surface: 2,
    /** Portal panels — bottom sheets, calendar/dialog bodies. */
    sheet: 12,
    /** Inputs, buttons, selects — interactive controls. */
    control: 4,
    /** Small tiles — selection rows, option containers, thumbnails. */
    tile: 2,
    /** Chips, tags, badges. */
    tag: 2,
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
  // THE GAUGE ramp (docs/architecture/gauge-thesis.md §3.2): SIX sizes
  // — 56 (the armed figures) · 36 (the statement, Instrument Cond) ·
  // 21 (the subhead) · 17 (the row name) · 15 (reading + row figures)
  // · 11 (whisper furniture) — with at most four on any screen. One
  // statement per screen at 36 (the content itself, sentence case —
  // never a page nameplate), second voice ≥ 1.4× quieter (36/21 =
  // 1.71 ✓). FURNITURE IS PRINTED CAPS (caps, Instrument, tracked),
  // CONTENT SPEAKS (sentence case). Retired ranks collapse onto the
  // ramp rather than deleting keys (the token structure is the
  // shell's). Consumers import the named style and spread it; they do
  // NOT pick ad-hoc fontSize/fontWeight.
  typography: {
    mobileTitle: {
      fontSize: 21,
      fontWeight: '600',
      lineHeight: 26,
      letterSpacing: -0.2,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileSubtitle: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileBody: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      letterSpacing: 0,
      fontFamily: undefined,
    } satisfies TypographyToken,
    mobileAction: {
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
      letterSpacing: 1.2,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileEyebrow: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 1.0,
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileFieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 0.1,
      fontFamily: undefined,
    } satisfies TypographyToken,
    // ── Figure language ────────────────────────────────────────────────
    // Martian keeps EVERY working figure (anything that changes,
    // aligns, or ledger-reads — at any size; mono is tabular by
    // construction). The counter is the logger's editable digit pair —
    // the one place figures speak at display scale.
    mobileHero: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 40,
      letterSpacing: -0.4,
      fontFamily: FONTS.displayCondensed,
    } satisfies TypographyToken,
    mobileDisplay: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 40,
      letterSpacing: -0.4,
      fontFamily: FONTS.displayCondensed,
    } satisfies TypographyToken,
    mobileFigure: {
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileItemTitle: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    // THE STATEMENT — one per screen: the condensed position of the
    // display face (width axis pinned at 75%, one file two families).
    mobileTitleCondensed: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 40,
      letterSpacing: -0.4,
      fontFamily: FONTS.displayCondensed,
    } satisfies TypographyToken,
    // THE ARMED FIGURES — the logger's editable weight/reps digits.
    mobileCounter: {
      fontSize: 56,
      fontWeight: '700',
      lineHeight: 60,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileLedger: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileMeta: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: undefined,
    } satisfies TypographyToken,
    mobileTag: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.4,
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
