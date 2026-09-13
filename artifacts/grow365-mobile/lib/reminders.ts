import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KEY = 'grow365.daily-reminder.id';

export function isValidReminderTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidTimezone(value: string): boolean {
  if (!value.trim()) return false;
  try {
    // Intl is the platform's authoritative IANA timezone database. This also
    // deliberately accepts the valid IANA alias "UTC".
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function timezoneOffsetMinutes(timezone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return Math.round((asUtc - date.getTime()) / 60_000);
}

function deviceTimeForTimezone(
  hour: number,
  minute: number,
  timezone: string,
): { hour: number; minute: number } {
  const now = new Date();
  const targetOffset = timezoneOffsetMinutes(timezone, now);
  const deviceOffset = -now.getTimezoneOffset();
  const targetMinutes = hour * 60 + minute;
  const deviceMinutes = ((targetMinutes - (targetOffset - deviceOffset)) + 1440) % 1440;
  return { hour: Math.floor(deviceMinutes / 60), minute: deviceMinutes % 60 };
}

export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  const existing = await AsyncStorage.getItem(REMINDER_KEY);
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing);
  }
  // Also clean up reminders created before the identifier was persisted.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.grow365Reminder === true)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
  await AsyncStorage.removeItem(REMINDER_KEY);
}

export async function scheduleDailyReminder(
  time: string,
  timezone: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!isValidReminderTime(time)) {
    throw new Error('Reminder time must use HH:MM (24-hour time).');
  }
  if (!isValidTimezone(timezone)) {
    throw new Error('Choose a valid IANA timezone for your reminder.');
  }
  await cancelDailyReminder();
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily reminders',
      description: 'Your daily Grow365 devotional reminder.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#4A5D4E',
    });
  }
  const androidTime = Platform.OS === 'android'
    ? deviceTimeForTimezone(hour, minute, timezone)
    : { hour, minute };
  const trigger: Notifications.NotificationTriggerInput =
    Platform.OS === 'ios'
      ? ({ type: 'calendar', hour, minute, repeats: true, timezone } as unknown as Notifications.NotificationTriggerInput)
      : ({ type: 'daily', channelId: 'daily-reminders', hour: androidTime.hour, minute: androidTime.minute } as unknown as Notifications.NotificationTriggerInput);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'A quiet moment with Grow365',
      body: 'Your daily devotional is ready whenever you are.',
      data: { url: '/today', grow365Reminder: true },
    },
    trigger,
  });
  await AsyncStorage.setItem(REMINDER_KEY, identifier);
}

/**
 * Recreates the native schedule when the app returns to the foreground.
 * Android daily triggers use the device clock, so this is intentionally
 * best-effort: opening the app lets us recalculate the selected timezone's
 * current offset, but background DST changes cannot be promised.
 */
export async function reconcileDailyReminder(
  enabled: boolean,
  time: string | null | undefined,
  timezone: string | null | undefined,
): Promise<void> {
  if (Platform.OS === 'web' || !enabled || !time || !timezone) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await scheduleDailyReminder(time, timezone);
}