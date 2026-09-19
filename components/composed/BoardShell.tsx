// components/composed/BoardShell.tsx
//
// THE BOARD's screen scaffold (docs/architecture/board-thesis.md
// §5–7): the flat board (atmosphere) + a header slot + THE TICKER
// (pinned under the header while a session runs — one tap returns to
// the Floor) + the scrolling body. THE BOARD has no tab bar and no
// drawer chrome: the Desk is a stack, home is its hub, and the
// ticker keeps the live session one tap away on every page.
//
// M3 — THE COMPRESS: a pushed screen may declare a `compact` restatement
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

  const compactBar = compact ? (
    <View
      pointerEvents="none"
      style={[styles.compactBar, { borderBottomColor: colors.border }]}
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
          header node beside it (a board page may have nothing else to
          say up top — the back law holds regardless). */}
      <View testID="desk-header-col" style={MOBILE_CONTENT_WIDTH_STYLE}>
        {onBack ? (
          <View style={styles.headerWithBack}>
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
          </View>
        ) : (
          header
        )}
        {isSessionActive ? <SessionStrip /> : null}
      </View>
      {compactBar}
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
  // THE COMPRESS bar — fixed 48px; its content fades in as the hero
  // leaves (never a layout change; the bar is always in the tree so
  // the pin never jumps).
  compactBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: PAGE_GUTTER,
    borderBottomWidth: 1,
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
});

export default BoardShell;
