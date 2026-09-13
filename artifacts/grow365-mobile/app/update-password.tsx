import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Typography } from '@/components/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/hooks/useColors';
import { authErrorMessage, validatePassword } from '@/lib/auth-errors';

export default function UpdatePasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState<string>('');
  const [confirmation, setConfirmation] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleUpdate = async (): Promise<void> => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match. Enter the same password in both fields.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      router.replace('/(tabs)');
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Typography variant="h2" style={styles.title}>Choose a new password</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Use at least 8 characters, then enter it again to confirm.
      </Typography>
      <Input
        label="New Password"
        secureTextEntry
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          setError(undefined);
        }}
      />
      <Input
        label="Confirm New Password"
        secureTextEntry
        value={confirmation}
        onChangeText={(value) => {
          setConfirmation(value);
          setError(undefined);
        }}
        error={error}
      />
      <Button title="Save New Password" onPress={() => void handleUpdate()} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 24, paddingTop: 40 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
});