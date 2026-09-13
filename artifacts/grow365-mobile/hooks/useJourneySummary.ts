import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useJourneySummary(userId: string | undefined) {
  return useQuery({
    queryKey: ['journey-summary', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const [dayResult, progressResult] = await Promise.all([
        supabase.rpc('current_journey_day', { uid: userId }),
        supabase
          .from('reading_progress')
          .select('devotional_id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('completed_at', 'is', null),
      ]);
      if (dayResult.error) throw dayResult.error;
      if (progressResult.error) throw progressResult.error;
      return { currentDay: dayResult.data, completedCount: progressResult.count ?? 0 };
    },
  });
}