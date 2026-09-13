import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import { cancelDailyReminder } from '@/lib/reminders';

const USER_DRAFT_PREFIX = 'grow365.journal-draft.';
const USER_METADATA_PREFIX = 'grow365.devotional-metadata.';

/**
 * Remove only data scoped to this account. This is used before a session is
 * allowed to switch users so drafts and devotional metadata cannot leak.
 */
export async function cleanupUserDeviceData(
  userId: string | undefined,
  queryClient: QueryClient,
): Promise<void> {
  // Cleanup must never strand a user in a session while signing out or after
  // account deletion. Query data is always cleared; device APIs can be absent
  // or unavailable during a native teardown.
  try {
    await cancelDailyReminder();
  } catch {
    // Continue with local storage and query cleanup.
  }
  try {
    if (userId) {
      const keys = await AsyncStorage.getAllKeys();
      const userPrefix = `${USER_DRAFT_PREFIX}${userId}.`;
      const metadataPrefix = `${USER_METADATA_PREFIX}${userId}.`;
      const userKeys = keys.filter(
        (key) => key.startsWith(userPrefix) || key.startsWith(metadataPrefix),
      );
      if (userKeys.length) await AsyncStorage.multiRemove(userKeys);
    }
  } catch {
    // Query cache clearing below still prevents stale server data from showing.
  }
  queryClient.clear();
}