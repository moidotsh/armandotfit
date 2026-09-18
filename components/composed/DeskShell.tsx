// components/composed/DeskShell.tsx
//
// The Desk's screen scaffold (docs/architecture/broadsheet-thesis.md
// §6): page field + atmosphere + a header slot + THE TICKER (pinned
// under the header while a session runs) + the scrolling body. THE
// BROADSHEET has no tab bar — the Desk is a stack, not a deck: home is
// the front page (its jump lines lead to Program, Library, Progress),
// everything else pushes and returns, and the ticker keeps the live
// session one tap away on every screen.
//
// Pushed screens pass `onBack` — a 44px chevron rides the header's
// left edge. On a standalone PWA there is no browser chrome, so the
// chevron is the always-there way back (root screens omit it).
//
// Width policy: header, strip, and body all ride the mobile column —
// nothing straddles the constraint on desktop. The name stays
// `DeskShell` (audit-screen-body recognizes it as a body-policy
// carrier).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { MobileAtmosphere, type MobileAtmosphereSurface } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { useWorkoutStore } from '../../stores';
import { SCREEN_BODY_STYLE, MOBILE_CONTENT_WIDTH_STYLE } from '../../constants';
import { SessionStrip } from './SessionStrip';

export interface DeskShellProps {
  /** Atmosphere surface flavor (kept for parity with ScreenScaffold). */
  surface?: MobileAtmosphereSurface;
  /** Header node — the screen's own header (wordmark row / MobileHeader). */
  header?: React.ReactNode;
  /**
   * Back affordance for PUSHED screens. When set, a 44px chevron rides
   * the header's left edge (the Desk is a stack with no tab bar — on a
   * standalone PWA there is no browser chrome, so the chevron is the
   * always-there way back). Root screens (home) omit it.
   */
  onBack?: () => void;
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
   * Scroll-event handoff for screens running scroll-driven
   * choreography on the body (Animated.event; attach only when motion
   * is allowed). Passed straight to the ScrollView.
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  testID?: string;
}

export function DeskShell({
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
}: DeskShellProps) {
  const { colors } = useAppTheme();
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface={surface} />
      {/* Header + ticker ride the same mobile column as the body —
          nothing straddles the constraint on desktop. */}
      <View testID="desk-header-col" style={MOBILE_CONTENT_WIDTH_STYLE}>
        {onBack && header ? (
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
            <View style={styles.headerFlex}>{header}</View>
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
          onScroll={onScroll}
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
  bodyContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
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

export default DeskShell;
