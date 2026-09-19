// app/_layout.tsx
// Root layout. Provider stack + PWA bootstrap + route-curtain mount.
//
// Provider stack (outer → inner):
//   ThemeProvider → SafeAreaProvider → RootGestureProvider →
//   AuthProvider → AuthGuard → ToastProvider → QueryProvider → Stack
//   + <ToastContainer/> (sibling of Stack, picks up toasts from anywhere)
//   + <RouteCurtain/> (the ink dialect's navigation transition; mounted
//     only when theme.transition.style = 'curtain', web-only, never
//     under reduced motion, never in DOM tests)
//
// No TamaguiProvider: the shell themes itself (MobilePremium reads the
// theme context directly) and metro.config.js resolves @tamagui helpers
// to a passthrough shim — zero Tamagui components ship.
//
// Three web-only effects are load-bearing:
//   1. Boot-plate handshake — lifts the pre-JS ink cover painted by the
//      id'd <style> in index.html (markBootReady sets data-boot-ready).
//   2. PWA runtime injection — Expo Web's static export strips every
//      PWA-related tag from <head> except <link rel="icon">. This block
//      restores the manifest link, apple-touch-icon, apple-mobile-web-app-*
//      metas, and both theme-color metas at runtime. The build-time
//      injector (scripts/inject-critical-web.ts) covers the exported
//      files; this covers dev + anything the strip still misses.
//   3. Service worker registration — Android Chrome's installability
//      criteria require a registered SW with a fetch handler.

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootGestureProvider } from '../components/composed';
import { APP_DISPLAY_NAME, APP_LAYOUT } from '../constants';
import { isWeb, hasDocument, hasWindow } from '../utils/platform';
import { logger } from '../utils';
import { curtainEnabled, markBootReady } from '../utils/routeTransition';
import { initializeNetworkListeners } from '../stores';
import { AuthProvider, ToastProvider, ThemeProvider, useAppTheme } from '../context';
import { AuthGuard, ToastContainer, AppErrorBoundary } from '../components/primitives';
import { QueryProvider } from '../lib/react-query';
import { RouteCurtain, OfflineBanner } from '../components/MobilePremium';
import { MusicSheet } from '../components/composed';
import { Z_INDEX } from '../constants';
import { useIsOnline } from '../stores';

// The curtain mounts only when the transition axis declares it — under
// the starter's 'none' preset this is false and nothing mounts.
const CURTAIN_ON = curtainEnabled();

