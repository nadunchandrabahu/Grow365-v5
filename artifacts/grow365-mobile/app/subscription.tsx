import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { Feather } from '@expo/vector-icons';

export default function SubscriptionScreen() {
  const colors = useColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Feather name="heart" size={48} color={colors.accent} style={styles.icon} />
        <Typography variant="h2" align="center" style={styles.title}>Support Grow365</Typography>
        <Typography variant="body" color="muted" align="center" style={styles.subtitle}>
          Your subscription helps us continue creating daily devotionals and maintaining this quiet space.
        </Typography>
      </View>
      
      <Card style={[styles.planCard, { borderColor: colors.accent, borderWidth: 1 }]}>
        <View style={styles.planHeader}>
          <Typography variant="h3">Annual Supporter</Typography>
          <Feather name="archive" size={24} color={colors.accent} />
        </View>
        <View style={styles.featureList}>
          {['Browse the full 365-day devotional archive', 'Filter published readings by series', 'Support the author team'].map(feat => (
            <View key={feat} style={styles.featureItem}>
              <Feather name="check" size={20} color={colors.success} style={{ marginRight: 12 }} />
              <Typography variant="body">{feat}</Typography>
            </View>
          ))}
        </View>
        <View style={[styles.freeNote, { borderTopColor: colors.border }]}>
          <Typography variant="body" color="muted" align="center">
            Today’s devotional and your complete private journal are always free.
          </Typography>
        </View>
        <Typography variant="caption" color="muted" align="center">
          In-app subscription setup is coming soon. This page is informational for now.
        </Typography>
      </Card>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
  icon: { marginBottom: 24 },
  title: { marginBottom: 16 },
  subtitle: { paddingHorizontal: 16 },
  planCard: { padding: 24, borderRadius: 16 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  featureList: { marginBottom: 32, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  freeNote: { borderTopWidth: 1, paddingTop: 20 },
});