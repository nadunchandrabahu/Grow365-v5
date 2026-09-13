import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { ErrorState, LoadingState } from '@/components/State';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import {
  type ArchiveDevotional,
  useDevotionalArchive,
} from '@/hooks/useDevotionalArchive';
import { useSubscriptionEntitlement } from '@/hooks/useSubscriptionEntitlement';
import { supabase } from '@/lib/supabase';

type DayCell = {
  day: number;
  devotional: ArchiveDevotional | null;
};

function storageUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from('devotional-assets').getPublicUrl(path).data
    .publicUrl;
}

function DayArtwork({
  imageUrl,
  isFuture,
  hasDevotional,
}: {
  imageUrl: string | null;
  isFuture: boolean;
  hasDevotional: boolean;
}) {
  const colors = useColors();
  const [failed, setFailed] = useState<boolean>(false);
  useEffect(() => setFailed(false), [imageUrl]);

  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.placeholder,
          { backgroundColor: isFuture ? colors.muted : colors.card },
        ]}
      >
        {!isFuture && hasDevotional && (
          <Feather name="sun" size={18} color={colors.accent} />
        )}
      </View>
      {imageUrl && !isFuture && !failed && (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

function ArchiveInvitation() {
  const colors = useColors();
  const router = useRouter();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.invitation}
    >
      <View style={styles.previewGrid} accessibilityElementsHidden>
        {Array.from({ length: 15 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.previewCell,
              {
                backgroundColor:
                  index < 8 ? colors.card : colors.muted,
                borderColor: colors.border,
                opacity: 1 - index * 0.035,
              },
            ]}
          >
            <Typography variant="caption" color="muted">
              {index + 1}
            </Typography>
          </View>
        ))}
      </View>
      <View
        style={[
          styles.paywallCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View
          style={[
            styles.archiveIcon,
            { backgroundColor: colors.muted, borderRadius: colors.radius },
          ]}
        >
          <Feather name="archive" size={28} color={colors.accent} />
        </View>
        <Typography variant="reference" color="accent">
          SUPPORTER ARCHIVE
        </Typography>
        <Typography variant="h2" align="center">
          Return to every day
        </Typography>
        <Typography variant="body" color="muted" align="center">
          Subscribers can revisit published readings across the full 365-day
          journey and browse them by series.
        </Typography>
        <View style={[styles.freePromise, { borderTopColor: colors.border }]}>
          <Feather name="heart" size={18} color={colors.accent} />
          <Typography variant="body">
            Today’s devotional and your complete private journal always remain
            free.
          </Typography>
        </View>
        <Button
          title="View Subscription Information"
          onPress={() => router.push('/subscription')}
          style={styles.paywallButton}
        />
      </View>
    </ScrollView>
  );
}

