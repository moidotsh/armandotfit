// utils/supabase/repositories/PartnerRepository.ts
//
// THE TRAINING PARTNER REPOSITORY — the eighth table's data layer.
// Connect by partner code (mutual), disconnect, and read-through for
// the partner's recent sessions (the couple page's live section).

import { supabase } from '../client';
import { ok, err, RepositoryErrorCode, type RepositoryResult } from './types';
import { logger } from '../../logger';

export interface TrainingPartner {
  partnerId: string;
  partnerDisplayName: string;
  connectedAt: string;
}

export interface PartnerSessionSummary {
  sessionId: string;
  startedAt: string;
  splitDay: number | null;
  exerciseCount: number;
  totalSets: number;
  tonnageKg: number;
}

function fail(op: string, e: unknown): RepositoryResult<never> {
  const message = e instanceof Error ? e.message : String(e);
  logger.warn('general', `PartnerRepository.${op}: ${message}`);
  return err(`Partner: ${message}`, RepositoryErrorCode.UNKNOWN);
}

/** Look up a user by their partner code (read-only, RLS-public). */
export async function findByPartnerCode(
  code: string,
): Promise<RepositoryResult<{ id: string; displayName: string }>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('partner_code', code.trim())
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return err('No lifter found with that partner code', RepositoryErrorCode.NOT_FOUND);
    }
    return ok({ id: data.id, displayName: data.display_name ?? '' });
  } catch (e) {
    return fail('findByPartnerCode', e);
  }
}

/** Connect to a partner — writes both directions (mutual). */
export async function connectPartner(
  partnerCode: string,
): Promise<RepositoryResult<TrainingPartner>> {
  try {
    const lookup = await findByPartnerCode(partnerCode);
    if (!lookup.success) return lookup;
    const partner = lookup.data;

    const { data: me, error: meErr } = await supabase
      .from('users')
      .select('id, display_name')
      .single();
    if (meErr) throw meErr;
    if (!me) return err('Not signed in', RepositoryErrorCode.UNKNOWN);

    await supabase.from('training_partners').delete().eq('user_id', me.id);
    await supabase.from('training_partners').delete().eq('partner_id', me.id);

    const { error: insErr } = await supabase.from('training_partners').insert([
      {
        user_id: me.id,
        partner_id: partner.id,
        partner_display_name: partner.displayName,
      },
      {
        user_id: partner.id,
        partner_id: me.id,
        partner_display_name: me.display_name ?? '',
      },
    ]);
    if (insErr) throw insErr;

    return ok({
      partnerId: partner.id,
      partnerDisplayName: partner.displayName,
      connectedAt: new Date().toISOString(),
    });
  } catch (e) {
    return fail('connectPartner', e);
  }
}

/** Disconnect — removes both directions. */
export async function disconnectPartner(): Promise<RepositoryResult<null>> {
  try {
    const { data: me } = await supabase.from('users').select('id').single();
    if (!me) return err('Not signed in', RepositoryErrorCode.UNKNOWN);

    const { error } = await supabase
      .from('training_partners')
      .delete()
      .or(`user_id.eq.${me.id},partner_id.eq.${me.id}`);
    if (error) throw error;
    return ok(null);
  } catch (e) {
    return fail('disconnectPartner', e);
  }
}

/** Get the current partner (if connected). */
export async function getPartner(): Promise<RepositoryResult<TrainingPartner | null>> {
  try {
    const { data, error } = await supabase
      .from('training_partners')
      .select('partner_id, partner_display_name, created_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return ok(null);
    return ok({
      partnerId: data.partner_id,
      partnerDisplayName: data.partner_display_name,
      connectedAt: data.created_at,
    });
  } catch (e) {
    return fail('getPartner', e);
  }
}

/** Get the signed-in user's own partner code. */
export async function getMyPartnerCode(): Promise<RepositoryResult<string>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('partner_code')
      .single();
    if (error) throw error;
    return ok(data?.partner_code ?? '');
  } catch (e) {
    return fail('getMyPartnerCode', e);
  }
}

/** The partner's recent sessions (read-through via RLS). */
export async function getPartnerRecentSessions(
  limit = 5,
): Promise<RepositoryResult<PartnerSessionSummary[]>> {
  try {
    const { data: partner, error: pErr } = await supabase
      .from('training_partners')
      .select('partner_id')
      .maybeSingle();
    if (pErr) throw pErr;
    if (!partner) return ok([]);

    const { data, error } = await supabase
      .from('sessions')
      .select(
        `
        id,
        started_at,
        split_day,
        logged_exercises (
          id,
          logged_sets (weight, reps)
        )
      `,
      )
      .eq('user_id', partner.partner_id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const summaries: PartnerSessionSummary[] = (data ?? []).map(
      (s: Record<string, unknown>) => {
        const exercises = (s.logged_exercises ?? []) as Record<string, unknown>[];
        let totalSets = 0;
        let tonnageKg = 0;
        for (const ex of exercises) {
          const sets = (ex.logged_sets ?? []) as { weight: number; reps: number }[];
          totalSets += sets.length;
          tonnageKg += sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        }
        return {
          sessionId: s.id as string,
          startedAt: s.started_at as string,
          splitDay: (s.split_day as number | null) ?? null,
          exerciseCount: exercises.length,
          totalSets,
          tonnageKg: Math.round(tonnageKg),
        };
      },
    );

    return ok(summaries);
  } catch (e) {
    return fail('getPartnerRecentSessions', e);
  }
}
