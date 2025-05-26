// app/settings.tsx - Settings Screen with Constrained View Setting
import React, { useState } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { 
  YStack, 
  XStack, 
  Text, 
  Button, 
  Card, 
  ScrollView, 
  Separator,
  Switch 
} from 'tamagui';
import { 
  ChevronLeft, 
  Smartphone, 
  Bell, 
  Moon, 
  User, 
  Info, 
  Mail 
} from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

// Settings Section Component
function SettingsSection({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) {
  const { colors, spacing, fontSize, borderRadius } = useAppTheme();
  
  return (
    <YStack marginBottom={spacing.large}>
      <Text
        color={colors.textMuted}
        fontSize={fontSize.small}
        fontWeight="600"
        textTransform="uppercase"
        letterSpacing={1}
        marginBottom={spacing.small}
        marginLeft={spacing.small}
      >
        {title}
      </Text>
      
      <Card
        backgroundColor={colors.card}
        borderRadius={borderRadius.medium}
        overflow="hidden"
        elevate
      >
        {children}
      </Card>
    </YStack>
  );
}

// Settings Item Component
function SettingsItem({
  icon,
  title,
  description,
  rightElement,
  onPress,
  showSeparator = true
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showSeparator?: boolean;
}) {
  const { colors, spacing, fontSize } = useAppTheme();
  
  return (
    <>
      <XStack
        alignItems="center"
        padding={spacing.large}
        pressStyle={onPress ? { opacity: 0.7 } : undefined}
        onPress={onPress}
        cursor={onPress ? 'pointer' : 'default'}
      >
        <XStack alignItems="center" space={spacing.medium} flex={1}>
          {React.isValidElement(icon) &&
            React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, {
              size: 24,
              color: colors.text
            })
          }
          
          <YStack flex={1}>
            <Text
              color={colors.text}
              fontSize={fontSize.medium}
              fontWeight="500"
            >
              {title}
            </Text>
            
            {description && (
              <Text
                color={colors.textMuted}
                fontSize={fontSize.small}
                marginTop={2}
              >
                {description}
              </Text>
            )}
          </YStack>
        </XStack>
        
        {rightElement && (
          <YStack paddingLeft={spacing.medium}>
            {rightElement}
          </YStack>
        )}
      </XStack>
      
      {showSeparator && (
        <Separator backgroundColor={colors.border} />
      )}
    </>
  );
}

// Constrained View Setting Component
function ConstrainedViewSetting() {
  const { colors, constrainedView, toggleConstrainedView } = useAppTheme();
  const isWeb = Platform.OS === 'web';
  
  // Don't render on non-web platforms
  if (!isWeb) {
    return null;
  }
  
  return (
    <SettingsItem
      icon={<Smartphone />}
      title="Phone-Width Layout"
      description="Constrain the app to phone dimensions on desktop"
      rightElement={
        <Switch
          checked={constrainedView}
          onCheckedChange={toggleConstrainedView}
          backgroundColor={constrainedView ? colors.buttonBackground : colors.cardAlt}
        />
      }
    />
  );
}

export default function SettingsScreen() {
  const { colors, spacing, fontSize, isNarrow } = useAppTheme();
  const isWeb = Platform.OS === 'web';
  
  // Demo state for other settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Always false for gym app
  
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ 
        paddingTop: isNarrow ? spacing.xlarge : spacing.xxlarge,
        paddingBottom: spacing.xlarge
      }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      <YStack 
        paddingHorizontal={isNarrow ? spacing.medium : spacing.large} 
        paddingBottom={spacing.large}
      >
        {/* Header */}
        <XStack alignItems="center" space={spacing.small} marginBottom={spacing.large}>
          <Button 
            size="$3" 
            circular 
            icon={<ChevronLeft size="$1" />} 
            onPress={() => router.back()}
            backgroundColor="transparent"
            focusStyle={{}}
            style={{
              WebkitTapHighlightColor: 'transparent',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
              outline: 'none'
            }}
          />
          <YStack>
            <Text
              color={colors.text}
              fontSize={isNarrow ? fontSize.xlarge : fontSize.xxlarge}
              fontWeight="700"
            >
              Settings
            </Text>
          </YStack>
        </XStack>

        {/* App Settings Section */}
        <SettingsSection title="App Settings">
          <SettingsItem
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
          
          <SettingsItem
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
        </SettingsSection>

        {/* Account Settings Section */}
        <SettingsSection title="Account">
          <SettingsItem
            icon={<User />}
            title="Profile"
            description="Manage your workout preferences"
            onPress={() => console.log('Navigate to profile')}
            rightElement={
              <Text color={colors.textMuted} fontSize={fontSize.large}>›</Text>
            }
          />
          
          <SettingsItem
            icon={<Info />}
            title="About"
            description="App version and information"
            onPress={() => console.log('Navigate to about')}
            rightElement={
              <Text color={colors.textMuted} fontSize={fontSize.large}>›</Text>
            }
            showSeparator={false}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support">
          <SettingsItem
            icon={<Mail />}
            title="Contact Support"
            description="Get help with the app"
            onPress={() => console.log('Open email support')}
            rightElement={
              <Text color={colors.textMuted} fontSize={fontSize.large}>›</Text>
            }
            showSeparator={false}
          />
        </SettingsSection>

        {/* Version Info */}
        <YStack alignItems="center" marginTop={spacing.xlarge}>
          <Text color={colors.textMuted} fontSize={fontSize.small}>
            Arman.fit v1.0.3
          </Text>
          <Text color={colors.textMuted} fontSize={fontSize.small} marginTop={spacing.xs}>
            Built for the gym
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
}