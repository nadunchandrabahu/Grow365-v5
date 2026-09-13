import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { authErrorMessage, validateEmail } from '@/lib/auth-errors';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { sendPasswordReset } = useAuth();

  const handleReset = async (): Promise<void> => {
    const validationError = validateEmail(email);
    setError(validationError);
    if (validationError) return;
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
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
      accessibilityLabel="Reset password"
    >
      {!sent ? (
        <>
          <Typography variant="body" color="muted" style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          
          <Input
            label="Email Address"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
          accessibilityLabel="Email address"
          accessibilityHint="Enter the email address associated with your account"
            onChangeText={(value) => {
              setEmail(value);
              setError(undefined);
            }}
            error={error}
          />
          
          <View style={styles.spacer} />
          <Button title="Send Reset Link" onPress={() => void handleReset()} loading={submitting} accessibilityRole="button" accessibilityLabel="Send password reset link" />
        </>
      ) : (
        <View style={styles.successContainer}>
          <Typography variant="h2" align="center" style={styles.title} accessibilityRole="header">Check your email</Typography>
          <Typography variant="body" color="muted" align="center" style={styles.subtitle}>
            We've sent password reset instructions to {email || 'your email address'}.
          </Typography>
          <Button title="Back to Sign In" variant="outline" onPress={() => router.back()} style={{ width: '100%' }} accessibilityRole="button" accessibilityLabel="Back to sign in" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40, flexGrow: 1 },
  title: { marginBottom: 16 },
  subtitle: { marginBottom: 32 },
  spacer: { flex: 1, minHeight: 40 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
});