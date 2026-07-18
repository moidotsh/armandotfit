// Add this to your existing navigation helper or create a new one

// navigation/SettingsNavigation.ts
import { router } from 'expo-router';

/**
 * Navigate to the settings screen
 */
export function navigateToSettings() {
  router.push('/settings');
}

/**
 * Navigate back from settings
 */
export function navigateBackFromSettings() {
  router.back();
}

// You can also update your index.tsx to use this:
// Replace the console.log with:
// onPress={navigateToSettings}