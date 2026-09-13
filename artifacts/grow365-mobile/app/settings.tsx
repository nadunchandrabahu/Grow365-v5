import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { authErrorMessage, validateName } from '@/lib/auth-errors';

export default function SettingsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const profileQuery = useProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const [displayName, setDisplayName] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayName(profileQuery.data.display_name);
    setReminderEnabled(profileQuery.data.reminder_enabled);
  }, [profileQuery.data]);

  const handleSave = async (): Promise<void> => {
    const nameError = validateName(displayName);
    setError(nameError);
    setSaved(false);
    if (nameError) return;

    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        reminder_enabled: reminderEnabled,
      });
      setSaved(true);
    } catch (caught) {
      setError(authErrorMessage(caught));
    }
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading your settings..." />
      </View>
    );
  }

  if (profileQuery.isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Settings could not be loaded"
          description="Check your connection and try again."
          onRetry={() => void profileQuery.refetch()}
        />
      </View>
    );
  }

  if (!profileQuery.data) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="user"
          title="Profile not found"
          description="Your account is signed in, but its profile record is missing."
          actionLabel="Try Again"
          onAction={() => void profileQuery.refetch()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Typography variant="h3" style={styles.sectionTitle}>Profile</Typography>
      <Input
        label="Display Name"
        value={displayName}
        onChangeText={(value) => {
          setDisplayName(value);
          setError(undefined);
          setSaved(false);
        }}
        error={error}
      />
      <View style={[styles.detail, { borderBottomColor: colors.border }]}>
        <Typography variant="body">Timezone</Typography>
        <Typography variant="caption" color="muted">
          {profileQuery.data.timezone}
        </Typography>
      </View>

      <Typography variant="h3" style={[styles.sectionTitle, styles.preferencesTitle]}>
        Preferences
      </Typography>
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingText}>
          <Typography variant="body">Daily Reminder</Typography>
          <Typography variant="caption" color="muted">
            Get a gentle nudge each morning.
          </Typography>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={(value) => {
            setReminderEnabled(value);
            setSaved(false);
          }}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {saved ? (
        <Typography variant="body" color="success" style={styles.feedback}>
          Your settings have been saved.
        </Typography>
      ) : null}
      <Button
        title="Save Settings"
        onPress={() => void handleSave()}
        loading={updateProfile.isPending}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24 },
  sectionTitle: { marginBottom: 16 },
  preferencesTitle: { marginTop: 32 },
  detail: { paddingVertical: 16, borderBottomWidth: 1, gap: 4 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingText: { flex: 1, paddingRight: 16 },
  feedback: { marginTop: 24 },
  saveButton: { marginTop: 24 },
});