import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  authErrorMessage,
  validateEmail,
  type AuthFormErrors,
} from '@/lib/auth-errors';

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { signIn } = useAuth();

  const handleSignIn = async (): Promise<void> => {
    const nextErrors: AuthFormErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Enter your password.',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Sign in"
    >
      <Typography variant="h2" style={styles.title} accessibilityRole="header">Welcome Back</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Sign in to continue your daily reflections.
      </Typography>
      
      <Input
        label="Email Address"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        accessibilityLabel="Email address"
        accessibilityHint="Enter the email address for your Grow365 account"
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined, form: undefined }));
        }}
        error={errors.email}
      />
      <Input
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        accessibilityLabel="Password"
        accessibilityHint="Enter your Grow365 password"
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined, form: undefined }));
        }}
        error={errors.password}
      />
      {errors.form ? (
        <Typography variant="body" color="destructive" style={styles.formError} accessibilityRole="alert">
          {errors.form}
        </Typography>
      ) : null}
      
      <Link
        href="/reset-password"
        style={styles.forgotPassword}
        accessibilityRole="link"
        accessibilityLabel="Forgot your password"
        accessibilityHint="Opens password reset"
      >
        <Typography variant="caption" color="muted">Forgot your password?</Typography>
      </Link>
      
      <Button title="Sign In" onPress={() => void handleSignIn()} loading={submitting} style={styles.button} accessibilityRole="button" accessibilityLabel="Sign in" />
      
      <View style={styles.footer}>
        <Typography variant="caption" color="muted">Don't have an account? </Typography>
        <Link href="/sign-up" accessibilityRole="link" accessibilityLabel="Create an account">
          <Typography variant="caption" style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Sign Up</Typography>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  forgotPassword: { alignSelf: 'flex-start', marginBottom: 32 },
  formError: { marginBottom: 20 },
  button: { marginBottom: 24 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
});