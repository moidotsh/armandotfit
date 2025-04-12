// Constants for workout splits

export type SplitType = 'oneADay' | 'twoADay';

interface WorkoutSplitInfo {
  id: SplitType;
  name: string;
  description: string;
}

interface WorkoutSplits {
  fullBody: WorkoutSplitInfo;
  amPm: WorkoutSplitInfo;
}

interface WorkoutSplits {
  fullBody: WorkoutSplitInfo;
  amPm: WorkoutSplitInfo;
}

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

// Custom theme colors and values for the app
export const theme = {
  colors: {
    accent: '#FF9500',  // The orange accent color
    dark: {
      background: '#121212',
      card: '#222222',
      text: '#FFFFFF',
      subtitle: '#FF9500',
      arrow: '#555555',
      iconBackground: '#333333',
    },
    light: {
      background: '#F5F5F5',
      card: '#FFFFFF',
      text: '#000000',
      subtitle: '#FF9500',
      arrow: '#CCCCCC',
      iconBackground: '#F0F0F0',
    }
  },
  
  // Common style values
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
  
  // Font sizes
  fontSize: {
    small: 16,
    medium: 22,
    large: 24,
    xlarge: 40,
  },
  
  // Border radius
  borderRadius: {
    small: 8,
    medium: 15,
    large: 24,
  },
};