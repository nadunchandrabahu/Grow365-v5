import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDER_KEY = 'grow365.daily-reminder.id';

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
  await cancelDailyReminder();
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('Reminder time must use HH:MM (24-hour time).');
  }
  const androidTime = Platform.OS === 'android'
    ? deviceTimeForTimezone(hour, minute, timezone)
    : { hour, minute };
  const trigger: Notifications.NotificationTriggerInput =
    Platform.OS === 'ios'
      ? ({ type: 'calendar', hour, minute, repeats: true, timezone } as unknown as Notifications.NotificationTriggerInput)
      : ({ type: 'daily', hour: androidTime.hour, minute: androidTime.minute } as unknown as Notifications.NotificationTriggerInput);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'A quiet moment with Grow365',
      body: 'Your daily devotional is ready whenever you are.',
      data: { url: '/(tabs)', grow365Reminder: true },
    },
    trigger,
  });
  await AsyncStorage.setItem(REMINDER_KEY, identifier);
}