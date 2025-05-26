// components/Layout/PageContainer.tsx - Enhanced page container for Arman.fit
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, RefreshControl, RefreshControlProps } from 'react-native';
import { ScrollView, View } from 'tamagui';
import { useAppTheme } from '../ThemeProvider';

interface PageContainerProps {
  /**
   * The content to display within the page
   */
  children: React.ReactNode;

  /**
   * Whether to disable scrolling
   */
  disableScroll?: boolean;

  /**
   * Custom padding horizontal
   */
  paddingHorizontal?: number | string;

  /**
   * Custom padding top
   */
  paddingTop?: number | string;

  /**
   * Custom padding bottom
   */
  paddingBottom?: number | string;

  /**
   * Whether to show vertical scroll indicator
   */
  showsVerticalScrollIndicator?: boolean;

  /**
   * ScrollView refresh control
   */
  refreshControl?: React.ReactElement<RefreshControlProps>;

  /**
   * Whether to adjust for keyboard
   */
  keyboardAware?: boolean;

  /**
   * Style for the scroll view content container
   */
  contentContainerStyle?: any;

  /**
   * Status bar style
   */
  statusBarStyle?: 'light' | 'dark';

  /**
   * Additional style props to apply
   */
  style?: any;
}

/**
 * A consistent container for all pages in the app with enhanced padding control
 */
export function PageContainer({
  children,
  disableScroll = false,
  paddingHorizontal,
  paddingTop,
  paddingBottom,
  showsVerticalScrollIndicator = false,
  refreshControl,
  keyboardAware = false,
  contentContainerStyle,
  statusBarStyle = 'dark',
  style
}: PageContainerProps) {
  const { colors, spacing, isNarrow } = useAppTheme();

  // Enhanced default padding values for better gym app UX
  const defaultPaddingHorizontal = paddingHorizontal !== undefined ? paddingHorizontal : (isNarrow ? 20 : 24);
  const defaultPaddingTop = paddingTop !== undefined ? paddingTop : (isNarrow ? 24 : 32);
  const defaultPaddingBottom = paddingBottom !== undefined ? paddingBottom : 24;

  // Content container style with default padding
  const defaultContentContainerStyle = {
    paddingTop: defaultPaddingTop,
    paddingBottom: defaultPaddingBottom,
    paddingHorizontal: defaultPaddingHorizontal,
    ...(contentContainerStyle || {})
  };

  // If scrolling is disabled, render in a View
  if (disableScroll) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: colors.background,
            ...defaultContentContainerStyle
          },
          style
        ]}
      >
        <StatusBar style={statusBarStyle} />
        {children}
      </View>
    );
  }

  // Otherwise render in a ScrollView
  return (
    <ScrollView
      style={[
        {
          flex: 1,
          backgroundColor: colors.background
        },
        style
      ]}
      contentContainerStyle={defaultContentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEventThrottle={16}
      keyboardDismissMode={keyboardAware ? 'on-drag' : 'none'}
      keyboardShouldPersistTaps={keyboardAware ? 'handled' : 'never'}
      refreshControl={refreshControl}
    >
      <StatusBar style={statusBarStyle} />
      {children}
    </ScrollView>
  );
}

export default PageContainer;