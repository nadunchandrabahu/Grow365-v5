import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage } from '@/lib/auth-errors';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { useProfile } from '@/hooks/useProfile';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [signOutError, setSignOutError] = React.useState<string | null>(null);
  const [signingOut, setSigningOut] = React.useState<boolean>(false);
  const profileQuery = useProfile(user?.id);
  const displayName = profileQuery.data?.display_name ?? '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'G';

  const menuItems = [
    { icon: 'settings', label: 'Settings', route: '/settings' },
    { icon: 'credit-card', label: 'Subscription', route: '/subscription' },
  ];

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      setSignOutError(authErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading your profile..." />
      </View>
    );
  }

  if (profileQuery.isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Your profile could not be loaded"
          description="Check your connection and try again."
          onRetry={() => void profileQuery.refetch()}
        />
      </View>
    );
  }

  if (!profileQuery.data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: 120 }]}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Typography variant="h1" style={{ color: colors.secondaryForeground }}>{initial}</Typography>
          </View>
          <Typography variant="h2" style={styles.name}>{displayName}</Typography>
          <Typography variant="body" color="muted">{user?.email ?? ''}</Typography>
        </View>

        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Feather name={item.icon as any} size={20} color={colors.foreground} style={styles.menuIcon} />
              <Typography variant="body" style={{ flex: 1 }}>{item.label}</Typography>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
        {signOutError ? (
          <Typography variant="body" color="destructive" style={styles.signOutError}>
            {signOutError}
          </Typography>
        ) : null}
        <Button
          title="Sign Out"
          variant="outline"
          loading={signingOut}
          onPress={() => void handleSignOut()}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { marginBottom: 4 },
  menu: { borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIcon: { marginRight: 16 },
  signOutError: { marginBottom: 16 },
});