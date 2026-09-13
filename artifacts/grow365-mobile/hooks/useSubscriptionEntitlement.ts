import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useSubscriptionEntitlement(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-entitlement', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc('has_active_subscription', {
        uid: userId,
      });
      if (error) throw error;
      return data;
    },
  });
}