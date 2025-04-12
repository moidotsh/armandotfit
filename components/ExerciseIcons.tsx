import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const ChestPressIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={styles.iconContainer}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path d="M8 11C5.5 11 4 13 4 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 15L16 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 19L16 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 11C9 11 9.5 11.5 10 12L18 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const LegPressIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => {
  return (
    <View style={styles.iconContainer}>
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
    <View style={styles.iconContainer}>
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
    <View style={styles.iconContainer}>
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
    <View style={styles.iconContainer}>
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
    <View style={styles.iconContainer}>
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  }
});