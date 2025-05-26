// app/settings.tsx - Enhanced Settings Screen using new components
import React, { useState } from 'react';
import { Platform } from 'react-native';
import { 
  YStack, 
  Switch 
} from 'tamagui';
import { 
  Bell, 
  Moon, 
  User, 
  Info, 
  Mail,
  Trash2
} from '@tamagui/lucide-icons';
import { PageContainer } from '../components/Layout/PageContainer';
import ScreenHeader from '@/components/Layout/ScreenHeader';
import SettingsGroup from '@/components/Settings/SettingsGroup';
import { SettingItem } from '../components/Settings/SettingItem';
import { ConstrainedViewSetting } from '../components/ConstrainedViewSetting';
import { useAppTheme } from '../components/ThemeProvider';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  
  // Demo state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Always false for gym app

  const handleClearData = () => {
    console.log('Clear data functionality would go here');
    // In a real app, this would clear user data
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
    console.log('Profile functionality would go here');
    // In a real app, this would navigate to profile settings
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

      {/* Account Settings Section */}
      <SettingsGroup title="Account">
        <SettingItem
          icon={<User />}
          title="Profile"
          description="Manage your workout preferences"
          onPress={handleProfile}
          rightElement={
            <YStack paddingRight={8}>
              <Bell size={16} color={colors.textMuted} style={{ transform: [{ rotate: '90deg' }] }} />
            </YStack>
          }
        />
        
        <SettingItem
          icon={<Info />}
          title="About"
          description="App version and information"
          onPress={handleAbout}
          rightElement={
            <YStack paddingRight={8}>
              <Bell size={16} color={colors.textMuted} style={{ transform: [{ rotate: '90deg' }] }} />
            </YStack>
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
            <YStack paddingRight={8}>
              <Bell size={16} color={colors.textMuted} style={{ transform: [{ rotate: '90deg' }] }} />
            </YStack>
          }
        />
      </SettingsGroup>

      {/* Data Management Section */}
      <SettingsGroup title="Data">
        <SettingItem
          icon={<Trash2 />}
          title="Clear All Data"
          description="Reset your workout history"
          onPress={handleClearData}
          destructive={true}
        />
      </SettingsGroup>

      {/* Version Info */}
      <YStack alignItems="center" marginTop={48}>
        <YStack alignItems="center" space={4}>
          <Bell 
            size={16} 
            color={colors.textMuted} 
            style={{ transform: [{ rotate: '0deg' }] }} 
          />
          <YStack alignItems="center">
            <Bell 
              size={13} 
              color={colors.textMuted}
            />
            <Bell 
              size={13} 
              color={colors.textMuted} 
              style={{ marginTop: 4 }}
            />
          </YStack>
        </YStack>
      </YStack>
    </PageContainer>
  );
}