import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter } from 'expo-router';

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <Typography variant="reference" color="accent" style={styles.step}>STEP 1 OF 1</Typography>
        <Typography variant="h2" style={styles.title}>Let's get acquainted</Typography>
        <Typography variant="body" color="muted" style={styles.subtitle}>
          How would you like to be addressed in your daily readings?
        </Typography>
        
        <Input
          label="Preferred Name"
          placeholder="e.g. Robert or Mary"
        />
        
        <View style={styles.spacer} />
        
        <Button title="Complete Setup" onPress={handleComplete} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flexGrow: 1 },
  step: { marginBottom: 12, letterSpacing: 1 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  spacer: { flex: 1, minHeight: 40 },
});