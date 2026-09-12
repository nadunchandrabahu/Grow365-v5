import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { useRouter } from 'expo-router';

export default function StudyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}>
        <Typography variant="h1" style={styles.title}>Study</Typography>
        
        <TouchableOpacity onPress={() => router.push('/devotional/past')} activeOpacity={0.7}>
          <Card style={styles.planCard}>
            <Typography variant="h3" style={styles.cardTitle}>Past Devotionals</Typography>
            <Typography variant="body" color="muted">Revisit previous readings and reflections.</Typography>
          </Card>
        </TouchableOpacity>

        <Typography variant="h3" style={styles.sectionTitle}>Groups</Typography>
        
        <View style={styles.groupActions}>
          <TouchableOpacity 
            onPress={() => router.push('/groups/create')} 
            style={[styles.actionBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
            activeOpacity={0.7}
          >
            <Typography variant="body" style={styles.actionText}>Create Group</Typography>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/groups/join')} 
            style={[styles.actionBox, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
            activeOpacity={0.7}
          >
            <Typography variant="body" style={styles.actionText}>Join Group</Typography>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/groups/1')} activeOpacity={0.7}>
          <Card style={styles.planCard}>
            <Typography variant="reference" color="muted" style={{marginBottom: 8}}>YOUR GROUPS</Typography>
            <Typography variant="h3" style={styles.cardTitle}>Morning Fellowship</Typography>
            <Typography variant="body" color="muted">3 active members</Typography>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { marginBottom: 32 },
  planCard: { padding: 20, marginBottom: 24 },
  cardTitle: { marginBottom: 8 },
  sectionTitle: { marginBottom: 16, marginTop: 16 },
  groupActions: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  actionBox: { flex: 1, padding: 16, alignItems: 'center' },
  actionText: { fontFamily: 'Inter_500Medium' },
});