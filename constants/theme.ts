// constants/theme.ts
// armandotfit theme — "THE COUNT" (see docs/architecture/count-thesis.md).
//
// A tally system on the shell's `ink` dialect (flat atmosphere, chit
// toasts, curtain transitions — see DIALECT below):
//
//   • The FIELD — one continuous page ruled by hairlines into a
//     ledger: CHALK in the light (warm-neutral white + graphite ink),
//     IRON at night (neutral near-black + chalk text). No cards
//     floating on backgrounds, no shadows; square-cut surfaces.
//   • THE IRON INTERRUPT (colors.focus.*) — the mode-independent
//     register for everything that interrupts: the chit toast, the
//     route curtain, the live session strip.
//
// One STRIKE color (the `brand` slot) appears exactly three ways: the
// next tally mark, the primary verb, the living pulse. Every
// text-bearing slot is measured WCAG AA on the darkest surface it
// rides (the full matrix lives in the thesis §3.3 and is regenerated
// by the contrast probe before any palette commit): light strike
// #C64100 (4.47:1 as fill on page), strikeText #A83E00 (5.54:1),
// chalk textOnStrike on the fill (4.73:1); dark strike #FF7A2E
// (7.48:1 on page), strikeText #FF9A5C (9.29:1), ink-on-strike
// (7.04:1); iron interrupt text #ECECEA on #0C0D0D (16.45:1).
//
// Structure + axes (dialect/shapes/fonts/typography/atmosphere/drawer/
// toast/transition + the TypeFaces width axis + the focus register) are
// the shell's, synced from arqavellum. Only the palette values, the
// DIALECT pick, and the added `mobileCounter` figure token are
// armandotfit's own (the counter token ports back domain-neutrally).

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
   * THE COUNT leaves this undefined: its display face (Big Shoulders)
   * is condensed by design.
   */
  displayCondensed?: string;
  /** Mono face — ledger figures: prices, stock, dates, metrics, eyebrows. */
  mono?: string;
}

