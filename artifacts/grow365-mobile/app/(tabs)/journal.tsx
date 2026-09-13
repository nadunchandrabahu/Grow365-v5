import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  type JournalListEntry,
  useJournalEntries,
} from '@/hooks/useJournal';

function formatEntryDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function entryTitle(entry: JournalListEntry): string {
  return entry.title?.trim() || 'Untitled reflection';
}

function entryExcerpt(entry: JournalListEntry): string {
  return entry.content.trim() || 'A quiet page waiting for your words.';
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const entriesQuery = useJournalEntries(user?.id, debouncedSearch);
  const isWeb = Platform.OS === 'web';

  const listHeader = (
    <View>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Typography variant="reference" color="muted">
            PRIVATE TO YOU
          </Typography>
          <Typography variant="h1">Journal</Typography>
        </View>
        <Pressable
          onPress={() => router.push('/journal/new')}
          style={[
            styles.newButton,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Write a new journal entry"
        >
          <Feather name="edit-3" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <View
        style={[
          styles.search,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={19} color={colors.mutedForeground} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search your journal"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
          autoCapitalize="none"
          accessibilityLabel="Search journal entries"
        />
        {searchText.length > 0 && (
          <Pressable
            onPress={() => setSearchText('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear journal search"
          >
            <Feather name="x" size={19} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (entriesQuery.isLoading) {
    return (
      <View
        style={[
          styles.state,
          {
            backgroundColor: colors.background,
            paddingTop: isWeb ? Math.max(insets.top, 67) : insets.top,
          },
        ]}
      >
        {listHeader}
        <LoadingState message="Opening your journal..." />
      </View>
    );
  }

  if (entriesQuery.isError) {
    return (
      <View
        style={[
          styles.state,
          {
            backgroundColor: colors.background,
            paddingTop: isWeb ? Math.max(insets.top, 67) : insets.top,
          },
        ]}
      >
        {listHeader}
        <ErrorState
          title="Your journal could not be opened"
          description="Your entries remain private. Check your connection and try again."
          onRetry={() => void entriesQuery.refetch()}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: isWeb ? Math.max(insets.top, 67) + 20 : insets.top + 20,
          paddingBottom: isWeb ? 118 : insets.bottom + 110,
        },
      ]}
      data={entriesQuery.data ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={listHeader}
      refreshControl={(
        <RefreshControl
          refreshing={entriesQuery.isRefetching}
          onRefresh={() => void entriesQuery.refetch()}
          tintColor={colors.primary}
        />
      )}
      ListEmptyComponent={(
        <EmptyState
          icon={debouncedSearch ? 'search' : 'book-open'}
          title={debouncedSearch ? 'No entries found' : 'Your journal is ready'}
          description={
            debouncedSearch
              ? 'Try a different word or phrase.'
              : 'Write freely. Every entry is private and saved only to your account.'
          }
          actionLabel={debouncedSearch ? 'Clear Search' : 'Write an Entry'}
          onAction={() => {
            if (debouncedSearch) setSearchText('');
            else router.push('/journal/new');
          }}
        />
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/journal/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${entryTitle(item)}`}
        >
          <Card style={styles.entryCard}>
            <View style={styles.entryTopRow}>
              <Typography variant="reference" color="muted">
                {formatEntryDate(item.entry_date).toUpperCase()}
              </Typography>
              {item.section && (
                <View
                  style={[
                    styles.sectionPill,
                    { backgroundColor: colors.muted, borderRadius: colors.radius },
                  ]}
                >
                  <Typography variant="caption" color="accent">
                    {item.section}
                  </Typography>
                </View>
              )}
            </View>
            <Typography variant="h3">{entryTitle(item)}</Typography>
            <Typography
              variant="journal"
              color="muted"
              numberOfLines={3}
              style={styles.excerpt}
            >
              {entryExcerpt(item)}
            </Typography>
            {(item.bible_ref || item.devotionalTitle) && (
              <View style={[styles.context, { borderTopColor: colors.border }]}>
                {item.bible_ref && (
                  <Typography variant="reference" color="accent">
                    {item.bible_ref}
                  </Typography>
                )}
                {item.devotionalTitle && (
                  <Typography variant="caption" color="muted" numberOfLines={1}>
                    From {item.devotionalTitle}
                  </Typography>
                )}
              </View>
            )}
          </Card>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  state: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headingCopy: {
    gap: 4,
  },
  newButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    paddingVertical: 12,
  },
  entryCard: {
    padding: 20,
    marginBottom: 14,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  excerpt: {
    marginTop: 8,
  },
  context: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
    gap: 5,
  },
});