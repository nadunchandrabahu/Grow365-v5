import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Card } from '@/components/Card';
import { useRouter } from 'expo-router';

export default function PastDevotionalsScreen() {
  const colors = useColors();
  const router = useRouter();

  const pastList = [
    { id: 2, date: 'OCTOBER 23', title: 'Grace in the Details', completed: true },
    { id: 3, date: 'OCTOBER 22', title: 'Finding Rest', completed: true },
    { id: 4, date: 'OCTOBER 21', title: 'Walking in Light', completed: false },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {pastList.map(item => (
        <TouchableOpacity key={item.id} onPress={() => router.push(`/devotional/${item.id}`)} activeOpacity={0.7}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Typography variant="reference" color="muted">{item.date}</Typography>
              {item.completed && (
                <View style={[styles.statusIndicator, { backgroundColor: (colors as any).success }]} />
              )}
            </View>
            <Typography variant="h3">{item.title}</Typography>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  card: { padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
});