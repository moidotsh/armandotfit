// utils/keyManagement.ts
// Encryption-key lifecycle. Vellum ships a minimal, domain-agnostic key
// manager: consumers derive a key (from a PIN, a password, a server-issued
// session secret — whatever their threat model dictates) and stash it via
// keyManager so repository code can encrypt/decrypt without re-deriving.
//
// This is the AsyncStorage gateway. Audit-security (SE2) treats this file
// as the canonical storage site for encryption keys — direct AsyncStorage
// calls elsewhere get blocked.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { isWeb, hasLocalStorage } from './platform';
import { logger } from './logger';
import { AppError, ErrorCode } from './errors';

const DATA_KEY_STORAGE = 'vellum.dataKey';
const SESSION_ONLY_FLAG = 'vellum.dataKey.sessionOnly';

let cachedKey: string | null = null;
let cachedSessionOnly: boolean = false;

function isSecureStoreAvailable(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function readKeyFromWebStorage(): Promise<string | null> {
  if (!isWeb || !hasLocalStorage()) return null;
  try {
    const sessionOnly = window.sessionStorage.getItem(SESSION_ONLY_FLAG) === '1';
    const storage = sessionOnly ? window.sessionStorage : window.localStorage;
    cachedSessionOnly = sessionOnly;
    return storage.getItem(DATA_KEY_STORAGE);
  } catch (error) {
    logger.warn('data', 'Failed to read data key from web storage', error);
    return null;
  }
}

async function writeKeyToWebStorage(key: string, sessionOnly: boolean): Promise<void> {
  if (!isWeb || !hasLocalStorage()) return;
  try {
    const storage = sessionOnly ? window.sessionStorage : window.localStorage;
    storage.setItem(DATA_KEY_STORAGE, key);
    window.sessionStorage.setItem(SESSION_ONLY_FLAG, sessionOnly ? '1' : '0');
    cachedSessionOnly = sessionOnly;
  } catch (error) {
    logger.error('data', 'Failed to persist data key to web storage', error);
    throw new AppError('Unable to persist encryption key', ErrorCode.STORAGE_ERROR, { cause: error as Error });
  }
}

async function clearWebStorageKey(): Promise<void> {
  if (!isWeb || !hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(DATA_KEY_STORAGE);
    window.sessionStorage.removeItem(DATA_KEY_STORAGE);
    window.sessionStorage.removeItem(SESSION_ONLY_FLAG);
  } catch (error) {
    logger.warn('data', 'Failed to clear data key from web storage', error);
  }
}

export async function setDataKey(key: string, sessionOnly = false): Promise<void> {
  cachedKey = key;
  if (isSecureStoreAvailable()) {
    try {
      await SecureStore.setItemAsync(DATA_KEY_STORAGE, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      logger.error('data', 'Failed to persist data key to SecureStore', error);
      throw new AppError('Unable to persist encryption key', ErrorCode.STORAGE_ERROR, { cause: error as Error });
    }
  } else {
    await writeKeyToWebStorage(key, sessionOnly);
  }
}

export async function getDataKey(): Promise<string | null> {
  if (cachedKey !== null) return cachedKey;
  if (isSecureStoreAvailable()) {
    try {
      const key = await SecureStore.getItemAsync(DATA_KEY_STORAGE);
      cachedKey = key;
      return key;
    } catch (error) {
      logger.warn('data', 'Failed to read data key from SecureStore', error);
      return null;
    }
  }
  return readKeyFromWebStorage();
}

export async function clearDataKey(): Promise<void> {
  cachedKey = null;
  cachedSessionOnly = false;
  if (isSecureStoreAvailable()) {
    try {
      await SecureStore.deleteItemAsync(DATA_KEY_STORAGE);
    } catch (error) {
      logger.warn('data', 'Failed to delete data key from SecureStore', error);
    }
  }
  await clearWebStorageKey();
}

export function isSessionOnlyKey(): boolean {
  return cachedSessionOnly;
}

export function hasCachedKey(): boolean {
  return cachedKey !== null;
}

/**
 * Force a re-read on next access. Used by the auth flow after a logout/login
 * cycle — without this, a stale cached key from the prior session leaks.
 */
export function invalidateCachedKey(): void {
  cachedKey = null;
  cachedSessionOnly = false;
}
