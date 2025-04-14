// navigation/NavigationHelper.tsx
import { router } from 'expo-router';
import { SplitType } from '../constants/theme';

/**
 * Helper functions for navigating within the app
 */

/**
 * Navigate to workout detail screen
 */
export function navigateToWorkout(splitType: SplitType | string, day: number) {
  router.push(`/workout-detail?type=${splitType}&day=${day}`);
}

/**
 * Navigate to split selection screen
 */
export function navigateToSplitSelection(type: SplitType | string = 'oneADay') {
  router.push(`/split-selection?type=${type}`);
}

/**
 * Navigate to home screen
 */
export function navigateToHome() {
  router.push('/');
}

/**
 * Navigate back
 */
export function goBack() {
  router.back();
}

/**
 * Type aliases for route params - to be used with useLocalSearchParams
 * We use type annotation instead of interfaces to avoid the Route constraint issue
 */
export type WorkoutDetailRouteParams = {
  type?: string;
  day?: string;
};

export type SplitSelectionRouteParams = {
  type?: string;
};