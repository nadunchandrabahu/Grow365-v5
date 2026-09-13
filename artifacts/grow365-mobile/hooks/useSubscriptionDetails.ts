import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type SubscriptionDetails = Pick<
  Tables<'subscriptions'>,
  'platform' | 'granted_reason' | 'status' | 'period_end' | 'entitlement' | 'product_id' | 'will_renew' | 'is_in_grace' | 'updated_at'
> & { active: boolean };

export function useSubscriptionDetails(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-details', userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<SubscriptionDetails | null> => {
      if (!userId) return null;
      const [activeResult, subscriptionResult] = await Promise.all([
        supabase.rpc('has_active_subscription', { uid: userId }),
        supabase
          .from('subscriptions')
          .select('platform, granted_reason, status, period_end, entitlement, product_id, will_renew, is_in_grace, updated_at')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);
      if (activeResult.error) throw activeResult.error;
      if (subscriptionResult.error) throw subscriptionResult.error;
      if (!subscriptionResult.data) return null;
      return { ...subscriptionResult.data, active: activeResult.data };
    },
  });
}