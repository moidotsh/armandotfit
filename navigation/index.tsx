// navigation/index.ts
export { AppHeader } from './AppHeader';
export { BottomNav } from './BottomNav';
export { 
  navigateToWorkout,
  navigateToWorkoutPrograms,
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