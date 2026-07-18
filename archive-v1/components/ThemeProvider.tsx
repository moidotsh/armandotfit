// components/ThemeProvider.tsx - Enhanced version adapted from QEP
import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { Theme } from 'tamagui';
import { theme } from '../constants/theme';

// For web, use localStorage; for native, we'll add AsyncStorage later if needed
const isWeb = Platform.OS === 'web';

// Storage key for constrained view setting
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
    // For native, default to false (no constraint needed)
    return false;
  }
};

const setStoredConstrainedView = async (value: boolean): Promise<void> => {
  if (isWeb) {
    try {
      localStorage.setItem(CONSTRAINED_VIEW_KEY, String(value));
    } catch {
      // Ignore storage errors
    }
  }
  // For native, we could add AsyncStorage here later
};

// Enhanced theme context type
type ThemeContextType = {
  // Theme identification
  colorScheme: 'light';
  isDark: false;
  
  // Complete theme structure
  colors: typeof theme.colors.light;
  spacing: typeof theme.spacing;
  fontSize: typeof theme.fontSize;
  fontWeight: typeof theme.fontWeight;
  borderRadius: typeof theme.borderRadius;
  shadows: typeof theme.shadows;
  animation: typeof theme.animation;
  zIndex: typeof theme.zIndex;
  
  // Constrained view functionality (for web)
  constrainedView: boolean;
  toggleConstrainedView: () => void;
  
  // Enhanced helper functions
  getColor: (colorPath: string) => string;
  getSpacing: (size: keyof typeof theme.spacing) => number;
  getFontSize: (size: keyof typeof theme.fontSize) => number;
  getBorderRadius: (size: keyof typeof theme.borderRadius) => number | string;
  getShadow: (size: keyof typeof theme.shadows) => object;
  
  // Responsive helpers
  isNarrow: boolean;
  screenWidth: number;
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

// Enhanced ThemeProvider component
export function ThemeProvider({ children }: ThemeProviderProps) {
  // State for constrained view (default based on platform)
  const [constrainedView, setConstrainedView] = useState(isWeb);
  
  // Screen width state for responsive helpers
  const [screenWidth, setScreenWidth] = useState(isWeb ? (typeof window !== 'undefined' ? window.innerWidth : 1200) : 375);

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

  // Listen for window resize on web
  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      const handleResize = () => {
        setScreenWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
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

  // Enhanced helper functions
  const getColor = (colorPath: string): string => {
    const pathArray = colorPath.split('.');
    let current: any = theme.colors.light;
    
    for (const key of pathArray) {
      if (current[key] !== undefined) {
        current = current[key];
      } else {
        console.warn(`Color path '${colorPath}' not found, returning fallback`);
        return theme.colors.light.text; // Fallback color
      }
    }
    
    return current;
  };

  const getSpacing = (size: keyof typeof theme.spacing): number => {
    return theme.spacing[size];
  };

  const getFontSize = (size: keyof typeof theme.fontSize): number => {
    return theme.fontSize[size];
  };

  const getBorderRadius = (size: keyof typeof theme.borderRadius): number | string => {
    return theme.borderRadius[size];
  };

  const getShadow = (size: keyof typeof theme.shadows): object => {
    return theme.shadows[size];
  };

  // Responsive helpers
  const isNarrow = screenWidth < 350;

  // Memoize the theme value to prevent unnecessary re-renders
  const themeValue = useMemo((): ThemeContextType => {
    return {
      // Theme identification
      colorScheme: 'light',
      isDark: false,
      
      // Theme structure
      colors: theme.colors.light,
      spacing: theme.spacing,
      fontSize: theme.fontSize,
      fontWeight: theme.fontWeight,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows,
      animation: theme.animation,
      zIndex: theme.zIndex,
      
      // Constrained view
      constrainedView,
      toggleConstrainedView,
      
      // Helper functions
      getColor,
      getSpacing,
      getFontSize,
      getBorderRadius,
      getShadow,
      
      // Responsive helpers
      isNarrow,
      screenWidth,
    };
  }, [constrainedView, isNarrow, screenWidth]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <Theme name="light">
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}