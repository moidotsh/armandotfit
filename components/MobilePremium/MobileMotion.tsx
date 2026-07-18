// components/MobilePremium/MobileMotion.tsx
// Re-export of the shared motion primitives under the MobilePremium namespace.
// Kept for backwards compatibility — qep-tracker consumers that imported
// motion from `components/MobilePremium/MobileMotion` can drop their import
// path in unchanged. New consumers should import from `components/premium/shared`
// directly (it's the canonical source).

export {
  FadeIn,
  Shake,
  Crossfade,
  usePressedStyle,
  useFocusRing,
  pressStyle,
  RESPOND_PRESSED,
  prefersReducedMotionSync,
  useReducedMotion,
  Pressable,
} from '../premium/shared';

export type {
  FadeInProps,
  ShakeProps,
  CrossfadeProps,
  UseFocusRingOptions,
} from '../premium/shared';
