import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}>
        <Typography variant="reference" color="accent" style={styles.date}>TUESDAY, OCT 24</Typography>
        <Typography variant="h1" style={styles.title}>Good morning, Robert.</Typography>
        
        <Card style={styles.todayCard}>
          <Typography variant="reference" color="muted" style={styles.cardHeader}>TODAY'S DEVOTIONAL</Typography>
          <Typography variant="h2" style={styles.cardTitle}>The Quiet Strength of Patience</Typography>
          <Typography variant="journal" color="muted" style={styles.cardPreview}>
            "Wait for the Lord; be strong, and let your heart take courage..."
          </Typography>
          <Button 
            title="Read Devotional" 
            onPress={() => router.push('/devotional/1')} 
            style={styles.cardButton} 
          />
        </Card>

        <Typography variant="h3" style={styles.sectionTitle}>Recent Activity</Typography>
        
        <Card style={styles.activityCard}>
          <View style={styles.activityRow}>
            <View style={[styles.statusDot, { backgroundColor: (colors as any).success }]} />
            <View style={{ flex: 1 }}>
              <Typography variant="body">Completed Yesterday's Reading</Typography>
              <Typography variant="caption" color="muted">Grace in the Details</Typography>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  date: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 32 },
  todayCard: { padding: 24, marginBottom: 40 },
  cardHeader: { marginBottom: 12, letterSpacing: 0.5 },
  cardTitle: { marginBottom: 16 },
  cardPreview: { marginBottom: 24, fontStyle: 'italic' },
  cardButton: { alignSelf: 'flex-start' },
  sectionTitle: { marginBottom: 16 },
  activityCard: { padding: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
});