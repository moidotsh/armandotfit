// Updated components/ExerciseIcons.tsx with consistent sizing and theming

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppTheme } from './ThemeProvider';

interface IconProps {
  size?: number;
  color?: string;
}

// Base component with consistent container sizing
const IconContainer = ({ size = 24, children }: { size: number, children: React.ReactNode }) => {
  const { colors } = useAppTheme();
  const containerSize = size * 1.6;
  
  return (
    <View 
      style={{
        width: containerSize, 
        height: containerSize,
        borderRadius: containerSize / 4,
        backgroundColor: colors.iconBackground,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {children}
    </View>
  );
};

export const ChestPressIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="7" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M8 11C5.5 11 4 13 4 15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 15L16 19" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 19L16 15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 11C9 11 9.5 11.5 10 12L18 12" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};

export const LegPressIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="6" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M8 8.5V12L14 18" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M14 20V16" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};

export const RowIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="7" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M8 10L8 15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M15 7L18 7" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 15L14 15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M14 15L18 7" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};

export const LateralRaiseIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M12 10V15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M7 13H17" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 18L16 18" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};

export const BicepCurlIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M12 9V14" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M7 19C9 16 10 14 10 14" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M17 19C15 16 14 14 14 14" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};

export const CalfRaiseIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M12 9V13" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 13H16" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 16L12 13L16 16" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8 19L12 16L16 19" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </IconContainer>
  );
};

export const AbsIcon = ({ size = 24, color }: IconProps) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="2.5" stroke={iconColor} strokeWidth="1.5" />
        <Path d="M12 9V12" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M10 14H14" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M9 17H15" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M10 20H14" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};