// utils/supabase/repositories/BodyWeightRepository.ts
//
// THE BODY WEIGHT REPOSITORY — the ninth table's data layer. Log a
// weigh-in, read the history, read the latest. The trend computes at
// read (no aggregates stored).

import { supabase } from '../client';
import { ok, err, RepositoryErrorCode, type RepositoryResult } from './types';
import { logger } from '../../logger';

export interface BodyWeightEntry {
  id: string;
  weightKg: number;
  recordedAt: string;
  note: string | null;
}

function fail(op: string, e: unknown): RepositoryResult<never> {
  const message = e instanceof Error ? e.message : String(e);
  logger.warn('data', `BodyWeightRepository.${op}: ${message}`);
  return err(`Body weight: ${message}`, RepositoryErrorCode.UNKNOWN);
}

export async function logWeight(
  weightKg: number,
  note?: string,
): Promise<RepositoryResult<BodyWeightEntry>> {
  try {
    const { data: me } = await supabase.from('users').select('id').single();
    if (!me) return err('Not signed in', RepositoryErrorCode.UNAUTHORIZED);

    const { data, error } = await supabase
      .from('body_weight_log')
      .insert({ user_id: me.id, weight_kg: weightKg, note: note ?? null })
      .select('id, weight_kg, recorded_at, note')
      .single();
    if (error) throw error;
    return ok({
      id: data.id,
      weightKg: Number(data.weight_kg),
      recordedAt: data.recorded_at,
      note: data.note,
    });
  } catch (e) {
    return fail('logWeight', e);
  }
}

export async function getWeightHistory(
  limit = 30,
): Promise<RepositoryResult<BodyWeightEntry[]>> {
  try {
    const { data, error } = await supabase
      .from('body_weight_log')
      .select('id, weight_kg, recorded_at, note')
      .order('recorded_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ok(
      (data ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        weightKg: Number(d.weight_kg),
        recordedAt: d.recorded_at as string,
        note: (d.note as string | null) ?? null,
      })),
    );
  } catch (e) {
    return fail('getWeightHistory', e);
  }
}

export async function getLatestWeight(): Promise<RepositoryResult<BodyWeightEntry | null>> {
  try {
    const { data, error } = await supabase
      .from('body_weight_log')
      .select('id, weight_kg, recorded_at, note')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return ok(null);
    return ok({
      id: data.id,
      weightKg: Number(data.weight_kg),
      recordedAt: data.recorded_at,
      note: data.note,
    });
  } catch (e) {
    return fail('getLatestWeight', e);
  }
}

export async function deleteWeight(
  id: string,
): Promise<RepositoryResult<null>> {
  try {
    const { error } = await supabase.from('body_weight_log').delete().eq('id', id);
    if (error) throw error;
    return ok(null);
  } catch (e) {
    return fail('deleteWeight', e);
  }
}
