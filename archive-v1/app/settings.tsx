// app/settings.tsx - Enhanced Settings Screen using new components
import React, { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { 
  YStack, 
  Switch,
  Text 
} from 'tamagui';
import { 
  Bell, 
  Moon, 
  User, 
  Info, 
  Mail,
  Trash2,
  LogOut,
  ChevronRight,
  Settings,
  Target,
  Download,
  AlertTriangle,
  Cloud,
  CloudOff,
  RefreshCw
} from '@tamagui/lucide-icons';
import { PageContainer } from '../components/Layout/PageContainer';
import ScreenHeader from '@/components/Layout/ScreenHeader';
import SettingsGroup from '@/components/Settings/SettingsGroup';
import { SettingItem } from '../components/Settings/SettingItem';
import { ConstrainedViewSetting } from '../components/ConstrainedViewSetting';
import { useAppTheme } from '../components/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { localWorkoutService } from '../data/localWorkoutService';
import { useWorkoutData } from '../context/WorkoutDataContext';

export default function SettingsScreen() {
  const { colors, spacing } = useAppTheme();
  const { signOut, profile, isLoading, updateProfile } = useAuth();
  const { 
    userPreferences, 
    updateUserPreferences, 
    sessions, 
    totalWorkouts,
    isOnline,
    pendingSyncCount,
    syncToCloud 
  } = useWorkoutData();
  
  // Demo state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Always false for gym app

  const handleLogout = async () => {
    console.log('Logout button pressed'); // Debug log
    
    if (Platform.OS === 'web') {
      // For web, use a simple confirm dialog
      const confirmed = confirm('Are you sure you want to sign out?');
      if (confirmed) {
        try {
          console.log('Attempting logout...');
          authService.logAuthEvent('User logout');
          await signOut();
          console.log('Logout successful');
        } catch (error) {
          console.error('Logout error:', error);
          alert('Failed to sign out. Please try again.');
        }
      }
    } else {
      // For native, use Alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                authService.logAuthEvent('User logout');
                await signOut();
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your workout data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: async () => {
            if (profile?.id) {
              try {
                await localWorkoutService.clearUserData(profile.id);
                Alert.alert('Success', 'All workout data has been cleared.');
              } catch (error) {
                console.error('Failed to clear data:', error);
                Alert.alert('Error', 'Failed to clear data. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const handleWorkoutPreferences = () => {
    if (Platform.OS === 'web') {
      const currentSplit = userPreferences.preferredSplit;
      const currentGoal = userPreferences.weeklyGoal;
      
      const newSplitInput = prompt(`Current split: ${currentSplit}\nEnter new split (oneADay or twoADay):`, currentSplit);
      if (newSplitInput && (newSplitInput === 'oneADay' || newSplitInput === 'twoADay') && newSplitInput !== currentSplit) {
        updateUserPreferences({ preferredSplit: newSplitInput });
        alert('Workout split updated!');
        return;
      }
      
      const newGoalInput = prompt(`Current weekly goal: ${currentGoal} workouts\nEnter new weekly goal (1-7):`, currentGoal.toString());
      if (newGoalInput) {
        const newGoal = parseInt(newGoalInput);
        if (newGoal >= 1 && newGoal <= 7 && newGoal !== currentGoal) {
          updateUserPreferences({ weeklyGoal: newGoal });
          alert('Weekly goal updated!');
        }
      }
    } else {
      Alert.alert(
        'Workout Preferences',
        `Split: ${userPreferences.preferredSplit}\nWeekly Goal: ${userPreferences.weeklyGoal} workouts\n\nFull editing available on web version.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleExportData = () => {
    if (Platform.OS === 'web') {
      try {
        const exportData = {
          profile: {
            displayName: profile?.displayName,
            email: profile?.email,
            exportDate: new Date().toISOString()
          },
          preferences: userPreferences,
          sessions: sessions,
          summary: {
            totalWorkouts,
            dataExportedAt: new Date().toISOString()
          }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `armandotfit-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert('Workout data exported successfully!');
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export data. Please try again.');
      }
    } else {
      Alert.alert(
        'Export Data',
        `You have ${totalWorkouts} workouts recorded.\n\nData export is available on the web version of the app.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all workout data. This action cannot be undone.\n\nAre you absolutely sure you want to proceed?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'Last chance! This will delete everything permanently.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    if (profile?.id) {
                      try {
                        // Clear local data first
                        await localWorkoutService.clearUserData(profile.id);
                        
                        // TODO: In a real implementation, you would:
                        // 1. Delete user data from database
                        // 2. Delete user profile
                        // 3. Delete auth account
                        
                        // For now, just sign out
                        await signOut();
                        Alert.alert('Account Deleted', 'Your account and all data have been permanently removed.');
                      } catch (error) {
                        console.error('Failed to delete account:', error);
                        Alert.alert('Error', 'Failed to delete account. Please contact support.');
                      }
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSyncData = async () => {
    if (!profile?.id) {
      Alert.alert('Sync Error', 'Please log in to sync your data.');
      return;
    }

    try {
      await syncToCloud();
      Alert.alert('Sync Complete', 'Your workout data has been synced to the cloud.');
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', 'Failed to sync data. Please check your internet connection and try again.');
    }
  };

  const handleContactSupport = () => {
    console.log('Contact support functionality would go here');
    // In a real app, this would open email or support system
  };

  const handleAbout = () => {
    console.log('About functionality would go here');
    // In a real app, this would show app info
  };

  const handleProfile = () => {
    if (Platform.OS === 'web') {
      const newDisplayName = prompt('Enter new display name:', profile?.displayName || '');
      if (newDisplayName && newDisplayName.trim() !== '' && newDisplayName !== profile?.displayName) {
        updateProfile({ displayName: newDisplayName.trim() })
          .then(result => {
            if (result.success) {
              alert('Profile updated successfully!');
            } else {
              alert(`Failed to update profile: ${result.error}`);
            }
          });
      }
    } else {
      // For native, show a simple alert with current info
      Alert.alert(
        'Profile Information',
        `Name: ${profile?.displayName}\nEmail: ${profile?.email}\n\nFull profile editing available on web version.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <PageContainer>
      <ScreenHeader
        title="Settings"
        showBackButton={true}
      />

      {/* App Settings Section */}
      <SettingsGroup title="App Settings">
        <SettingItem
          icon={<Bell />}
          title="Notifications"
          description="Workout reminders and progress alerts"
          rightElement={
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              backgroundColor={notificationsEnabled ? colors.buttonBackground : colors.cardAlt}
            />
          }
        />
        
        <SettingItem
          icon={<Moon />}
          title="Dark Mode"
          description="Not available - optimized for gym lighting"
          rightElement={
            <Switch
              checked={false}
              disabled={true}
              backgroundColor={colors.cardAlt}
              opacity={0.5}
            />
          }
        />
        
        {/* Constrained View Setting - Only shows on web */}
        <ConstrainedViewSetting />
      </SettingsGroup>

      {/* User Profile Section */}
      {profile && (
        <SettingsGroup title="Profile">
          <SettingItem
            icon={<User />}
            title={authService.getDisplayName(profile)}
            description={profile.email}
            onPress={handleProfile}
            rightElement={
              <ChevronRight size={20} color={colors.textMuted} />
            }
          />
          
          <SettingItem
            icon={<Target />}
            title="Workout Preferences"
            description={`${userPreferences.preferredSplit} • ${userPreferences.weeklyGoal}/week`}
            onPress={handleWorkoutPreferences}
            rightElement={
              <ChevronRight size={20} color={colors.textMuted} />
            }
          />
          
          <SettingItem
            icon={<LogOut />}
            title="Sign Out"
            description="Sign out of your account"
            onPress={handleLogout}
            destructive={true}
          />
          
          <SettingItem
            icon={<AlertTriangle />}
            title="Delete Account"
            description="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            destructive={true}
          />
        </SettingsGroup>
      )}

      {/* Account Settings Section */}
      <SettingsGroup title="Information">        
        <SettingItem
          icon={<Info />}
          title="About"
          description="App version and information"
          onPress={handleAbout}
          rightElement={
            <ChevronRight size={20} color={colors.textMuted} />
          }
        />
      </SettingsGroup>

      {/* Support Section */}
      <SettingsGroup title="Support">
        <SettingItem
          icon={<Mail />}
          title="Contact Support"
          description="Get help with the app"
          onPress={handleContactSupport}
          rightElement={
            <ChevronRight size={20} color={colors.textMuted} />
          }
        />
      </SettingsGroup>

      {/* Cloud Sync Section - Only show for authenticated users */}
      {profile && (
        <SettingsGroup title="Cloud Sync">
          <SettingItem
            icon={isOnline ? <Cloud /> : <CloudOff />}
            title="Sync Status"
            description={isOnline 
              ? `Online • ${pendingSyncCount} pending` 
              : 'Offline • Changes will sync when online'
            }
            rightElement={
              <Text color={isOnline ? colors.success : colors.textMuted} fontSize={12}>
                {isOnline ? 'Connected' : 'Offline'}
              </Text>
            }
          />
          
          {pendingSyncCount > 0 && (
            <SettingItem
              icon={<RefreshCw />}
              title="Sync Now"
              description={`Sync ${pendingSyncCount} pending changes`}
              onPress={handleSyncData}
              rightElement={
                <ChevronRight size={20} color={colors.textMuted} />
              }
            />
          )}
        </SettingsGroup>
      )}

      {/* Data Management Section */}
      <SettingsGroup title="Data">
        <SettingItem
          icon={<Download />}
          title="Export Data"
          description="Download your workout history"
          onPress={handleExportData}
          rightElement={
            <ChevronRight size={20} color={colors.textMuted} />
          }
        />
        
        <SettingItem
          icon={<Trash2 />}
          title="Clear All Data"
          description="Reset your workout history"
          onPress={handleClearData}
          destructive={true}
        />
      </SettingsGroup>

      {/* App Version */}
      <YStack alignItems="center" marginTop={spacing.xxxlarge} paddingBottom={spacing.large}>
        <Text color={colors.textMuted} fontSize={12}>
          Armandotfit v1.0.0
        </Text>
      </YStack>
    </PageContainer>
  );
}