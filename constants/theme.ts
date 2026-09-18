// constants/theme.ts
// armandotfit theme — "THE BOARD" (see
// docs/architecture/board-thesis.md).
//
// The training whiteboard: quantities drawn, not written. One flat
// board per mode — the WHITE BOARD in daylight (near-white neutral +
// ink), the CHALKBOARD at night (near-black neutral + chalk) — no
// cards, no shadows except the docked logger. On the shell's `ink`
// dialect (flat atmosphere, chit toasts, curtain transitions — see
// DIALECT below).
//
//   • COLOR HAS TWO JOBS — the `meter` ramp encodes LOAD (the plate
//     code: red 25 / blue 20 / yellow 15 / green 10 / white 5 / steel
//     1.25, drawn as proportional slabs), and the record-orange
//     `brand` slot marks PRs, links, and the living pulse. Everything
//     else is ink; the verb is the heaviest ink on the page.
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
// prices, stock, dates, metrics, eyebrows); body/UI text stays the
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
   * THE BOARD pins Archivo's width axis at 75% as 'Archivo Cond' —
   * the STATEMENT position.
   */
  displayCondensed?: string;
  /** Mono face — ledger figures: prices, stock, dates, metrics, eyebrows. */
  mono?: string;
}

const FONTS = {
  // THE BOARD pair (docs/architecture/board-thesis.md §3.1) — Archivo
  // (one variable file, wght 100–900 + wdth 62–125) speaks the board's
  // words: statements (as 'Archivo Cond', the width-pinned second
  // family), subheads, row names, furniture caps, verb labels. Spline
  // Sans Mono (one variable file, wght 300–700) keeps EVERY figure —
  // armed values, ledgers, dates, timers; mono is tabular by
  // construction. Files in public/fonts/, @font-face + preloads in
  // index.html (id'd style), runtime restore in app/_layout.tsx —
  // the injector carries both into every exported route.
  display: 'Archivo',
  displayCondensed: 'Archivo Cond',
  mono: 'Spline Sans Mono',
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
  background: '#0A0B0C',
  surface: '#131416',
  surfaceAlt: '#191B1E',
  border: '#232629',
  text: '#EDE9DE',
  muted: '#9A9B96',
  signal: '#FF8A4A',
  onSignal: '#0A0B0C',
  track: '#1E2023',
  signalSoft: 'rgba(255, 138, 74, 0.16)',
} as const;

// The categorical meter ramp — six steps + the rim that guarantees
// each step's edge on light grounds. Structure is the shell's (same
// keys both repos); armandotfit's values are the PLATE CODE (thesis
// §4.2): red 25 / blue 20 / yellow 15 / green 10 / white 5 / steel
// 1.25. Arqavellum keeps its own (indigo-tinted) values.
const METER_LIGHT = {
  step1: '#C0281C',
  step2: '#1E4FB8',
  step3: '#D9A62E',
  step4: '#23714A',
  step5: '#ECECE5',
  step6: '#8D9299',
  rim: '#16181C',
} as const;

const METER_DARK = {
  step1: '#E4604F',
  step2: '#6C9EF2',
  step3: '#F0C64F',
  step4: '#4DB87E',
  step5: '#F5F5F0',
  step6: '#A9AEB5',
  rim: '#0C0D0F',
} as const;

