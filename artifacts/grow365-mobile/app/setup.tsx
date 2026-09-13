import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { authErrorMessage, validateName } from '@/lib/auth-errors';
import {
  cancelDailyReminder,
  isValidReminderTime,
  isValidTimezone,
  scheduleDailyReminder,
} from '@/lib/reminders';

const COMMON_TIMEZONES = [
  'UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Africa/Johannesburg',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const detectedTimezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  })();
  const initialName =
    (typeof user?.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    '';
  const [name, setName] = useState(initialName);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const updateProfile = useUpdateProfile(user?.id);

  const timezones = useMemo(
    () => Array.from(new Set([detectedTimezone, ...COMMON_TIMEZONES])),
    [detectedTimezone],
  );

  const completeSetup = async (withReminder: boolean): Promise<void> => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!isValidReminderTime(reminderTime)) {
      setError('Reminder time must use HH:MM (24-hour time).');
      return;
    }
    if (!isValidTimezone(timezone)) {
      setError('Choose a valid IANA timezone for your reminder.');
      return;
    }
    setError(undefined);

    try {
      // Permission is requested only from this explicit opt-in action. The
      // "Not now" path never calls either permission API.
      if (withReminder && reminderEnabled && Platform.OS !== 'web') {
        const current = await Notifications.getPermissionsAsync();
        const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Notifications are off, so the daily reminder was not enabled. You can allow them in Settings or choose Not now.');
        }
      }

      const enabled = withReminder && reminderEnabled;
      await updateProfile.mutateAsync({
        display_name: name.trim(),
        timezone,
        reminder_enabled: enabled,
        reminder_time: reminderTime,
        onboarded_at: new Date().toISOString(),
      });
      try {
        if (enabled) await scheduleDailyReminder(reminderTime, timezone);
        else await cancelDailyReminder();
      } catch (scheduleError) {
        // Keep the server preference honest if native scheduling fails.
        await updateProfile.mutateAsync({ reminder_enabled: false });
        throw scheduleError;
      }
      router.replace('/(tabs)');
    } catch (caught) {
      setError(authErrorMessage(caught));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="reference" color="accent" style={styles.step}>STEP 1 OF 1</Typography>
        <Typography variant="h2" style={styles.title}>Let's get acquainted</Typography>
        <Typography variant="body" color="muted" style={styles.subtitle}>
          Choose how Grow365 should greet you and whether a gentle daily nudge would help you make room for reflection.
        </Typography>

        <Input
          label="Preferred Name"
          placeholder="e.g. Robert or Mary"
          value={name}
          onChangeText={(value) => { setName(value); setError(undefined); }}
          error={error && !validateName(name) ? undefined : error}
        />

        <View style={[styles.reminderCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Typography variant="body">Daily devotional reminder</Typography>
              <Typography variant="caption" color="muted">
                We will ask for notification permission only after you choose to turn this on and finish setup.
              </Typography>
            </View>
            <Switch
              accessibilityLabel="Enable daily devotional reminder"
              value={reminderEnabled}
              onValueChange={(value) => { setReminderEnabled(value); setError(undefined); }}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <Input
            label="Reminder time (HH:MM)"
            value={reminderTime}
            onChangeText={(value) => { setReminderTime(value); setError(undefined); }}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            error={error && !isValidReminderTime(reminderTime) ? error : undefined}
          />
          <View style={[styles.selector, { borderColor: colors.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reminder timezone ${timezone}`}
              style={styles.selectorButton}
              onPress={() => setTimezoneOpen((open) => !open)}
            >
              <View>
                <Typography variant="caption" color="muted">TIMEZONE</Typography>
                <Typography variant="body">{timezone}</Typography>
              </View>
              <Feather name={timezoneOpen ? 'chevron-up' : 'chevron-down'} size={19} color={colors.mutedForeground} />
            </Pressable>
            {timezoneOpen ? (
              <View style={[styles.timezoneList, { borderTopColor: colors.border }]}>
                {timezones.map((zone) => (
                  <Pressable
                    key={zone}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: zone === timezone }}
                    style={styles.timezoneOption}
                    onPress={() => { setTimezone(zone); setTimezoneOpen(false); setError(undefined); }}
                  >
                    <Typography variant="body">{zone}</Typography>
                    {zone === timezone && <Feather name="check" size={18} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <Typography variant="caption" color="muted">
            Your time is kept as an IANA timezone so local-time reminders can follow seasonal clock changes when the app resyncs.
          </Typography>
        </View>

        {error ? <Typography variant="body" color="destructive" style={styles.feedback}>{error}</Typography> : null}
        <View style={styles.spacer} />
        <Button
          title={reminderEnabled ? 'Enable reminder & complete setup' : 'Complete setup'}
          onPress={() => void completeSetup(reminderEnabled)}
          loading={updateProfile.isPending}
        />
        <Button
          title="Not now"
          variant="ghost"
          onPress={() => void completeSetup(false)}
          disabled={updateProfile.isPending}
          style={styles.notNow}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flexGrow: 1 },
  step: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 24, lineHeight: 25 },
  reminderCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 },
  settingText: { flex: 1, gap: 4 },
  selector: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  selectorButton: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timezoneList: { borderTopWidth: 1, maxHeight: 240 },
  timezoneOption: { padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  feedback: { marginTop: 14 },
  spacer: { flex: 1, minHeight: 28 },
  notNow: { marginTop: 6 },
});