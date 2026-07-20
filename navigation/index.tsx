// navigation/index.tsx
// Barrel for the navigation helper layer. All raw router calls live in
// `NavigationHelper.tsx` (the C1-audited exempt site); other files
// import the typed helpers from here.

export {
  NavigationPath,
  navigationHierarchy,
  navigateToHome,
  navigateToLogin,
  navigateToRegister,
  navigateToForgotPassword,
  navigateToSettings,
  navigateToPremiumShowcase,
  navigateToWorkoutDetail,
  navigateToExerciseDatabase,
  navigateToExerciseDetail,
  navigateToProgression,
  navigateToAnalytics,
  navigateToWorkoutPrograms,
  navigateToSplitSelection,
  navigateToEquipmentInventory,
  navigateToPlanPreview,
  navigateToPlanReplacement,
  replaceWithHome,
  replaceWithLogin,
  replaceWithRegister,
  replaceWithForgotPassword,
  safeGoBack,
  goBack,
  routerInstance,
  type Router,
} from './NavigationHelper';
