// constants/theme.ts
// armandotfit theme — "THE QUIET PAGE" (see
// docs/architecture/quiet-page-thesis.md).
//
// Reduction as the design language, on the shell's `ink` dialect
// (flat atmosphere, chit toasts, curtain transitions — see DIALECT
// below):
//
//   • THE PAGE — one continuous warm sheet held together by air, not
//     rules: PAPER in the light (warm cream + warm ink), EVENING
//     EDITION at night (warm black + cream text). Never cool gray,
//     never blue-steel. Square-cut print surfaces (2px), no shadows.
//   • THE WIRE (colors.focus.*) — the mode-independent interrupt
//     register: the warm-black plate for the chit toast, the route
//     curtain, and the live-session ticker.
//
// One RECORD red (the `brand` slot) appears exactly three ways: the
// record mark (PBs, today's position, LIVE), the primary verb, the
// living pulse. Palette values are the BROADSHEET's measured set,
// carried over verbatim (the AA matrix of that run still pins them):
// light record #C24100, recordText #9A3300, paper textOnRecord on the
// fill; dark record #FF7E45, recordText #FF9E6E, ink-on-record; wire
// text #EDE9DE on #0E0C08.
//
// Structure + axes (dialect/shapes/fonts/typography/atmosphere/drawer/
// toast/transition + the TypeFaces width axis + the focus register) are
// the shell's, synced from arqavellum. Only the palette values, the
// DIALECT pick, and the retuned type ramp are armandotfit's own.

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
   * THE QUIET PAGE leaves this undefined: its display face (Rokkitt)
   * is a single-position slab.
   */
  displayCondensed?: string;
  /** Mono face — ledger figures: prices, stock, dates, metrics, eyebrows. */
  mono?: string;
}

