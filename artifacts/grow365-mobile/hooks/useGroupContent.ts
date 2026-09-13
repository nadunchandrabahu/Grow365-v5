import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export interface GroupContent {
  group: Pick<Tables<'groups'>, 'id' | 'name' | 'description'>;
  memberCount: number;
  notes: Array<
    Pick<
      Tables<'group_notes'>,
      'id' | 'title' | 'content' | 'bible_ref' | 'updated_at'
    > & {
      profiles: { display_name: string } | null;
    }
  >;
  questions: Array<
    Pick<
      Tables<'group_questions'>,
      'id' | 'title' | 'body' | 'bible_ref' | 'updated_at' | 'is_resolved'
    > & {
      profiles: { display_name: string } | null;
    }
  >;
}

export function useGroupContent(
  userId: string | undefined,
  groupId: string | undefined,
) {
  return useQuery({
    queryKey: ['group-content', userId, groupId],
    enabled: Boolean(userId && groupId),
    queryFn: async (): Promise<GroupContent | null> => {
      if (!userId || !groupId) return null;
      const [groupResult, membersResult, notesResult, questionsResult] =
        await Promise.all([
          supabase
            .from('groups')
            .select('id, name, description')
            .eq('id', groupId)
            .maybeSingle(),
          supabase
            .from('group_members')
            .select('user_id', { count: 'exact', head: true })
            .eq('group_id', groupId),
          supabase
            .from('group_notes')
            .select(
              'id, title, content, bible_ref, updated_at, profiles(display_name)',
            )
            .eq('group_id', groupId)
            .order('updated_at', { ascending: false }),
          supabase
            .from('group_questions')
            .select(
              'id, title, body, bible_ref, updated_at, is_resolved, profiles(display_name)',
            )
            .eq('group_id', groupId)
            .order('updated_at', { ascending: false }),
        ]);

      if (groupResult.error) throw groupResult.error;
      if (!groupResult.data) return null;
      if (membersResult.error) throw membersResult.error;
      if (notesResult.error) throw notesResult.error;
      if (questionsResult.error) throw questionsResult.error;

      return {
        group: groupResult.data,
        memberCount: membersResult.count ?? 0,
        notes: notesResult.data.map((note) => ({
          ...note,
          profiles:
            note.profiles && !Array.isArray(note.profiles)
              ? note.profiles
              : null,
        })),
        questions: questionsResult.data.map((question) => ({
          ...question,
          profiles:
            question.profiles && !Array.isArray(question.profiles)
              ? question.profiles
              : null,
        })),
      };
    },
  });
}

export function useMyGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-groups', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<
      Array<Pick<Tables<'groups'>, 'id' | 'name' | 'description'>>
    > => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(id, name, description)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return data.flatMap((membership) => {
        const group =
          membership.groups && !Array.isArray(membership.groups)
            ? membership.groups
            : null;
        return group ? [group] : [];
      });
    },
  });
}