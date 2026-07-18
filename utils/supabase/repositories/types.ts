// utils/supabase/repositories/types.ts
// Repository pattern core types. Domain-agnostic — consumers define
// their own entity types (T) and DTOs (CreateDTO, UpdateDTO) and pass
// them through `IRepository<T, CreateDTO, UpdateDTO>`. The audit gate
// (D5) flags any repository method that doesn't return `RepositoryResult<T>`.

import type { z } from 'zod';

/**
 * Result type for repository operations. Discriminated union on
 * `success` — callers must narrow before reading `data` or `error`.
 */
export type RepositoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: RepositoryError };

/**
 * Error class for repository failures. Carries a `code` for switch-
 * based handling and an optional cause for chaining.
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: RepositoryErrorCode,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export enum RepositoryErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Query options for `findAll` operations.
 */
export interface FindOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Base repository interface. Consumers define a concrete repository
 * (e.g. `WorkoutRepository`) that implements this for their entity
 * type. The audit gate (S9) flags any direct `supabase.*` call
 * outside this folder.
 */
export interface IRepository<T, CreateDTO, UpdateDTO> {
  findAll(options?: FindOptions): Promise<RepositoryResult<T[]>>;
  findById(id: string): Promise<RepositoryResult<T | null>>;
  create(data: CreateDTO): Promise<RepositoryResult<T>>;
  update(id: string, data: UpdateDTO): Promise<RepositoryResult<T>>;
  delete(id: string): Promise<RepositoryResult<void>>;
  deleteMany(ids: string[]): Promise<RepositoryResult<void>>;
}

/**
 * Helper to create a successful result. Mirrors qep-tracker's `ok`.
 */
export function ok<T>(data: T): RepositoryResult<T> {
  return { success: true, data };
}

/**
 * Helper to create an error result. Mirrors qep-tracker's `err`.
 */
export function err<T = never>(
  message: string,
  code: RepositoryErrorCode,
  cause?: Error,
): RepositoryResult<T> {
  return {
    success: false,
    error: new RepositoryError(message, code, cause),
  };
}

/**
 * Validate data against a Zod schema and return a RepositoryResult.
 * Consumers should call this inside `create` / `update` methods to
 * enforce the wire contract before persisting.
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): RepositoryResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return ok(result.data);
  }
  return err(
    result.error.issues.map((e) => e.message).join(', '),
    RepositoryErrorCode.VALIDATION_ERROR,
  );
}
