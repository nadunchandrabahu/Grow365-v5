import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useLocalSearchParams } from 'expo-router';

export default function GroupScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="h1" style={styles.title}>Morning Fellowship</Typography>
        <Typography variant="body" color="muted">3 active members</Typography>
      </View>
      
      <View style={styles.actions}>
        <Button title="Invite Members" variant="outline" onPress={() => {}} />
      </View>

      <Typography variant="h3" style={styles.sectionTitle}>Recent Discussions</Typography>
      
      <Card style={styles.discussionCard}>
        <View style={styles.cardHeader}>
          <Typography variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>Sarah</Typography>
          <Typography variant="reference" color="muted">2 HOURS AGO</Typography>
        </View>
        <Typography variant="body">
          I really loved today's reading on patience. It's exactly what I needed to hear this week.
        </Typography>
      </Card>
      
      <Card style={styles.discussionCard}>
        <View style={styles.cardHeader}>
          <Typography variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>Michael</Typography>
          <Typography variant="reference" color="muted">YESTERDAY</Typography>
        </View>
        <Typography variant="body">
          Has anyone else struggled with keeping a consistent routine?
        </Typography>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 24 },
  title: { marginBottom: 8 },
  actions: { marginBottom: 40, alignItems: 'flex-start' },
  sectionTitle: { marginBottom: 16 },
  discussionCard: { padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
});