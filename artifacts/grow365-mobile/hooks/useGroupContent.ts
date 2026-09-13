import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type Profile = { display_name: string } | null;
type Group = Pick<
  Tables<'groups'>,
  'id' | 'name' | 'description' | 'cover_path' | 'owner_id' | 'created_at'
>;
type Note = Pick<
  Tables<'group_notes'>,
  | 'id'
  | 'title'
  | 'content'
  | 'bible_ref'
  | 'updated_at'
  | 'created_at'
  | 'author_id'
  | 'devotional_id'
  | 'visibility'
> & { profiles: Profile };
type Question = Pick<
  Tables<'group_questions'>,
  | 'id'
  | 'title'
  | 'body'
  | 'bible_ref'
  | 'updated_at'
  | 'created_at'
  | 'author_id'
  | 'devotional_id'
  | 'is_resolved'
  | 'reply_count'
> & { profiles: Profile };
type Reply = Pick<
  Tables<'question_replies'>,
  'id' | 'question_id' | 'parent_id' | 'body' | 'created_at' | 'updated_at' | 'author_id'
> & { profiles: Profile };

export interface GroupContent {
  group: Group;
  memberCount: number;
  members: Array<
    Pick<Tables<'group_members'>, 'user_id' | 'role' | 'joined_at'> & {
      profiles: Profile;
    }
  >;
  notes: Note[];
  questions: Question[];
  replies: Reply[];
  linkedDevotionals: Array<
    Pick<Tables<'devotionals'>, 'id' | 'title' | 'day_of_year'>
  >;
  devotionalOptions: Array<
    Pick<Tables<'devotionals'>, 'id' | 'title' | 'day_of_year'>
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
            // The credential column is intentionally never selected or exposed.
            .select('id, name, description, cover_path, owner_id, created_at')
            .eq('id', groupId)
            .maybeSingle(),
          supabase
            .from('group_members')
            .select('user_id, role, joined_at, profiles(display_name)', {
              count: 'exact',
            })
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true }),
          supabase
            .from('group_notes')
            .select(
              'id, title, content, bible_ref, updated_at, created_at, author_id, devotional_id, visibility, profiles(display_name)',
            )
            .eq('group_id', groupId)
            .order('updated_at', { ascending: false }),
          supabase
            .from('group_questions')
            .select(
              'id, title, body, bible_ref, updated_at, created_at, author_id, devotional_id, is_resolved, reply_count, profiles(display_name)',
            )
            .eq('group_id', groupId)
            .order('updated_at', { ascending: false }),
        ]);

      if (groupResult.error) throw groupResult.error;
      if (!groupResult.data) return null;
      if (membersResult.error) throw membersResult.error;
      if (notesResult.error) throw notesResult.error;
      if (questionsResult.error) throw questionsResult.error;

      const questionIds = questionsResult.data.map((question) => question.id);
      const repliesResult = questionIds.length
        ? await supabase
            .from('question_replies')
            .select(
              'id, question_id, parent_id, body, created_at, updated_at, author_id, profiles(display_name)',
            )
            .in('question_id', questionIds)
            .order('created_at', { ascending: true })
        : { data: [], error: null };
      if (repliesResult.error) throw repliesResult.error;

      const devotionalIds = [
        ...notesResult.data.map((note) => note.devotional_id),
        ...questionsResult.data.map((question) => question.devotional_id),
      ].filter((id): id is string => Boolean(id));
      const [linkedDevotionalsResult, publishedDevotionalsResult] =
        await Promise.all([
          devotionalIds.length
            ? supabase
                .from('devotionals')
                .select('id, title, day_of_year')
                .in('id', [...new Set(devotionalIds)])
            : Promise.resolve({ data: [], error: null }),
          supabase
            .from('devotionals')
            .select('id, title, day_of_year')
            .eq('status', 'published')
            .order('publish_date', { ascending: false })
            .limit(100),
        ]);
      if (linkedDevotionalsResult.error) throw linkedDevotionalsResult.error;
      if (publishedDevotionalsResult.error) {
        throw publishedDevotionalsResult.error;
      }
      const linkedDevotionals = linkedDevotionalsResult.data.filter(
        (devotional, index, all) =>
          all.findIndex((candidate) => candidate.id === devotional.id) === index,
      );
      const devotionalOptions = [
        ...linkedDevotionals,
        ...publishedDevotionalsResult.data,
      ].filter(
        (devotional, index, all) =>
          all.findIndex((candidate) => candidate.id === devotional.id) === index,
      );

      return {
        group: groupResult.data,
        memberCount: membersResult.count ?? 0,
        members: membersResult.data.map((member) => ({
          ...member,
          profiles:
            member.profiles && !Array.isArray(member.profiles)
              ? member.profiles
              : null,
        })),
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
        replies: repliesResult.data.map((reply) => ({
          ...reply,
          profiles:
            reply.profiles && !Array.isArray(reply.profiles)
              ? reply.profiles
              : null,
        })),
        linkedDevotionals,
        devotionalOptions,
      };
    },
  });
}

export function useMyGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-groups', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<
      Array<Pick<Tables<'groups'>, 'id' | 'name' | 'description' | 'cover_path'>>
    > => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('group_members')
        .select('groups(id, name, description, cover_path)')
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