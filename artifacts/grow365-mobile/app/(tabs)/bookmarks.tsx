import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  type BookmarkKind,
  type ResolvedBookmark,
  useBookmarks,
  useRemoveBookmark,
  useSavePassageBookmark,
} from '@/hooks/useBookmarks';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | BookmarkKind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'devotional', label: 'Devotionals' },
  { value: 'passage', label: 'Passages' },
  { value: 'note', label: 'Notes' },
  { value: 'question', label: 'Questions' },
];

const KIND_LABELS: Record<BookmarkKind, string> = {
  devotional: 'Devotional',
  passage: 'Bible passage',
  note: 'Group note',
  question: 'Group question',
};

const KIND_ICONS: Record<BookmarkKind, keyof typeof Feather.glyphMap> = {
  devotional: 'book-open',
  passage: 'book',
  note: 'file-text',
  question: 'message-circle',
};

function coverUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from('devotional-assets').getPublicUrl(path).data
    .publicUrl;
}

function BookmarkArtwork({
  imageUrl,
  kind,
}: {
  imageUrl: string | null;
  kind: BookmarkKind;
}) {
  const colors = useColors();
  const [failed, setFailed] = useState<boolean>(false);
  useEffect(() => setFailed(false), [imageUrl]);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.cover}
        contentFit="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <Feather
      name={KIND_ICONS[kind]}
      size={22}
      color={colors.accent}
    />
  );
}

