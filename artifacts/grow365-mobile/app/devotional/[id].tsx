import React, { useCallback } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDevotional,
  useReadingProgress,
  useSaveReadingProgress,
} from '@/hooks/useDevotional';
import { useColors } from '@/hooks/useColors';

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatReference(
  book: string | null,
  chapter: number | null,
  verses: string | null,
): string | null {
  if (!book) return null;
  if (!chapter) return book;
  return `${book} ${chapter}${verses ? `:${verses}` : ''}`;
}

export default function DevotionalReaderScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const devotionalId = getSingleParam(params.id);
  const devotionalQuery = useDevotional(devotionalId);
  const progressQuery = useReadingProgress(user?.id, devotionalId);
  const saveProgress = useSaveReadingProgress(user?.id, devotionalId);

  const persistScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      if (progressQuery.data?.completed_at || saveProgress.isPending) return;
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollableHeight = Math.max(1, contentSize.height - layoutMeasurement.height);
      const scrollPct = Math.round((contentOffset.y / scrollableHeight) * 100);
      if (scrollPct <= 0) return;
      saveProgress.mutate({ scrollPct: Math.min(99, scrollPct), completedAt: null });
    },
    [progressQuery.data?.completed_at, saveProgress],
  );

  if (devotionalQuery.isLoading || progressQuery.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Opening your reading..." />
      </View>
    );
  }

  if (devotionalQuery.isError || progressQuery.isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="This reading could not be opened"
          description="It may not be available to your account, or your connection may be offline."
          onRetry={() => {
            void devotionalQuery.refetch();
            void progressQuery.refetch();
          }}
        />
      </View>
    );
  }

  const devotional = devotionalQuery.data;
  if (!devotional) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="book-open"
          title="Reading unavailable"
          description="This devotional is not currently available to your account."
        />
      </View>
    );
  }

  const reference = formatReference(
    devotional.primary_book,
    devotional.primary_chapter,
    devotional.primary_verses,
  );
  const isCompleted = Boolean(progressQuery.data?.completed_at);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      onMomentumScrollEnd={persistScroll}
      onScrollEndDrag={persistScroll}
    >
      <Typography variant="reference" color="accent" style={styles.eyebrow}>
        {(devotional.devotional_series?.name ?? `DAY ${devotional.day_of_year}`).toUpperCase()}
      </Typography>
      <Typography variant="h1" style={styles.title}>{devotional.title}</Typography>

      {devotional.memory_verse ? (
        <View style={[styles.verseContainer, { borderLeftColor: colors.accent }]}>
          <Typography variant="journal" style={styles.verseText}>
            {devotional.memory_verse}
          </Typography>
          {reference ? (
            <Typography variant="reference" color="muted" align="right">
              {reference.toUpperCase()}
            </Typography>
          ) : null}
        </View>
      ) : null}

      {devotional.description ? (
        <Typography variant="body" style={styles.description}>
          {devotional.description}
        </Typography>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={isCompleted ? 'Reading Completed' : 'Mark as Completed'}
          variant="success"
          disabled={isCompleted}
          loading={saveProgress.isPending}
          onPress={() =>
            saveProgress.mutate({
              scrollPct: 100,
              completedAt: new Date().toISOString(),
            })
          }
        />
        <Button
          title="Open Full Devotional"
          variant="outline"
          onPress={() => void Linking.openURL(devotional.express_url)}
        />
      </View>

      {saveProgress.isError ? (
        <Typography variant="body" color="destructive" align="center">
          Your progress could not be saved. Please try again.
        </Typography>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 72 },
  eyebrow: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 32 },
  verseContainer: { marginBottom: 32, paddingLeft: 20, borderLeftWidth: 2 },
  verseText: { fontStyle: 'italic', marginBottom: 12 },
  description: { marginBottom: 32, lineHeight: 29 },
  actions: { gap: 12, marginTop: 16, marginBottom: 24 },
});