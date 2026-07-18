// components/MobilePremium/index.ts
// Barrel for the MobilePremium kit. This is the canonical import site for
// premium mobile primitives: `import { MobileSurface, MobileHeader } from
// '@components/MobilePremium'`.

export { MobileAtmosphere } from './MobileAtmosphere';
export type { MobileAtmosphereProps, MobileAtmosphereSurface } from './MobileAtmosphere';

export { MobileSurface } from './MobileSurface';
export type { MobileSurfaceProps } from './MobileSurface';

export { MobileHeader } from './MobileHeader';
export type { MobileHeaderProps } from './MobileHeader';

export { MobileActionFooter } from './MobileActionFooter';
export type { MobileActionFooterProps } from './MobileActionFooter';

export { MobilePrimaryButton } from './MobilePrimaryButton';
export type { MobilePrimaryButtonProps } from './MobilePrimaryButton';

export { MobileInput } from './MobileInput';
export type { MobileInputProps } from './MobileInput';

export { MobileAlert } from './MobileAlert';
export type { MobileAlertProps, MobileAlertVariant } from './MobileAlert';

export { MobileSettingsRow } from './MobileSettingsRow';
export type { MobileSettingsRowProps } from './MobileSettingsRow';

export { MobileSectionEyebrow } from './MobileSectionEyebrow';
export type { MobileSectionEyebrowProps } from './MobileSectionEyebrow';

export { MobileStepper } from './MobileStepper';
export type { MobileStepperProps } from './MobileStepper';

export { MobileSelect } from './MobileSelect';
export type { MobileSelectProps, MobileSelectOption } from './MobileSelect';

export { MobileCheckboxItem } from './MobileCheckboxItem';
export type { MobileCheckboxItemProps } from './MobileCheckboxItem';

export { MobileSelectionList } from './MobileSelectionList';
export type {
  MobileSelectionListProps,
  MobileSelectionOption,
} from './MobileSelectionList';

export { MobileStepRail } from './MobileStepRail';
export type { MobileStepRailProps } from './MobileStepRail';

export { MobileDialog } from './MobileDialog';
export type { MobileDialogProps } from './MobileDialog';

// Motion re-export (alias of components/premium/shared).
export * from './MobileMotion';

// The showcase is exported separately so consumers can embed it.
export { default as showcase } from './showcase';
