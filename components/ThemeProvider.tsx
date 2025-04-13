import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, useTheme as useTamaguiTheme } from 'tamagui';
import { theme } from '../constants/theme';

// Define the theme context type
type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  colors: typeof theme.colors.light | typeof theme.colors.dark;
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

// ThemeProvider component
export function ThemeProvider({ children }: ThemeProviderProps) {
  const tamaguiTheme = useTamaguiTheme();
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const isDark = colorScheme === 'dark';
  
  // Memoize the theme value to prevent unnecessary re-renders
  const themeValue = useMemo(() => {
    return {
      colorScheme,
      isDark,
      colors: isDark ? theme.colors.dark : theme.colors.light,
      spacing: theme.spacing,
      fontSize: theme.fontSize,
      fontWeight: theme.fontWeight,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows,
      animation: theme.animation
    };
  }, [colorScheme, isDark]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <Theme name={colorScheme}>
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

// Export theme constants for direct usage
export { theme };