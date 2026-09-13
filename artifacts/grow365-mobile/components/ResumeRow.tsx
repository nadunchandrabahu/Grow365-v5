import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Feather } from '@expo/vector-icons';

interface Props {
  devotionalId: string;
  title: string;
  dayOfYear: number;
  scrollPct: number;
}

export function ResumeRow({ devotionalId, title, dayOfYear, scrollPct }: Props) {
  const colors = useColors();
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/devotional/${devotionalId}`)}
      accessibilityRole="link"
      accessibilityLabel={`Resume reading: ${title}`}
      accessibilityHint="Opens this devotional"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(scrollPct),
        text: `${Math.round(scrollPct)} percent complete`,
      }}
      style={[styles.container, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="reference" color="accent">RESUME READING</Typography>
          <Typography variant="caption" color="muted">{Math.round(scrollPct)}%</Typography>
        </View>
          <Typography variant="body" style={styles.title}>
          {title}
        </Typography>
        
        <View style={[styles.progressTrack, { backgroundColor: colors.border, borderRadius: 2 }]}>
          <View 
            style={[
              styles.progressFill, 
              { backgroundColor: colors.accent, width: `${Math.max(5, Math.min(100, scrollPct))}%`, borderRadius: 2 }
            ]} 
          />
        </View>
      </View>
      <View style={styles.iconContainer}>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} accessible={false} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    padding: 20,
    marginBottom: 40,
  },
  content: {
    flex: 1,
    paddingRight: 16,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
    flexShrink: 1,
  },
  progressTrack: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  iconContainer: {
    justifyContent: 'center',
  },
});