const FONTS = {
  // The COUNT pair (docs/architecture/count-thesis.md §2.1). Big
  // Shoulders — the industrial condensed grotesk — speaks statements
  // (titles, station names, hero figures, button labels). Azeret Mono
  // keeps the count (every changing or aligned figure: timers, ledgers,
  // the armed counter — mono is tabular by construction). Files in
  // public/fonts/, @font-face + preloads in index.html (id'd style),
  // runtime restore in app/_layout.tsx — the injector carries both
  // into every exported route.
  display: 'Big Shoulders',
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

// The iron interrupt — everything that must interrupt renders as the
// heaviest plate in the system, in BOTH modes (the chit toast, the
// route curtain, the live session strip). Identical values in both
// palettes BY DESIGN; it is a surface family (like `glass` /
// `mobilePremium`), not a third color scheme — `useAppTheme()` still
// resolves exactly two.
const IRON_INTERRUPT = {
  background: '#0C0D0D',
  surface: '#171818',
  surfaceAlt: '#1D1E1E',
  border: '#272928',
  text: '#ECECEA',
  muted: '#979B98',
  signal: '#FF7A2E',
  onSignal: '#141514',
  track: '#222423',
  signalSoft: 'rgba(255, 122, 46, 0.16)',
} as const;

export const theme = {
  colors: {
    // ── Chalk (the field, light default) ────────────────────────────────
    // A warm-neutral white with graphite ink: no hue cast, hairline
    // rules, square-cut surfaces. Every MobilePremium primitive
    // defaults to this palette unless the consumer flips `colorScheme`
    // to 'dark'. Measured ladder: text 16.2 on card → secondary 10.2 →
    // muted 5.5 on the darkest surface it rides.
    light: {
      // UI element colors
      background: '#F6F6F4',
      backgroundAlt: '#ECECEA',
      card: '#FAFAF8',
      cardAlt: '#EFEFED',
      border: '#D9D9D5',

      // Card border colors — 1px precision edges on chalk.
      cardBorder: 'rgba(19, 21, 20, 0.10)',
      cardBorderHover: 'rgba(19, 21, 20, 0.18)',

      // Text colors. Every informative slot clears WCAG AA (4.5:1) on
      // the DARKEST chalk surface it rides (page #F1F1EF).
      text: '#131514',
      textMuted: '#5C6160',
      textSecondary: '#3B3F3D',

      // Interactive element colors — the `brand` slot: THE STRIKE.
      // One hue, measured at both jobs: as a fill it clears 3:1 with
      // headroom (#C64100 = 4.47 on page); as small text it never
      // appears — `brandText` below is the text companion.
      brand: '#C64100',
      brandHover: '#B53A00',
      brandPress: '#A33400',
      brandMuted: 'rgba(198, 65, 0, 0.08)',
      brandSoft: 'rgba(198, 65, 0, 0.12)',
      buttonBackground: '#C64100',
      buttonBackgroundDisabled: 'rgba(198, 65, 0, 0.5)',

      // The brand slot's TEXT companion — the same hue darkened until
      // it clears WCAG AA (4.5:1) as small text (labels, eyebrows,
      // links) on the chalk surfaces: 5.54:1 on page, 5.99 on card.
      brandText: '#A83E00',

      // Brand-hue accent for iron plates (the chit, the curtain, the
      // session strip) — a brightened strike reads on iron (8.30:1 on
      // #0C0D0D).
      brandOnInk: '#FF8A3D',

      // Semantic status colors. Measured AA as TEXT on page AND card:
      // success 5.14/4.75, warning 5.48/5.07, error 5.80/5.36, info
      // 5.64/5.21.
      status: {
        success: '#0E7A4E',
        warning: '#8F5B00',
        error: '#BB2A1F',
        info: '#1D5FCC',
      },

      // Re-export aliases for call sites that read `success` and `alert`
      // at the top level (alternative to `status.success` / `status.error`).
      success: '#0E7A4E',
      alert: '#BB2A1F',

      // Text color for content rendered on top of the brand color slot
      // (button labels, the selected check). Stencil discipline: CHALK
      // on the burnt orange — measured 4.73:1; ink on it fails (3.63).
      textOnBrand: '#FFF6EF',

      // Secondary text on brand surfaces. One paint per plate:
      // hierarchy on a brand fill comes from size/face, not alpha —
      // this equals textOnBrand (see thesis §3).
      textOnBrandMuted: '#FFF6EF',

      // Deeper background for full-bleed screens — the field's page
      // tone: chalk, never cold steel.
      backgroundDeep: '#F1F1EF',

      // Text color variants. `textColors.muted` and `textMuted` are
      // unified (same value, both names). `tertiary` is DECORATIVE ONLY
      // (3.2:1 on card): placeholders, disabled states, watermarks —
      // it never carries information; informative quiet text reads
      // `textMuted`.
      textColors: {
        muted: '#5C6160',
        secondary: '#3B3F3D',
        tertiary: '#8F938F',
      },

      // Icon background tints (semantic — darker hue on pale tint).
      iconBackground: {
        blue: 'rgba(29, 95, 204, 0.10)',
        green: 'rgba(14, 122, 78, 0.10)',
        purple: 'rgba(126, 34, 206, 0.10)',
        orange: 'rgba(198, 65, 0, 0.10)',
        white: 'rgba(19, 21, 20, 0.06)',
      },

      // Glass tokens (kept for the shell's glass-dialect primitives).
      // On chalk these read as paper tints, not frosted windows.
      glass: {
        background: 'rgba(250, 250, 248, 0.72)',
        backgroundLight: 'rgba(250, 250, 248, 0.55)',
        border: 'rgba(19, 21, 20, 0.10)',
        borderHighlight: 'rgba(19, 21, 20, 0.18)',
        borderHover: 'rgba(19, 21, 20, 0.14)',
        emptyInputBorder: 'rgba(19, 21, 20, 0.22)',
        panelBackground: 'rgba(250, 250, 248, 0.6)',
        inputBackground: 'rgba(19, 21, 20, 0.04)',
        inputFocusBackground: 'rgba(198, 65, 0, 0.06)',
      },

      // Alert background tint for error containers.
      alertBackground: 'rgba(187, 42, 31, 0.08)',

      // ── Mobile premium primitive kit tokens ───────────────────────────
      // The field is FLAT and RULED: hairlines declare structure, not
      // glow. Elevation = rule / tint step / iron (thesis §4); the one
      // shadow in the system is a 1px seat.
      mobilePremium: {
        // Hairline border (inner) — graphite at low opacity.
        hairlineBorder: 'rgba(19, 21, 20, 0.10)',
        hairlineBorderStrong: 'rgba(19, 21, 20, 0.20)',

        // Surface gradient stops — the field runs flat; the gradient is
        // a whisper, kept for primitives that composite it.
        surfaceGradientTop: 'rgba(19, 21, 20, 0.02)',
        surfaceGradientBottom: 'rgba(19, 21, 20, 0.0)',

        // Contact shadow — a 1px seat, not a glow.
        surfaceGlow: '0 1px 2px rgba(19, 21, 20, 0.05)',

        // Backdrop blur for web (saturate is safe on chalk).
        surfaceBackdropBlur: 'blur(24px) saturate(160%)',

        // Android Chrome fallback — near-solid surface + milder blur.
        androidChromeSurfaceBackground: 'rgba(250, 250, 248, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        // Nav drawer (shell parity; the drawer is retired from this
        // app's chrome but the primitive stays synced).
        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'dd',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        // Faint vignette to settle the page into its edges (web).
        atmosphereVignette: 'inset 0 0 160px 60px rgba(19, 21, 20, 0.03)',

        // Rail (progress) — fill travels across a 2px track.
        railTrack: 'rgba(19, 21, 20, 0.10)',
        railFillShadow: 'none',
      },

      // ── The iron interrupt (see IRON_INTERRUPT above) ─────────────────
      focus: IRON_INTERRUPT,
    },

    // ── Iron (the field at night, opt-in) ───────────────────────────────
    // Mirror of `light` with every key retuned for dark surfaces:
    // neutral near-black, never slate-blue. The structural shape
    // MUST match `light` so `theme.colors[colorScheme].*` is type-safe.
    dark: {
      background: '#101111',
      backgroundAlt: '#141515',
      card: '#171818',
      cardAlt: '#1C1D1D',
      border: '#272928',

      // Card border colors — chalk hairlines on iron.
      cardBorder: 'rgba(236, 236, 234, 0.10)',
      cardBorderHover: 'rgba(236, 236, 234, 0.18)',

      // Text colors — measured: text 15.0 on card, secondary 10.4,
      // muted 6.0 on cardAlt.
      text: '#ECECEA',
      textMuted: '#979B98',
      textSecondary: '#C4C6C3',

      // The `brand` slot at night: a bright strike — 7.48:1 on page as
      // fill/large type; `brandText` carries small text at 9.29:1.
      brand: '#FF7A2E',
      brandHover: '#FF8A47',
      brandPress: '#E96E24',
      brandMuted: 'rgba(255, 122, 46, 0.14)',
      brandSoft: 'rgba(255, 122, 46, 0.18)',
      buttonBackground: '#FF7A2E',
      buttonBackgroundDisabled: 'rgba(255, 122, 46, 0.4)',

      // Text companion of `brand` (see `light.brandText`).
      brandText: '#FF9A5C',

      // Brand-hue accent for iron plates (identical register both
      // modes — see light.brandOnInk).
      brandOnInk: '#FF8A3D',

      // Semantic status colors — brightened for dark contrast (all
      // 6.8–10.2:1 as text on page and card).
      status: {
        success: '#3FC98E',
        warning: '#E5B54B',
        error: '#F27F72',
        info: '#74ABFF',
      },

      // Aliases matching `light` (kept in sync across both palettes).
      success: '#3FC98E',
      alert: '#F27F72',

      // Ink on the bright strike — measured 7.04:1.
      textOnBrand: '#141514',

      // One paint per plate (see light.textOnBrandMuted).
      textOnBrandMuted: '#141514',

      // Page tone for full-bleed screens — iron black.
      backgroundDeep: '#0C0D0D',

      // Text color variants. `tertiary` is DECORATIVE ONLY — never
      // carries information.
      textColors: {
        muted: '#979B98',
        secondary: '#C4C6C3',
        tertiary: '#696D6A',
      },

      // Icon background tints — bright hue on dark tint.
      iconBackground: {
        blue: 'rgba(116, 171, 255, 0.16)',
        green: 'rgba(63, 201, 142, 0.16)',
        purple: 'rgba(192, 132, 252, 0.16)',
        orange: 'rgba(255, 122, 46, 0.16)',
        white: 'rgba(236, 236, 234, 0.08)',
      },

      // Glassmorphism (dark) — smoked paper tints.
      glass: {
        background: 'rgba(20, 21, 21, 0.72)',
        backgroundLight: 'rgba(20, 21, 21, 0.55)',
        border: 'rgba(236, 236, 234, 0.10)',
        borderHighlight: 'rgba(236, 236, 234, 0.20)',
        borderHover: 'rgba(236, 236, 234, 0.14)',
        emptyInputBorder: 'rgba(236, 236, 234, 0.22)',
        panelBackground: 'rgba(12, 13, 13, 0.6)',
        inputBackground: 'rgba(236, 236, 234, 0.05)',
        inputFocusBackground: 'rgba(255, 122, 46, 0.10)',
      },

      // Alert background tint for error containers (dark red wash).
      alertBackground: 'rgba(242, 127, 114, 0.12)',

      // ── Mobile premium primitive kit tokens (dark) ───────────────────
      // Flat at night too: hairlines up, shadows down to a seat.
      mobilePremium: {
        hairlineBorder: 'rgba(236, 236, 234, 0.10)',
        hairlineBorderStrong: 'rgba(236, 236, 234, 0.20)',

        surfaceGradientTop: 'rgba(236, 236, 234, 0.03)',
        surfaceGradientBottom: 'rgba(236, 236, 234, 0.0)',

        surfaceGlow: '0 1px 2px rgba(0, 0, 0, 0.4)',

        surfaceBackdropBlur: 'blur(24px) saturate(140%)',

        androidChromeSurfaceBackground: 'rgba(16, 17, 17, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        navScrimBackdropBlur: 'blur(8px)',
        navScrimAlpha: 'cc',
        navPanelShadow: '4px 0 32px rgba(0, 0, 0, 0.36), 0 2px 8px rgba(0, 0, 0, 0.2)',

        atmosphereVignette: 'inset 0 0 160px 60px rgba(0, 0, 0, 0.28)',

        railTrack: 'rgba(236, 236, 234, 0.12)',
        railFillShadow: 'none',
      },

      // ── The iron interrupt (identical to light — see above) ──────────
      focus: IRON_INTERRUPT,
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
  // Semantic corner radii for the MobilePremium kit. THE COUNT runs
  // SQUARE-CUT (thesis §2.4): surfaces barely softened, controls and
  // tiles cut crisp, chips are marking boxes — a pill marks nothing
  // here. `borderRadius` above is the raw size scale for ad-hoc
  // shapes; primitives use these semantics.
  shapes: {
    /** Cards + section surfaces (MobileSurface, StatCard, alerts). */
    surface: 4,
    /** Portal panels — bottom sheets, calendar/dialog bodies. */
    sheet: 8,
    /** Inputs, buttons, selects — interactive controls. */
    control: 3,
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
  // THE COUNT scale (docs/architecture/count-thesis.md §2.2): three
  // interleaved ramps — statements in the display face (30 · 44 · 76),
  // mono figures (14 · 26 · 56, always tabular), words (11 · 13 · 15 ·
  // 16 · 17). A statement is always one register louder than the
  // figures around it. Line-heights snap to 2. Consumers import the
  // named style and spread it; they do NOT pick ad-hoc
  // fontSize/fontWeight values. Retune the values here, but keep the
  // named-style discipline.
  typography: {
    mobileTitle: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: 0,
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
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 20,
      letterSpacing: 0.4,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileEyebrow: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 1.4,
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileFieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 0.1,
      fontFamily: undefined,
    } satisfies TypographyToken,
    // ── Figure language ────────────────────────────────────────────────
    // Numbers are the app's content, so the scale names their slots
    // too. Statement figures ride the display face; WORKING figures
    // (anything that changes or aligns) ride the mono face — mono is
    // tabular by construction, so timers and counters cannot jitter.
    mobileHero: {
      fontSize: 76,
      fontWeight: '800',
      lineHeight: 78,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileDisplay: {
      fontSize: 44,
      fontWeight: '800',
      lineHeight: 46,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    mobileFigure: {
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 30,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.1,
      fontFamily: undefined,
    } satisfies TypographyToken,
    // Condensed title — the arm's-length NAME position: the stage's
    // station name, one register under mobileDisplay (the display face
    // is already condensed by design).
    mobileTitleCondensed: {
      fontSize: 38,
      fontWeight: '800',
      lineHeight: 40,
      letterSpacing: 0,
      fontFamily: FONTS.display,
    } satisfies TypographyToken,
    // The armed counter — THE COUNT at full size: the live weight ×
    // reps digits and display timers. Mono (tabular by construction);
    // the one place the mono face is allowed above 30px.
    mobileCounter: {
      fontSize: 56,
      fontWeight: '700',
      lineHeight: 60,
      letterSpacing: -1,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileLedger: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: FONTS.mono,
    } satisfies TypographyToken,
    mobileMeta: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0,
      fontVariant: ['tabular-nums'],
      fontFamily: undefined,
    } satisfies TypographyToken,
    mobileTag: {
      fontSize: 11,
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