function RootShell() {
  const { colorScheme, colors } = useAppTheme();
  const isOnline = useIsOnline();

  // Network listener — web online/offline events. The cleanup is paired
  // so audit R4b's listener-pairing rule holds.
  useEffect(() => {
    const cleanup = initializeNetworkListeners();
    return cleanup;
  }, []);

  // Boot-plate handshake (web only): lift the pre-JS ink cover pasted
  // into index.html. Setting data-boot-ready is a no-op when no boot CSS
  // exists.
  useEffect(() => {
    if (!isWeb || !hasDocument()) return;
    markBootReady();
  }, []);

  // PWA runtime injection + service worker registration. Both gated on
  // isWeb — native has no document or navigator.serviceWorker.
  useEffect(() => {
    if (!isWeb || !hasDocument() || !hasWindow()) return;

    const ensureMeta = (name: string, content: string, media?: string) => {
      const selector = `meta[name="${name}"]${media ? `[media="${media}"]` : ''}`;
      if (document.querySelector(selector)) return;
      const m = document.createElement('meta');
      m.name = name;
      m.content = content;
      if (media) m.setAttribute('media', media);
      document.head.appendChild(m);
    };
    const ensureLink = (rel: string, href: string, type?: string) => {
      if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = rel;
      l.href = href;
      if (type) l.type = type;
      document.head.appendChild(l);
    };
    ensureLink('manifest', '/manifest.json');
    ensureLink('apple-touch-icon', '/icons/192.png');
    ensureLink('icon', '/icons/192.png', 'image/png');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-status-bar-style', colorScheme === 'dark' ? 'black' : 'default');
    ensureMeta('apple-mobile-web-app-title', APP_DISPLAY_NAME);
    ensureMeta('theme-color', colors.backgroundDeep, '(min-width: 701px)');
    ensureMeta('theme-color', colors.backgroundDeep, '(max-width: 700px)');

    const ensureStyle = (id: string, css: string) => {
      if (document.getElementById(id)) return;
      const el = document.createElement('style');
      el.id = id;
      el.textContent = css;
      document.head.appendChild(el);
    };
    ensureStyle(
      'global-scrollbar-css',
      '*::-webkit-scrollbar{display:none}*{scrollbar-width:none;-ms-overflow-style:none}',
    );

    // The focus law (index.html #global-focus-css, mirrored here): the
    // UA outline never leaks; every focusable control carries OUR ring
    // — a 2px rule in its own ink.
    ensureStyle(
      'global-focus-css',
      [
        "button:focus,[role='button']:focus,[role='link']:focus,a:focus,select:focus{outline-width:0;box-shadow:0 0 0 2px currentColor}",
        'input:focus,textarea:focus{outline-width:0}',
      ].join(''),
    );

    // THE GAUGE faces — runtime restore of index.html's id'd
    // @font-face block (static export strips <head> styles; the
    // build-time injector covers exported routes, this covers dev and
    // anything the strip still misses). 'Instrument Cond' is the same
    // variable file with font-stretch pinned at 75% — one download,
    // two families (the width-axis trick; see gauge-thesis §3.1).
    // Mirror trio: index.html, scripts/inject-critical-web.ts, this
    // block.
    const ensureFontLinks = () => {
      const fontFiles = [
        '/fonts/instrument-sans-var.woff2',
        '/fonts/martian-mono-var.woff2',
      ];
      for (const href of fontFiles) {
        if (document.querySelector(`link[rel="preload"][href="${href}"]`)) continue;
        const l = document.createElement('link');
        l.rel = 'preload';
        l.href = href;
        l.as = 'font';
        l.type = 'font/woff2';
        l.setAttribute('crossorigin', '');
        document.head.appendChild(l);
      }
    };
    ensureFontLinks();
    ensureStyle(
      'arq-font-faces',
      [
        "@font-face{font-family:'Instrument Sans';font-style:normal;font-weight:400 700;font-stretch:75% 100%;font-display:swap;src:url('/fonts/instrument-sans-var.woff2') format('woff2')}",
        "@font-face{font-family:'Instrument Cond';font-style:normal;font-weight:400 700;font-stretch:75%;font-display:swap;src:url('/fonts/instrument-sans-var.woff2') format('woff2')}",
        "@font-face{font-family:'Martian Mono';font-style:normal;font-weight:100 800;font-stretch:75% 112.5%;font-display:swap;src:url('/fonts/martian-mono-var.woff2') format('woff2')}",
      ].join(''),
    );

    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        logger.warn('general', 'SW registration failed:', err);
      });
    };
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register, { once: true });
    return () => {
      window.removeEventListener('load', register);
    };
  }, [colorScheme, colors]);

  return (
    <SafeAreaProvider>
      <RootGestureProvider>
        <AuthProvider>
          <AuthGuard enabled={APP_LAYOUT.authGuard}>
            <ToastProvider>
              <QueryProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    // No width policy here: the body column is owned by
                    // each screen (SB1 — ScreenScaffold or
                    // SCREEN_BODY_STYLE on the route itself).
                    contentStyle: {
                      backgroundColor: colors.backgroundDeep,
                    },
                  }}
                />
                <ToastContainer />
                {/* THE MUSIC SURFACE — the hidden player + sheet mount
                    once at the root: audio persists across routes. */}
                <MusicSheet />
                {!isOnline ? (
                  <OfflineBanner
                    variant="offline"
                    message="Offline — sets keep logging, save when back online"
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: Z_INDEX.toast - 1 }}
                    testID="offline-banner"
                  />
                ) : null}
                {CURTAIN_ON ? <RouteCurtain /> : null}
              </QueryProvider>
            </ToastProvider>
          </AuthGuard>
        </AuthProvider>
      </RootGestureProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <RootShell />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
