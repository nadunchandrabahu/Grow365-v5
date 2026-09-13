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
  validateName,
  validatePassword,
  type AuthFormErrors,
} from '@/lib/auth-errors';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async (): Promise<void> => {
    const nextErrors: AuthFormErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      const result = await signUp({ name, email, password });
      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(email.trim());
      } else {
        router.replace('/setup');
      }
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationEmail) {
    return (
      <View style={[styles.confirmation, { backgroundColor: colors.background }]}>
        <Typography variant="h2" align="center" style={styles.title} accessibilityRole="header">Check your email</Typography>
        <Typography variant="body" color="muted" align="center" style={styles.subtitle}>
          We sent a confirmation link to {confirmationEmail}. Open it, then return here to sign in.
        </Typography>
        <Button title="Go to Sign In" onPress={() => router.replace('/sign-in')} accessibilityRole="button" accessibilityLabel="Go to sign in" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Create account"
    >
      <Typography variant="h2" style={styles.title} accessibilityRole="header">Create Account</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Start your journey of daily reflection.
      </Typography>
      
      <Input
        label="Your Name"
        placeholder="Enter your name"
        autoCapitalize="words"
        value={name}
        accessibilityLabel="Your name"
        accessibilityHint="Enter the name shown on your profile"
        onChangeText={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined, form: undefined }));
        }}
        error={errors.name}
      />
      <Input
        label="Email Address"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        accessibilityLabel="Email address"
        accessibilityHint="Enter an email address for your account"
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined, form: undefined }));
        }}
        error={errors.email}
      />
      <Input
        label="Password"
        placeholder="Create a password"
        secureTextEntry
        value={password}
        accessibilityLabel="Password"
        accessibilityHint="Create a password with at least 8 characters"
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
      
      <View style={styles.spacer} />
      
      <Button title="Create Account" onPress={() => void handleSignUp()} loading={submitting} style={styles.button} accessibilityRole="button" accessibilityLabel="Create account" />
      
      <View style={styles.footer}>
        <Typography variant="caption" color="muted">Already have an account? </Typography>
        <Link href="/sign-in" accessibilityRole="link" accessibilityLabel="Sign in to an existing account">
          <Typography variant="caption" style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Sign In</Typography>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40, flexGrow: 1 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32 },
  spacer: { flex: 1, minHeight: 40 },
  button: { marginBottom: 24 },
  formError: { marginBottom: 16 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  confirmation: { flex: 1, justifyContent: 'center', padding: 24 },
});