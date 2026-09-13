import { Linking, Platform } from 'react-native';

export type StorePlatform = 'ios' | 'android';

function normalizedStorePlatform(platform: string | null | undefined): StorePlatform | null {
  if (platform === 'ios' || platform === 'app_store' || platform === 'apple') return 'ios';
  if (platform === 'android' || platform === 'play_store' || platform === 'google_play') return 'android';
  return null;
}

export function canManageSubscription(
  platform: string | null | undefined,
  grantedReason: string | null | undefined,
): boolean {
  return Platform.OS !== 'web' && Boolean(normalizedStorePlatform(platform) && !grantedReason);
}

export function manageableStorePlatform(
  platform: string | null | undefined,
  grantedReason: string | null | undefined,
): StorePlatform | null {
  return Platform.OS !== 'web' && !grantedReason ? normalizedStorePlatform(platform) : null;
}

export function subscriptionManagementUrl(platform: StorePlatform): string {
  return platform === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions?package=net.grow365.app';
}

export async function openSubscriptionManagement(
  platform: StorePlatform,
): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Subscription management is available in the App Store or Google Play app.');
  }
  await Linking.openURL(subscriptionManagementUrl(platform));
}