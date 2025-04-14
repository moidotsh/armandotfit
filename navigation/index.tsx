// navigation/index.ts
export { AppHeader } from './AppHeader';
export { BottomNav } from './BottomNav';
export { 
  navigateToWorkout,
  navigateToSplitSelection,
  navigateToHome,
  goBack
} from './NavigationHelper';
export type { 
  WorkoutDetailRouteParams,
  SplitSelectionRouteParams
} from './NavigationHelper';