const FONTS = {
  // THE QUIET PAGE pair (docs/architecture/quiet-page-thesis.md §3.1)
  // — inherited from the BROADSHEET verbatim: the pair was never the
  // density problem. Rokkitt — the slab-serif statement voice —
  // speaks headlines (the statement, subheads, station names, button
  // labels). Azeret Mono keeps the agate (every changing or aligned
  // figure: timers, set rows, the armed call — mono is tabular by
  // construction). Files in public/fonts/, @font-face + preloads in
  // index.html (id'd style), runtime restore in app/_layout.tsx —
  // the injector carries both into every exported route.
  display: 'Rokkitt',
  displayCondensed: undefined,
  mono: 'Azeret Mono',
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
// ink in the system, in BOTH modes (the chit toast, the route curtain,
// the live-session ticker). Identical values in both palettes BY
// DESIGN; it is a surface family (like `glass` / `mobilePremium`), not
// a third color scheme — `useAppTheme()` still resolves exactly two.
const WIRE = {
  background: '#0E0C08',
  surface: '#16130E',
  surfaceAlt: '#1C1913',
  border: '#27231B',
  text: '#EDE9DE',
  muted: '#9C9686',
  signal: '#FF8A4A',
  onSignal: '#14110C',
  track: '#1F1B14',
  signalSoft: 'rgba(255, 138, 74, 0.16)',
} as const;

export const theme = {
  colors: {
    // ── Paper (the page, light default) ──────────────────────────────
    // A warm cream sheet with warm ink: the daily paper in daylight.
    // Never cool gray, never blue. Every MobilePremium primitive
    // defaults to this palette unless the consumer flips `colorScheme`
    // to 'dark'. Measured ladder: text ~15 on card → secondary ~9 →
    // muted ≥ 4.5 on the darkest surface it rides.
    light: {
      // UI element colors
      background: '#F6F3EB',
      backgroundAlt: '#EDE9DE',
      card: '#FBF9F2',
      cardAlt: '#F0EDE2',
      border: '#DFDACE',

      // Card border colors — 1px precision edges on paper.
      cardBorder: 'rgba(27, 24, 18, 0.14)',
      cardBorderHover: 'rgba(27, 24, 18, 0.22)',

      // Text colors. Every informative slot clears WCAG AA (4.5:1) on
      // the DARKEST paper surface it rides (page #F2EEE5).
      text: '#1B1812',
      textMuted: '#5F5B4E',
      textSecondary: '#413D33',

      // Interactive element colors — the `brand` slot: THE RECORD.
      // One editorial red, measured at both jobs: as a fill it clears
      // 3:1 with headroom; as small text it never appears —
      // `brandText` below is the text companion.
      brand: '#C24100',
      brandHover: '#B03A00',
      brandPress: '#9E3300',
      brandMuted: 'rgba(194, 65, 0, 0.08)',
      brandSoft: 'rgba(194, 65, 0, 0.12)',
      buttonBackground: '#C24100',
      buttonBackgroundDisabled: 'rgba(194, 65, 0, 0.5)',

      // The brand slot's TEXT companion — the same hue darkened until
      // it clears WCAG AA (4.5:1) as small text (labels, kickers,
      // links) on the paper surfaces.
      brandText: '#9A3300',

      // Brand-hue accent for wire plates (the chit, the curtain, the
      // ticker) — a brightened record reads on the warm-black wire.
      brandOnInk: '#FF8A4A',

      // Semantic status colors. Measured AA as TEXT on page AND card
      // (matrix in broadsheet-thesis §3.3).
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

      // Text color for content rendered on top of the brand color slot
      // (button labels, the selected check). Stencil discipline: PAPER
      // on the record red — one paint per plate.
      textOnBrand: '#FFF5EC',

      // Secondary text on brand surfaces. One paint per plate:
      // hierarchy on a brand fill comes from size/face, not alpha —
      // this equals textOnBrand (see thesis §3).
      textOnBrandMuted: '#FFF5EC',

      // Deeper background for full-bleed screens — the page tone:
      // warm cream, never cold.
      backgroundDeep: '#F2EEE5',

      // Text color variants. `textColors.muted` and `textMuted` are
      // unified (same value, both names). `tertiary` is DECORATIVE ONLY
      // (fails AA on card): placeholders, disabled states, watermarks —
      // it never carries information; informative quiet text reads
      // `textMuted`.
      textColors: {
        muted: '#5F5B4E',
        secondary: '#413D33',
        tertiary: '#918D7F',
      },

      // Icon background tints (semantic — darker hue on pale tint).
      iconBackground: {
        blue: 'rgba(29, 95, 204, 0.10)',
        green: 'rgba(30, 122, 76, 0.10)',
        purple: 'rgba(126, 34, 206, 0.10)',
        orange: 'rgba(194, 65, 0, 0.10)',
        white: 'rgba(27, 24, 18, 0.06)',
      },

      // Glass tokens (kept for the shell's glass-dialect primitives).
      // On paper these read as paper tints, not frosted windows.
      glass: {
        background: 'rgba(251, 249, 242, 0.72)',
        backgroundLight: 'rgba(251, 249, 242, 0.55)',
        border: 'rgba(27, 24, 18, 0.14)',
        borderHighlight: 'rgba(27, 24, 18, 0.22)',
        borderHover: 'rgba(27, 24, 18, 0.18)',
        emptyInputBorder: 'rgba(27, 24, 18, 0.26)',
        panelBackground: 'rgba(251, 249, 242, 0.6)',
        inputBackground: 'rgba(27, 24, 18, 0.04)',
        inputFocusBackground: 'rgba(194, 65, 0, 0.06)',
      },

      // Alert background tint for error containers.
      alertBackground: 'rgba(179, 38, 30, 0.08)',

      // ── Mobile premium primitive kit tokens ───────────────────────────
      // The page is FLAT and RULED: hairlines declare structure, not
      // glow. Elevation = rule / tint step / the wire (thesis §4); the
      // one shadow in the system is a 1px seat.
      mobilePremium: {
        // Hairline border (inner) — warm ink at low opacity.
        hairlineBorder: 'rgba(27, 24, 18, 0.14)',
        hairlineBorderStrong: 'rgba(27, 24, 18, 0.24)',

        // Surface gradient stops — the page runs flat; the gradient is
        // a whisper, kept for primitives that composite it.
        surfaceGradientTop: 'rgba(27, 24, 18, 0.02)',
        surfaceGradientBottom: 'rgba(27, 24, 18, 0.0)',

        // Contact shadow — a 1px seat, not a glow.
        surfaceGlow: '0 1px 2px rgba(27, 24, 18, 0.05)',

        // Backdrop blur for web (saturate is safe on paper).
        surfaceBackdropBlur: 'blur(24px) saturate(160%)',

        // Android Chrome fallback — near-solid surface + milder blur.
        androidChromeSurfaceBackground: 'rgba(251, 249, 242, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        // Nav drawer (shell parity; the drawer is retired from this
        // app's chrome but the primitive stays synced).
        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'dd',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        // Faint vignette to settle the page into its edges (web).
        atmosphereVignette: 'inset 0 0 160px 60px rgba(27, 24, 18, 0.03)',

        // Rail (progress) — fill travels across a 2px track.
        railTrack: 'rgba(27, 24, 18, 0.12)',
        railFillShadow: 'none',
      },

      // ── The wire (see WIRE above) ─────────────────────────────────────
      focus: WIRE,
    },

    // ── Evening Edition (the page at night, opt-in) ──────────────────
    // Mirror of `light` with every key retuned for dark surfaces:
    // warm black, never slate-blue. The structural shape
    // MUST match `light` so `theme.colors[colorScheme].*` is type-safe.
    dark: {
      background: '#14110C',
      backgroundAlt: '#181510',
      card: '#1A1710',
      cardAlt: '#201C14',
      border: '#2C2820',

      // Card border colors — cream hairlines on warm black.
      cardBorder: 'rgba(237, 233, 222, 0.14)',
      cardBorderHover: 'rgba(237, 233, 222, 0.22)',

      // Text colors — measured: text ~14 on card, secondary ~9,
      // muted ≥ 4.5 on cardAlt.
      text: '#EDE9DE',
      textMuted: '#9C9686',
      textSecondary: '#CBC6B8',

      // The `brand` slot at night: a bright record red — high contrast
      // on page as fill/large type; `brandText` carries small text.
      brand: '#FF7E45',
      brandHover: '#FF8E5C',
      brandPress: '#E96E35',
      brandMuted: 'rgba(255, 126, 69, 0.14)',
      brandSoft: 'rgba(255, 126, 69, 0.18)',
      buttonBackground: '#FF7E45',
      buttonBackgroundDisabled: 'rgba(255, 126, 69, 0.4)',

      // Text companion of `brand` (see `light.brandText`).
      brandText: '#FF9E6E',

      // Brand-hue accent for wire plates (identical register both
      // modes — see light.brandOnInk).
      brandOnInk: '#FF8A4A',

      // Semantic status colors — brightened for dark contrast (all AA
      // as text on page and card; matrix in thesis §3.3).
      status: {
        success: '#40C98E',
        warning: '#E5B54B',
        error: '#F27F72',
        info: '#74ABFF',
      },

      // Aliases matching `light` (kept in sync across both palettes).
      success: '#40C98E',
      alert: '#F27F72',

      // Ink on the bright record — one paint per plate.
      textOnBrand: '#14110C',

      // One paint per plate (see light.textOnBrandMuted).
      textOnBrandMuted: '#14110C',

      // Page tone for full-bleed screens — warm black.
      backgroundDeep: '#100E0A',

      // Text color variants. `tertiary` is DECORATIVE ONLY — never
      // carries information.
      textColors: {
        muted: '#9C9686',
        secondary: '#CBC6B8',
        tertiary: '#6B665A',
      },

      // Icon background tints — bright hue on dark tint.
      iconBackground: {
        blue: 'rgba(116, 171, 255, 0.16)',
        green: 'rgba(64, 201, 142, 0.16)',
        purple: 'rgba(192, 132, 252, 0.16)',
        orange: 'rgba(255, 126, 69, 0.16)',
        white: 'rgba(237, 233, 222, 0.08)',
      },

      // Glassmorphism (dark) — smoked paper tints.
      glass: {
        background: 'rgba(24, 21, 16, 0.72)',
        backgroundLight: 'rgba(24, 21, 16, 0.55)',
        border: 'rgba(237, 233, 222, 0.14)',
        borderHighlight: 'rgba(237, 233, 222, 0.24)',
        borderHover: 'rgba(237, 233, 222, 0.18)',
        emptyInputBorder: 'rgba(237, 233, 222, 0.26)',
        panelBackground: 'rgba(16, 14, 10, 0.6)',
        inputBackground: 'rgba(237, 233, 222, 0.05)',
        inputFocusBackground: 'rgba(255, 126, 69, 0.10)',
      },

      // Alert background tint for error containers (dark red wash).
      alertBackground: 'rgba(242, 127, 114, 0.12)',

      // ── Mobile premium primitive kit tokens (dark) ───────────────────
      // Flat at night too: hairlines up, shadows down to a seat.
      mobilePremium: {
        hairlineBorder: 'rgba(237, 233, 222, 0.14)',
        hairlineBorderStrong: 'rgba(237, 233, 222, 0.24)',

        surfaceGradientTop: 'rgba(237, 233, 222, 0.03)',
        surfaceGradientBottom: 'rgba(237, 233, 222, 0.0)',

        surfaceGlow: '0 1px 2px rgba(0, 0, 0, 0.4)',

        surfaceBackdropBlur: 'blur(24px) saturate(140%)',

        androidChromeSurfaceBackground: 'rgba(20, 17, 12, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'cc',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        atmosphereVignette: 'inset 0 0 160px 60px rgba(0, 0, 0, 0.28)',

        railTrack: 'rgba(237, 233, 222, 0.14)',
        railFillShadow: 'none',
      },

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
  // Semantic corner radii for the MobilePremium kit. THE BROADSHEET
  // runs SQUARE-CUT PRINT (thesis §2.5): the corner is a cut — 2px
  // softening only so subpixel edges don't fizz; portals get 4. A
  // pill marks nothing here. `borderRadius` above is the raw size
  // scale for ad-hoc shapes; primitives use these semantics.
  shapes: {
    /** Cards + section surfaces (MobileSurface, StatCard, alerts). */
    surface: 2,
    /** Portal panels — bottom sheets, calendar/dialog bodies. */
    sheet: 4,
    /** Inputs, buttons, selects — interactive controls. */
    control: 2,
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
  // THE QUIET PAGE ramp (docs/architecture/quiet-page-thesis.md §3.2):
  // FIVE sizes total — 48 (the call) · 34 (the statement) · 22 (the
  // subhead) · 15 (the row/verb/reading) · 12 (the whisper) — with at
  // most four on any screen and ~3 on a Desk page. One statement per
  // screen at 34 (the content itself, sentence case — never a page
  // nameplate), second voice ≥ 1.4× quieter. Line-heights snap to 2.
  // Retired ranks collapse onto the ramp rather than deleting keys
  // (the token structure is the shell's): `mobileHero` and the deck
  // rank no longer have a distinct size. Consumers import the named
  // style and spread it; they do NOT pick ad-hoc fontSize/fontWeight.
  typography: {
    mobileTitle: {
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 26,
      letterSpacing: -0.2,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileSubtitle: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0,
      fontFamily: undefined,
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
      letterSpacing: 0.5,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileEyebrow: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 14,
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
    // Agate keeps EVERY working figure (anything that changes, aligns,
    // or ledger-reads — at any size; mono is tabular by construction).
    // The counter is the one place the mono face is allowed above the
    // row scale.
    mobileHero: {
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 38,
      letterSpacing: -0.4,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileDisplay: {
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 38,
      letterSpacing: -0.4,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileFigure: {
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileItemTitle: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: -0.1,
      fontFamily: undefined,
    } satisfies TypographyToken,
    // Station head — the arm's-length NAME position: the Floor's
    // station name at the statement scale (the call above it is the
    // only louder thing on the Floor).
    mobileTitleCondensed: {
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 38,
      letterSpacing: -0.4,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    // The call — THE ARMED SET at full size: the live weight × reps
    // digits and Floor timers. Agate (tabular by construction); the
    // one place the mono face is allowed above the row scale.
    mobileCounter: {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 52,
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
