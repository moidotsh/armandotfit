// hooks/queries/useBodyweightHistory.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query';
import { getWeightHistory } from '../../utils/supabase/repositories';

export function useBodyweightHistory(days = 90) {
  return useQuery({
    queryKey: queryKeys.bodyWeight.history(),
    queryFn: async () => {
      const r = await getWeightHistory(days);
      if (!r.success) throw r.error;
      return r.data;
    },
  });
}
