// utils/supabase/repositories/UserProfileRepository.ts
// Repository for the users table (one row per authenticated lifter,
// auto-created by the handle_new_user trigger on signup). Covers the
// settings-screen update path; the initial INSERT goes through the
// trigger, not this repository.

import { supabase } from '../client';
import { BaseRepository } from './BaseRepository';
import {
  type FindOptions,
  type IRepository,
  type RepositoryResult,
  RepositoryError,
  RepositoryErrorCode,
  ok,
} from './types';
import type { Profile, ProfileUpdateDTO, WeightUnit } from '../../../shared/types';
import { isWeightUnit } from '../../../utils/weight';

interface UserRow {
  id: string;
  display_name: string;
  weight_unit: string;
  rest_days: number[] | null;
  created_at: string;
}

export class UserProfileRepository
  extends BaseRepository<Profile, UserRow, ProfileUpdateDTO>
  implements IRepository<Profile, UserRow, ProfileUpdateDTO>
{
  private static TABLE = 'users';

  /** List users. RLS scopes to the caller — effectively self-only. */
  async findAll(options?: FindOptions): Promise<RepositoryResult<Profile[]>> {
    try {
      let query = supabase.from(UserProfileRepository.TABLE).select('*');
      if (options?.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) throw error;
      return ok((data as UserRow[]).map(toProfile));
    } catch (e) {
      return this.handleError('findAll', e);
    }
  }

  /** Find a user by id (== auth.users.id). */
  async findByUserId(id: string): Promise<RepositoryResult<Profile | null>> {
    try {
      const { data, error } = await supabase
        .from(UserProfileRepository.TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toProfile(data as UserRow) : null);
    } catch (e) {
      return this.handleError('findByUserId', e);
    }
  }

  /** Update display name / rest days. */
  async update(
    id: string,
    dto: ProfileUpdateDTO,
  ): Promise<RepositoryResult<Profile>> {
    try {
      const snake: Record<string, unknown> = {};
      if (dto.displayName !== undefined) snake.display_name = dto.displayName;
      if (dto.restDays !== undefined) snake.rest_days = dto.restDays;
      if (dto.weightUnit !== undefined) snake.weight_unit = dto.weightUnit;
      if (Object.keys(snake).length === 0) {
        const existing = await this.findByUserId(id);
        if (!existing.success) return existing;
        if (!existing.data) return errNotFound();
        return ok(existing.data);
      }
      const { data, error } = await supabase
        .from(UserProfileRepository.TABLE)
        .update(snake)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return ok(toProfile(data as UserRow));
    } catch (e) {
      return this.handleError('update', e);
    }
  }

  /** Find by id — same as findByUserId (id == auth.users.id). */
  async findById(id: string): Promise<RepositoryResult<Profile | null>> {
    return this.findByUserId(id);
  }

  /**
   * No create surface — the users row is created by the handle_new_user
   * trigger on signup, never by the client.
   */
  async create(): Promise<RepositoryResult<Profile>> {
    return errNotFound();
  }

  async deleteMany(): Promise<RepositoryResult<void>> {
    // Users are deleted via auth (CASCADE), not through this repository.
    return ok(undefined);
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(UserProfileRepository.TABLE)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('delete', e);
    }
  }
}

function errNotFound(): RepositoryResult<Profile> {
  const error = new RepositoryError(
    'User not found',
    RepositoryErrorCode.NOT_FOUND,
  );
  return { success: false, error };
}

/** The stored weight_unit string → the typed unit ('kg' when absent
 * or unrecognized — the storage default). */
function toWeightUnit(v: string | null | undefined): WeightUnit {
  return isWeightUnit(v) ? v : 'kg';
}

function toProfile(row: UserRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    restDays: row.rest_days ?? [],
    weightUnit: toWeightUnit(row.weight_unit),
    createdAt: row.created_at,
  };
}

// Singleton — the daily-driver access path.
export const userProfileRepository = new UserProfileRepository();
