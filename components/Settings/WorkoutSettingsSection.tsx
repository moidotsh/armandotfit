// components/Settings/WorkoutSettingsSection.tsx
interface WorkoutSettingsSectionProps {
    marginTop?: number | string;
  }
  
  export function WorkoutSettingsSection({
    marginTop
  }: WorkoutSettingsSectionProps) {
    const { colors } = useAppTheme();
    const [preferredSplit, setPreferredSplit] = React.useState('oneADay');
    const [weeklyGoal, setWeeklyGoal] = React.useState(4);
    
    return (
      <SettingsGroup title="WORKOUT SETTINGS" marginTop={marginTop}>
        <SettingItem 
          icon={<span>🏋️</span>} // Replace with Lucide icon
          title="Preferred Split"
          description={`Currently: ${preferredSplit === 'oneADay' ? 'Single Session' : 'Dual Session'}`}
          onPress={() => {
            // Toggle between split types
            setPreferredSplit(prev => prev === 'oneADay' ? 'twoADay' : 'oneADay');
          }}
        />
        
        <SettingItem 
          icon={<span>🎯</span>} // Replace with Lucide icon
          title="Weekly Goal"
          description={`${weeklyGoal} workouts per week`}
          onPress={() => {
            // Open goal selector
            console.log('Open weekly goal selector');
          }}
        />
      </SettingsGroup>
    );
  }
  
  // components/Settings/AppSettingsSection.tsx - For Arman.fit
  import { Switch } from 'tamagui';
  import { Bell, Monitor, Smartphone } from '@tamagui/lucide-icons';
  import { Platform } from 'react-native';
import SettingsGroup, { SettingItem } from './SettingsGroup';
import { useAppTheme } from '../ThemeProvider';
import React from 'react';
  
  interface AppSettingsSectionProps {
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    constrainedView?: boolean;
    toggleConstrainedView?: () => void;
    marginTop?: number | string;
  }
  
  export function AppSettingsSection({
    notificationsEnabled,
    setNotificationsEnabled,
    constrainedView,
    toggleConstrainedView,
    marginTop
  }: AppSettingsSectionProps) {
    const { colors } = useAppTheme();
    const isWeb = Platform.OS === 'web';
    
    return (
      <SettingsGroup title="APP SETTINGS" marginTop={marginTop}>
        <SettingItem 
          icon={<Bell />}
          title="Workout Reminders"
          description="Get notified about workout sessions"
          rightElement={
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              backgroundColor={notificationsEnabled ? colors.buttonBackground : colors.cardAlt}
            />
          }
        />
        
        <SettingItem 
          icon={<Monitor />}
          title="Always Light Mode"
          description="Optimized for gym lighting conditions"
          rightElement={
            <Switch
              checked={true}
              disabled={true}
              backgroundColor={colors.cardAlt}
              opacity={0.5}
            />
          }
        />
        
        {/* Only show constrained view setting on web */}
        {isWeb && constrainedView !== undefined && toggleConstrainedView && (
          <SettingItem 
            icon={<Smartphone />}
            title="Phone-Width Layout"
            description="Constrain app to phone dimensions on desktop"
            rightElement={
              <Switch
                checked={constrainedView}
                onCheckedChange={toggleConstrainedView}
                backgroundColor={constrainedView ? colors.buttonBackground : colors.cardAlt}
              />
            }
          />
        )}
      </SettingsGroup>
    );
  }

  export default WorkoutSettingsSection;