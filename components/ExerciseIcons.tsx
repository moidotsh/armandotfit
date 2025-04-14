// Extended components/ExerciseIcons.tsx with abstract Unown/MissingNo-style icons

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
    paths={["M10 38 L20 10 L34 28", "M28 34 L22 20"]}
    circles={[{ cx: 14, cy: 18, r: 3 }]}
  />
);

export const BackIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M18 10 L24 24 L10 30", "M24 24 L36 38"]}
    circles={[{ cx: 30, cy: 16, r: 2 }]} 
  />
);

export const ChestIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M12 16 L28 22 L20 34", "M16 30 L34 26"]}
    circles={[{ cx: 18, cy: 22, r: 3 }]}
  />
);

export const UpperLegIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M24 10 L18 36 L34 28", "M20 20 L28 34"]}
    circles={[{ cx: 26, cy: 18, r: 3 }]}
  />
);

export const LowerLegIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M16 18 L24 30 L32 22", "M20 34 L30 38"]}
    circles={[{ cx: 20, cy: 24, r: 2 }]}
  />
);

export const ShouldersIcon = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M12 24 L30 12 L26 30", "M18 18 L36 36"]}
    circles={[{ cx: 28, cy: 18, r: 3 }]}
  />
);

export const AbsIconAlt = (props: IconProps) => (
  <GlitchIcon
    {...props}
    paths={["M18 14 L28 18", "M20 22 L32 26", "M22 30 L30 34"]}
    circles={[{ cx: 24, cy: 10, r: 2 }]}
  />
);
