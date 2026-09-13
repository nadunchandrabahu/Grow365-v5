import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ArchiveSeries = Pick<
  Tables<'devotional_series'>,
  'id' | 'name' | 'cover_path'
 >;

type ArchiveDevotionalRow = Pick<
  Tables<'devotionals'>,
  'id' | 'title' | 'day_of_year' | 'cover_path' | 'series_id'
> & {
  devotional_series: ArchiveSeries | null;
};

export type ArchiveDevotional = ArchiveDevotionalRow & {
  completed: boolean;
};

export interface DevotionalArchiveData {
  currentDay: number;
  devotionals: ArchiveDevotional[];
  series: ArchiveSeries[];
}

export function useDevotionalArchive(
  userId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['devotional-archive', userId],
    enabled: Boolean(userId && enabled),
    queryFn: async (): Promise<DevotionalArchiveData> => {
      if (!userId) {
        return { currentDay: 1, devotionals: [], series: [] };
      }

      const [dayResult, devotionalsResult, progressResult, seriesResult] =
        await Promise.all([
          supabase.rpc('current_journey_day'),
          supabase
            .from('devotionals')
            .select(
              'id, title, day_of_year, cover_path, series_id, devotional_series(id, name, cover_path)',
            )
            .eq('status', 'published')
            .order('day_of_year'),
          supabase
            .from('reading_progress')
            .select('devotional_id, completed_at')
            .eq('user_id', userId)
            .not('completed_at', 'is', null),
          supabase
            .from('devotional_series')
            .select('id, name, cover_path')
            .eq('is_active', true)
            .order('sort_order')
            .order('name'),
        ]);

      if (dayResult.error) throw dayResult.error;
      if (devotionalsResult.error) throw devotionalsResult.error;
      if (progressResult.error) throw progressResult.error;
      if (seriesResult.error) throw seriesResult.error;

      const completedIds = new Set(
        progressResult.data.map((progress) => progress.devotional_id),
      );

      return {
        currentDay: dayResult.data,
        devotionals: devotionalsResult.data.map((devotional) => ({
          ...devotional,
          completed: completedIds.has(devotional.id),
        })),
        series: seriesResult.data,
      };
    },
  });
}