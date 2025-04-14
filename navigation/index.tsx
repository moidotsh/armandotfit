// navigation/index.ts
export { AppHeader } from './AppHeader';
export { BottomNav } from './BottomNav';
export { 
  navigateToWorkout,
  navigateToSplitSelection,
  navigateToHome,
  goBack,
  navigateToPath,
  NavigationPath,
  navigationHierarchy
} from './NavigationHelper';
export type { 
  WorkoutDetailRouteParams,
  SplitSelectionRouteParams,
  ExerciseDetailRouteParams
} from './NavigationHelper';