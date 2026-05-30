import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo/dist/cache';

/**
 * Clerk token cache backed by the device secure storage (Keychain/Keystore).
 * On web, Clerk uses its own browser storage, so this is a no-op there.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    if (Platform.OS === 'web') return null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Non-fatal: a failed cache write just means re-auth on next cold start.
    }
  },
};
