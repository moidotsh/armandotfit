// constants/theme.ts - Enhanced Light-Only Theme System
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
    description: 'Two targeted sessions each day'
  }
};

// Enhanced color palette - optimized for gym environment visibility
const palette = {
  // Primary brand colors - keeping the orange but making it more vibrant for gym lighting
  orange: {
    primary: '#FF9500',
    light: '#FFB74D',
    dark: '#E67700',
    subtle: '#FFF3E0'
  },
  
  // Neutral grays - lighter and more contrasted for better gym visibility
  gray: {
    50: '#FAFAFA',    // Almost white background
    100: '#F5F5F5',   // Very light background
    200: '#EEEEEE',   // Light background
    300: '#E0E0E0',   // Light border
    400: '#BDBDBD',   // Medium border
    500: '#9E9E9E',   // Medium text
    600: '#757575',   // Dark text
    700: '#616161',   // Darker text
    800: '#424242',   // Very dark text
    900: '#212121',   // Almost black
    950: '#0F0F0F'    // Pure dark
  },
  
  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Semantic colors - optimized for gym environment
  success: '#4CAF50',   // Keep green for success
  warning: '#FF9800',   // Orange for warnings
  error: '#F44336',     // Red for errors
  info: '#2196F3',      // Blue for info
  
  // Exercise category colors - brighter and more distinct
  exercise: {
    chest: '#E53E3E',     // Red
    arms: '#805AD5',      // Purple
    shoulders: '#3182CE', // Blue
    back: '#38A169',      // Green
    upperLeg: '#D69E2E',  // Yellow/Gold
    lowerLeg: '#DD6B20',  // Orange
    abs: '#ECC94B',       // Light yellow
    cardio: '#E53E3E',    // Red variant
  }
};

// Category colors for exercise types (enhanced visibility)
export const categoryColors: Record<string, string> = {
  'Chest': palette.exercise.chest,
  'Arms': palette.exercise.arms,
  'Shoulders': palette.exercise.shoulders,
  'Back': palette.exercise.back,
  'UpperLeg': palette.exercise.upperLeg,
  'LowerLeg': palette.exercise.lowerLeg,
  'Abs': palette.exercise.abs,
  'Back/Shoulders': '#22C55E', // Green variant
  'UpperLeg (Accessory)': '#F59E0B' // Amber variant
};

// Enhanced theme structure with better organization
export const theme = {
  // Color system - comprehensive light theme
  colors: {
    // Brand colors
    primary: palette.orange.primary,
    primaryLight: palette.orange.light,
    primaryDark: palette.orange.dark,
    primarySubtle: palette.orange.subtle,
    
    // UI Element colors - optimized for gym lighting
    light: {
      // Background colors
      background: palette.gray[50],        // Very light for main background
      backgroundAlt: palette.gray[100],    // Slightly darker for sections
      backgroundSubtle: palette.gray[200], // For subtle distinctions
      
      // Card colors
      card: palette.white,                 // Pure white for main cards
      cardAlt: palette.gray[100],          // Light gray for secondary cards
      cardSubtle: palette.gray[200],       // For tertiary elements
      
      // Border colors
      border: palette.gray[300],           // Light borders
      borderLight: palette.gray[200],      // Very light borders
      borderDark: palette.gray[400],       // Darker borders for emphasis
      
      // Text colors - enhanced contrast for gym visibility
      text: palette.gray[900],             // Almost black for main text
      textSecondary: palette.gray[700],    // Dark gray for secondary text
      textMuted: palette.gray[600],        // Medium gray for muted text
      textSubtle: palette.gray[500],       // Light gray for subtle text
      textOnPrimary: palette.white,        // White text on orange backgrounds
      
      // Interactive element colors
      buttonBackground: palette.orange.primary,
      buttonBackgroundHover: palette.orange.dark,
      buttonBackgroundDisabled: palette.gray[300],
      buttonText: palette.white,
      buttonTextDisabled: palette.gray[500],
      
      // State colors
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
      info: palette.info,
      
      // Special UI elements
      overlay: 'rgba(0, 0, 0, 0.5)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      highlight: palette.orange.subtle,
      
      // Exercise-specific colors
      exerciseCard: palette.white,
      exerciseCardHover: palette.gray[50],
      
      // Icon backgrounds
      iconBackground: palette.gray[200],
      iconBackgroundHover: palette.gray[300],
      
      // Alert colors
      alert: palette.error,
      alertBackground: '#FFEBEE',
      
      // Toggle and switch colors
      toggleBackground: palette.gray[300],
      toggleBackgroundActive: palette.orange.primary,
      
      // Arrow and chevron colors
      arrow: palette.gray[400],
      arrowHover: palette.gray[600],
    }
  },
  
  // Enhanced spacing system - more granular control
  spacing: {
    xxs: 2,     // Very tiny spacing
    xs: 4,      // Tiny spacing
    small: 8,   // Small spacing
    medium: 16, // Medium spacing
    large: 24,  // Large spacing
    xlarge: 32, // Extra large spacing
    xxlarge: 48,// Very large spacing
    xxxlarge: 64, // Huge spacing
  },
  
  // Enhanced font sizes - better hierarchy
  fontSize: {
    xxs: 10,    // Very small text
    xs: 12,     // Small text
    small: 14,  // Small text
    medium: 16, // Body text
    large: 18,  // Large text
    xlarge: 22, // Extra large text
    xxlarge: 28,// Very large text
    xxxlarge: 36, // Huge text
    display: 48,  // Display text
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800'
  },

  // Enhanced border radius system
  borderRadius: {
    none: 0,
    xs: 2,
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    xxlarge: 20,
    pill: 9999,   // For pill-shaped elements
    circle: '50%' // For circular elements
  },

  // Enhanced shadow system - optimized for light theme
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0
    },
    small: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    medium: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    large: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6
    },
    xlarge: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12
    }
  },

  // Animation durations and easings
  animation: {
    fast: 150,
    medium: 250,
    slow: 350,
    verySlow: 500,
    // Easing curves
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  // Z-index scale for layering
  zIndex: {
    background: -1,
    base: 0,
    raised: 1,
    overlay: 10,
    modal: 100,
    tooltip: 1000,
    toast: 10000
  },

  // Breakpoints for responsive design
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  }
};