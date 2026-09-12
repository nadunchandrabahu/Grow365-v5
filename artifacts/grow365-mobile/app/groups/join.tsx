import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter } from 'expo-router';

export default function JoinGroupScreen() {
  const colors = useColors();
  const router = useRouter();
  const [code, setCode] = useState('');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Enter the invite code from your group organizer to join.
      </Typography>
      
      <Input
        label="Invite Code"
        placeholder="e.g. A7X9-B2M4"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
      />
      
      <View style={styles.spacer} />
      
      <Button 
        title="Join Group" 
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