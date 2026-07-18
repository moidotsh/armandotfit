// constants/theme.ts
// Armandotfit's canonical token palette. Light is the default surface; dark
// is opt-in (toggle via useAppTheme().setColorScheme('dark')). audit-ui-theme
// (S7) still enforces "no hardcoded hex" — both modes resolve through
// `theme.colors[colorScheme].*` via useAppTheme() (or a direct constants
// import).
//
// The `brand` slot is the single override point. Vellum (the starter this
// repo was cloned from) ships with a neutral indigo default; armandotfit
// overrides it to its identity orange (`#FF9500`). Everything else (grays,
// semantic status colors, surface tokens) stays domain-agnostic.
//
// Adding dark mode to a consumer's brand slot: vellum's `dark.brand` is
// slightly brighter than `light.brand` so it holds its own against a dark
// surface. Armandotfit's orange is bright enough on both surfaces, so dark
// stays at `#FF9500` and uses lighter orange variants for hover/press —
// `dark.brand*` is the brighter companion, not a derived shade.

import type { TextStyle } from 'react-native';

// TextStyle-shaped typography tokens. Typing these explicitly avoids the
// `fontWeight: string` widening that breaks spread-into-<Text> calls
// (RN's TextStyle.fontWeight is a union of string literals, not `string`).
type TypographyToken = Pick<
  TextStyle,
  'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'
>;

