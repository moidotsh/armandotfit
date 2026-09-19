// hooks/useWeightUnit.ts
//
// The weight DISPLAY unit, read from the profile (users.weight_unit)
// with a kg fallback while the row loads or is unreachable — the
// logger, ledgers, receipts, and the wall all ask this one hook, so
// the unit is consistent everywhere and storage stays kg (gauge-
// thesis §4; utils/weight.ts owns the arithmetic).

import { useProfile } from './queries';
import type { WeightUnit } from '../shared/types';

export function useWeightUnit(): WeightUnit {
  const profileQuery = useProfile();
  return profileQuery.data?.weightUnit ?? 'kg';
}
