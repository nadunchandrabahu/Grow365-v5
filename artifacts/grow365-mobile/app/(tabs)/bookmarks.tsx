import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { EmptyState } from '@/components/State';

export default function BookmarksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Typography variant="h1">Bookmarks</Typography>
      </View>
      <View style={styles.content}>
        <EmptyState 
          title="No bookmarks yet" 
          description="Save verses and devotionals to read them later." 
          icon="bookmark"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  content: { flex: 1 },
});