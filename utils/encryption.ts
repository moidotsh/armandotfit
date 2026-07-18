// utils/encryption.ts
// Generic AES encrypt/decrypt wrapper around crypto-js. Vellum's version is
// domain-agnostic — it takes a key, not a PIN. Consumers that need
// PIN-derived keys (qep-tracker parity) compose this with a PBKDF2 step
// in their own code; vellum doesn't ship that policy.

import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { logger } from './logger';
import { AppError, ErrorCode } from './errors';

export const ENCRYPTION_PREFIX = 'VEL:';

export const encryptDataWithKey = <T>(data: T, derivedKey: string): string => {
  try {
    if (!derivedKey) {
      throw new AppError('Derived key is required for encryption', ErrorCode.VALIDATION_ERROR);
    }
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encrypted = AES.encrypt(dataString, derivedKey).toString();
    return ENCRYPTION_PREFIX + encrypted;
  } catch (error) {
    logger.error('data', 'Key-based encryption failed', error);
    throw new AppError('Failed to encrypt data with key', ErrorCode.ENCRYPTION_ERROR);
  }
};

export const decryptDataWithKey = <T = unknown>(encryptedData: string, derivedKey: string): T => {
  try {
    if (!encryptedData) {
      return {} as T;
    }
    if (!derivedKey) {
      throw new AppError('Derived key is required for decryption', ErrorCode.VALIDATION_ERROR);
    }
    if (!encryptedData.startsWith(ENCRYPTION_PREFIX)) {
      throw new AppError(
        `Invalid encrypted data format (expected ${ENCRYPTION_PREFIX} prefix)`,
        ErrorCode.DATA_CORRUPTION,
      );
    }
    const encrypted = encryptedData.substring(ENCRYPTION_PREFIX.length);
    const decrypted = AES.decrypt(encrypted, derivedKey);
    const decryptedString = decrypted.toString(Utf8);
    try {
      return JSON.parse(decryptedString) as T;
    } catch {
      return decryptedString as unknown as T;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('data', 'Key-based decryption failed', error);
    throw new AppError('Failed to decrypt data with key', ErrorCode.ENCRYPTION_ERROR);
  }
};

/**
 * Generate a random anonymous ID in XXX-XXX-XXX format. Uses crypto.randomUUID
 * for uniform keyspace. Useful for any consumer that needs a stable but
 * non-PII identifier (anonymous analytics, device pairing, etc.).
 */
export const generateAnonymousId = (): string => {
  try {
    const hex = crypto.randomUUID().replace(/[^0-9a-f]/gi, '').slice(0, 9);
    const part1 = hex.slice(0, 3);
    const part2 = hex.slice(3, 6);
    const part3 = hex.slice(6, 9);
    return `${part1}-${part2}-${part3}`;
  } catch (error) {
    logger.error('data', 'Failed to generate anonymous ID', error);
    throw new AppError('Failed to generate anonymous ID', ErrorCode.UNKNOWN);
  }
};

export default {
  encryptDataWithKey,
  decryptDataWithKey,
  generateAnonymousId,
  ENCRYPTION_PREFIX,
};
