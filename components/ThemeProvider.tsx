import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme } from 'tamagui';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme() as 'light' | 'dark';
  const isDark = colorScheme === 'dark';

  const value = {
    colorScheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      <Theme name={colorScheme}>
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}