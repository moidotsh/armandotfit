// components/composed/BoardShell.tsx
//
// The screen scaffold (docs/architecture/gauge-thesis.md §5–8; the
// BoardShell name is taught to audit-screen-body.ts — SB1): the flat
// ground (atmosphere) + a header slot + THE TICKER
// (pinned under the header while a session runs — one tap returns to
// the Floor) + the scrolling body. THE BOARD has no tab bar and no
// drawer chrome: the Desk is a stack, home is its hub, and the
// ticker keeps the live session one tap away on every page.
//
// F4 — THE COMPRESS: a pushed screen may declare a `compact` restatement
// (title + optional live figure). It rides a 48px sticky bar that is
// EMPTY while the page's hero statement is on screen and CROSSFADES
// IN (scroll-linked, transform/opacity only) as the statement scrolls
// away — the big words hand off to the carried words. Under reduced
// motion the bar renders its restatement statically at full opacity.
//
// Width policy: header, strip, and body all ride the mobile column —
// nothing straddles the constraint on desktop. The name
// `BoardShell` is taught to audit-screen-body.ts as a body-policy
// carrier (SB1).

import React, { useCallback } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { MobileAtmosphere, type MobileAtmosphereSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { useWorkoutStore } from '../../stores';
import {
  SCREEN_BODY_STYLE,
  MOBILE_CONTENT_WIDTH_STYLE,
  PAGE_GUTTER,
  BLOCK_GAP,
} from '../../constants';
import { useCompressFade } from '../premium/shared';
import { SessionStrip } from './SessionStrip';

export interface BoardShellProps {
  /** Atmosphere surface flavor (kept for parity with ScreenScaffold). */
  surface?: MobileAtmosphereSurface;
  /** Header node — the screen's own header (folio row / MobileHeader). */
  header?: React.ReactNode;
  /**
   * Back affordance for PUSHED screens. When set, a 44px chevron rides
   * the header's left edge (the Desk is a stack — on a standalone PWA
   * there is no browser chrome, so the chevron is the always-there way
   * back). Root screens (home) omit it.
   */
  onBack?: () => void;
  /**
   * M3 THE COMPRESS — the sticky bar's restatement. Declare it and a
   * 48px bar rides the top of the scroll body: empty while the hero is
   * visible, crossfading to `{title, figure}` as the hero leaves. The
   * hero itself is the body's first child (a 36px statement).
   */
  compact?: { title: string; figure?: React.ReactNode };
  /** The scroll body. */
  children: React.ReactNode;
  /** Body content container style (gutter overrides etc.). */
  contentContainerStyle?: React.ComponentProps<typeof ScrollView>['contentContainerStyle'];
  /** Passed to the ScrollView. */
  showsVerticalScrollIndicator?: boolean;
  /**
   * Render the children directly instead of inside the shell's
   * ScrollView — for screens whose body is its own scroller (a
   * SectionList/FlatList). Width policy still applies.
   */
  noScroll?: boolean;
  /** Passed to the ScrollView — sticky chapter heads etc. */
  stickyHeaderIndices?: number[] | undefined;
  /**
   * Scroll-event handoff for screens running their own scroll-driven
   * choreography on the body. When `compact` is declared the shell
   * attaches its own listener and FORWARDS events here too.
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  testID?: string;
}

export function BoardShell({
  surface = 'training',
  header,
  onBack,
  compact,
  children,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  onScroll,
  noScroll = false,
  stickyHeaderIndices,
  testID,
}: BoardShellProps) {
  const { colors } = useAppTheme();
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

  // M3 — the compress fade (the shared motion primitive): 0 while the
  // hero is on screen, 1 once it has scrolled past. Static-eligible
  // under reduced motion / off-web — the bar renders its restatement.
  const { compress, handleScroll: fadeScroll, static: fadeStatic } = useCompressFade(!!compact);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(event);
      fadeScroll(event);
    },
    [onScroll, fadeScroll],
  );

  // F4 — THE COMPRESS's restatement. On a pushed page (onBack set) it
  // rides THE SAME ROW as the back chevron — the condensed nav-bar
  // read: [‾<] title ····· figure — one chrome row, never a blank
  // chevron line stacked over its own bar. On a root page it keeps
  // the standalone 48px bar under the header. Both fade in under
  // scroll (transform/opacity only); static under reduced motion.
  const compactRestate = compact ? (
    <View
      pointerEvents="none"
      style={onBack ? styles.compactInline : styles.compactBar}
      testID="board-compact-bar"
    >
      <Animated.Text
        style={[
          styles.compactTitle,
          { color: colors.text },
          fadeStatic ? null : { opacity: compress },
        ]}
        numberOfLines={1}
      >
        {compact.title}
      </Animated.Text>
      {compact.figure ? (
        <Animated.View style={fadeStatic ? null : { opacity: compress }}>
          {compact.figure}
        </Animated.View>
      ) : null}
    </View>
  ) : null;

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface={surface} />
      {/* Header + ticker ride the same mobile column as the body —
          nothing straddles the constraint on desktop. The back
          chevron renders whenever onBack is set, with or without a
          header node beside it; when `compact` is declared the
          restatement fills the row beside the chevron and the row
          carries the bar's hairline. */}
      <View testID="desk-header-col" style={MOBILE_CONTENT_WIDTH_STYLE}>
        {onBack ? (
          <View
            style={[
              styles.headerWithBack,
              compact ? styles.headerWithCompact : null,
              compact ? { borderBottomColor: colors.border } : null,
            ]}
          >
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [styles.backButton, pressed ? { opacity: 0.6 } : null]}
              testID="desk-back"
            >
              <ChevronLeft size={26} color={colors.text} />
            </Pressable>
            {header ? <View style={styles.headerFlex}>{header}</View> : null}
            {compact ? compactRestate : null}
          </View>
        ) : (
          <>
            {header}
            {compact ? (
              <View style={[styles.compactBarHold, { borderBottomColor: colors.border }]}>
                {compactRestate}
              </View>
            ) : null}
          </>
        )}
        {isSessionActive ? <SessionStrip /> : null}
      </View>
      {noScroll ? (
        <View testID={testID} style={[styles.body, MOBILE_CONTENT_WIDTH_STYLE]}>
          {children}
        </View>
      ) : (
        <ScrollView
          testID={testID}
          style={styles.body}
          contentContainerStyle={contentContainerStyle ?? styles.bodyContent}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          stickyHeaderIndices={stickyHeaderIndices}
        >
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  // THE BOARD air law: the 20px gutter, and the block rhythm's
  // baseline — top-level blocks carry BLOCK_GAP (32) above them; the
  // tail breathes.
  bodyContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: 8,
    paddingBottom: 2 * BLOCK_GAP,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // The pushed header row when `compact` is declared: one chrome row
  // — the chevron, the restatement filling the space beside it, and
  // the compress bar's hairline under the whole row.
  headerWithCompact: {
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
    paddingRight: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginBottom: 4,
  },
  headerFlex: {
    flex: 1,
  },
  // THE COMPRESS's inline restatement — fills the header row beside
  // the chevron; fades in under scroll (never a layout change; the
  // node is always in the tree so the row never jumps).
  compactInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // The standalone compress bar (root pages): fixed 48px under the
  // header.
  compactBarHold: {
    borderBottomWidth: 1,
  },
  compactBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: PAGE_GUTTER,
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
});

export default BoardShell;
