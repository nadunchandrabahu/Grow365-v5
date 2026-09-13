import { useQuery } from '@tanstack/react-query';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Devotional = Tables<'devotionals'> & {
  devotional_series?: Tables<'devotional_series'> | null;
};

export function useTodayDevotional(userId: string | undefined) {
  return useQuery({
    queryKey: ['today-devotional', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Devotional | null> => {
      const { data: journeyDay, error: journeyError } = await supabase.rpc(
        'current_journey_day',
      );
      if (journeyError) throw journeyError;

      const { data, error } = await supabase
        .from('devotionals')
        .select('*, devotional_series(*)')
        .eq('day_of_year', journeyDay)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data as Devotional | null;
    },
  });
}

export function useLatestCompletedReading(userId: string | undefined) {
  return useQuery({
    queryKey: ['latest-completed-reading', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<{
      completedAt: string;
      devotional: Pick<Devotional, 'id' | 'title'>;
    } | null> => {
      if (!userId) return null;
      const { data: progress, error: progressError } = await supabase
        .from('reading_progress')
        .select('completed_at, devotional_id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (progressError) throw progressError;
      if (!progress?.completed_at) return null;

      const { data: devotional, error: devotionalError } = await supabase
        .from('devotionals')
        .select('id, title')
        .eq('id', progress.devotional_id)
        .single();
      if (devotionalError) throw devotionalError;

      return { completedAt: progress.completed_at, devotional };
    },
  });
}
export function useYearRibbon(userId: string | undefined) {
  return useQuery({
    queryKey: ['year-ribbon', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data: journeyDay, error: journeyError } = await supabase.rpc('current_journey_day');
      if (journeyError) throw journeyError;

      const { data: progress, error: progressError } = await supabase
        .from('reading_progress')
        .select(`
          completed_at,
          devotional_id,
          devotionals!inner (
            id,
            day_of_year,
            status
          )
        `)
        .eq('user_id', userId!)
        .eq('devotionals.status', 'published');
      
      if (progressError) throw progressError;

      const completedDays = new Set<number>();
      for (const p of progress) {
        if (p.completed_at && p.devotionals && !Array.isArray(p.devotionals)) {
          completedDays.add(p.devotionals.day_of_year);
        }
      }

      // Also get a map of available devotionals to their IDs so clicking a future available day works
      const { data: allDevos, error: allDevosError } = await supabase
        .from('devotionals')
        .select('id, day_of_year')
        .eq('status', 'published');
        
      if (allDevosError) throw allDevosError;
      
      const dayToDevoId = new Map<number, string>();
      for (const d of allDevos) {
        dayToDevoId.set(d.day_of_year, d.id);
      }

      return {
        currentDay: journeyDay,
        completedDays,
        dayToDevoId
      };
    }
  });
}

export function usePartialReading(userId: string | undefined) {
  return useQuery({
    queryKey: ['partial-reading', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_progress')
        .select(`
          scroll_pct,
          devotional_id,
          devotionals!inner (
            id,
            title,
            day_of_year,
            status
          )
        `)
        .eq('user_id', userId!)
        .is('completed_at', null)
        .gt('scroll_pct', 0)
        .eq('devotionals.status', 'published')
        .order('first_opened', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });
}

export type RecentActivityItem = {
  id: string;
  type: 'note' | 'question';
  title: string;
  preview: string;
  activityAt: string;
  groupId: string;
  groupName: string;
  authorId: string;
  authorName: string;
};

export function useRecentGroupActivity(userId: string | undefined) {
  return useQuery({
    queryKey: ['recent-group-activity', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<RecentActivityItem[]> => {
      // Fetch notes
      const { data: notes, error: notesError } = await supabase
        .from('group_notes')
        .select(`
          id,
          title,
          content,
          created_at,
          updated_at,
          groups (id, name),
          profiles (id, display_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(10);
        
      if (notesError) throw notesError;

      // Fetch questions
      const { data: questions, error: questionsError } = await supabase
        .from('group_questions')
        .select(`
          id,
          title,
          body,
          created_at,
          updated_at,
          groups (id, name),
          profiles (id, display_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(10);
        
      if (questionsError) throw questionsError;

      const items: RecentActivityItem[] = [];
      
      for (const n of notes || []) {
        if (!n.groups || Array.isArray(n.groups) || !n.profiles || Array.isArray(n.profiles)) continue;
        items.push({
          id: `note-${n.id}`,
          type: 'note',
          title: n.title || 'New note',
          preview: n.content.substring(0, 100),
          activityAt: n.updated_at || n.created_at,
          groupId: n.groups.id,
          groupName: n.groups.name,
          authorId: n.profiles.id,
          authorName: n.profiles.display_name,
        });
      }
      
      for (const q of questions || []) {
        if (!q.groups || Array.isArray(q.groups) || !q.profiles || Array.isArray(q.profiles)) continue;
        items.push({
          id: `question-${q.id}`,
          type: 'question',
          title: q.title,
          preview: (q.body || '').substring(0, 100),
          activityAt: q.updated_at || q.created_at,
          groupId: q.groups.id,
          groupName: q.groups.name,
          authorId: q.profiles.id,
          authorName: q.profiles.display_name,
        });
      }
      
      items.sort((a, b) => new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime());
      
      return items.slice(0, 5);
    }
  });
}
