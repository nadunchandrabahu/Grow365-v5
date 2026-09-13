import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  useLatestCompletedReading,
  useTodayDevotional,
} from '@/hooks/useHomeData';
import { useProfile } from '@/hooks/useProfile';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const profileQuery = useProfile(user?.id);
  const devotionalQuery = useTodayDevotional(user?.id);
  const progressQuery = useLatestCompletedReading(user?.id);

  if (profileQuery.isLoading || devotionalQuery.isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Preparing today’s reading..." />
      </View>
    );
  }

  if (profileQuery.isError || devotionalQuery.isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Today could not be loaded"
          description="Check your connection and try again."
          onRetry={() => {
            void profileQuery.refetch();
            void devotionalQuery.refetch();
          }}
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

  const devotional = devotionalQuery.data;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 120 },
        ]}
      >
        <Typography variant="reference" color="accent" style={styles.date}>
          {dateFormatter.format(new Date()).toUpperCase()}
        </Typography>
        <Typography variant="h1" style={styles.title}>
          Good morning, {profileQuery.data.display_name}.
        </Typography>

        {devotional ? (
          <Card style={styles.todayCard}>
            <Typography variant="reference" color="muted" style={styles.cardHeader}>
              TODAY&apos;S DEVOTIONAL
            </Typography>
            <Typography variant="h2" style={styles.cardTitle}>
              {devotional.title}
            </Typography>
            {devotional.memory_verse ? (
              <Typography variant="journal" color="muted" style={styles.cardPreview}>
                {devotional.memory_verse}
              </Typography>
            ) : devotional.description ? (
              <Typography variant="body" color="muted" style={styles.cardPreview}>
                {devotional.description}
              </Typography>
            ) : null}
            <Button
              title="Read Devotional"
              onPress={() => router.push(`/devotional/${devotional.id}`)}
              style={styles.cardButton}
            />
          </Card>
        ) : (
          <Card style={styles.todayCard}>
            <EmptyState
              icon="book-open"
              title="No devotional for today"
              description="There is no published devotional available for your current journey day."
            />
          </Card>
        )}

        <Typography variant="h3" style={styles.sectionTitle}>Recent Activity</Typography>
        {progressQuery.isLoading ? (
          <Card style={styles.activityCard}>
            <LoadingState message="Loading recent activity..." />
          </Card>
        ) : progressQuery.isError ? (
          <Card style={styles.activityCard}>
            <ErrorState
              title="Activity could not be loaded"
              description="Try again when your connection is available."
              onRetry={() => void progressQuery.refetch()}
            />
          </Card>
        ) : progressQuery.data ? (
          <Card style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <View style={styles.activityText}>
                <Typography variant="body">Completed a reading</Typography>
                <Typography variant="caption" color="muted">
                  {progressQuery.data.devotional.title} ·{' '}
                  {shortDateFormatter.format(new Date(progressQuery.data.completedAt))}
                </Typography>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.activityCard}>
            <Typography variant="body" color="muted">
              Completed readings will appear here.
            </Typography>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  date: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 32 },
  todayCard: { padding: 24, marginBottom: 40, minHeight: 210 },
  cardHeader: { marginBottom: 12, letterSpacing: 0.5 },
  cardTitle: { marginBottom: 16 },
  cardPreview: { marginBottom: 24 },
  cardButton: { alignSelf: 'flex-start' },
  sectionTitle: { marginBottom: 16 },
  activityCard: { padding: 16, minHeight: 84 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activityText: { flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
});