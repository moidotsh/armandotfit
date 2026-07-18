// components/NoHighlightView.tsx
import { styled, YStack, YStackProps } from 'tamagui';

export const NoHighlightView = styled(YStack, {
  name: 'NoHighlightView',
  // Add custom CSS properties in style prop
  style: {
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    userSelect: 'none',
    outline: 'none'
  }
})