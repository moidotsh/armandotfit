// Extended components/ExerciseIcons.tsx with abstract Unown/MissingNo-style icons (muscle-inspired)

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppTheme } from './ThemeProvider';

interface IconProps {
  size?: number;
  color?: string;
}

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

const GlitchIcon = ({ paths, circles = [], size = 24, color }: { paths: string[], circles?: { cx: number, cy: number, r: number }[], size?: number, color?: string }) => {
  const { colors } = useAppTheme();
  const iconColor = color || colors.text;
  return (
    <IconContainer size={size}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {paths.map((d, i) => (
          <Path key={`p-${i}`} d={d} stroke={iconColor} strokeWidth="2" strokeLinecap="round" />
        ))}
        {circles.map((c, i) => (
          <Circle key={`c-${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke={iconColor} strokeWidth="2" />
        ))}
      </Svg>
    </IconContainer>
  );
};

export const ArmsIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M16 36 Q24 24 32 36", "M20 20 L24 12"]}
    circles={[{ cx: 24, cy: 28, r: 3 }]}
  />
);

export const BackIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M20 10 L28 24 L20 38", "M28 10 L20 24 L28 38"]}
    circles={[{ cx: 24, cy: 24, r: 2 }]}
  />
);

export const ChestIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M18 16 Q24 24 30 16", "M18 32 Q24 24 30 32"]}
    circles={[{ cx: 24, cy: 24, r: 3 }]}
  />
);

export const UpperLegIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M20 10 L24 28 L30 38", "M28 20 L18 38"]}
    circles={[{ cx: 26, cy: 32, r: 3 }]}
  />
);

export const LowerLegIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M22 10 L20 24 L28 38", "M26 20 L22 32"]}
    circles={[{ cx: 24, cy: 36, r: 2 }]}
  />
);

export const ShouldersIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M14 18 Q24 8 34 18", "M14 30 Q24 40 34 30"]}
    circles={[{ cx: 24, cy: 24, r: 3 }]}
  />
);

export const AbsIconAlt = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M20 12 H28", "M20 18 H28", "M20 24 H28", "M20 30 H28", "M20 36 H28"]}
    circles={[]}
  />
);