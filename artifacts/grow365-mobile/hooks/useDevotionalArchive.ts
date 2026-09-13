import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type ArchiveSeries = Pick<Tables<'devotional_series'>, 'id' | 'name'>;

type ArchiveDevotionalRow = Pick<
  Tables<'devotionals'>,
  | 'id'
  | 'title'
  | 'description'
  | 'day_of_year'
  | 'publish_date'
  | 'primary_book'
  | 'primary_chapter'
  | 'primary_verses'
> & {
  devotional_series: ArchiveSeries | null;
};

export type ArchiveDevotional = ArchiveDevotionalRow & {
  completed: boolean;
};

export function useDevotionalArchive(userId: string | undefined) {
  return useQuery({
    queryKey: ['devotional-archive', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ArchiveDevotional[]> => {
      if (!userId) return [];

      const [devotionalsResult, progressResult] = await Promise.all([
        supabase
          .from('devotionals')
          .select(`
            id,
            title,
            description,
            day_of_year,
            publish_date,
            primary_book,
            primary_chapter,
            primary_verses,
            devotional_series (
              id,
              name
            )
          `)
          .eq('status', 'published')
          .order('day_of_year', { ascending: false }),
        supabase
          .from('reading_progress')
          .select('devotional_id, completed_at')
          .eq('user_id', userId)
          .not('completed_at', 'is', null),
      ]);

      if (devotionalsResult.error) throw devotionalsResult.error;
      if (progressResult.error) throw progressResult.error;

      const completedIds = new Set(
        progressResult.data.map((progress) => progress.devotional_id),
      );

      return devotionalsResult.data.map((devotional) => ({
        ...devotional,
        completed: completedIds.has(devotional.id),
      }));
    },
  });
}