export const theme = {
  colors: {
    // ── Light surface (default) ────────────────────────────────────────
    // Vellum's default surface. Every MobilePremium primitive defaults
    // to this palette unless the consumer flips `colorScheme` to 'dark'.
    light: {
      // UI element colors
      background: '#FFFFFF',
      backgroundAlt: '#F8F9FB',
      card: '#FFFFFF',
      cardAlt: '#F3F4F6',
      border: '#E5E7EB',

      // Card border colors for subtle definition (light-tuned: dark-on-light
      // hairline reads as a precision edge instead of a heavy outline).
      cardBorder: 'rgba(15, 23, 42, 0.06)',
      cardBorderHover: 'rgba(15, 23, 42, 0.12)',

      // Text colors
      text: '#0F172A',
      textMuted: '#64748B',
      textSecondary: '#475569',

      // Interactive element colors — the `brand` slot.
      // Armandotfit identity: orange `#FF9500` (ported from v1 theme — see
      // archive-v1/constants/theme.ts). Hover darkens to a richer orange
      // (vellum convention: hover goes deeper); press darkens further.
      brand: '#FF9500',
      brandHover: '#E67700',
      brandPress: '#B85C00',
      brandMuted: 'rgba(255, 149, 0, 0.08)',
      brandSoft: 'rgba(255, 149, 0, 0.12)',
      buttonBackground: '#FF9500',
      buttonBackgroundDisabled: 'rgba(255, 149, 0, 0.5)',

      // Semantic status colors (iOS-style — consistent across consumers)
      status: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },

      // Re-export aliases for parity with qep-tracker call sites that used
      // `success` and `alert` at the top level. Consumers porting code over
      // don't have to rewrite these on day one.
      success: '#10B981',
      alert: '#EF4444',

      // Text color for content rendered on top of the brand color slot
      // (e.g. MobilePrimaryButton label, selected-state check icon). Pure
      // white regardless of which brand hue the consumer picked — every
      // default brand shade is dark enough that white reads cleanly.
      textOnBrand: '#FFFFFF',

      // Deeper background for full-bleed screens (auth, onboarding).
      // Light-mode interpretation: a faintly-cooler off-white that lets a
      // central card pop without losing the light feel.
      backgroundDeep: '#F1F5F9',

      // Text color variants. `textColors.muted` and `textMuted` are unified
      // (same value, both names) — mirrors the qep-tracker r9 audit decision
      // so consumers don't have to remember which "muted" to use.
      textColors: {
        muted: '#64748B',
        secondary: '#64748B',
        tertiary: '#94A3B8',
      },

      // Icon background tints (semantic — same keys as qep-tracker, retuned
      // for light: darker hue on pale tint instead of bright hue on dark).
      iconBackground: {
        blue: 'rgba(59, 130, 246, 0.12)',
        green: 'rgba(16, 185, 129, 0.12)',
        purple: 'rgba(168, 85, 247, 0.12)',
        orange: 'rgba(249, 115, 22, 0.12)',
        white: 'rgba(15, 23, 42, 0.06)',
      },

      // Glassmorphism (light). Retuned from qep-tracker's dark glass:
      // backdrop is a near-solid pale tint instead of dark smoked glass;
      // borders are dark hairlines instead of light bleed-through.
      glass: {
        background: 'rgba(255, 255, 255, 0.72)',
        backgroundLight: 'rgba(255, 255, 255, 0.55)',
        border: 'rgba(15, 23, 42, 0.08)',
        borderHighlight: 'rgba(15, 23, 42, 0.15)',
        borderHover: 'rgba(15, 23, 42, 0.12)',
        emptyInputBorder: 'rgba(15, 23, 42, 0.2)',
        panelBackground: 'rgba(255, 255, 255, 0.6)',
        inputBackground: 'rgba(15, 23, 42, 0.03)',
        inputFocusBackground: 'rgba(255, 149, 0, 0.05)',
        orbBlue: 'rgba(59, 130, 246, 0.10)',
        orbPurple: 'rgba(168, 85, 247, 0.08)',
        orbTeal: 'rgba(20, 184, 166, 0.08)',
        orbIndigo: 'rgba(79, 70, 229, 0.10)',
      },

      // Alert background tint for error containers.
      alertBackground: 'rgba(239, 68, 68, 0.08)',

      // ── Mobile premium primitive kit tokens ───────────────────────────
      // Consumed by components/MobilePremium/*. These are the light-tuned
      // siblings of qep-tracker's dark mobilePremium tokens.
      //
      // Design rationale (see docs/architecture/mobile-premium-design-system.md):
      //   • Hairline inner border = a 1px line at low opacity DARK. Reads as
      //     a precision edge against a light surface (inverse of the dark
      //     kit's low-opacity white).
      //   • Surface gradient = top ~3% darker than bottom, suggesting soft
      //     directional light hitting a physical object from above.
      //   • Soft glow = the outer shadow identity of a surface. One value,
      //     applied consistently.
      //   • No Android Chrome fallback tint — on a light surface, the
      //     default ~4% dark alpha reads as intended; no saturate() wash-out
      //     failure mode to compensate for.
      mobilePremium: {
        // Hairline border (inner) — dark-on-light at low opacity.
        hairlineBorder: 'rgba(15, 23, 42, 0.08)',
        hairlineBorderStrong: 'rgba(15, 23, 42, 0.15)',

        // Surface gradient stops — top slightly darker than bottom by ~3%
        // luminance. Dark alpha over light surface composites correctly.
        surfaceGradientTop: 'rgba(15, 23, 42, 0.03)',
        surfaceGradientBottom: 'rgba(15, 23, 42, 0.005)',

        // Soft outer glow — the surface's shadow identity (web only).
        // Lighter than the dark kit's glow because the surface is already
        // bright; we want a soft elevation cue, not a heavy vignette.
        surfaceGlow: '0 8px 32px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)',

        // Backdrop blur for web (saturate is safe on light surfaces).
        surfaceBackdropBlur: 'blur(24px) saturate(160%)',

        // Android Chrome fallback — near-solid surface + milder blur.
        // Mirrors qep-tracker's fallback shape, retuned for light.
        androidChromeSurfaceBackground: 'rgba(255, 255, 255, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        // Faint vignette to settle the atmosphere into the edges (web).
        // Much softer than the dark kit's vignette — a whisper of depth,
        // not a visible darkening.
        atmosphereVignette: 'inset 0 0 160px 60px rgba(15, 23, 42, 0.04)',

        // Rail (progress) — fill travels across a 2px track.
        railTrack: 'rgba(15, 23, 42, 0.08)',
        railFillShadow: '0 0 8px currentColor',
      },
    },

    // ── Dark surface (opt-in) ──────────────────────────────────────────
    // Mirror of `light` with every key retuned for dark surfaces. Active
    // when the consumer calls `useAppTheme().setColorScheme('dark')` (or
    // when system preference resolves to dark — see ThemeProvider's
    // detection logic). The structural shape MUST match `light` so
    // `theme.colors[colorScheme].*` is type-safe in TS.
    dark: {
      // UI element colors — dark surfaces. Slightly cooler than pure
      // charcoal to feel "calm dark" instead of "OLED black".
      background: '#0B0F19',
      backgroundAlt: '#111827',
      card: '#161E2E',
      cardAlt: '#1E293B',
      border: '#334155',

      // Card border colors (dark-tuned: light-on-dark hairline reads as
      // a precision edge against the dark surface).
      cardBorder: 'rgba(226, 232, 240, 0.08)',
      cardBorderHover: 'rgba(226, 232, 240, 0.15)',

      // Text colors — inverted from light.
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      textSecondary: '#CBD5E1',

      // Interactive element colors — the `brand` slot. Orange holds its
      // own against dark surfaces, so dark brand stays at the identity
      // hue; hover/press brighten (inverse of light's darken pattern) so
      // the engagement state reads as a glow against the dark surface.
      brand: '#FF9500',
      brandHover: '#FFB74D',
      brandPress: '#FFC966',
      brandMuted: 'rgba(255, 149, 0, 0.16)',
      brandSoft: 'rgba(255, 149, 0, 0.20)',
      buttonBackground: '#FF9500',
      buttonBackgroundDisabled: 'rgba(255, 149, 0, 0.4)',

      // Semantic status colors — brightened for dark contrast.
      status: {
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA',
      },

      // Aliases matching `light` (qep-tracker call-site parity).
      success: '#34D399',
      alert: '#F87171',

      // Text on brand — stays white; the dark-mode brand is bright enough
      // that white reads cleanly. Consumers with a very pale brand may
      // want to override this to '#0B0F19'.
      textOnBrand: '#FFFFFF',

      // Deeper background for full-bleed screens (auth, onboarding) —
      // darker still so a central card pops.
      backgroundDeep: '#050810',

      // Text color variants.
      textColors: {
        muted: '#94A3B8',
        secondary: '#CBD5E1',
        tertiary: '#64748B',
      },

      // Icon background tints — dark-tuned (brighter hue on dark tint).
      iconBackground: {
        blue: 'rgba(96, 165, 250, 0.18)',
        green: 'rgba(52, 211, 153, 0.18)',
        purple: 'rgba(192, 132, 252, 0.18)',
        orange: 'rgba(251, 146, 60, 0.18)',
        white: 'rgba(226, 232, 240, 0.08)',
      },

      // Glassmorphism (dark). Retuned from light: backdrop is smoked
      // glass instead of frosted white; borders are light hairlines.
      glass: {
        background: 'rgba(22, 30, 46, 0.72)',
        backgroundLight: 'rgba(22, 30, 46, 0.55)',
        border: 'rgba(226, 232, 240, 0.08)',
        borderHighlight: 'rgba(226, 232, 240, 0.18)',
        borderHover: 'rgba(226, 232, 240, 0.12)',
        emptyInputBorder: 'rgba(226, 232, 240, 0.20)',
        panelBackground: 'rgba(11, 15, 25, 0.6)',
        inputBackground: 'rgba(226, 232, 240, 0.04)',
        inputFocusBackground: 'rgba(255, 149, 0, 0.10)',
        orbBlue: 'rgba(59, 130, 246, 0.20)',
        orbPurple: 'rgba(168, 85, 247, 0.16)',
        orbTeal: 'rgba(20, 184, 166, 0.16)',
        orbIndigo: 'rgba(99, 102, 241, 0.20)',
      },

      // Alert background tint for error containers (dark-mode red wash).
      alertBackground: 'rgba(248, 113, 113, 0.12)',

      // ── Mobile premium primitive kit tokens (dark) ───────────────────
      // Mirrors the light `mobilePremium` block, retuned for dark surfaces:
      //   • Hairline border = light-on-dark at low opacity (inverse of
      //     the light kit's dark-on-light).
      //   • Surface gradient = top slightly lighter than bottom (suggests
      //     a soft overhead light catching a raised surface).
      //   • Stronger outer glow — dark surfaces need more shadow to read
      //     as elevated against a dark background.
      mobilePremium: {
        hairlineBorder: 'rgba(226, 232, 240, 0.08)',
        hairlineBorderStrong: 'rgba(226, 232, 240, 0.15)',

        surfaceGradientTop: 'rgba(226, 232, 240, 0.05)',
        surfaceGradientBottom: 'rgba(226, 232, 240, 0.01)',

        surfaceGlow: '0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.30)',

        surfaceBackdropBlur: 'blur(24px) saturate(140%)',

        androidChromeSurfaceBackground: 'rgba(22, 30, 46, 0.88)',
        androidChromeSurfaceBlur: 'blur(12px)',

        atmosphereVignette: 'inset 0 0 160px 60px rgba(0, 0, 0, 0.30)',

        railTrack: 'rgba(226, 232, 240, 0.10)',
        railFillShadow: '0 0 8px currentColor',
      },
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

  // ── Named type styles ─────────────────────────────────────────────────
  // Premium reads through type. Consumers import the named style and spread
  // it; they do NOT pick ad-hoc fontSize/fontWeight values for titles and
  // subtitles. These mirror qep-tracker's typography tokens verbatim — the
  // discipline travels, the surface retunes elsewhere.
  typography: {
    mobileTitle: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: -0.2,
    } satisfies TypographyToken,
    mobileSubtitle: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0,
    } satisfies TypographyToken,
    mobileBody: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22,
      letterSpacing: 0,
    } satisfies TypographyToken,
    mobileAction: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.4,
    } satisfies TypographyToken,
    mobileEyebrow: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 1.4,
    } satisfies TypographyToken,
    mobileFieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 0.1,
    } satisfies TypographyToken,
  },
};

// The two color schemes vellum supports. `light` is the default. Type-wide
// so consumers can type their own APIs (`onChangeColorScheme(next: ColorScheme)`).
export type ColorScheme = 'light' | 'dark';

// Convenience aliases — the resolved palette shape for either mode. Both
// `light` and `dark` are structurally identical, so the union collapses to
// a single shape.
export type ColorPalette = typeof theme.colors.light;
