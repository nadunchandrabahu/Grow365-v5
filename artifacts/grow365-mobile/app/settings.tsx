import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { authErrorMessage, validateName } from '@/lib/auth-errors';
import { cancelDailyReminder, scheduleDailyReminder } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';
import { cleanupUserDeviceData } from '@/lib/user-device-cleanup';

type OwnedMember = { user_id: string; profiles: { display_name: string } | null };
type OwnedGroup = { id: string; name: string; members: OwnedMember[] };
const COMMON_TIMEZONES = [
  'UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Africa/Johannesburg',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

function useOwnedGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['owned-groups-for-delete', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<OwnedGroup[]> => {
      if (!userId) return [];
      const { data: groups, error } = await supabase.from('groups').select('id,name').eq('owner_id', userId);
      if (error) throw error;
      const result = await Promise.all((groups ?? []).map(async (group) => {
        const { data: members, error: memberError } = await supabase
          .from('group_members')
          .select('user_id,profiles(display_name)')
          .eq('group_id', group.id)
          .neq('user_id', userId);
        if (memberError) throw memberError;
        return {
          id: group.id,
          name: group.name,
          members: (members ?? []).map((member) => ({
            user_id: member.user_id,
            profiles: member.profiles && !Array.isArray(member.profiles) ? member.profiles : null,
          })),
        };
      }));
      return result;
    },
  });
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function listAvatarObjectPaths(userId: string): Promise<string[]> {
  const prefix = `${userId}/`;
  const paths: string[] = [];
  const listFolder = async (folder: string): Promise<void> => {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage.from('avatars').list(folder, {
        limit: 1000,
        offset,
      });
      if (error) {
        throw new Error(`Your avatar files could not be listed, so your account was not deleted: ${error.message}`);
      }
      for (const object of data ?? []) {
        const objectPath = `${folder}/${object.name}`;
        if (!objectPath.startsWith(prefix) || objectPath.includes('/../') || objectPath.endsWith('/..')) {
          throw new Error('An avatar path was outside your account folder, so your account was not deleted.');
        }
        // Supabase returns an id for files and null for folder entries.
        if (object.id) paths.push(objectPath);
        else await listFolder(objectPath);
      }
      if (!data || data.length < 1000) break;
      offset += data.length;
    }
  };
  await listFolder(userId);
  return paths;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Typography variant="h3" style={[styles.sectionTitle, { color: colors.foreground }]}>{children}</Typography>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, signOut, updateEmail, updatePassword } = useAuth();
  const profileQuery = useProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const ownedGroups = useOwnedGroups(user?.id);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [timezone, setTimezone] = useState('UTC');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [journeyConfirmOpen, setJourneyConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setDisplayName(profile.display_name);
    setStartDate(profile.start_date);
    setReminderEnabled(profile.reminder_enabled);
    setReminderTime(profile.reminder_time ?? '08:00');
    setTimezone(profile.timezone || 'UTC');
    setAvatarPath(profile.avatar_path);
  }, [profileQuery.data]);
  useEffect(() => setEmail(user?.email ?? ''), [user?.email]);

  const timezones = useMemo(() => {
    const detected = (() => {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; }
    })();
    return Array.from(new Set([detected, ...COMMON_TIMEZONES].filter((value): value is string => Boolean(value))));
  }, []);

  const chooseAvatar = async () => {
    setError(undefined);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const saveProfile = async (confirmedJourneyChange = false) => {
    if (!profileQuery.data || !user) return;
    if (!confirmedJourneyChange && startDate !== profileQuery.data.start_date) {
      setJourneyConfirmOpen(true);
      return;
    }
    const nameError = validateName(displayName);
    if (nameError) { setError(nameError); return; }
    if (!isValidDate(startDate)) { setError('Use a valid journey start date in YYYY-MM-DD format.'); return; }
    if (!isValidTime(reminderTime)) { setError('Reminder time must use HH:MM (24-hour time).'); return; }
    setBusy(true); setError(undefined); setNotice(null);
    const previousReminder = {
      reminder_enabled: profileQuery.data.reminder_enabled,
      reminder_time: profileQuery.data.reminder_time,
      timezone: profileQuery.data.timezone,
    };
    try {
      const wasEnabled = profileQuery.data.reminder_enabled;
      if (reminderEnabled && !wasEnabled && Platform.OS !== 'web') {
        const permission = await Notifications.getPermissionsAsync();
        const finalPermission = permission.granted ? permission : await Notifications.requestPermissionsAsync();
        if (!finalPermission.granted) throw new Error('Notification permission is needed to enable daily reminders.');
      }

      const oldAvatarPath = profileQuery.data.avatar_path;
      let nextAvatarPath = oldAvatarPath;
      let uploadedAvatarPath: string | null = null;
      if (avatarUri) {
        const extension = avatarUri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
        const response = await fetch(avatarUri);
        if (!response.ok) throw new Error('Could not read the selected avatar.');
        const { error: uploadError } = await supabase.storage.from('avatars').upload(
          `${user.id}/avatar.${extension}`,
          await response.arrayBuffer(),
          { contentType: extension === 'png' ? 'image/png' : 'image/jpeg', upsert: true },
        );
        if (uploadError) throw uploadError;
        nextAvatarPath = `${user.id}/avatar.${extension}`;
        uploadedAvatarPath = nextAvatarPath;
      }

      try {
        await updateProfile.mutateAsync({
          display_name: displayName.trim(),
          start_date: startDate,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime,
          timezone,
          avatar_path: nextAvatarPath,
        });
      } catch (profileError) {
        if (uploadedAvatarPath && uploadedAvatarPath !== oldAvatarPath) {
          const { error: rollbackAvatarError } = await supabase.storage
            .from('avatars')
            .remove([uploadedAvatarPath]);
          if (rollbackAvatarError) {
            throw new Error(`Your profile could not be saved, and the new avatar could not be cleaned up: ${rollbackAvatarError.message}`);
          }
        }
        throw profileError;
      }
      let avatarCleanupWarning: string | null = null;
      if (oldAvatarPath && nextAvatarPath && oldAvatarPath !== nextAvatarPath) {
        const { error: oldAvatarError } = await supabase.storage
          .from('avatars')
          .remove([oldAvatarPath]);
        if (oldAvatarError) {
          avatarCleanupWarning = `Your profile was saved, but the previous avatar could not be removed: ${oldAvatarError.message}`;
        }
      }
      try {
        if (Platform.OS !== 'web') {
          if (!reminderEnabled) await cancelDailyReminder();
          else if (reminderEnabled && (!wasEnabled || reminderTime !== profileQuery.data.reminder_time || timezone !== profileQuery.data.timezone)) await scheduleDailyReminder(reminderTime, timezone);
        }
      } catch (scheduleError) {
        try {
          await updateProfile.mutateAsync(previousReminder);
          if (Platform.OS !== 'web') {
            if (previousReminder.reminder_enabled && previousReminder.reminder_time) {
              await scheduleDailyReminder(previousReminder.reminder_time, previousReminder.timezone);
            } else {
              await cancelDailyReminder();
            }
          }
        } catch {
          throw new Error(`The reminder could not be updated and your profile could not be fully rolled back. Please try saving again. ${authErrorMessage(scheduleError)}${avatarCleanupWarning ? ` ${avatarCleanupWarning}` : ''}`);
        }
        throw new Error(`The reminder could not be updated, so its previous settings were restored. ${authErrorMessage(scheduleError)}${avatarCleanupWarning ? ` ${avatarCleanupWarning}` : ''}`);
      }
      setAvatarPath(nextAvatarPath);
      setAvatarUri(null);
      setNotice(Platform.OS === 'web' && reminderEnabled ? 'Saved. Web browsers store your preference; native app reminders are available on iOS and Android.' : 'Your settings have been saved.');
      if (avatarCleanupWarning) setNotice(avatarCleanupWarning);
      if (startDate !== profileQuery.data.start_date) setJourneyConfirmOpen(false);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const saveJourneyDate = () => {
    if (!isValidDate(startDate)) { setError('Use a valid journey start date in YYYY-MM-DD format.'); return; }
    setJourneyConfirmOpen(true);
  };

  const changeEmail = async () => {
    if (!email.trim() || email.trim() === user?.email) return;
    setBusy(true); setError(undefined); setNotice(null);
    try { await updateEmail(email); setNotice('Check your inbox to verify your new email address.'); } catch (caught) { setError(authErrorMessage(caught)); } finally { setBusy(false); }
  };
  const changePassword = async () => {
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true); setError(undefined); setNotice(null);
    try { await updatePassword(newPassword); setNewPassword(''); setNotice('Your password has been updated.'); } catch (caught) { setError(authErrorMessage(caught)); } finally { setBusy(false); }
  };
  const confirmDelete = async () => {
    if (deleteText !== 'DELETE' || ownedGroups.isLoading || ownedGroups.isError || ownedGroups.data === undefined || ownedGroups.data.length) return;
    setBusy(true); setError(undefined);
    try {
      const avatarPaths = await listAvatarObjectPaths(user!.id);
      if (avatarPaths.length) {
        const { error: avatarError } = await supabase.storage
          .from('avatars')
          .remove(avatarPaths);
        if (avatarError) {
          throw new Error(`Your avatar files could not be removed, so your account was not deleted: ${avatarError.message}`);
        }
      }
      const { error: deletionError } = await supabase.rpc('delete_my_account');
      if (deletionError) throw deletionError;
      await cleanupUserDeviceData(user?.id, queryClient);
      await supabase.auth.signOut();
      router.replace('/');
    } catch (caught) {
      setError(authErrorMessage(caught));
      setBusy(false);
    }
  };
  const transfer = async (groupId: string, memberId: string) => {
    setBusy(true); setError(undefined);
    try {
      const { error: transferError } = await supabase.rpc('transfer_group_ownership', { p_group_id: groupId, p_new_owner_id: memberId });
      if (transferError) throw transferError;
      await ownedGroups.refetch();
      setNotice('Ownership transferred. You can now continue account deletion.');
    } catch (caught) { setError(authErrorMessage(caught)); } finally { setBusy(false); }
  };
  const handleSignOut = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await cleanupUserDeviceData(user?.id, queryClient);
      await signOut();
      router.replace('/');
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (profileQuery.isLoading) return <View style={[styles.state, { backgroundColor: colors.background }]}><LoadingState message="Loading your settings..." /></View>;
  if (profileQuery.isError) return <View style={[styles.state, { backgroundColor: colors.background }]}><ErrorState title="Settings could not be loaded" description="Check your connection and try again." onRetry={() => void profileQuery.refetch()} /></View>;
  if (!profileQuery.data) return <View style={[styles.state, { backgroundColor: colors.background }]}><EmptyState icon="user" title="Profile not found" description="Your account is signed in, but its profile record is missing." actionLabel="Try Again" onAction={() => void profileQuery.refetch()} /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionTitle>Account</SectionTitle>
      <View style={styles.avatarRow}><Avatar path={avatarUri ?? avatarPath} name={displayName} size={72} /><Button title="Choose photo" variant="outline" size="small" onPress={() => void chooseAvatar()} /></View>
      <Input label="Name" value={displayName} onChangeText={setDisplayName} />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Button title="Update email" variant="outline" size="small" loading={busy} onPress={() => void changeEmail()} />
      <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" placeholder="At least 8 characters" />
      <Button title="Update password" variant="outline" size="small" loading={busy} onPress={() => void changePassword()} />

      <SectionTitle>Journey</SectionTitle>
      <Input label="Start date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2025-01-01" />
      <Button title="Save journey date" variant="outline" size="small" onPress={saveJourneyDate} />

      <SectionTitle>Notifications</SectionTitle>
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingText}><Typography variant="body">Daily devotional reminder</Typography><Typography variant="caption" color="muted">{Platform.OS === 'web' ? 'Web stores this preference; native reminders are available in the app.' : Platform.OS === 'android' ? 'A gentle reminder at this time. Android uses your device time; daylight-saving changes may require saving again.' : 'A gentle reminder at this time and timezone.'}</Typography></View>
        <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ true: colors.primary }} />
      </View>
      <Input label="Reminder time (HH:MM)" value={reminderTime} onChangeText={setReminderTime} placeholder="08:00" keyboardType="numbers-and-punctuation" />
      <View style={[styles.selector, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable style={styles.selectorButton} onPress={() => setTimezoneOpen((open) => !open)}><View><Typography variant="caption" color="muted">TIMEZONE</Typography><Typography variant="body">{timezone}</Typography></View><Feather name={timezoneOpen ? 'chevron-up' : 'chevron-down'} size={19} color={colors.mutedForeground} /></Pressable>
        {timezoneOpen && <View style={[styles.timezoneList, { borderTopColor: colors.border }]}>{timezones.map((zone) => <Pressable key={zone} style={styles.timezoneOption} onPress={() => { setTimezone(zone); setTimezoneOpen(false); }}><Typography variant="body">{zone}</Typography>{zone === timezone && <Feather name="check" size={18} color={colors.primary} />}</Pressable>)}</View>}
      </View>
      {notice ? <Typography variant="body" color="success" style={styles.feedback}>{notice}</Typography> : null}
      {error ? <Typography variant="body" color="destructive" style={styles.feedback}>{error}</Typography> : null}
      <Button title="Save settings" loading={busy || updateProfile.isPending} onPress={() => void saveProfile()} style={styles.saveButton} />

      <SectionTitle>Legal</SectionTitle>
      <Pressable style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/privacy')}><Typography variant="body">Privacy policy</Typography><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
      <Pressable style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/terms')}><Typography variant="body">Terms of use</Typography><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
      <View style={styles.version}><Typography variant="caption" color="muted">Grow365 version 1.0.0</Typography></View>
      <Button title="Sign out" variant="outline" loading={busy} onPress={() => void handleSignOut()} />
      <Button title="Delete my account" variant="ghost" onPress={() => { setDeleteText(''); setDeleteOpen(true); }} style={{ borderColor: colors.destructive }} />

      <Modal visible={journeyConfirmOpen} transparent animationType="fade" onRequestClose={() => setJourneyConfirmOpen(false)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: colors.card }]}><Typography variant="h3">Change your journey start?</Typography><Typography variant="body" color="muted" style={styles.modalBody}>This changes which day of Grow365 you see next. Save this new start date?</Typography><View style={styles.modalActions}><Button title="Cancel" variant="ghost" onPress={() => setJourneyConfirmOpen(false)} /><Button title="Confirm and save" loading={busy} onPress={() => void saveProfile(true)} /></View></View></View>
      </Modal>
      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <ScrollView style={styles.deleteScroll} contentContainerStyle={styles.deleteScrollContent} keyboardShouldPersistTaps="handled">
            <Typography variant="h3">Delete your account?</Typography>
            <Typography variant="body" color="muted" style={styles.modalBody}>Your journal, bookmarks, reading progress, subscription record, group memberships, and avatar will be deleted permanently. Group discussion authors remain as “Former member”. This cannot be undone.</Typography>
            {ownedGroups.isLoading ? <LoadingState message="Checking group ownership…" /> : ownedGroups.isError ? <Typography variant="body" color="destructive">Owned groups could not be loaded. Try again before deleting.</Typography> : ownedGroups.data?.length ? <View style={styles.transferBox}><Typography variant="body">Transfer ownership before deleting:</Typography>{ownedGroups.data.map((group) => <View key={group.id} style={[styles.ownedGroup, { borderColor: colors.border }]}><Typography variant="body">{group.name}</Typography>{group.members.length ? group.members.map((member) => <Button key={member.user_id} title={`Transfer to ${member.profiles?.display_name ?? 'Former member'}`} size="small" variant="outline" disabled={busy} onPress={() => void transfer(group.id, member.user_id)} />) : <Typography variant="caption" color="muted">This group has no other members.</Typography>}</View>)}</View> : null}
            <Input label='Type DELETE to confirm' value={deleteText} onChangeText={setDeleteText} autoCapitalize="characters" />
          </ScrollView>
          <View style={styles.modalActions}><Button title="Cancel" variant="ghost" onPress={() => setDeleteOpen(false)} /><Button title="Delete permanently" loading={busy} disabled={deleteText !== 'DELETE' || ownedGroups.isLoading || ownedGroups.isError || ownedGroups.data === undefined || Boolean(ownedGroups.data.length)} onPress={() => void confirmDelete()} /></View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  sectionTitle: { marginTop: 25, marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: 14 },
  settingText: { flex: 1, paddingRight: 16, gap: 3 },
  selector: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  selectorButton: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timezoneList: { borderTopWidth: 1, maxHeight: 240 },
  timezoneOption: { padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  feedback: { marginTop: 14 },
  saveButton: { marginTop: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1 },
  version: { alignItems: 'center', paddingVertical: 18 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { borderRadius: 16, padding: 22, maxHeight: '90%' },
  deleteScroll: { flexShrink: 1 },
  deleteScrollContent: { paddingBottom: 4 },
  modalBody: { marginTop: 12, lineHeight: 21 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 18 },
  transferBox: { marginTop: 18, gap: 10 },
  ownedGroup: { gap: 8, padding: 12, borderWidth: 1, borderRadius: 10 },
});