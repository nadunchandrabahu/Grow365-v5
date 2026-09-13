import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import {
  type BookmarkTarget,
  useEntityBookmark,
  useToggleEntityBookmark,
} from '@/hooks/useBookmarks';
import { useColors } from '@/hooks/useColors';
import { useGroupContent } from '@/hooks/useGroupContent';

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function GroupBookmarkButton({
  target,
}: {
  target: BookmarkTarget;
}) {
  const colors = useColors();
  const { user } = useAuth();
  const bookmark = useEntityBookmark(user?.id, target);
  const toggle = useToggleEntityBookmark(user?.id, target);
  const saved = Boolean(bookmark.data);

  return (
    <Pressable
      onPress={() => {
        if (!toggle.isPending) toggle.mutate(saved);
      }}
      disabled={bookmark.isLoading || toggle.isPending}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove bookmark' : 'Save bookmark'}
    >
      <Feather
        name="bookmark"
        size={20}
        color={saved ? colors.accent : colors.mutedForeground}
      />
    </Pressable>
  );
}

export default function GroupScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const groupId = one(params.id);
  const groupQuery = useGroupContent(user?.id, groupId);

  if (groupQuery.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Opening the group..." />
      </View>
    );
  }

  if (groupQuery.isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="This group could not be opened"
          description="Check your connection or group membership and try again."
          onRetry={() => void groupQuery.refetch()}
        />
      </View>
    );
  }

  if (!groupQuery.data) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="users"
          title="Group not available"
          description="This group may no longer exist, or you may not be a member."
        />
      </View>
    );
  }

  const { group, memberCount, notes, questions } = groupQuery.data;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Typography variant="reference" color="muted">
        YOUR GROUP
      </Typography>
      <Typography variant="h1" style={styles.title}>
        {group.name}
      </Typography>
      <Typography variant="body" color="muted">
        {memberCount} {memberCount === 1 ? 'member' : 'members'}
      </Typography>
      {group.description && (
        <Typography variant="body" color="muted" style={styles.description}>
          {group.description}
        </Typography>
      )}

      <Typography variant="h3" style={styles.sectionTitle}>
        Notes
      </Typography>
      {notes.length === 0 ? (
        <Typography variant="body" color="muted" style={styles.quiet}>
          No shared notes yet.
        </Typography>
      ) : (
        notes.map((note) => (
          <Card key={note.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Typography variant="h3">
                  {note.title ?? 'Shared note'}
                </Typography>
                <Typography variant="caption" color="muted">
                  {note.profiles?.display_name ?? 'Group member'}
                </Typography>
              </View>
              <GroupBookmarkButton
                target={{
                  kind: 'note',
                  targetId: note.id,
                  label: note.title ?? 'Group note',
                }}
              />
            </View>
            {note.bible_ref && (
              <Typography variant="reference" color="accent">
                {note.bible_ref}
              </Typography>
            )}
            <Typography variant="body" color="muted" style={styles.body}>
              {note.content}
            </Typography>
          </Card>
        ))
      )}

      <Typography variant="h3" style={styles.sectionTitle}>
        Questions
      </Typography>
      {questions.length === 0 ? (
        <Typography variant="body" color="muted" style={styles.quiet}>
          No questions yet.
        </Typography>
      ) : (
        questions.map((question) => (
          <Card key={question.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Typography variant="h3">{question.title}</Typography>
                <Typography variant="caption" color="muted">
                  {question.profiles?.display_name ?? 'Group member'}
                  {question.is_resolved ? ' · Resolved' : ''}
                </Typography>
              </View>
              <GroupBookmarkButton
                target={{
                  kind: 'question',
                  targetId: question.id,
                  label: question.title,
                }}
              />
            </View>
            {question.bible_ref && (
              <Typography variant="reference" color="accent">
                {question.bible_ref}
              </Typography>
            )}
            {question.body && (
              <Typography variant="body" color="muted" style={styles.body}>
                {question.body}
              </Typography>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  state: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  title: { marginTop: 4, marginBottom: 8 },
  description: { marginTop: 12, maxWidth: 600 },
  sectionTitle: { marginTop: 34, marginBottom: 14 },
  quiet: { marginBottom: 8 },
  card: { padding: 18, marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardTitle: { flex: 1, gap: 3 },
  body: { marginTop: 10 },
});