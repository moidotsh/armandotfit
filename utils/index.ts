// utils/index.ts
// Barrel export for utilities. Audit-barrels treats this as the canonical
// entry for cross-folder imports (`@utils/...`). Same-folder imports go to
// the relative source (`./errors`).

export * from './platform';
export * from './logger';
export {
  KG_PER_LB,
  isWeightUnit,
  toDisplayWeight,
  fromDisplayWeight,
  roundDisplayWeight,
  weightStep,
  weightUnitLabel,
  formatWeight,
  formatVolumeWeight,
} from './weight';
export type { WeightUnit } from './weight';
export * from './errors';
export * from './api-client';
export * from './validation';
export * from './uuid';
export * from './haptics';
export * from './facts';
export * from './domMeasurement';
export * from './debug';
export * from './toastEventEmitter';
export * from './crossPlatformAlert';
export * from './cache';
export * from './retry';
export * from './date-helpers';
export * from './activityGrid';
export * from './buildAiPayload';
export * from './routeTransition';
export * from './i18n';
