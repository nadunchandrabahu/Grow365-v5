import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const GROUP_COVERS_BUCKET = 'group-covers';

/**
 * Private group cover URLs are intentionally kept in React Query memory only.
 * The user id is part of the key so a signed URL is never reused across users.
 */
export function useGroupCoverUrl(
  path: string | null | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: ['group-cover-url', userId, path],
    enabled: Boolean(userId && path),
    staleTime: 50 * 60 * 1000,
    refetchInterval: 50 * 60 * 1000,
    gcTime: 0,
    queryFn: async (): Promise<string | null> => {
      if (!userId || !path) return null;
      const { data, error } = await supabase.storage
        .from(GROUP_COVERS_BUCKET)
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}