import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter, Link } from 'expo-router';

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    // Navigate to tabs
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Welcome Back</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Sign in to continue your daily reflections.
      </Typography>
      
      <Input
        label="Email Address"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <Link href="/reset-password" style={styles.forgotPassword}>
        <Typography variant="caption" color="muted">Forgot your password?</Typography>
      </Link>
      
      <Button title="Sign In" onPress={handleSignIn} style={styles.button} />
      
      <View style={styles.footer}>
        <Typography variant="caption" color="muted">Don't have an account? </Typography>
        <Link href="/sign-up">
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
  button: { marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});