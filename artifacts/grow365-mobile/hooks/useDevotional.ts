import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type DevotionalDetail = Tables<'devotionals'> & {
  devotional_series?: Pick<Tables<'devotional_series'>, 'id' | 'name'> | null;
};

const progressKey = (userId: string | undefined, devotionalId: string | undefined) =>
  ['reading-progress', userId, devotionalId] as const;

export function useDevotional(devotionalId: string | undefined) {
  return useQuery({
    queryKey: ['devotional', devotionalId],
    enabled: Boolean(devotionalId),
    queryFn: async (): Promise<DevotionalDetail | null> => {
      if (!devotionalId) return null;
      const { data, error } = await supabase
        .from('devotionals')
        .select('*, devotional_series(id, name)')
        .eq('id', devotionalId)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
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
      completedAt: string | null;
    }): Promise<Tables<'reading_progress'>> => {
      if (!userId || !devotionalId) {
        throw new Error('Sign in to save reading progress.');
      }

      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(
          {
            user_id: userId,
            devotional_id: devotionalId,
            scroll_pct: Math.max(0, Math.min(100, scrollPct)),
            completed_at: completedAt,
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
    },
  });
}