import React from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}>
        <Typography variant="reference" color="muted" style={styles.date}>OCT 24, 2023</Typography>
        <Typography variant="h1" style={styles.title}>Journal</Typography>
        
        <View style={[styles.editorContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <TextInput
            style={[styles.editor, { color: colors.foreground, fontFamily: 'Lora_400Regular' }]}
            multiline
            placeholder="Write your thoughts..."
            placeholderTextColor={colors.mutedForeground}
            textAlignVertical="top"
          />
        </View>
        
        <Button title="Save Entry" onPress={() => {}} style={styles.saveButton} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flexGrow: 1 },
  date: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 24 },
  editorContainer: { flex: 1, borderWidth: 1, minHeight: 300, marginBottom: 24 },
  editor: { flex: 1, padding: 20, fontSize: 19, lineHeight: 30 },
  saveButton: { alignSelf: 'flex-end' },
});