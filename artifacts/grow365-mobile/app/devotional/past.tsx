import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  type ArchiveDevotional,
  useDevotionalArchive,
} from '@/hooks/useDevotionalArchive';

function formatPublishDate(publishDate: string | null): string | null {
  if (!publishDate) return null;
  const date = new Date(`${publishDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatScriptureReference(devotional: ArchiveDevotional): string | null {
  if (!devotional.primary_book) return null;

  const chapter = devotional.primary_chapter
    ? ` ${devotional.primary_chapter}`
    : '';
  const verses = devotional.primary_verses
    ? `:${devotional.primary_verses}`
    : '';

  return `${devotional.primary_book}${chapter}${verses}`;
}

export default function PastDevotionalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const archiveQuery = useDevotionalArchive(user?.id);

  if (archiveQuery.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading the devotional archive..." />
      </View>
    );
  }

  if (archiveQuery.isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="The archive could not be loaded"
          description="Check your connection and try again."
          onRetry={() => void archiveQuery.refetch()}
        />
      </View>
    );
  }

  if (!archiveQuery.data?.length) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="book-open"
          title="No devotionals yet"
          description="Published devotionals will appear here when they are available."
          actionLabel="Try Again"
          onAction={() => void archiveQuery.refetch()}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={archiveQuery.data}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={(
        <View style={styles.header}>
          <Typography variant="h2">Devotional Archive</Typography>
          <Typography variant="body" color="muted" style={styles.headerDescription}>
            Return to any published reading in the Grow365 journey.
          </Typography>
        </View>
      )}
      renderItem={({ item }) => {
        const publishDate = formatPublishDate(item.publish_date);
        const scriptureReference = formatScriptureReference(item);

        return (
          <TouchableOpacity
            onPress={() => router.push(`/devotional/${item.id}`)}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel={`Open Day ${item.day_of_year}: ${item.title}`}
          >
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Typography variant="reference" color="muted">
                  DAY {item.day_of_year}
                </Typography>
                {item.completed && (
                  <View style={styles.completed}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: colors.success },
                      ]}
                    />
                    <Typography variant="caption" color="success">
                      Completed
                    </Typography>
                  </View>
                )}
              </View>

              <Typography variant="h3">{item.title}</Typography>

              <View style={styles.metadata}>
                {item.devotional_series?.name && (
                  <Typography variant="caption" color="muted">
                    {item.devotional_series.name}
                  </Typography>
                )}
                {scriptureReference && (
                  <Typography variant="reference" color="accent">
                    {scriptureReference}
                  </Typography>
                )}
                {publishDate && (
                  <Typography variant="caption" color="muted">
                    {publishDate}
                  </Typography>
                )}
              </View>

              {item.description && (
                <Typography
                  variant="body"
                  color="muted"
                  numberOfLines={3}
                  style={styles.description}
                >
                  {item.description}
                </Typography>
              )}
            </Card>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  state: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  headerDescription: {
    marginTop: 6,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metadata: {
    gap: 4,
    marginTop: 8,
  },
  description: {
    marginTop: 12,
  },
});