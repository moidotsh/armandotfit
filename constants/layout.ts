// constants/layout.ts
// App-level layout config. Single source of truth for cross-cutting
// switches that affect how screens compose primitives. The primitives
// themselves stay generic; this file is where the app author flips
// global behavior without editing the MobilePremium kit.
//
// Mirrors vellum/constants/layout.ts verbatim — same constant name, same
// shape, same default. The two files stay in sync so a future vellum
// consumer inherits the switch in the same place.

export type NavDrawerBrandPersistence = 'cutout' | 'slideout';

export const APP_LAYOUT = {
  /**
   * How the nav drawer handles the brand area when open.
   *
   * - 'cutout': the panel + scrim start below the home header so the
   *   brand + hamburger (which swaps to X) stay visible at the same
   *   position. Matches the qep-tracker pattern.
   * - 'slideout': the panel covers the full screen height; the brand is
   *   re-rendered in the drawer's header slot. The home header is
   *   covered while the drawer is open.
   *
   * Default is 'cutout' (the more polished pattern).
   */
  navDrawerBrandPersistence: 'cutout' as NavDrawerBrandPersistence,
} as const;
