import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useJourneySummary } from '@/hooks/useJourneySummary';
import { useMyGroups } from '@/hooks/useGroupContent';
import { useSubscriptionDetails } from '@/hooks/useSubscriptionDetails';
import { manageableStorePlatform, openSubscriptionManagement } from '@/lib/subscription-management';
import { cleanupUserDeviceData } from '@/lib/user-device-cleanup';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/Avatar';
import { GroupCover } from '@/components/GroupCover';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { authErrorMessage } from '@/lib/auth-errors';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useProfile(user?.id);
  const journeyQuery = useJourneySummary(user?.id);
  const groupsQuery = useMyGroups(user?.id);
  const subscriptionDetailsQuery = useSubscriptionDetails(user?.id);
  const [signOutError, setSignOutError] = React.useState<string | null>(null);
  const [signingOut, setSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await cleanupUserDeviceData(user?.id, queryClient);
      await signOut();
      router.replace('/');
    } catch (error) {
      setSignOutError(authErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

  if (profileQuery.isLoading) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><LoadingState message="Loading your profile..." /></View>;
  }
  if (profileQuery.isError) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><ErrorState title="Your profile could not be loaded" description="Check your connection and try again." onRetry={() => void profileQuery.refetch()} /></View>;
  }
  if (!profileQuery.data) {
    return <View style={[styles.state, { backgroundColor: colors.background }]}><EmptyState icon="user" title="Profile not found" description="Your account is signed in, but its profile record is missing." actionLabel="Try Again" onAction={() => void profileQuery.refetch()} /></View>;
  }

  const profile = profileQuery.data;
  const startDate = new Date(`${profile.start_date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getSubStatusText = () => {
    const details = subscriptionDetailsQuery.data;
    if (!details || !details.active) return 'No active subscription';

    switch (details.status) {
      case 'granted':
        return 'Granted Access';
      case 'cancelled':
        if (details.period_end) {
          const date = new Date(details.period_end).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          return `Cancelled — Active Until ${date}`;
        }
        return 'Cancelled — Active';
      case 'trial':
        return 'Active (Trial)';
      default:
        return 'Active Subscription';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: 120 }]}>
        <View style={styles.header}>
          <Avatar path={profile.avatar_path} name={profile.display_name} size={88} />
          <Typography variant="h2" style={styles.name}>{profile.display_name}</Typography>
          <Typography variant="body" color="muted">{user?.email ?? ''}</Typography>
        </View>

        <Card style={styles.summary}>
          <Typography variant="h3">Your journey</Typography>
          {journeyQuery.isLoading ? <Typography variant="body" color="muted">Loading your progress…</Typography> : journeyQuery.isError ? <Typography variant="body" color="destructive">Journey details are unavailable right now.</Typography> : (
            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}><Typography variant="body" color="muted">Current day</Typography><Typography variant="body">Day {journeyQuery.data?.currentDay ?? '—'}</Typography></View>
              <View style={styles.summaryRow}><Typography variant="body" color="muted">Readings completed</Typography><Typography variant="body">{journeyQuery.data?.completedCount ?? 0}</Typography></View>
              <View style={styles.summaryRow}><Typography variant="body" color="muted">Started</Typography><Typography variant="body">{startDate}</Typography></View>
            </View>
          )}
        </Card>

        <View style={styles.sectionHeading}><Typography variant="h3">Subscription</Typography></View>
        <Card style={styles.subscriptionCard}>
          {subscriptionDetailsQuery.isLoading ? <Typography variant="body" color="muted">Checking your subscription…</Typography> : subscriptionDetailsQuery.isError ? <Typography variant="body" color="destructive">Subscription status is unavailable.</Typography> : (
            <>
              <View style={styles.subscriptionRow}>
                <Feather name={subscriptionDetailsQuery.data?.active ? 'check-circle' : 'heart'} size={21} color={subscriptionDetailsQuery.data?.active ? colors.success : colors.foreground} />
                <View style={styles.subscriptionText}>
                  <Typography variant="body">{getSubStatusText()}</Typography>
                  <Typography variant="caption" color="muted">{subscriptionDetailsQuery.data?.active ? 'Thank you for supporting this quiet space.' : 'Support daily devotionals and the Grow365 community.'}</Typography>
                </View>
              </View>
              {subscriptionDetailsQuery.data?.active &&
              subscriptionDetailsQuery.data.status !== 'granted' &&
              manageableStorePlatform(subscriptionDetailsQuery.data.platform, subscriptionDetailsQuery.data.granted_reason) ? (
                <Button title="Manage subscription" variant="ghost" size="small" onPress={() => void openSubscriptionManagement(manageableStorePlatform(subscriptionDetailsQuery.data!.platform, subscriptionDetailsQuery.data!.granted_reason)!).catch((error) => setSignOutError(authErrorMessage(error)))} />
              ) : (
                <Button title={subscriptionDetailsQuery.data?.active ? 'Subscription details' : 'Learn about subscription'} variant="ghost" size="small" onPress={() => router.push('/subscription')} />
              )}
            </>
          )}
        </Card>

        <View style={styles.sectionHeading}><Typography variant="h3">Your groups</Typography></View>
        {groupsQuery.isLoading ? <LoadingState message="Loading groups…" /> : groupsQuery.isError ? <Typography variant="body" color="destructive">Groups could not be loaded.</Typography> : groupsQuery.data?.length ? (
          <View style={styles.groups}>
            {groupsQuery.data.map((group) => (
              <TouchableOpacity key={group.id} onPress={() => router.push(`/groups/${group.id}` as any)} activeOpacity={0.8}>
                <Card style={styles.groupCard}>
                  <GroupCover path={group.cover_path} userId={user?.id} style={styles.cover} />
                  <Typography variant="body" style={styles.groupName}>{group.name}</Typography>
                  {group.description ? <Typography variant="caption" color="muted" numberOfLines={2}>{group.description}</Typography> : null}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : <Typography variant="body" color="muted">You are not in any groups yet.</Typography>}

        <View style={[styles.menu, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')}><Feather name="settings" size={20} color={colors.foreground} /><Typography variant="body" style={styles.menuLabel}>Settings</Typography><Feather name="chevron-right" size={20} color={colors.mutedForeground} /></TouchableOpacity>
        </View>
        {signOutError ? <Typography variant="body" color="destructive" style={styles.signOutError}>{signOutError}</Typography> : null}
        <Button title="Sign Out" variant="outline" loading={signingOut} onPress={() => void handleSignOut()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 28 },
  name: { marginTop: 14, marginBottom: 4 },
  summary: { padding: 20 },
  summaryRows: { marginTop: 14, gap: 11 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionHeading: { marginTop: 30, marginBottom: 12 },
  subscriptionCard: { padding: 18 },
  subscriptionRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  subscriptionText: { flex: 1, gap: 3 },
  groups: { gap: 12 },
  groupCard: { padding: 12 },
  cover: { minHeight: 90, marginBottom: 10 },
  groupName: { fontWeight: '600', marginBottom: 3 },
  menu: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 30, marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuLabel: { flex: 1, marginLeft: 14 },
  signOutError: { marginBottom: 16 },
});