export const theme = {
  colors: {
    // ── The white board (light default) ─────────────────────────────
    // A neutral near-white ground — no cream cast, no blue-steel cast:
    // the board is the neutral field the plates sing against. Every
    // MobilePremium primitive defaults to this palette unless the
    // consumer flips `colorScheme` to 'dark'. Measured ladder (thesis
    // §4.4): text ~17 on card → secondary ~10 → muted ≥ 5.7 on the
    // darkest surface it rides.
    light: {
      // UI element colors
      background: '#FAFAF7',
      backgroundAlt: '#F1F1EC',
      card: '#FFFFFF',
      cardAlt: '#F4F4EF',
      border: '#DDDDD3',

      // Card border colors — 1px precision edges on the board.
      cardBorder: 'rgba(22, 24, 28, 0.14)',
      cardBorderHover: 'rgba(22, 24, 28, 0.22)',

      // Text colors. Every informative slot clears WCAG AA (4.5:1) on
      // every board surface it rides (matrix in thesis §4.4).
      text: '#16181C',
      textMuted: '#5C6067',
      textSecondary: '#3E4148',

      // Interactive element colors — the `brand` slot: RECORD ORANGE.
      // Marks PRs, links, and the living pulse; appears as a fill only
      // in toasts/tints (measured 4.82 with its on-fill text).
      brand: '#C24100',
      brandHover: '#B03A00',
      brandPress: '#9E3300',
      brandMuted: 'rgba(194, 65, 0, 0.08)',
      brandSoft: 'rgba(194, 65, 0, 0.12)',
      // THE VERB IS INK (thesis pillar 2): the heaviest mark on the
      // page is the board's own ink, not a hue. 17.0:1 with its label.
      buttonBackground: '#16181C',
      buttonBackgroundDisabled: 'rgba(22, 24, 28, 0.4)',

      // The brand slot's TEXT companion — the same hue darkened until
      // it clears WCAG AA (4.5:1) as small text (labels, kickers,
      // links) on the board surfaces.
      brandText: '#9A3300',

      // Brand-hue accent for wire plates (the chit, the curtain) —
      // a brightened record reads on the near-black wire.
      brandOnInk: '#FF8A4A',

      // Semantic status colors. Measured AA as TEXT on page AND card
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
      // labels, the selected check). One paint per plate: board-ground
      // on ink.
      textOnBrand: '#FAFAF7',

      // Secondary text on ink fills. One paint per plate: hierarchy on
      // an ink fill comes from size/face, not alpha.
      textOnBrandMuted: '#FAFAF7',

      // Deeper background for full-bleed screens — the board's edge
      // tone.
      backgroundDeep: '#F1F1EC',

      // Text color variants. `textColors.muted` and `textMuted` are
      // unified (same value, both names). `tertiary` is DECORATIVE ONLY
      // (fails AA on card): placeholders, disabled states, watermarks —
      // it never carries information; informative quiet text reads
      // `textMuted`.
      textColors: {
        muted: '#5C6067',
        secondary: '#3E4148',
        tertiary: '#9A9DA3',
      },

      // Icon background tints (semantic — darker hue on pale tint).
      iconBackground: {
        blue: 'rgba(30, 79, 184, 0.10)',
        green: 'rgba(35, 113, 74, 0.10)',
        purple: 'rgba(126, 34, 206, 0.10)',
        orange: 'rgba(194, 65, 0, 0.10)',
        white: 'rgba(22, 24, 28, 0.06)',
      },

      // Glass tokens (kept for the shell's glass-dialect primitives).
      // On the board these read as neutral tints, not frosted windows.
      glass: {
        background: 'rgba(255, 255, 255, 0.72)',
        backgroundLight: 'rgba(255, 255, 255, 0.55)',
        border: 'rgba(22, 24, 28, 0.14)',
        borderHighlight: 'rgba(22, 24, 28, 0.22)',
        borderHover: 'rgba(22, 24, 28, 0.18)',
        emptyInputBorder: 'rgba(22, 24, 28, 0.26)',
        panelBackground: 'rgba(250, 250, 247, 0.6)',
        inputBackground: 'rgba(22, 24, 28, 0.04)',
        inputFocusBackground: 'rgba(22, 24, 28, 0.07)',
      },

      // Alert background tint for error containers.
      alertBackground: 'rgba(179, 38, 30, 0.08)',

      // ── Mobile premium primitive kit tokens ───────────────────────────
      // The board is FLAT and RULED: hairlines declare structure, no
      // glow. Elevation = rule / tint step; the ONE real shadow in the
      // system is instrumentShadow — the docked logger is the app's
      // single physical object (thesis §5).
      mobilePremium: {
        // Hairline border (inner) — ink at low opacity.
        hairlineBorder: 'rgba(22, 24, 28, 0.14)',
        hairlineBorderStrong: 'rgba(22, 24, 28, 0.24)',

        // Surface gradient stops — the board runs flat; the gradient is
        // a whisper, kept for primitives that composite it.
        surfaceGradientTop: 'rgba(22, 24, 28, 0.02)',
        surfaceGradientBottom: 'rgba(22, 24, 28, 0.0)',

        // Contact shadow — a 1px seat, not a glow.
        surfaceGlow: '0 1px 2px rgba(22, 24, 28, 0.05)',

        // THE INSTRUMENT LIFT — the docked logger's shadow (the one
        // physical object; thesis pillar 2). Nothing else uses it.
        instrumentShadow:
          '0 -2px 6px rgba(22, 24, 28, 0.08), 0 -12px 32px rgba(22, 24, 28, 0.16)',

        // Backdrop blur for web (saturate is safe on the board).
        surfaceBackdropBlur: 'blur(24px) saturate(160%)',

        // Android Chrome fallback — near-solid surface + milder blur.
        androidChromeSurfaceBackground: 'rgba(255, 255, 255, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        // Nav drawer (shell parity; the drawer stays synced but unwired
        // — THE BOARD has no tab bar and no drawer chrome).
        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'dd',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        // Faint vignette to settle the board into its edges (web).
        atmosphereVignette: 'inset 0 0 160px 60px rgba(22, 24, 28, 0.03)',

        // Rail (progress) — fill travels across a 2px track.
        railTrack: 'rgba(22, 24, 28, 0.12)',
        railFillShadow: 'none',
      },

      // ── The meter ramp (see METER_LIGHT above) ────────────────────────
      meter: METER_LIGHT,

      // ── The wire (see WIRE above) ─────────────────────────────────────
      focus: WIRE,
    },

    // ── The chalkboard (dark, opt-in) ───────────────────────────────
    // Mirror of `light` with every key retuned for dark surfaces:
    // near-black neutral, chalk text, brightened plates. The structural
    // shape MUST match `light` so `theme.colors[colorScheme].*` is
    // type-safe.
    dark: {
      background: '#101113',
      backgroundAlt: '#15171A',
      card: '#17191C',
      cardAlt: '#1D2023',
      border: '#2A2D31',

      // Card border colors — chalk hairlines on the black board.
      cardBorder: 'rgba(242, 243, 240, 0.14)',
      cardBorderHover: 'rgba(242, 243, 240, 0.22)',

      // Text colors — measured (thesis §4.4): text ~16 on card,
      // secondary ~10, muted ≥ 5.8 on cardAlt.
      text: '#F2F3F0',
      textMuted: '#989B95',
      textSecondary: '#C4C7C2',

      // The `brand` slot at night: bright record orange — high
      // contrast on the board as fill/large type; `brandText` carries
      // small text.
      brand: '#FF7E45',
      brandHover: '#FF8E5C',
      brandPress: '#E96E35',
      brandMuted: 'rgba(255, 126, 69, 0.14)',
      brandSoft: 'rgba(255, 126, 69, 0.18)',
      // THE VERB IS INK: at night the ink is chalk — the heaviest mark
      // inverts with the board. 16.96:1 with its label.
      buttonBackground: '#F2F3F0',
      buttonBackgroundDisabled: 'rgba(242, 243, 240, 0.4)',

      // Text companion of `brand` (see `light.brandText`).
      brandText: '#FF9E6E',

      // Brand-hue accent for wire plates (identical register both
      // modes — see light.brandOnInk).
      brandOnInk: '#FF8A4A',

      // Semantic status colors — brightened for dark contrast (all AA
      // as text on page and card; matrix in thesis §4.4).
      status: {
        success: '#40C98E',
        warning: '#E5B54B',
        error: '#F27F72',
        info: '#74ABFF',
      },

      // Aliases matching `light` (kept in sync across both palettes).
      success: '#40C98E',
      alert: '#F27F72',

      // Board ink on the chalk verb — one paint per plate.
      textOnBrand: '#101113',

      // One paint per plate (see light.textOnBrandMuted).
      textOnBrandMuted: '#101113',

      // Page tone for full-bleed screens — the black board's edge.
      backgroundDeep: '#0C0D0F',

      // Text color variants. `tertiary` is DECORATIVE ONLY — never
      // carries information.
      textColors: {
        muted: '#989B95',
        secondary: '#C4C7C2',
        tertiary: '#6A6D68',
      },

      // Icon background tints — bright hue on dark tint.
      iconBackground: {
        blue: 'rgba(108, 158, 242, 0.16)',
        green: 'rgba(77, 184, 126, 0.16)',
        purple: 'rgba(192, 132, 252, 0.16)',
        orange: 'rgba(255, 126, 69, 0.16)',
        white: 'rgba(242, 243, 240, 0.08)',
      },

      // Glassmorphism (dark) — smoked board tints.
      glass: {
        background: 'rgba(21, 23, 26, 0.72)',
        backgroundLight: 'rgba(21, 23, 26, 0.55)',
        border: 'rgba(242, 243, 240, 0.14)',
        borderHighlight: 'rgba(242, 243, 240, 0.24)',
        borderHover: 'rgba(242, 243, 240, 0.18)',
        emptyInputBorder: 'rgba(242, 243, 240, 0.26)',
        panelBackground: 'rgba(12, 13, 15, 0.6)',
        inputBackground: 'rgba(242, 243, 240, 0.05)',
        inputFocusBackground: 'rgba(242, 243, 240, 0.09)',
      },

      // Alert background tint for error containers (dark red wash).
      alertBackground: 'rgba(242, 127, 114, 0.12)',

      // ── Mobile premium primitive kit tokens (dark) ───────────────────
      // Flat at night too: hairlines up, the instrument lift softened.
      mobilePremium: {
        hairlineBorder: 'rgba(242, 243, 240, 0.14)',
        hairlineBorderStrong: 'rgba(242, 243, 240, 0.24)',

        surfaceGradientTop: 'rgba(242, 243, 240, 0.03)',
        surfaceGradientBottom: 'rgba(242, 243, 240, 0.0)',

        surfaceGlow: '0 1px 2px rgba(0, 0, 0, 0.4)',

        instrumentShadow:
          '0 -2px 6px rgba(0, 0, 0, 0.35), 0 -12px 32px rgba(0, 0, 0, 0.5)',

        surfaceBackdropBlur: 'blur(24px) saturate(140%)',

        androidChromeSurfaceBackground: 'rgba(16, 17, 19, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'cc',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        atmosphereVignette: 'inset 0 0 160px 60px rgba(0, 0, 0, 0.28)',

        railTrack: 'rgba(242, 243, 240, 0.14)',
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
  // Semantic corner radii for the MobilePremium kit. THE BOARD runs
  // BUTT JOINTS on surfaces (the board is one piece — radius 0),
  // softens only where a thumb lands: controls 10, portals 14, small
  // tiles 6, tags 4. A pill marks nothing here.
  shapes: {
    /** Cards + section surfaces (MobileSurface, StatCard, alerts). */
    surface: 0,
    /** Portal panels — bottom sheets, calendar/dialog bodies. */
    sheet: 14,
    /** Inputs, buttons, selects — interactive controls. */
    control: 10,
    /** Small tiles — selection rows, option containers, thumbnails. */
    tile: 6,
    /** Chips, tags, badges. */
    tag: 4,
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
  // THE BOARD ramp (docs/architecture/board-thesis.md §3.2): SIX sizes
  // — 56 (the armed figures) · 36 (the statement, Archivo Cond) · 22
  // (the subhead) · 17 (the row name) · 15 (reading + row figures) ·
  // 12 (whisper furniture) — with at most four on any screen. One
  // statement per screen at 36 (the content itself, sentence case —
  // never a page nameplate), second voice ≥ 1.4× quieter (36/22 =
  // 1.64 ✓). FURNITURE SHOUTS (caps, Archivo, tracked), CONTENT
  // SPEAKS (sentence case). Retired ranks collapse onto the ramp
  // rather than deleting keys (the token structure is the shell's).
  // Consumers import the named style and spread it; they do NOT pick
  // ad-hoc fontSize/fontWeight.
  typography: {
    mobileTitle: {
      fontSize: 22,
      fontWeight: '700',
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
      fontWeight: '800',
      lineHeight: 20,
      letterSpacing: 1.2,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileEyebrow: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 1.2,
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
    // Spline keeps EVERY working figure (anything that changes, aligns,
    // or ledger-reads — at any size; mono is tabular by construction).
    // The counter is the logger's editable digit pair — the one place
    // figures speak at display scale.
    mobileHero: {
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 40,
      letterSpacing: -0.5,
      fontFamily: FONTS.displayCondensed,
    } satisfies TypographyToken,
    mobileDisplay: {
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 40,
      letterSpacing: -0.5,
      fontFamily: FONTS.displayCondensed,
    } satisfies TypographyToken,
    mobileFigure: {
      fontSize: 15,
      fontWeight: '600',
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
      fontWeight: '800',
      lineHeight: 40,
      letterSpacing: -0.5,
      fontFamily: FONTS.displayCondensed,
    } satisfies TypographyToken,
    // THE ARMED FIGURES — the logger's editable weight/reps digits.
    mobileCounter: {
      fontSize: 56,
      fontWeight: '700',
      lineHeight: 60,
      letterSpacing: -1,
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
