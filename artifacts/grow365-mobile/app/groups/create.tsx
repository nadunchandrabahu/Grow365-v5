import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter } from 'expo-router';

export default function CreateGroupScreen() {
  const colors = useColors();
  const router = useRouter();
  const [name, setName] = useState('');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Start a new study group to read and reflect together.
      </Typography>
      
      <Input
        label="Group Name"
        placeholder="e.g. Morning Fellowship"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Description (Optional)"
        placeholder="What is this group about?"
        multiline
        numberOfLines={3}
        style={{ minHeight: 80 }}
      />
      
      <View style={styles.spacer} />
      
      <Button 
        title="Create Group" 
        onPress={() => router.replace('/groups/1')} 
        style={styles.button} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 32, flexGrow: 1 },
  subtitle: { marginBottom: 32 },
  spacer: { flex: 1, minHeight: 40 },
  button: { marginBottom: 24 },
});