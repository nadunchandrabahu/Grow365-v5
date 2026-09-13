import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

const bookmarkKey = (userId: string | undefined, devotionalId: string | undefined) => 
  ['bookmark', 'devotional', userId, devotionalId] as const;

export function useBookmark(userId: string | undefined, devotionalId: string | undefined) {
  return useQuery({
    queryKey: bookmarkKey(userId, devotionalId),
    enabled: Boolean(userId && devotionalId),
    queryFn: async (): Promise<Tables<'bookmarks'> | null> => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId!)
        .eq('devotional_id', devotionalId!)
        .eq('kind', 'devotional')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });
}

export function useToggleBookmark(userId: string | undefined, devotionalId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (!userId || !devotionalId) throw new Error('Not signed in');
      
      if (isBookmarked) {
        // remove
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('devotional_id', devotionalId)
          .eq('kind', 'devotional');
        if (error) throw error;
        return null;
      } else {
        // add
        const { data, error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: userId,
            devotional_id: devotionalId,
            kind: 'devotional',
            label: 'Devotional'
          })
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(bookmarkKey(userId, devotionalId), data);
      void queryClient.invalidateQueries({ queryKey: ['bookmarks', userId] });
    }
  });
}