export default function BookmarksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [showPassageForm, setShowPassageForm] = useState<boolean>(false);
  const [passageRef, setPassageRef] = useState<string>('');
  const [passageLabel, setPassageLabel] = useState<string>('');
  const [passageError, setPassageError] = useState<string | null>(null);
  const [openedPassage, setOpenedPassage] =
    useState<ResolvedBookmark | null>(null);
  const [removeCandidate, setRemoveCandidate] =
    useState<ResolvedBookmark | null>(null);
  const bookmarksQuery = useBookmarks(user?.id);
  const removeBookmark = useRemoveBookmark(user?.id);
  const savePassage = useSavePassageBookmark(user?.id);

  const filtered = useMemo(
    () =>
      (bookmarksQuery.data ?? []).filter(
        (item) => filter === 'all' || item.bookmark.kind === filter,
      ),
    [bookmarksQuery.data, filter],
  );

  const openBookmark = (item: ResolvedBookmark): void => {
    if (item.unavailable) return;
    if (item.devotional) {
      router.push(`/devotional/${item.devotional.id}`);
    } else if (item.groupId) {
      router.push(`/groups/${item.groupId}`);
    } else if (item.bookmark.kind === 'passage') {
      setOpenedPassage(item);
    }
  };

  const confirmRemove = (item: ResolvedBookmark): void => {
    setRemoveCandidate(item);
  };

  const header = (
    <View>
      <Typography variant="reference" color="muted">
        SAVED FOR LATER
      </Typography>
      <View style={styles.headingRow}>
        <Typography variant="h1" style={styles.title}>
          Bookmarks
        </Typography>
        <Pressable
          onPress={() => setShowPassageForm(true)}
          style={[
            styles.addPassage,
            {
              backgroundColor: colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save a Bible passage"
        >
          <Feather name="plus" size={18} color={colors.foreground} />
          <Typography variant="caption">Passage</Typography>
        </Pressable>
      </View>
      <Typography variant="body" color="muted" style={styles.intro}>
        Devotionals, passages, notes, and questions you want to return to.
      </Typography>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((option) => {
          const selected = filter === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setFilter(option.value)}
              style={[
                styles.filter,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Typography
                variant="caption"
                style={{
                  color: selected
                    ? colors.primaryForeground
                    : colors.foreground,
                }}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (bookmarksQuery.isLoading) {
    return (
      <View
        style={[
          styles.state,
          {
            backgroundColor: colors.background,
            paddingTop:
              Platform.OS === 'web'
                ? Math.max(insets.top, 67) + 20
                : insets.top + 20,
          },
        ]}
      >
        {header}
        <LoadingState message="Gathering your bookmarks..." />
      </View>
    );
  }

  if (bookmarksQuery.isError) {
    return (
      <View
        style={[
          styles.state,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 20,
          },
        ]}
      >
        {header}
        <ErrorState
          title="Bookmarks are unavailable"
          description="Check your connection and try again."
          onRetry={() => void bookmarksQuery.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop:
            Platform.OS === 'web'
              ? Math.max(insets.top, 67) + 20
              : insets.top + 20,
          paddingBottom: Platform.OS === 'web' ? 118 : insets.bottom + 110,
        },
      ]}
      data={filtered}
      keyExtractor={(item) => item.bookmark.id}
      ListHeaderComponent={header}
      refreshControl={(
        <RefreshControl
          refreshing={bookmarksQuery.isRefetching}
          onRefresh={() => void bookmarksQuery.refetch()}
          tintColor={colors.primary}
        />
      )}
      ListEmptyComponent={(
        <EmptyState
          icon="bookmark"
          title={filter === 'all' ? 'No bookmarks yet' : `No ${FILTERS.find((item) => item.value === filter)?.label.toLowerCase()} saved`}
          description={
            filter === 'all'
              ? 'Save something meaningful and it will be waiting here.'
              : 'Choose another filter to see the rest of your saved items.'
          }
          actionLabel={filter === 'all' ? undefined : 'Show All'}
          onAction={filter === 'all' ? undefined : () => setFilter('all')}
        />
      )}
      renderItem={({ item }) => {
        const imageUrl = coverUrl(item.devotional?.coverPath ?? null);
        return (
          <Pressable
            onPress={() => openBookmark(item)}
            disabled={
              item.unavailable ||
              (!item.devotional &&
                !item.groupId &&
                item.bookmark.kind !== 'passage')
            }
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
          >
            <Card style={[styles.card, item.unavailable && styles.unavailable]}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: colors.muted,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <BookmarkArtwork
                  imageUrl={imageUrl}
                  kind={item.bookmark.kind}
                />
              </View>
              <View style={styles.cardCopy}>
                <Typography variant="reference" color="accent">
                  {KIND_LABELS[item.bookmark.kind].toUpperCase()}
                </Typography>
                <Typography variant="h3" numberOfLines={2}>
                  {item.title}
                </Typography>
                {item.unavailable ? (
                  <Typography variant="caption" color="muted">
                    This saved item is no longer available.
                  </Typography>
                ) : (
                  <>
                    {item.excerpt && (
                      <Typography variant="body" color="muted" numberOfLines={2}>
                        {item.excerpt}
                      </Typography>
                    )}
                    {item.groupName && (
                      <Typography variant="caption" color="muted">
                        {item.groupName}
                      </Typography>
                    )}
                  </>
                )}
              </View>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  confirmRemove(item);
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title} from bookmarks`}
              >
                <Feather name="bookmark" size={21} color={colors.accent} />
              </Pressable>
            </Card>
          </Pressable>
        );
      }}
      />
      <Modal
        visible={showPassageForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPassageForm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.modalHeading}>
              <View style={styles.cardCopy}>
                <Typography variant="reference" color="accent">
                  BIBLE PASSAGE
                </Typography>
                <Typography variant="h2">Save a reference</Typography>
              </View>
              <Pressable
                onPress={() => setShowPassageForm(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Typography variant="caption" color="muted">
              REFERENCE
            </Typography>
            <TextInput
              value={passageRef}
              onChangeText={(value) => {
                setPassageRef(value);
                setPassageError(null);
              }}
              placeholder="e.g. Philippians 2:1–2"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius,
                },
              ]}
              autoFocus
              accessibilityLabel="Bible reference"
            />
            <Typography variant="caption" color="muted">
              NOTE (OPTIONAL)
            </Typography>
            <TextInput
              value={passageLabel}
              onChangeText={setPassageLabel}
              placeholder="Why you want to return to it"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius,
                },
              ]}
              accessibilityLabel="Passage bookmark note"
            />
            {passageError && (
              <Typography variant="caption" color="destructive">
                {passageError}
              </Typography>
            )}
            <Button
              title="Save Passage"
              loading={savePassage.isPending}
              onPress={() => {
                if (!passageRef.trim()) {
                  setPassageError('Enter a Bible reference.');
                  return;
                }
                savePassage.mutate(
                  { bibleRef: passageRef, label: passageLabel },
                  {
                    onSuccess: () => {
                      setPassageRef('');
                      setPassageLabel('');
                      setShowPassageForm(false);
                      setFilter('passage');
                    },
                    onError: () =>
                      setPassageError(
                        'This passage could not be saved. It may already be bookmarked.',
                      ),
                  },
                );
              }}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(openedPassage)}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenedPassage(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.modalHeading}>
              <View style={styles.cardCopy}>
                <Typography variant="reference" color="accent">
                  SAVED PASSAGE
                </Typography>
                <Typography variant="h2">{openedPassage?.title}</Typography>
              </View>
              <Pressable
                onPress={() => setOpenedPassage(null)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close passage"
              >
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Typography variant="reference" color="accent">
              {openedPassage?.bookmark.bible_ref}
            </Typography>
            <Button title="Done" onPress={() => setOpenedPassage(null)} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(removeCandidate)}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoveCandidate(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Typography variant="reference" color="destructive">
              REMOVE BOOKMARK
            </Typography>
            <Typography variant="h2">Remove this saved item?</Typography>
            <Typography variant="body" color="muted">
              “{removeCandidate?.title}” will no longer appear in your
              bookmarks.
            </Typography>
            <View style={styles.modalActions}>
              <Button
                title="Keep"
                variant="outline"
                onPress={() => setRemoveCandidate(null)}
                style={styles.modalAction}
              />
              <Button
                title="Remove"
                loading={removeBookmark.isPending}
                onPress={() => {
                  if (!removeCandidate) return;
                  removeBookmark.mutate(removeCandidate.bookmark.id, {
                    onSuccess: () => setRemoveCandidate(null),
                  });
                }}
                style={styles.modalAction}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  state: { flex: 1, paddingHorizontal: 24 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { marginTop: 4 },
  addPassage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  intro: { marginTop: 8, maxWidth: 500 },
  filters: { gap: 8, paddingVertical: 22 },
  filter: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    marginBottom: 12,
  },
  unavailable: { opacity: 0.62 },
  iconBox: {
    width: 58,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: { width: '100%', height: '100%' },
  cardCopy: { flex: 1, gap: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 21, 0.48)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderWidth: 1,
    padding: 22,
    gap: 10,
  },
  modalHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalAction: { flex: 1 },
});