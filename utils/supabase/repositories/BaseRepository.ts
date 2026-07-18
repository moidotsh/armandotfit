// utils/supabase/repositories/BaseRepository.ts
// Abstract base class implementing shared error-handling shape for
// concrete repositories. Consumers extend this with their entity-
// specific Supabase calls. The audit gate (S9) flags direct supabase
// usage outside this folder + AuthService.

import {
  type IRepository,
  type RepositoryResult,
  type FindOptions,
  RepositoryError,
  RepositoryErrorCode,
  err,
} from './types';
import { logger } from '../../logger';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO>
  implements IRepository<T, CreateDTO, UpdateDTO>
{
  abstract findAll(options?: FindOptions): Promise<RepositoryResult<T[]>>;
  abstract findById(id: string): Promise<RepositoryResult<T | null>>;
  abstract create(data: CreateDTO): Promise<RepositoryResult<T>>;
  abstract update(id: string, data: UpdateDTO): Promise<RepositoryResult<T>>;
  abstract delete(id: string): Promise<RepositoryResult<void>>;
  abstract deleteMany(ids: string[]): Promise<RepositoryResult<void>>;

  /**
   * Map an unknown error to a RepositoryResult. Logs the operation
   * context so failures are traceable without re-reading the call site.
   *
   * Concrete repositories call this in their catch blocks:
   *
   *   try { ... } catch (e) {
   *     return this.handleError('findAll', e);
   *   }
   */
  protected handleError(operation: string, error: unknown): RepositoryResult<never> {
    if (error instanceof RepositoryError) {
      return { success: false, error };
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('repository', `${operation} failed:`, message);
    return err(
      `${operation} failed: ${message}`,
      RepositoryErrorCode.UNKNOWN,
      error instanceof Error ? error : undefined,
    );
  }
}
