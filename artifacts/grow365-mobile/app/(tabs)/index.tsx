import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Button } from '@/components/Button';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import {
  useTodayDevotional,
  useYearRibbon,
  usePartialReading,
  useRecentGroupActivity,
} from '@/hooks/useHomeData';

import { YearRibbon } from '@/components/YearRibbon';
import { TodayDevotionalCard } from '@/components/TodayDevotionalCard';
import { ResumeRow } from '@/components/ResumeRow';
import { QuickLinks } from '@/components/QuickLinks';
import { RecentActivity } from '@/components/RecentActivity';

function formatToday(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date());
  }
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const profileQuery = useProfile(user?.id);
  const devotionalQuery = useTodayDevotional(
    user?.id,
    profileQuery.data?.timezone,
  );
  const ribbonQuery = useYearRibbon(user?.id);
  const partialReadingQuery = usePartialReading(user?.id);
  const activityQuery = useRecentGroupActivity(user?.id);

  const isLoading = profileQuery.isLoading || devotionalQuery.isLoading || ribbonQuery.isLoading;
  const isError = profileQuery.isError || devotionalQuery.isError || ribbonQuery.isError;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Preparing your space..." />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Couldn't load today"
          description="Check your connection and try again. If this continues, review your timezone in Settings."
          onRetry={() => {
            void profileQuery.refetch();
            void devotionalQuery.refetch();
            void ribbonQuery.refetch();
          }}
        />
        <Button
          title="Open settings"
          variant="outline"
          onPress={() => router.push('/settings')}
          style={styles.errorAction}
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
  const partialReading = partialReadingQuery.data;
  const ribbon = ribbonQuery.data;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 120 },
        ]}
      >
        <View style={styles.header} accessible accessibilityRole="header">
          <Typography variant="reference" color="accent" style={styles.date}>
            {formatToday(profileQuery.data.timezone).toUpperCase()}
          </Typography>
          <Typography variant="h1" style={styles.title}>
            Good morning, {profileQuery.data.display_name}.
          </Typography>
          <Typography variant="body" color="muted" style={styles.journeyDay}>
            Day {ribbon?.currentDay ?? 1} of your 365-day journey
          </Typography>
        </View>

        {ribbon && (
          <YearRibbon
            currentDay={ribbon.currentDay}
            completedDays={ribbon.completedDays}
            dayToDevoId={ribbon.dayToDevoId}
          />
        )}

        {devotional ? (
          <View style={styles.cardContainer}>
            <TodayDevotionalCard devotional={devotional} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="book-open"
              title="No reading for today"
              description="There is no published reading available for your current journey day."
            />
          </View>
        )}

        {partialReadingQuery.isLoading ? (
          <Typography variant="caption" color="muted" style={styles.resumeStatus}>
            Checking your reading progress…
          </Typography>
        ) : partialReadingQuery.isError ? (
          <View style={styles.resumeStatus}>
            <Typography variant="caption" color="destructive" accessibilityRole="alert">
              Your saved reading progress is unavailable.
            </Typography>
            <Pressable
              onPress={() => void partialReadingQuery.refetch()}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Retry reading progress"
              accessibilityHint="Checks for your saved reading progress again"
            >
              <Typography variant="caption" color="accent" style={styles.retryText}>
                Try again
              </Typography>
            </Pressable>
          </View>
        ) : partialReading ? (
          <View style={styles.resumeContainer}>
            <ResumeRow
              devotionalId={partialReading.devotional_id}
              title={partialReading.devotionals.title}
              dayOfYear={partialReading.devotionals.day_of_year}
              scrollPct={partialReading.scroll_pct}
            />
          </View>
        ) : null}

        <View style={styles.linksContainer}>
          <QuickLinks />
        </View>

        <View style={styles.activityContainer}>
          {activityQuery.isLoading ? (
            <LoadingState message="Loading activity..." />
          ) : activityQuery.isError ? (
            <ErrorState
              title="Activity unavailable"
              description="Could not load group activity."
              onRetry={() => void activityQuery.refetch()}
            />
          ) : (
            <RecentActivity activities={activityQuery.data || []} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  errorAction: {
    alignSelf: 'center',
    marginTop: 12,
  },
  content: { 
    // minimal vertical padding, handled mostly by insets
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  date: { 
    marginBottom: 12, 
    letterSpacing: 1 
  },
  title: { 
    marginBottom: 8,
  },
  journeyDay: { marginBottom: 0 },
  resumeContainer: {
    paddingHorizontal: 24,
  },
  resumeStatus: {
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  retryText: {
    textDecorationLine: 'underline',
  },
  cardContainer: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  linksContainer: {
    paddingHorizontal: 24,
  },
  activityContainer: {
    paddingHorizontal: 24,
  }
});
