import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Devotional = Tables<'devotionals'>;

export function useTodayDevotional(userId: string | undefined) {
  return useQuery({
    queryKey: ['today-devotional', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Devotional | null> => {
      const { data: journeyDay, error: journeyError } = await supabase.rpc(
        'current_journey_day',
      );
      if (journeyError) throw journeyError;

      const { data, error } = await supabase
        .from('devotionals')
        .select('*')
        .eq('day_of_year', journeyDay)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useLatestCompletedReading(userId: string | undefined) {
  return useQuery({
    queryKey: ['latest-completed-reading', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<{
      completedAt: string;
      devotional: Pick<Devotional, 'id' | 'title'>;
    } | null> => {
      if (!userId) return null;
      const { data: progress, error: progressError } = await supabase
        .from('reading_progress')
        .select('completed_at, devotional_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (progressError) throw progressError;
      if (!progress?.completed_at) return null;

      const { data: devotional, error: devotionalError } = await supabase
        .from('devotionals')
        .select('id, title')
        .eq('id', progress.devotional_id)
        .single();
      if (devotionalError) throw devotionalError;

      return { completedAt: progress.completed_at, devotional };
    },
  });
}