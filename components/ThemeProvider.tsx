// components/ThemeProvider.tsx - Light Theme Only Version
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Theme } from 'tamagui';
import { theme } from '../constants/theme';

// Define the theme context type
type ThemeContextType = {
  colorScheme: 'light'; // Always light
  isDark: false; // Never dark
  colors: typeof theme.colors.light; // Always light colors
  spacing: typeof theme.spacing;
  fontSize: typeof theme.fontSize;
  fontWeight: typeof theme.fontWeight;
  borderRadius: typeof theme.borderRadius;
  shadows: typeof theme.shadows;
  animation: typeof theme.animation;
};

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}

// Props for the ThemeProvider component
type ThemeProviderProps = {
  children: ReactNode;
};

// ThemeProvider component - always light mode
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Memoize the theme value to prevent unnecessary re-renders
  // Always use light theme regardless of system preference
  const themeValue = useMemo((): ThemeContextType => {
    return {
      colorScheme: 'light',
      isDark: false,
      colors: theme.colors.light,
      spacing: theme.spacing,
      fontSize: theme.fontSize,
      fontWeight: theme.fontWeight,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows,
      animation: theme.animation
    };
  }, []);

  return (
    <ThemeContext.Provider value={themeValue}>
      <Theme name="light">
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

// Export theme constants for direct usage
export { theme };