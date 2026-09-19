// utils/supabase/repositories/MusicPickRepository.ts
// Repository for the music_picks table (the owner-sanctioned sixth
// table — raw picks, latest first; the recency list itself is the
// replay playlist). RLS scopes every row to the caller.

import { supabase } from '../client';
import { BaseRepository } from './BaseRepository';
import {
  type IRepository,
  type RepositoryResult,
} from './types';
import { ok } from './types';
import type { ID } from '../../../shared/types';
import type { MusicPick } from '../../../shared/types/music';

interface MusicPickRow {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  artist: string | null;
  picked_at: string;
}

export interface MusicPickCreateDTO {
  userId: ID;
  videoId: string;
  title: string;
  artist: string | null;
}

function toPick(row: MusicPickRow): MusicPick {
  return {
    id: row.id,
    videoId: row.video_id,
    title: row.title,
    artist: row.artist,
    pickedAt: row.picked_at,
  };
}

export class MusicPickRepository
  extends BaseRepository<MusicPick, MusicPickCreateDTO, never>
  implements IRepository<MusicPick, MusicPickCreateDTO, never>
{
  private static TABLE = 'music_picks';

  /** The caller's picks, latest first (the replay playlist). */
  async findRecent(userId: ID, limit = 20): Promise<RepositoryResult<MusicPick[]>> {
    try {
      const { data, error } = await supabase
        .from(MusicPickRepository.TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('picked_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ok((data as MusicPickRow[]).map(toPick));
    } catch (e) {
      return this.handleError('findRecent', e);
    }
  }

  async create(dto: MusicPickCreateDTO): Promise<RepositoryResult<MusicPick>> {
    try {
      const { data, error } = await supabase
        .from(MusicPickRepository.TABLE)
        .insert({
          user_id: dto.userId,
          video_id: dto.videoId,
          title: dto.title,
          artist: dto.artist,
        })
        .select('*')
        .single();
      if (error) throw error;
      return ok(toPick(data as MusicPickRow));
    } catch (e) {
      return this.handleError('create', e);
    }
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(MusicPickRepository.TABLE)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return ok(undefined);
    } catch (e) {
      return this.handleError('delete', e);
    }
  }

  // The pick list is never read by id, updated in place, or bulk
  // deleted; the surface is recent-list + create + delete.

  async findAll(): Promise<RepositoryResult<MusicPick[]>> {
    return this.findRecent('', 0);
  }
  async findById(): Promise<RepositoryResult<MusicPick | null>> {
    return ok(null);
  }
  async update(): Promise<RepositoryResult<MusicPick>> {
    return this.handleError('update', new Error('not supported'));
  }
  async deleteMany(): Promise<RepositoryResult<void>> {
    return ok(undefined);
  }
}

// Singleton — the daily-driver access path.
export const musicPickRepository = new MusicPickRepository();
