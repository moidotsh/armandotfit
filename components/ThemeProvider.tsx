// components/ThemeProvider.tsx - Updated with Constrained View Support
import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Theme } from 'tamagui';
import { theme } from '../constants/theme';

// For web, we need to use a different storage mechanism
const isWeb = Platform.OS === 'web';

// Storage functions for constrained view setting
const CONSTRAINED_VIEW_KEY = 'armandotfit_constrained_view';

const getStoredConstrainedView = async (): Promise<boolean> => {
  if (isWeb) {
    try {
      const value = localStorage.getItem(CONSTRAINED_VIEW_KEY);
      return value === null ? true : value === 'true'; // Default to true
    } catch {
      return true;
    }
  } else {
    // For native, you'd use AsyncStorage here if available
    // For now, just return default
    return true;
  }
};

const setStoredConstrainedView = async (value: boolean): Promise<void> => {
  if (isWeb) {
    try {
      localStorage.setItem(CONSTRAINED_VIEW_KEY, String(value));
    } catch {
      // Ignore storage errors
    }
  } else {
    // For native, you'd use AsyncStorage here if available
  }
};

// Define the theme context type - keeping light theme for now
type ThemeContextType = {
  colorScheme: 'light';
  isDark: false;
  colors: typeof theme.colors.light;
  spacing: typeof theme.spacing;
  fontSize: typeof theme.fontSize;
  fontWeight: typeof theme.fontWeight;
  borderRadius: typeof theme.borderRadius;
  shadows: typeof theme.shadows;
  animation: typeof theme.animation;
  // Add constrained view properties
  constrainedView: boolean;
  toggleConstrainedView: () => void;
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

// ThemeProvider component with constrained view support
export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  
  // State for constrained view (default to true for web, false for native)
  const [constrainedView, setConstrainedView] = useState(isWeb);

  // Load constrained view setting on mount
  useEffect(() => {
    const loadConstrainedViewSetting = async () => {
      try {
        const storedValue = await getStoredConstrainedView();
        setConstrainedView(storedValue);
      } catch (error) {
        console.error('Error loading constrained view setting:', error);
      }
    };

    loadConstrainedViewSetting();
  }, []);

  // Toggle constrained view setting
  const toggleConstrainedView = async () => {
    const newValue = !constrainedView;
    setConstrainedView(newValue);
    try {
      await setStoredConstrainedView(newValue);
      
      // For web, dispatch a storage event to update any listeners
      if (isWeb && typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: CONSTRAINED_VIEW_KEY,
          newValue: String(newValue),
          oldValue: String(!newValue)
        }));
      }
    } catch (error) {
      console.error('Error saving constrained view setting:', error);
    }
  };

  // Memoize the theme value to prevent unnecessary re-renders
  // Keep using light theme for now (you can change this later)
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
      animation: theme.animation,
      constrainedView,
      toggleConstrainedView
    };
  }, [constrainedView]);

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