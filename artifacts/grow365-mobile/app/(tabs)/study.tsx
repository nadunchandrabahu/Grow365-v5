import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { GroupCover } from '@/components/GroupCover';
import { useRouter } from 'expo-router';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { useAuth } from '@/contexts/AuthContext';
import { useMyGroups } from '@/hooks/useGroupContent';

export default function StudyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const groupsQuery = useMyGroups(user?.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}>
        <Typography variant="h1" style={styles.title}>Study</Typography>
        
        <TouchableOpacity
          onPress={() => router.push('/devotional/past')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open past devotionals"
          accessibilityHint="Revisit previous readings and reflections"
          accessibilityState={{ disabled: false }}
        >
          <Card style={styles.planCard}>
            <Typography variant="h3" style={styles.cardTitle}>Past Devotionals</Typography>
            <Typography variant="body" color="muted">Revisit previous readings and reflections.</Typography>
          </Card>
        </TouchableOpacity>

        <Typography variant="h3" style={styles.sectionTitle}>Groups</Typography>
        
        <View style={styles.groupActions}>
          <TouchableOpacity 
            onPress={() => router.push('/groups/create')} 
            style={[styles.actionBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Create a group"
            accessibilityHint="Start a private Bible study group"
            accessibilityState={{ disabled: false }}
          >
            <Typography variant="body" style={styles.actionText}>Create Group</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/groups/join')} 
            style={[styles.actionBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Join a group"
            accessibilityHint="Enter an invite code and password to join a group"
            accessibilityState={{ disabled: false }}
          >
            <Typography variant="body" style={styles.actionText}>Join Group</Typography>
          </TouchableOpacity>
        </View>

        {authLoading || groupsQuery.isLoading ? (
          <LoadingState message="Loading your groups..." />
        ) : groupsQuery.isError ? (
          <ErrorState
            title="Groups are unavailable"
            description="Check your connection and try again."
            onRetry={() => void groupsQuery.refetch()}
          />
        ) : groupsQuery.data?.length ? (
          groupsQuery.data.map((group) => (
            <TouchableOpacity
              key={group.id}
              onPress={() => router.push(`/groups/${group.id}`)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Open group ${group.name}`}
              accessibilityHint="View this group's devotionals, notes, questions, and members"
              accessibilityState={{ disabled: false }}
            >
              <Card style={styles.planCard}>
                <GroupCover path={group.cover_path} userId={user?.id} style={styles.groupCover} />
                <Typography variant="reference" color="muted" style={styles.groupLabel}>
                  YOUR GROUP
                </Typography>
                <Typography variant="h3" style={styles.cardTitle}>
                  {group.name}
                </Typography>
                {group.description && (
                  <Typography variant="body" color="muted">
                    {group.description}
                  </Typography>
                )}
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Card style={styles.planCard}>
            <EmptyState
              icon="users"
              title="No groups yet"
              description="Create a group or join one to begin sharing notes and questions."
              actionLabel="Create a group"
              onAction={() => router.push('/groups/create')}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { marginBottom: 32 },
  planCard: { padding: 20, marginBottom: 24 },
  cardTitle: { marginBottom: 8 },
  sectionTitle: { marginBottom: 16, marginTop: 16 },
  groupActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  actionBox: { flexGrow: 1, flexBasis: 160, minHeight: 44, padding: 16, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Inter_500Medium' },
  groupLabel: { marginBottom: 8 },
  groupCover: { minHeight: 116, marginBottom: 16 },
});