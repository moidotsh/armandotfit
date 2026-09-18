// components/composed/DeskShell.tsx
//
// The Desk's screen scaffold (docs/architecture/signal-thesis.md §6):
// page background + atmosphere + a header slot + the scrolling body +
// the MobileTabBar. The four top-level Desk surfaces (Today, Library,
// Progress, Program) compose this; pushed flows (the funnel, detail
// pages, settings) run their own chrome with back navigation — the bar
// marks top-level membership, not a route wrapper.
//
// The tab bar's center action is the app's primary verb: START before
// a session, RESUME (pulsing) while one is active. The verb's state
// reads the workout store — no prop threading from every screen.

import React from 'react';
import { ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Dumbbell, TrendingUp, CalendarDays, Play } from '@tamagui/lucide-icons-2';
import {
  MobileAtmosphere,
  MobileTabBar,
  type MobileAtmosphereSurface,
} from '../MobilePremium';
import { useAppTheme } from '../../context';
import { useWorkoutStore } from '../../stores';
import {
  navigateToHome,
  navigateToExerciseDatabase,
  navigateToProgression,
  navigateToProgram,
  navigateToSplitSelection,
  navigateToWorkoutDetail,
} from '../../navigation';
import { SCREEN_BODY_STYLE, MOBILE_CONTENT_WIDTH_STYLE } from '../../constants';

export interface DeskShellProps {
  /** Atmosphere surface flavor (kept for parity with ScreenScaffold). */
  surface?: MobileAtmosphereSurface;
  /** Header node — the screen's own header (wordmark row / MobileHeader). */
  header?: React.ReactNode;
  /** The scroll body. */
  children: React.ReactNode;
  /** The tab bar's active tab id (route path). */
  activeTab?: string;
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
  children,
  activeTab,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  onScroll,
  noScroll = false,
  stickyHeaderIndices,
  testID,
}: DeskShellProps) {
  const { colors } = useAppTheme();
  const isSessionActive = useWorkoutStore((s) => s.isSessionActive);

  const tabIcon = (Icon: typeof Home, active: boolean) => (
    <Icon size={19} color={active ? colors.text : colors.textMuted} />
  );
  const tab = (
    id: string,
    label: string,
    Icon: typeof Home,
    onPress: () => void,
  ) => ({
    id,
    label,
    icon: tabIcon(Icon, activeTab === id),
    onPress,
  });

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface={surface} />
      {/* The header slot rides the same mobile column as the body and
          the tab bar — nothing straddles the constraint on desktop. */}
      <View style={MOBILE_CONTENT_WIDTH_STYLE}>{header}</View>
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
      <MobileTabBar
        items={[
          tab('/', 'TODAY', Home, navigateToHome),
          tab('/exercise-database', 'LIBRARY', Dumbbell, navigateToExerciseDatabase),
          tab('/progression', 'PROGRESS', TrendingUp, navigateToProgression),
          tab('/program', 'PROGRAM', CalendarDays, navigateToProgram),
        ]}
        activeId={activeTab}
        centerAction={{
          label: isSessionActive ? 'Resume session' : 'Start workout',
          active: isSessionActive,
          icon: <Play size={22} color={colors.textOnBrand} />,
          onPress: isSessionActive ? () => navigateToWorkoutDetail() : navigateToSplitSelection,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: { ...SCREEN_BODY_STYLE },
  bodyContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
});

export default DeskShell;
