import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type DevotionalDetail = Tables<'devotionals'> & {
  devotional_series?: Pick<
    Tables<'devotional_series'>,
    'id' | 'name' | 'cover_path'
  > | null;
};

const progressKey = (userId: string | undefined, devotionalId: string | undefined) =>
  ['reading-progress', userId, devotionalId] as const;

const devotionalCacheKey = (devotionalId: string) =>
  `grow365.devotional-metadata.${devotionalId}`;

export function useDevotional(devotionalId: string | undefined) {
  return useQuery({
    queryKey: ['devotional', devotionalId],
    enabled: Boolean(devotionalId),
    queryFn: async (): Promise<DevotionalDetail | null> => {
      if (!devotionalId) return null;
      try {
        const { data, error } = await supabase
          .from('devotionals')
          .select('*, devotional_series(id, name, cover_path)')
          .eq('id', devotionalId)
          .eq('status', 'published')
          .maybeSingle();
        if (error) throw error;

        if (data) {
          void AsyncStorage.setItem(
            devotionalCacheKey(devotionalId),
            JSON.stringify(data),
          );
        }
        return data;
      } catch (error) {
        const cached = await AsyncStorage.getItem(devotionalCacheKey(devotionalId));
        if (!cached) throw error;
        return JSON.parse(cached) as DevotionalDetail;
      }
    },
  });
}

export function useReadingProgress(
  userId: string | undefined,
  devotionalId: string | undefined,
) {
  return useQuery({
    queryKey: progressKey(userId, devotionalId),
    enabled: Boolean(userId && devotionalId),
    queryFn: async (): Promise<Tables<'reading_progress'> | null> => {
      if (!userId || !devotionalId) return null;
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('devotional_id', devotionalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveReadingProgress(
  userId: string | undefined,
  devotionalId: string | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scrollPct,
      completedAt,
    }: {
      scrollPct: number;
      completedAt?: string | null;
    }): Promise<Tables<'reading_progress'>> => {
      if (!userId || !devotionalId) {
        throw new Error('Sign in to save reading progress.');
      }

      const { data: existing } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('devotional_id', devotionalId)
        .maybeSingle();

      const newCompletedAt = completedAt !== undefined 
        ? completedAt 
        : (existing?.completed_at ?? null);

      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(
          {
            user_id: userId,
            devotional_id: devotionalId,
            scroll_pct: Math.max(0, Math.min(100, scrollPct)),
            completed_at: newCompletedAt,
            first_opened: existing?.first_opened ?? new Date().toISOString(),
          },
          { onConflict: 'user_id,devotional_id' },
        )
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (progress) => {
      queryClient.setQueryData(progressKey(userId, devotionalId), progress);
      void queryClient.invalidateQueries({ queryKey: ['year-ribbon', userId] });
      void queryClient.invalidateQueries({ queryKey: ['partial-reading', userId] });
      void queryClient.invalidateQueries({ queryKey: ['devotional-archive', userId] });
    },
  });
}