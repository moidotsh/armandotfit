// components/composed/AppShellHeader.tsx
// The home header wired to the cutout nav drawer — the shell's one-drawer
// pattern pre-assembled: MobileHomeHeader (brand from APP_DISPLAY_NAME,
// the shell's display-name slot) + HamburgerButton + MobileNavDrawerGlassCap
// + MobileNavDrawer in the APP_LAYOUT default persistence/anchor modes,
// locked to the shared content column. Consumers pass their drawer
// destinations — typically navigateTo* helpers from the navigation barrel
// — plus the optional slots MobileHomeHeader and MobileNavDrawer already
// expose (subtitle, rightAction, footer, atmosphere). One app, one drawer:
// child screens carry the `> [title]` MobileHeader and go back with the
// chevron; this header belongs to the home surface only.

import React, { useState } from 'react';
import { usePathname } from 'expo-router';
import {
  HamburgerButton,
  MobileHomeHeader,
  MobileNavDrawer,
  MobileNavDrawerGlassCap,
  type MobileNavDrawerItem,
} from '../MobilePremium';
import {
  APP_DISPLAY_NAME,
  APP_LAYOUT,
  MOBILE_CONTENT_MAX_WIDTH,
} from '../../constants';

/** Atmosphere surface for the drawer body — the drawer's own prop type. */
type DrawerAtmosphere = React.ComponentProps<typeof MobileNavDrawer>['atmosphere'];

interface AppShellHeaderProps {
  /** Drawer destinations — navigateTo* helpers from the navigation barrel. */
  items: MobileNavDrawerItem[];
  /** Optional normal-case subtitle under the brand (screen context). */
  subtitle?: string;
  /** Optional top-right action — rides MobileHomeHeader's rightAction slot. */
  rightAction?: React.ReactNode;
  /** Optional drawer bottom slot (sign-out, etc.). */
  footer?: React.ReactNode;
  /** Atmosphere surface for the drawer body (the drawer default applies when omitted). */
  atmosphere?: DrawerAtmosphere;
}

export function AppShellHeader({
  items,
  subtitle,
  rightAction,
  footer,
  atmosphere,
}: AppShellHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <MobileHomeHeader
        brand={APP_DISPLAY_NAME}
        subtitle={subtitle}
        rightAction={rightAction}
        menuButton={
          <HamburgerButton
            isOpen={drawerOpen}
            onPress={() => setDrawerOpen((prev) => !prev)}
          />
        }
        drawerGlassCap={
          <MobileNavDrawerGlassCap open={drawerOpen} columnWidth={MOBILE_CONTENT_MAX_WIDTH} />
        }
      />
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={items}
        activePathname={pathname ?? '/'}
        atmosphere={atmosphere}
        footer={footer}
        anchor={APP_LAYOUT.navDrawerAnchor}
        brandPersistence={APP_LAYOUT.navDrawerBrandPersistence}
        columnWidth={MOBILE_CONTENT_MAX_WIDTH}
      />
    </>
  );
}

export default AppShellHeader;
