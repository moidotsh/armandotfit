import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from './ThemeProvider';

export const LoadingScreen = () => {
  const { colors } = useAppTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="12"
            r="10"
            stroke={colors.text}
            strokeOpacity={0.3}
            strokeWidth={2.5}
          />
          <Path
            d="M22 12a10 10 0 00-10-10"
            stroke={colors.text}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
