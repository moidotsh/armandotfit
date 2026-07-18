// utils/cryptoPolyfill.ts
// Crypto polyfill for React Native. CryptoJS + the encryption helpers
// in utils/encryption.ts require `crypto.getRandomValues`, which isn't
// available in the React Native runtime by default. This polyfill wires
// it via expo-crypto on native. Web already has `crypto` — no-op there.
//
// Imported as the first line of app/_layout.tsx so the polyfill lands
// before any consumer imports encryption code.

import * as ExpoCrypto from 'expo-crypto';
import { isNative } from './platform';

if (isNative) {
  const getRandomBytesSync = (length: number): Uint8Array => {
    return ExpoCrypto.getRandomBytes(length);
  };

  const createCryptoPolyfill = () => ({
    getRandomValues: <T extends ArrayBufferView>(array: T): T => {
      const buffer = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      const randomBytes = getRandomBytesSync(buffer.length);
      buffer.set(randomBytes);
      return array;
    },
    subtle: {
      digest: async (algorithm: string, data: BufferSource) => {
        const algoMap: Record<string, string> = {
          'SHA-1': 'SHA1',
          'SHA-256': 'SHA256',
          'SHA-384': 'SHA384',
          'SHA-512': 'SHA512',
        };
        const expoAlgo = algoMap[algorithm] || 'SHA256';
        return ExpoCrypto.digest(expoAlgo as ExpoCrypto.CryptoDigestAlgorithm, data);
      },
    } as unknown as SubtleCrypto,
    randomUUID: () => ExpoCrypto.randomUUID(),
  });

  const polyfill = createCryptoPolyfill();
  // @ts-expect-error — `crypto` isn't in the RN type but is at runtime after this.
  globalThis.crypto = polyfill;
}

export {};
