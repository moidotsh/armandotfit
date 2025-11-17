// navigation/NavigationHelper.tsx
import { router } from 'expo-router';
import { SplitType } from '../constants/theme';

/**
 * App navigation hierarchy paths
 */
export enum NavigationPath {
    HOME = 'home',
    WORKOUT_DETAIL = 'workout-detail',
    SPLIT_SELECTION = 'split-selection',
    WORKOUT_PROGRAMS = 'workout-programs',
    EXERCISE_DETAIL = 'exercise-detail',
    LOGIN = 'auth/login',
    REGISTER = 'auth/register',
    FORGOT_PASSWORD = 'auth/forgot-password',
    SETTINGS = 'settings'
  }
  
  /**
   * Define the navigation hierarchy relationships
   * This maps each route to its parent route for back navigation
   */
  export const navigationHierarchy: Record<string, NavigationPath> = {
    [NavigationPath.WORKOUT_DETAIL]: NavigationPath.HOME,
    [NavigationPath.SPLIT_SELECTION]: NavigationPath.HOME,
    [NavigationPath.WORKOUT_PROGRAMS]: NavigationPath.HOME,
    // We'll add this when the page exists
    // 'exercise-detail': NavigationPath.WORKOUT_DETAIL
  };

/**
 * Navigate to workout detail screen
 */
export function navigateToWorkout(splitType: SplitType | string, day: number, from: NavigationPath = NavigationPath.HOME) {
  router.push(`/workout-detail?type=${splitType}&day=${day}&from=${from}`);
}

/**
 * Navigate to workout programs screen
 */
export function navigateToWorkoutPrograms() {
  router.push('/workout-programs');
}

/**
 * Navigate to split selection screen
 */
export function navigateToSplitSelection(type: SplitType | string = 'oneADay', from: NavigationPath = NavigationPath.HOME) {
  router.push(`/split-selection?type=${type}&from=${from}`);
}

/**
 * Navigate to home screen
 */
export function navigateToHome() {
  router.push('/');
}

/**
 * Navigate to login screen
 */
export function navigateToLogin() {
  router.push('/auth/login');
}

/**
 * Navigate to register screen
 */
export function navigateToRegister() {
  router.push('/auth/register');
}

/**
 * Navigate to forgot password screen
 */
export function navigateToForgotPassword() {
  router.push('/auth/forgot-password');
}

/**
 * Navigate to settings screen
 */
export function navigateToSettings() {
  router.push('/settings');
}

/**
 * Intelligent back navigation that respects the app hierarchy
 * If from parameter is provided in route, use that
 * Otherwise, use the defined hierarchy
 */
export function goBack(currentPath: NavigationPath | string, fromParam?: string) {
    // If a specific 'from' path is defined in the URL params, prioritize that
    if (fromParam) {
      if (fromParam === 'home' || Object.values(NavigationPath).includes(fromParam as NavigationPath)) {
        navigateToPath(fromParam as NavigationPath);
        return;
      }
    }
    
    // If the current path is a known path in our hierarchy
    if (Object.values(NavigationPath).includes(currentPath as NavigationPath)) {
      const parentPath = navigationHierarchy[currentPath] || NavigationPath.HOME;
      navigateToPath(parentPath);
      return;
    }
    
    // Default fallback - just go home
    navigateToHome();
  }

/**
 * Navigate to any path in the app
 */
/**
 * Navigate to any path in the app
 */
export function navigateToPath(path: NavigationPath, params: Record<string, string> = {}) {
    // Add debugging logs
    console.log('NavigateToPath called with:', { path, params });
    
    // Handle home route specially
    if (path === NavigationPath.HOME) {
      console.log('Navigating to home');
      router.push('/');
      return;
    }
    
    // Try the direct string approach for exercise-detail
    if (path === NavigationPath.EXERCISE_DETAIL) {
      // Build query string manually
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');
        
      const fullPath = `/exercise-detail${queryString ? `?${queryString}` : ''}`;
      console.log('Using direct navigation to:', fullPath);
      
      try {
        router.push(fullPath as any);
        console.log('Direct navigation attempt completed');
      } catch (error) {
        console.error('Direct navigation error:', error);
      }
      return;
    }
    
    // For other routes, use the object approach
    const navigationObject = {
      pathname: `/${path}`,
      params
    };
    
    console.log('Navigation object:', navigationObject);
    
    try {
      router.push(navigationObject as any);
      console.log('Navigation successful');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

/**
 * Type aliases for route params - to be used with useLocalSearchParams
 * We use type annotation instead of interfaces to avoid the Route constraint issue
 */
export type WorkoutDetailRouteParams = {
  type?: string;
  day?: string;
  from?: string;
};

export type SplitSelectionRouteParams = {
  type?: string;
  from?: string;
};

export type ExerciseDetailRouteParams = {
    id?: string;
    from?: string;
  };
  
  // Define future route types here - we'll add the actual routes later
  export const FUTURE_ROUTES = {
    EXERCISE_DETAIL: 'exercise-detail'
  };