// Updated components_ExerciseIcons.tsx

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Base component with responsive container sizing
const IconContainer = ({ size = 24, children }: { size: number, children: React.ReactNode }) => {
  const containerSize = size * 1.6;
  return (
    <View 
      style={[
        styles.iconContainer, 
        { 
          width: containerSize, 
          height: containerSize,
          borderRadius: containerSize / 4
        }
      ]}
    >
      {children}
    </View>
  );
};

export const ChestPressIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M8 11C5.5 11 4 13 4 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 15L16 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 19L16 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 11C9 11 9.5 11.5 10 12L18 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </IconContainer>
  );
};

export const LegPressIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={[styles.iconContainer, { width: size * 2, height: size * 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M8 8.5V12L14 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M14 20V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const RowIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={[styles.iconContainer, { width: size * 2, height: size * 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M8 10L8 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M15 7L18 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 15L14 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M14 15L18 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const LateralRaiseIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={[styles.iconContainer, { width: size * 2, height: size * 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M12 10V15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M7 13H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 18L16 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const BicepCurlIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={[styles.iconContainer, { width: size * 2, height: size * 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M12 9V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M7 19C9 16 10 14 10 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M17 19C15 16 14 14 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const CalfRaiseIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={[styles.iconContainer, { width: size * 2, height: size * 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M12 9V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 13H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 16L12 13L16 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8 19L12 16L16 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};

export const AbsIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={[styles.iconContainer, { width: size * 2, height: size * 2 }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M12 9V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M10 14H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M9 17H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M10 20H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  }
});