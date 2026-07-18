// navigation/BottomNav.tsx
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { XStack, YStack, Text } from 'tamagui';
import { Home, BarChart2, History } from '@tamagui/lucide-icons';
import { useAppTheme } from '../components/ThemeProvider';
import { navigateToHome } from './NavigationHelper';

interface BottomNavProps {
  currentRoute?: string;
}

/**
 * Bottom navigation component - currently a placeholder for future implementation
 * Not used in the current app, but ready for when tab navigation is added
 */
export function BottomNav({ currentRoute = 'home' }: BottomNavProps) {
  const { colors, spacing, fontSize } = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 350;
  
  // This is just a placeholder structure and is not currently used in the app
  return (
    <XStack 
      height={isNarrow ? 60 : 70} 
      backgroundColor={colors.card}
      borderTopWidth={1}
      borderColor={colors.border}
      justifyContent="space-around"
      alignItems="center"
    >
      <NavItem 
        icon={<Home size={isNarrow ? 24 : 28} color={currentRoute === 'home' ? colors.buttonBackground : colors.textMuted} />} 
        label="Home" 
        isActive={currentRoute === 'home'}
        onPress={navigateToHome}
      />
      <NavItem 
        icon={<BarChart2 size={isNarrow ? 24 : 28} color={currentRoute === 'stats' ? colors.buttonBackground : colors.textMuted} />} 
        label="Stats" 
        isActive={currentRoute === 'stats'}
        onPress={() => {}}
      />
      <NavItem 
        icon={<History size={isNarrow ? 24 : 28} color={currentRoute === 'history' ? colors.buttonBackground : colors.textMuted} />} 
        label="History" 
        isActive={currentRoute === 'history'}
        onPress={() => {}}
      />
    </XStack>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function NavItem({ icon, label, isActive, onPress }: NavItemProps) {
  const { colors, fontSize } = useAppTheme();
  
  return (
    <YStack 
      alignItems="center" 
      justifyContent="center"
      paddingVertical={8}
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}
      cursor="pointer"
    >
      {icon}
      <Text
        color={isActive ? colors.buttonBackground : colors.textMuted}
        fontSize={fontSize.small}
        fontWeight={isActive ? "600" : "400"}
        marginTop={4}
      >
        {label}
      </Text>
    </YStack>
  );
}