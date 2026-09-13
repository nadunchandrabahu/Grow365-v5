import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL');
}

if (!supabasePublishableKey) {
  throw new Error(
    'Missing required environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY',
  );
}

const CHUNK_SIZE = 1800;

async function removeNativeValue(key: string): Promise<void> {
  const countValue = await SecureStore.getItemAsync(`${key}.__count`);
  const count = Number(countValue ?? '0');
  await Promise.all([
    SecureStore.deleteItemAsync(key),
    SecureStore.deleteItemAsync(`${key}.__count`),
    ...Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, index) =>
      SecureStore.deleteItemAsync(`${key}.${index}`),
    ),
  ]);
}

const secureStorage: SupportedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    const countValue = await SecureStore.getItemAsync(`${key}.__count`);
    const count = Number(countValue ?? '0');
    if (!count) return SecureStore.getItemAsync(key);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.getItemAsync(`${key}.${index}`),
      ),
    );
    if (chunks.some((chunk) => chunk === null)) return null;
    return chunks.join('');
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await removeNativeValue(key);
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) ?? [];
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(`${key}.${index}`, chunk, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
      ),
    );
    await SecureStore.setItemAsync(`${key}.__count`, String(chunks.length), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await removeNativeValue(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}