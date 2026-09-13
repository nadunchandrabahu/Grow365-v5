import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database, Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type BookmarkKind = Database['public']['Enums']['bookmark_kind'];
type BookmarkRow = Tables<'bookmarks'>;

export interface BookmarkTarget {
  kind: BookmarkKind;
  devotionalId?: string;
  targetId?: string;
  bibleRef?: string;
  label?: string;
}

export interface ResolvedBookmark {
  bookmark: BookmarkRow;
  title: string;
  excerpt: string | null;
  groupId: string | null;
  groupName: string | null;
  devotional: {
    id: string;
    title: string;
    dayOfYear: number;
    coverPath: string | null;
    seriesName: string | null;
  } | null;
  unavailable: boolean;
}

const bookmarkKey = (
  userId: string | undefined,
  target: BookmarkTarget | undefined,
) => [
  'bookmark',
  target?.kind,
  userId,
  target?.devotionalId ?? null,
  target?.targetId ?? null,
  target?.bibleRef ?? null,
] as const;

function targetFilters<T>(
  query: T,
  target: BookmarkTarget,
): T {
  let filtered = query as T & {
    eq: (column: string, value: string) => typeof filtered;
  };
  if (target.devotionalId) {
    filtered = filtered.eq('devotional_id', target.devotionalId);
  }
  if (target.targetId) filtered = filtered.eq('target_id', target.targetId);
  if (target.bibleRef) filtered = filtered.eq('bible_ref', target.bibleRef);
  return filtered as T;
}

