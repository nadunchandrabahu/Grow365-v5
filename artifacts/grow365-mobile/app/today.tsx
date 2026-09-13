import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';

function dateInTimezone(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    const year = value('year');
    const month = value('month');
    const day = value('day');
    if (!year || !month || !day) throw new Error('The local date could not be determined.');
    return `${year}-${month}-${day}`;
  } catch {
    throw new Error('Your profile timezone is invalid. Update it in Settings and try again.');
  }
}

export default function TodayScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const profileQuery = useProfile(user?.id);
  const localDate = profileQuery.data?.timezone
    ? (() => {
        try {
          return dateInTimezone(profileQuery.data.timezone);
        } catch {
          return undefined;
        }
      })()
    : undefined;
  const timezoneError = Boolean(profileQuery.data?.timezone && !localDate);
  const devotionalQuery = useQuery({
    queryKey: ['notification-today-devotional', user?.id, localDate],
    enabled: Boolean(user?.id && localDate),
    queryFn: async () => {
      if (!localDate) throw new Error('Your local date could not be determined.');
      const { data, error } = await supabase
        .from('devotionals')
        .select('id')
        .eq('publish_date', localDate)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (devotionalQuery.data?.id) {
      router.replace(`/devotional/${devotionalQuery.data.id}`);
    }
  }, [devotionalQuery.data?.id, router]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (profileQuery.isLoading || devotionalQuery.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Finding today's reading..." />
      </View>
    );
  }
  if (profileQuery.isError || devotionalQuery.isError || timezoneError || !profileQuery.data) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title={!profileQuery.data ? 'Your profile could not be found' : 'Today could not be opened'}
          description={
            !profileQuery.data
              ? 'Your account is signed in, but its profile record is missing.'
              : timezoneError
                ? 'Your profile timezone is invalid. Update it in Settings and try again.'
              : devotionalQuery.error instanceof Error
                ? devotionalQuery.error.message
                : 'Check your connection and try again.'
          }
          onRetry={() => {
            void profileQuery.refetch();
            void devotionalQuery.refetch();
          }}
        />
        <Button title="Back" variant="ghost" onPress={goBack} />
      </View>
    );
  }

  if (!devotionalQuery.data) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="sun"
          title="No reading for today"
          description="There is not a published devotional for your local day yet. Take a quiet moment and check back soon."
        />
        <Button title="Back to home" variant="outline" onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={[styles.state, { backgroundColor: colors.background }]}>
      <LoadingState message="Opening today’s devotional…" />
    </View>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});