export default function PastDevotionalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [seriesId, setSeriesId] = useState<string>('all');
  const entitlement = useSubscriptionEntitlement(user?.id);
  const archiveQuery = useDevotionalArchive(
    user?.id,
    entitlement.data === true,
  );
  const columns = width >= 900 ? 8 : width >= 600 ? 6 : 4;
  const dayCellWidth = (width - 32 - (columns - 1) * 7) / columns;

  const days = useMemo<DayCell[]>(() => {
    const devotionals = archiveQuery.data?.devotionals ?? [];
    const matching =
      seriesId === 'all'
        ? devotionals
        : devotionals.filter(
            (devotional) => devotional.series_id === seriesId,
          );
    const byDay = new Map<number, ArchiveDevotional>();
    matching.forEach((devotional) => {
      if (!byDay.has(devotional.day_of_year)) {
        byDay.set(devotional.day_of_year, devotional);
      }
    });
    return Array.from({ length: 365 }, (_, index) => ({
      day: index + 1,
      devotional: byDay.get(index + 1) ?? null,
    }));
  }, [archiveQuery.data?.devotionals, seriesId]);

  if (entitlement.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Checking archive access..." />
      </View>
    );
  }

  if (entitlement.isError) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Archive access could not be checked"
          description="Nothing has been unlocked. Check your connection and try again."
          onRetry={() => void entitlement.refetch()}
        />
      </View>
    );
  }

  if (!entitlement.data) return <ArchiveInvitation />;

  if (archiveQuery.isLoading) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState message="Opening the 365-day archive..." />
      </View>
    );
  }

  if (archiveQuery.isError || !archiveQuery.data) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          title="The archive could not be loaded"
          description="Check your connection and try again."
          onRetry={() => void archiveQuery.refetch()}
        />
      </View>
    );
  }

  const currentDay = archiveQuery.data.currentDay;
  const series = archiveQuery.data.series;

  return (
    <FlatList
      key={columns}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 36 },
      ]}
      data={days}
      numColumns={columns}
      columnWrapperStyle={styles.dayRow}
      keyExtractor={(item) => String(item.day)}
      refreshControl={(
        <RefreshControl
          refreshing={archiveQuery.isRefetching || entitlement.isRefetching}
          tintColor={colors.primary}
          onRefresh={() => {
            void entitlement.refetch();
            void archiveQuery.refetch();
          }}
        />
      )}
      ListHeaderComponent={(
        <View style={styles.header}>
          <Typography variant="reference" color="accent">
            THE 365-DAY JOURNEY
          </Typography>
          <Typography variant="h2" style={styles.heading}>
            Devotional Archive
          </Typography>
          <Typography variant="body" color="muted">
            Revisit any published day behind you. Days ahead will unfold in
            their time.
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {[{ id: 'all', name: 'All series' }, ...series].map((item) => {
              const selected = item.id === seriesId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSeriesId(item.id)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Typography
                    variant="caption"
                    style={{
                      color: selected
                        ? colors.primaryForeground
                        : colors.foreground,
                    }}
                  >
                    {item.name}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.legend}>
            <View style={[styles.legendMark, { borderColor: colors.accent }]} />
            <Typography variant="caption" color="muted">
              Today is Day {currentDay}
            </Typography>
          </View>
        </View>
      )}
      renderItem={({ item }) => {
        const isToday = item.day === currentDay;
        const isFuture = item.day > currentDay;
        const devotional = item.devotional;
        const seriesCover = devotional?.devotional_series?.cover_path ?? null;
        const imageUrl = storageUrl(
          devotional?.cover_path ?? seriesCover,
        );
        const canOpen = Boolean(devotional && !isFuture);
        const label = isToday
          ? `Today, Day ${item.day}${devotional ? `, ${devotional.title}` : ', no published reading'}`
          : isFuture
            ? `Day ${item.day}, ahead`
            : devotional
              ? `Open Day ${item.day}, ${devotional.title}`
              : `Day ${item.day}, no published reading`;

        return (
          <Pressable
            style={[styles.dayCellWrapper, { width: dayCellWidth }]}
            onPress={() => {
              if (devotional && canOpen) {
                router.push(`/devotional/${devotional.id}`);
              }
            }}
            disabled={!canOpen}
            accessibilityRole={canOpen ? 'link' : 'text'}
            accessibilityLabel={label}
          >
            <View
              style={[
                styles.dayCell,
                {
                  backgroundColor: colors.card,
                  borderColor: isToday ? colors.accent : colors.border,
                  borderWidth: isToday ? 2 : 1,
                  borderRadius: Math.max(colors.radius - 3, 4),
                  opacity: isFuture ? 0.32 : devotional ? 1 : 0.6,
                },
              ]}
            >
              <DayArtwork
                imageUrl={imageUrl}
                isFuture={isFuture}
                hasDevotional={Boolean(devotional)}
              />
              <View style={styles.dayNumberWrap}>
                <Typography
                  variant="caption"
                  style={{
                    color:
                      imageUrl && !isFuture
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                  }}
                >
                  {item.day}
                </Typography>
              </View>
              {devotional?.completed && !isFuture && (
                <View
                  style={[
                    styles.completed,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Feather name="check" size={10} color={colors.successForeground} />
                </View>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  state: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20 },
  header: { paddingHorizontal: 8, marginBottom: 16 },
  heading: { marginTop: 4, marginBottom: 8 },
  filters: { gap: 8, paddingVertical: 20 },
  filter: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendMark: { width: 14, height: 14, borderWidth: 2, borderRadius: 3 },
  dayRow: { gap: 7 },
  dayCellWrapper: { marginBottom: 7 },
  dayCell: { width: '100%', aspectRatio: 0.74, overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  dayNumberWrap: {
    position: 'absolute',
    left: 5,
    bottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  completed: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitation: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 22,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    opacity: 0.7,
  },
  previewCell: {
    width: 54,
    height: 70,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallCard: {
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  archiveIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freePromise: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 18,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  paywallButton: { width: '100%', marginTop: 6 },
});