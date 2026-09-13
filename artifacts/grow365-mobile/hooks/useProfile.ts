import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tables, TablesUpdate } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Profile = Tables<'profiles'>;
export type ProfileUpdate = Omit<TablesUpdate<'profiles'>, 'id' | 'is_admin'>;

const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate): Promise<Profile> => {
      if (!userId) throw new Error('You need to sign in before updating your profile.');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKey(userId), profile);
    },
  });
}