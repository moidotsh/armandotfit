// components/composed/BoardShell.tsx
//
// The screen scaffold (docs/architecture/interval-thesis.md §5, §8;
// the BoardShell name is taught to audit-screen-body.ts — SB1): the
// one ground (atmosphere) + a header slot + THE TICKER (pinned under
// the header while a session runs — one tap returns to the Floor) +
// the scrolling body. THE INTERVAL has no tab bar and no drawer
// chrome: the Desk is a stack, home is its hub, and the ticker keeps
// the live session one tap away on every page.
//
// THE STILL SYSTEM (thesis §6): no compress bar, no crossfades — the
// shell renders statically; scroll changes nothing about the chrome.
//
// Width policy: header, strip, and body all ride the mobile column —
// nothing straddles the constraint on desktop. The name
// `BoardShell` is taught to audit-screen-body.ts as a body-policy
// carrier (SB1).

import React, { useCallback } from 'react';
import {
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
  PRESS_DIP
} from '../../constants';
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
  /** The scroll body. */
  children: React.ReactNode;
  /** Body content container style (gutter overrides etc.). */
  contentContainerStyle?: ScrollView['props']['contentContainerStyle'];
  /** Passed to the ScrollView. */
  showsVerticalScrollIndicator?: boolean;
  /**
   * Render the children directly instead of inside the shell's
   * ScrollView — for screens whose body is its own scroller (a
   * SectionList/FlatList). Width policy still applies.
   */
  noScroll?: boolean;
  /** Passed to the ScrollView — sticky zone heads etc. */
  stickyHeaderIndices?: number[] | undefined;
  /**
   * Scroll-event handoff for screens running their own scroll-driven
   * behavior on the body.
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  testID?: string;
}

export function BoardShell({
  surface = 'training',
  header,
  onBack,
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

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(event);
    },
    [onScroll],
  );

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface={surface} />
      {/* Header + ticker ride the same mobile column as the body —
          nothing straddles the constraint on desktop. The back
          chevron renders whenever onBack is set, with or without a
          header node beside it. */}
      <View testID="desk-header-col" style={MOBILE_CONTENT_WIDTH_STYLE}>
        {onBack ? (
          <View style={styles.headerWithBack}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [styles.backButton, pressed ? { opacity: PRESS_DIP } : null]}
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
          scrollEventThrottle={onScroll ? 16 : undefined}
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
  // The air law (thesis §5): the 20px gutter, and the block rhythm's
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
});

export default BoardShell;
