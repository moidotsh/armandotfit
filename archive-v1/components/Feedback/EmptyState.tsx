// components/Feedback/EmptyState.tsx - Enhanced empty state component
import React from 'react';
import { Button, Text, YStack } from 'tamagui';
import { useAppTheme } from '../ThemeProvider';

interface EmptyStateProps {
  /**
   * The message to display
   */
  message: string;
  
  /**
   * Optional action button text
   */
  actionText?: string;
  
  /**
   * Optional action handler
   */
  onAction?: () => void;
  
  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Whether to show inside a card
   */
  useCard?: boolean;
  
  /**
   * Custom illustration or graphic
   */
  illustration?: React.ReactNode;
}

/**
 * A component to show when there's no data to display
 */
export function EmptyState({
  message,
  actionText,
  onAction,
  icon,
  useCard = false,
  illustration
}: EmptyStateProps) {
  const { colors, spacing, fontSize, borderRadius, getShadow } = useAppTheme();
  
  const content = (
    <YStack
      alignItems="center"
      justifyContent="center"
      padding={spacing.large}
      space={spacing.medium}
    >
      {illustration && <YStack marginBottom={spacing.medium}>{illustration}</YStack>}
      
      {icon && <YStack marginBottom={spacing.small}>{icon}</YStack>}
      
      <Text
        color={colors.textMuted}
        fontSize={fontSize.medium}
        textAlign="center"
        maxWidth={280}
      >
        {message}
      </Text>
      
      {actionText && onAction && (
        <Button
          backgroundColor={colors.buttonBackground}
          color={colors.buttonText}
          marginTop={spacing.medium}
          onPress={onAction}
          borderRadius={borderRadius.large}
          paddingHorizontal={spacing.large}
          height={48}
          fontWeight="600"
          style={getShadow('medium')}
        >
          {actionText}
        </Button>
      )}
    </YStack>
  );
  
  // If useCard is true, wrap in a card container
  if (useCard) {
    return (
      <YStack
        backgroundColor={colors.card}
        borderRadius={borderRadius.medium}
        overflow="hidden"
        marginVertical={spacing.medium}
        style={getShadow('medium')}
      >
        {content}
      </YStack>
    );
  }
  
  return content;
}

export default EmptyState;