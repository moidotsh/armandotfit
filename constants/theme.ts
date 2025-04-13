// constants/theme.ts - Centralized theming system

// Define the base type for split information
export type SplitType = 'oneADay' | 'twoADay';

// Workout split information
interface WorkoutSplitInfo {
  id: SplitType;
  name: string;
  description: string;
}

// Define the interface for workout splits
interface WorkoutSplits {
  fullBody: WorkoutSplitInfo;
  amPm: WorkoutSplitInfo;
}

// Workout split type definitions.
export const WORKOUT_SPLITS: WorkoutSplits = {
  fullBody: {
    id: 'oneADay',
    name: 'Full Body Split',
    description: 'Complete all muscle groups in a single session'
  },
  amPm: {
    id: 'twoADay',
    name: 'AM/PM Split',
    description: 'Two targeted sessions per day'
  }
};

// Palette - Base colors
const palette = {
  orange: {
    primary: '#FF9500',
    light: '#FFB74D',
    dark: '#E67700'
  },
  gray: {
    50: '#F5F5F5',
    100: '#EEEEEE',
    200: '#E0E0E0',
    300: '#CCCCCC',
    400: '#AAAAAA',
    500: '#9E9E9E',
    600: '#777777',
    700: '#555555',
    800: '#333333',
    900: '#222222',
    950: '#121212'
  },
  white: '#FFFFFF',
  black: '#000000',
  success: '#4CAF50',
  warning: '#FF5733',
  info: '#2196F3',
  error: '#F44336',
};

// Category colors for exercise types
export const categoryColors: Record<string, string> = {
  'Chest': '#FF5252',
  'Arms': '#7C4DFF',
  'Shoulders': '#448AFF',
  'Back': '#009688',
  'UpperLeg': '#FF9800',
  'LowerLeg': '#FFB74D',
  'Abs': '#FFD54F',
  'Back/Shoulders': '#4DB6AC',
  'UpperLeg (Accessory)': '#FFA726'
};

// Theme structure
export const theme = {
  // Color system
  colors: {
    // Brand colors
    accent: palette.orange.primary,
    accentLight: palette.orange.light,
    accentDark: palette.orange.dark,
    
    // Semantic colors
    success: palette.success,
    warning: palette.warning,
    info: palette.info,
    error: palette.error,
    
    // Theme-specific colors
    dark: {
      // UI Element colors
      background: palette.gray[950],
      backgroundAlt: palette.gray[900],
      card: palette.gray[900],
      cardAlt: palette.gray[800],
      iconBackground: palette.gray[800],
      toggleBackground: palette.gray[800],
      pill: palette.white,
      border: palette.gray[700],
      
      // Text colors
      text: palette.white,
      textMuted: palette.gray[400],
      textSecondary: palette.gray[500],
      
      // Interactive element colors
      buttonBackground: palette.orange.primary,
      buttonBackgroundDisabled: `${palette.orange.primary}80`, // 50% opacity
      
      // Specific UI elements
      subtitle: palette.orange.primary,
      arrow: palette.gray[700],
      alert: palette.warning,
    },
    
    light: {
      // UI Element colors
      background: palette.gray[50],
      backgroundAlt: palette.gray[100],
      card: palette.white,
      cardAlt: palette.gray[100],
      iconBackground: palette.gray[200],
      toggleBackground: palette.gray[800],
      pill: palette.black,
      border: palette.gray[300],
      
      // Text colors
      text: palette.black,
      textMuted: palette.gray[600],
      textSecondary: palette.gray[700],
      
      // Interactive element colors
      buttonBackground: palette.orange.primary,
      buttonBackgroundDisabled: `${palette.orange.primary}80`, // 50% opacity
      
      // Specific UI elements
      subtitle: palette.orange.primary,
      arrow: palette.gray[300],
      alert: palette.warning,
    }
  },
  
  // Spacing system
  spacing: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 48
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    small: 16,
    medium: 18,
    large: 22,
    xlarge: 28,
    xxlarge: 40
  },
  
  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },

  // Border radius
  borderRadius: {
    xs: 4,
    small: 8,
    medium: 15,
    large: 20,
    xlarge: 25,
    pill: 50
  },

  // Shadows
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8
    }
  },

  // Animation durations
  animation: {
    fast: 200,
    medium: 300,
    slow: 500
  }
};