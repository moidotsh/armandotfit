// components/ConstrainedLayout.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useAppTheme } from './ThemeProvider';

interface ConstrainedLayoutProps {
  children: React.ReactNode;
}

export const ConstrainedLayout: React.FC<ConstrainedLayoutProps> = ({ children }) => {
  const { width } = useWindowDimensions();
  const { constrainedView, colors } = useAppTheme();
  const isWeb = Platform.OS === 'web';
  
  // Define constants
  const MAX_WIDTH = 480;
  // Add a buffer zone to prevent flickering at the boundary
  const BUFFER_ZONE = 5; 
  
  // Memoize the layout decision based on width with a buffer zone
  const shouldApplyConstraint = useMemo(() => {
    if (!isWeb || !constrainedView) {
      return false;
    }
    
    // Only constrain if significantly wider than our max width (with buffer)
    return width > (MAX_WIDTH + BUFFER_ZONE);
  }, [isWeb, constrainedView, width]);
  
  // Apply global modal constraint styles to document head when on web
  useEffect(() => {
    if (isWeb && constrainedView && typeof document !== 'undefined') {
      // Create style tag for modal constraints
      const styleTag = document.createElement('style');
      styleTag.id = 'modal-constraint-styles';
      styleTag.innerHTML = `
        /* Target modal container elements */
        [role="dialog"],
        .ReactModalPortal,
        .modal-container,
        .react-modal-overlay {
          max-width: ${MAX_WIDTH}px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          left: 0 !important;
          right: 0 !important;
        }
        
        /* Constrain generic modal overlays */
        .modal-overlay,
        .modal-backdrop,
        .ReactModal__Overlay {
          display: flex !important;
          justify-content: center !important;
        }
        
        /* Specifically target React Native modals */
        .ReactNativeModal,
        [data-reactroot] > [data-reactroot] > [data-reactroot] {
          max-width: ${MAX_WIDTH}px !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        
        /* Global text wrapping fix for constrained view */
        * {
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          word-break: break-word !important;
          hyphens: auto !important;
        }
        
        /* Ensure Tamagui Text components wrap properly */
        [data-tamagui="Text"] {
          white-space: pre-wrap !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          max-width: 100% !important;
        }
        
        /* Adjust font sizes for constrained view */
        h1, [data-tamagui="H1"] {
          font-size: 28px !important;
          line-height: 1.3 !important;
        }
        
        h2, [data-tamagui="H2"] {
          font-size: 22px !important;
          line-height: 1.3 !important;
        }
        
        h3, [data-tamagui="H3"] {
          font-size: 18px !important;
          line-height: 1.3 !important;
        }
        
        p, [data-tamagui="Text"] {
          font-size: 14px !important;
          line-height: 1.4 !important;
        }
        
        /* Ensure cards and containers don't overflow */
        [data-tamagui="Card"], [data-tamagui="YStack"], [data-tamagui="XStack"] {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        /* Fix button text overflow */
        [data-tamagui="Button"] {
          font-size: 14px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
        }
      `;
      
      // Add to document head
      document.head.appendChild(styleTag);
      
      // Cleanup function to remove the style tag when unmounted
      return () => {
        const existingStyle = document.getElementById('modal-constraint-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isWeb, constrainedView]);

  // If we shouldn't apply constraint, just render children directly
  if (!shouldApplyConstraint) {
    return <>{children}</>;
  }

  // Apply the constraint layout
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.innerContainer,
          {
            width: MAX_WIDTH,
            borderColor: colors.border,
            backgroundColor: colors.background
          }
        ]}
      >
        {children}
      </View>
    </View>
  );
};

// Use StyleSheet for better performance and type checking
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  innerContainer: {
    flex: 1,
    maxWidth: '100%',
    height: '100%',
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    // Add horizontal padding for better spacing
    paddingHorizontal: 8,
    // Ensure text wraps properly
    ...(Platform.OS === 'web' && {
      overflowWrap: 'break-word',
      wordWrap: 'break-word',
      hyphens: 'auto',
      boxSizing: 'border-box',
      boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
    }),
    // Keep shadow props for native
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5
    })
  }
});