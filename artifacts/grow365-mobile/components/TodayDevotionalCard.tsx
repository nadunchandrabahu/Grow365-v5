import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import type { Devotional } from '@/hooks/useHomeData';

interface Props {
  devotional: Devotional;
}

export function TodayDevotionalCard({ devotional }: Props) {
  const colors = useColors();
  const router = useRouter();

  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  let coverUrl: string | null = null;
  if (devotional.cover_path) {
    coverUrl = supabase.storage.from('devotional-assets').getPublicUrl(devotional.cover_path).data.publicUrl;
  }

  const seriesName = devotional.devotional_series?.name;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius * 1.5 }]}>
      <Pressable
        onPress={() => router.push(`/devotional/${devotional.id}`)}
        style={styles.imageContainer}
        accessibilityRole="link"
        accessibilityLabel={`Read ${devotional.title}`}
      >
        {coverUrl && failedCoverUrl !== coverUrl ? (
          <Image 
            source={{ uri: coverUrl }} 
            style={styles.image} 
            contentFit="cover" 
            cachePolicy="disk" 
            recyclingKey={coverUrl}
            transition={180}
            onError={() => setFailedCoverUrl(coverUrl)}
          />
        ) : (
          <View style={[styles.fallbackImage, { backgroundColor: colors.muted }]}>
            <Typography variant="h2" color="muted" align="center" style={{ opacity: 0.3 }}>
              GROW365
            </Typography>
          </View>
        )}
      </Pressable>
      
      <View style={styles.content}>
        <Typography variant="reference" color="accent" style={styles.series}>
          {seriesName ? seriesName.toUpperCase() : 'TODAY’S DEVOTIONAL'}
        </Typography>
        <Typography variant="h2" style={styles.title}>
          {devotional.title}
        </Typography>
        
        {devotional.description ? (
          <Typography variant="body" color="muted" style={styles.description}>
            {devotional.description}
          </Typography>
        ) : devotional.memory_verse ? (
          <Typography variant="journal" color="muted" style={styles.description}>
            {devotional.memory_verse}
          </Typography>
        ) : null}

        <Button
          title="Read Devotional"
          onPress={() => router.push(`/devotional/${devotional.id}`)}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 40,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  series: {
    marginBottom: 12,
    letterSpacing: 1,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 24,
  },
  button: {
    alignSelf: 'flex-start',
  },
});
