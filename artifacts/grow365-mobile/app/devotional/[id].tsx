import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { useLocalSearchParams } from 'expo-router';

export default function DevotionalReaderScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="reference" color="accent" style={styles.date}>OCTOBER 24</Typography>
      <Typography variant="h1" style={styles.title}>The Quiet Strength of Patience</Typography>
      
      <View style={[styles.verseContainer, { borderLeftColor: colors.border }]}>
        <Typography variant="journal" style={styles.verseText}>
          "Wait for the Lord; be strong, and let your heart take courage; wait for the Lord!"
        </Typography>
        <Typography variant="reference" color="muted" align="right">
          PSALM 27:14
        </Typography>
      </View>

      <Typography variant="body" style={styles.paragraph}>
        In our fast-paced world, waiting often feels like wasted time. We drum our fingers, check our watches, and look for shortcuts. But biblical waiting is not passive idleness; it is an active, faithful reliance on God's perfect timing.
      </Typography>
      
      <Typography variant="body" style={styles.paragraph}>
        When we are asked to wait, we are being invited to trust. It is in the quiet spaces between the prayer and the answer that our faith puts down its deepest roots.
      </Typography>

      <View style={styles.actions}>
        <Button title="Mark as Completed" variant="success" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  date: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 32 },
  verseContainer: { marginBottom: 40, paddingLeft: 20, borderLeftWidth: 2 },
  verseText: { fontStyle: 'italic', marginBottom: 12 },
  paragraph: { marginBottom: 24 },
  actions: { marginTop: 40, alignItems: 'center' },
});