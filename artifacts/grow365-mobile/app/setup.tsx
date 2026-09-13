import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useProfile';
import { authErrorMessage, validateName } from '@/lib/auth-errors';

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const initialName =
    (typeof user?.user_metadata?.display_name === 'string' &&
      user.user_metadata.display_name) ||
    (typeof user?.user_metadata?.full_name === 'string' &&
      user.user_metadata.full_name) ||
    '';
  const [name, setName] = useState<string>(initialName);
  const [error, setError] = useState<string | undefined>();
  const updateProfile = useUpdateProfile(user?.id);

  const handleComplete = async (): Promise<void> => {
    const nameError = validateName(name);
    setError(nameError);
    if (nameError) return;

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await updateProfile.mutateAsync({
        display_name: name.trim(),
        timezone,
        onboarded_at: new Date().toISOString(),
      });
      router.replace('/(tabs)');
    } catch (caught) {
      setError(authErrorMessage(caught));
    }
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
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(undefined);
          }}
          error={error}
        />
        
        <View style={styles.spacer} />
        
        <Button
          title="Complete Setup"
          onPress={() => void handleComplete()}
          loading={updateProfile.isPending}
        />
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