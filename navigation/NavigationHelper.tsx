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
    // Rather than including non-existent routes, we'll handle them differently
    // EXERCISE_DETAIL = 'exercise-detail' // Future page
  }
  
  /**
   * Define the navigation hierarchy relationships
   * This maps each route to its parent route for back navigation
   */
  export const navigationHierarchy: Record<string, NavigationPath> = {
    [NavigationPath.WORKOUT_DETAIL]: NavigationPath.HOME,
    [NavigationPath.SPLIT_SELECTION]: NavigationPath.HOME,
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
export function navigateToPath(path: NavigationPath, params: Record<string, string> = {}) {
    // Handle home route specially
    if (path === NavigationPath.HOME) {
      router.push('/');
      return;
    }
    
    // For existing routes, use the path directly
    if (path === NavigationPath.WORKOUT_DETAIL || path === NavigationPath.SPLIT_SELECTION) {
      const routePath = `/${path}`;
      
      if (Object.keys(params).length > 0) {
        // Use href format for paths with query parameters
        router.push({
          pathname: routePath as any, // Using 'as any' to bypass the type checking here
          params: params
        });
      } else {
        router.push(routePath as any); // Using 'as any' to bypass the type checking
      }
      return;
    }
    
    // Fallback for any future routes - will only be used when those routes exist
    console.log(`Navigating to future route: ${path}`);
    router.push('/');
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