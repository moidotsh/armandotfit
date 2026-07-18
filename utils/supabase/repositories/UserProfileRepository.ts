// utils/supabase/repositories/UserProfileRepository.ts
// Repository for the profiles table (auth.users extension). One row per
// user, auto-created by the handle_new_user trigger on signup. This
// repository covers the post-signup update path (onboarding edits,
// settings-screen changes). The initial INSERT goes through the trigger,
// not this repository.

import { supabase } from '../client';
import { BaseRepository } from './BaseRepository';
import {
  type FindOptions,
  type IRepository,
  type RepositoryResult,
  RepositoryErrorCode,
  err,
  ok,
} from './types';
import type {
  Profile,
  ProfileUpdateDTO,
  PreferredSplit,
  WeeklyGoal,
} from '../../../shared/types';

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  preferred_split: PreferredSplit;
  weekly_goal: WeeklyGoal;
  created_at: string;
  updated_at: string;
}

/**
 * UserProfileRepository — concrete repository over the profiles table.
 * The generic CRUD shape (findAll / delete / deleteMany) is implemented
 * to satisfy IRepository, but the daily-driver surface is
 * findByUserId + update.
 */
export class UserProfileRepository
  extends BaseRepository<Profile, Partial<ProfileRow>, ProfileUpdateDTO>
  implements IRepository<Profile, Partial<ProfileRow>, ProfileUpdateDTO>
{
  private static TABLE = 'profiles';

  /** List all profiles. Admin-only in practice — RLS scopes to the caller. */
  async findAll(options?: FindOptions): Promise<RepositoryResult<Profile[]>> {
    try {
      let query = supabase.from(UserProfileRepository.TABLE).select('*');
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc',
        });
      }
      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset) query = query.range(
        options.offset,
        options.offset + (options.limit ?? 50) - 1,
      );

      const { data, error } = await query;
      if (error) throw error;
      return ok((data as ProfileRow[]).map(toProfile));
    } catch (e) {
      return this.handleError('findAll', e);
    }
  }

  /** Find a profile by its id (== auth.users.id). */
  async findById(id: string): Promise<RepositoryResult<Profile | null>> {
    try {
      const { data, error } = await supabase
        .from(UserProfileRepository.TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return ok(data ? toProfile(data as ProfileRow) : null);
    } catch (e) {
      return this.handleError('findById', e);
    }
  }

  /**
   * Find the current user's profile. Convenience wrapper around
   * findById(authSession.user.id). The hook layer will typically pass
   * the user id from the auth store.
   */
  async findByUserId(userId: string): Promise<RepositoryResult<Profile | null>> {
    return this.findById(userId);
  }

  /**
   * Create is a no-op for profiles — the handle_new_user trigger handles
   * INSERT on signup. Exposed to satisfy IRepository, but callers should
   * use update() instead.
   */
  async create(data: Partial<ProfileRow>): Promise<RepositoryResult<Profile>> {
    try {
      const { data: row, error } = await supabase
        .from(UserProfileRepository.TABLE)
        .insert(data)
        .select('*')
        .single();
      if (error) throw error;
      return ok(toProfile(row as ProfileRow));
    } catch (e) {
      return this.handleError('create', e);
    }
  }

  /**
   * Update the current user's profile. RLS scopes the write to
   * auth.uid() = id, so passing a foreign userId returns NOT_FOUND
   * rather than mutating another user's row.
   */
  async update(
    userId: string,
    data: ProfileUpdateDTO,
  ): Promise<RepositoryResult<Profile>> {
    try {
      const snake = toSnakeUpdate(data);
      const { data: row, error } = await supabase
        .from(UserProfileRepository.TABLE)
        .update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      if (!row) {
        return err(
          'Profile not found',
          RepositoryErrorCode.NOT_FOUND,
        );
      }
      return ok(toProfile(row as ProfileRow));
    } catch (e) {
      return this.handleError('update', e);
    }
  }

  /** Delete is owner-only via RLS. Used from the account-settings screen. */
  async delete(userId: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(UserProfileRepository.TABLE)
        .delete()
        .eq('id', userId);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('delete', e);
    }
  }

  async deleteMany(ids: string[]): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(UserProfileRepository.TABLE)
        .delete()
        .in('id', ids);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('deleteMany', e);
    }
  }
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    preferredSplit: row.preferred_split,
    weeklyGoal: row.weekly_goal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSnakeUpdate(dto: ProfileUpdateDTO): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (dto.firstName !== undefined) out.first_name = dto.firstName;
  if (dto.lastName !== undefined) out.last_name = dto.lastName;
  if (dto.displayName !== undefined) out.display_name = dto.displayName;
  if (dto.preferredSplit !== undefined) out.preferred_split = dto.preferredSplit;
  if (dto.weeklyGoal !== undefined) out.weekly_goal = dto.weeklyGoal;
  return out;
}

// Singleton export — the daily-driver access path.
export const userProfileRepository = new UserProfileRepository();
