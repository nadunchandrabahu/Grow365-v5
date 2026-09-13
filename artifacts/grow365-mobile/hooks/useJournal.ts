import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export const JOURNAL_SECTIONS = [
  'Encounter',
  'Pray',
  'Read',
  'Process',
  'Peek',
  'Practice',
  'Ponder',
] as const;

export type JournalSection = (typeof JOURNAL_SECTIONS)[number];
export type JournalEntry = Tables<'journal_entries'>;

export type JournalListEntry = JournalEntry & {
  devotionalTitle: string | null;
};

export interface JournalDraftFields {
  title: string;
  content: string;
  bibleRef: string;
  section: JournalSection | null;
  entryDate: string;
  devotionalId: string | null;
}

export interface SaveJournalInput extends JournalDraftFields {
  id?: string;
  userId: string;
}

async function addDevotionalTitles(
  entries: JournalEntry[],
): Promise<JournalListEntry[]> {
  const devotionalIds = Array.from(
    new Set(
      entries
        .map((entry) => entry.devotional_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const titleById = new Map<string, string>();
  if (devotionalIds.length > 0) {
    const { data, error } = await supabase
      .from('devotionals')
      .select('id, title')
      .in('id', devotionalIds);
    if (error) throw error;
    data.forEach((devotional) => titleById.set(devotional.id, devotional.title));
  }

  return entries.map((entry) => ({
    ...entry,
    devotionalTitle: entry.devotional_id
      ? titleById.get(entry.devotional_id) ?? null
      : null,
  }));
}

export function useJournalEntries(
  userId: string | undefined,
  searchTerm: string,
) {
  return useQuery({
    queryKey: ['journal-entries', userId, searchTerm],
    enabled: Boolean(userId),
    queryFn: async (): Promise<JournalListEntry[]> => {
      if (!userId) return [];
      const term = searchTerm.trim();

      if (term) {
        const { data, error } = await supabase.rpc('search_journal_entries', {
          search_term: term,
        });
        if (error) throw error;
        const ownedEntries = data.filter((entry) => entry.user_id === userId);
        return addDevotionalTitles(ownedEntries);
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return addDevotionalTitles(data);
    },
  });
}

export function useJournalEntry(
  userId: string | undefined,
  entryId: string | undefined,
) {
  return useQuery({
    queryKey: ['journal-entry', userId, entryId],
    enabled: Boolean(userId && entryId),
    queryFn: async (): Promise<JournalEntry | null> => {
      if (!userId || !entryId) return null;
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveJournalInput): Promise<JournalEntry> => {
      const values = {
        user_id: input.userId,
        title: input.title.trim() || null,
        content: input.content,
        bible_ref: input.bibleRef.trim() || null,
        section: input.section,
        entry_date: input.entryDate,
        devotional_id: input.devotionalId,
        group_id: null,
        is_private: true,
        updated_at: new Date().toISOString(),
      };

      if (input.id) {
        const { data, error } = await supabase
          .from('journal_entries')
          .update(values)
          .eq('id', input.id)
          .eq('user_id', input.userId)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(values)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (entry) => {
      queryClient.setQueryData(
        ['journal-entry', entry.user_id, entry.id],
        entry,
      );
      void queryClient.invalidateQueries({
        queryKey: ['journal-entries', entry.user_id],
      });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      userId,
    }: {
      id: string;
      userId: string;
    }): Promise<void> => {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: ['journal-entry', variables.userId, variables.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['journal-entries', variables.userId],
      });
    },
  });
}