export function useEntityBookmark(
  userId: string | undefined,
  target: BookmarkTarget | undefined,
) {
  return useQuery({
    queryKey: bookmarkKey(userId, target),
    enabled: Boolean(
      userId &&
        target &&
        (target.devotionalId || target.targetId || target.bibleRef),
    ),
    queryFn: async (): Promise<BookmarkRow | null> => {
      if (!userId || !target) return null;
      let query = supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('kind', target.kind);
      query = targetFilters(query, target);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleEntityBookmark(
  userId: string | undefined,
  target: BookmarkTarget | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isBookmarked: boolean): Promise<BookmarkRow | null> => {
      if (
        !userId ||
        !target ||
        (!target.devotionalId && !target.targetId && !target.bibleRef)
      ) {
        throw new Error('Bookmark target is unavailable');
      }

      if (isBookmarked) {
        let query = supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('kind', target.kind);
        query = targetFilters(query, target);
        const { error } = await query;
        if (error) throw error;
        return null;
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          kind: target.kind,
          devotional_id: target.devotionalId ?? null,
          target_id: target.targetId ?? null,
          bible_ref: target.bibleRef ?? null,
          label: target.label ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(bookmarkKey(userId, target), data);
      void queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
    },
  });
}

export function useBookmark(
  userId: string | undefined,
  devotionalId: string | undefined,
) {
  return useEntityBookmark(
    userId,
    devotionalId
      ? { kind: 'devotional', devotionalId }
      : undefined,
  );
}

export function useToggleBookmark(
  userId: string | undefined,
  devotionalId: string | undefined,
) {
  return useToggleEntityBookmark(
    userId,
    devotionalId
      ? {
          kind: 'devotional',
          devotionalId,
          label: 'Devotional',
        }
      : undefined,
  );
}

export function useBookmarks(userId: string | undefined) {
  return useQuery({
    queryKey: ['bookmarks', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ResolvedBookmark[]> => {
      if (!userId) return [];
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const devotionalIds = bookmarks
        .filter((row) => row.kind === 'devotional' && row.devotional_id)
        .map((row) => row.devotional_id as string);
      const noteIds = bookmarks
        .filter((row) => row.kind === 'note' && row.target_id)
        .map((row) => row.target_id as string);
      const questionIds = bookmarks
        .filter((row) => row.kind === 'question' && row.target_id)
        .map((row) => row.target_id as string);

      const [devotionalsResult, notesResult, questionsResult] =
        await Promise.all([
          devotionalIds.length
            ? supabase
                .from('devotionals')
                .select(
                  'id, title, day_of_year, cover_path, devotional_series(name, cover_path)',
                )
                .in('id', devotionalIds)
            : Promise.resolve({ data: [], error: null }),
          noteIds.length
            ? supabase
                .from('group_notes')
                .select('id, title, content, group_id, groups(name)')
                .in('id', noteIds)
            : Promise.resolve({ data: [], error: null }),
          questionIds.length
            ? supabase
                .from('group_questions')
                .select('id, title, body, group_id, groups(name)')
                .in('id', questionIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (devotionalsResult.error) throw devotionalsResult.error;
      if (notesResult.error) throw notesResult.error;
      if (questionsResult.error) throw questionsResult.error;

      const devotionals = new Map(
        devotionalsResult.data.map((row) => [row.id, row]),
      );
      const notes = new Map(notesResult.data.map((row) => [row.id, row]));
      const questions = new Map(
        questionsResult.data.map((row) => [row.id, row]),
      );

      return bookmarks.map((bookmark): ResolvedBookmark => {
        if (bookmark.kind === 'devotional') {
          const devotional = bookmark.devotional_id
            ? devotionals.get(bookmark.devotional_id)
            : undefined;
          const series =
            devotional?.devotional_series &&
            !Array.isArray(devotional.devotional_series)
              ? devotional.devotional_series
              : null;
          return {
            bookmark,
            title: devotional?.title ?? bookmark.label ?? 'Saved devotional',
            excerpt: devotional
              ? `Day ${devotional.day_of_year}${series?.name ? ` · ${series.name}` : ''}`
              : null,
            groupId: null,
            groupName: null,
            devotional: devotional
              ? {
                  id: devotional.id,
                  title: devotional.title,
                  dayOfYear: devotional.day_of_year,
                  coverPath:
                    devotional.cover_path ?? series?.cover_path ?? null,
                  seriesName: series?.name ?? null,
                }
              : null,
            unavailable: !devotional,
          };
        }

        if (bookmark.kind === 'note') {
          const note = bookmark.target_id
            ? notes.get(bookmark.target_id)
            : undefined;
          const group =
            note?.groups && !Array.isArray(note.groups) ? note.groups : null;
          return {
            bookmark,
            title: note?.title ?? bookmark.label ?? 'Saved note',
            excerpt: note?.content ?? null,
            groupId: note?.group_id ?? null,
            groupName: group?.name ?? null,
            devotional: null,
            unavailable: !note,
          };
        }

        if (bookmark.kind === 'question') {
          const question = bookmark.target_id
            ? questions.get(bookmark.target_id)
            : undefined;
          const group =
            question?.groups && !Array.isArray(question.groups)
              ? question.groups
              : null;
          return {
            bookmark,
            title: question?.title ?? bookmark.label ?? 'Saved question',
            excerpt: question?.body ?? null,
            groupId: question?.group_id ?? null,
            groupName: group?.name ?? null,
            devotional: null,
            unavailable: !question,
          };
        }

        return {
          bookmark,
          title: bookmark.label ?? bookmark.bible_ref ?? 'Saved passage',
          excerpt:
            bookmark.label && bookmark.label !== bookmark.bible_ref
              ? bookmark.bible_ref
              : null,
          groupId: null,
          groupName: null,
          devotional: null,
          unavailable: !bookmark.bible_ref,
        };
      });
    },
  });
}

export function useRemoveBookmark(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookmarkId: string): Promise<void> => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
      void queryClient.invalidateQueries({ queryKey: ['bookmark'] });
    },
  });
}

export function useSavePassageBookmark(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bibleRef,
      label,
    }: {
      bibleRef: string;
      label: string;
    }): Promise<BookmarkRow> => {
      if (!userId) throw new Error('Not signed in');
      const reference = bibleRef.trim();
      if (!reference) throw new Error('Enter a Bible reference');
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          kind: 'passage',
          bible_ref: reference,
          label: label.trim() || reference,
          devotional_id: null,
          target_id: null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
    },
  });
}