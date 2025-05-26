// components/UI/Card/StatCard.tsx - Specialized card for displaying statistics
import React from 'react';
import { Card, XStack, YStack, Text } from 'tamagui';
import { useAppTheme } from '../../ThemeProvider';

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface StatCardProps {
  stats: StatItem[];
  title?: string;
  columns?: 2 | 3 | 4;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  marginTop?: number | string;
  marginBottom?: number | string;
}

/**
 * Specialized card for displaying statistics in a clean, organized format
 */
export function StatCard({
  stats,
  title,
  columns = 3,
  size = 'medium',
  loading = false,
  marginTop,
  marginBottom
}: StatCardProps) {
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();
  
  const getFontSizes = () => {
    switch (size) {
      case 'small':
        return { label: fontSize.xs, value: fontSize.small };
      case 'large':
        return { label: fontSize.medium, value: fontSize.large };
      default:
        return { label: fontSize.small, value: fontSize.medium };
    }
  };
  
  const { label: labelSize, value: valueSize } = getFontSizes();
  
  return (
    <Card
      backgroundColor={colors.card}
      padding={spacing.large}
      borderRadius={borderRadius.medium}
      marginTop={marginTop}
      marginBottom={marginBottom}
      elevate
      style={getShadow('medium')}
    >
      {title && (
        <Text
          color={colors.text}
          fontSize={fontSize.medium}
          fontWeight="600"
          marginBottom={spacing.medium}
        >
          {title}
        </Text>
      )}
      
      <XStack justifyContent="space-between" width="100%">
        {stats.map((stat, index) => (
          <YStack key={`stat-${index}-${stat.value}`} alignItems="center" flex={1}>
            <Text
              color={colors.textSecondary}
              fontSize={labelSize}
              fontWeight="300"
              style={{ letterSpacing: 0.5 }}
            >
              {stat.label}
            </Text>
            
            <XStack alignItems="center" space={4}>
              {loading ? (
                <Text color={colors.text} fontSize={valueSize} fontWeight="600">
                  ...
                </Text>
              ) : (
                <>
                  {stat.icon && <YStack marginRight={spacing.xs}>{stat.icon}</YStack>}
                  
                  <Text
                    color={stat.color || colors.text}
                    fontSize={valueSize}
                    fontWeight="600"
                  >
                    {stat.value}
                  </Text>
                  
                  {stat.unit && (
                    <Text
                      color={colors.textMuted}
                      fontSize={valueSize}
                      fontWeight="500"
                    >
                      {stat.unit}
                    </Text>
                  )}
                </>
              )}
            </XStack>
          </YStack>
        ))}
      </XStack>
    </Card>
  );
}

export default StatCard;