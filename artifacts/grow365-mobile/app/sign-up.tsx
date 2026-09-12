import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useRouter, Link } from 'expo-router';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    // Navigate to setup
    router.replace('/setup');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Create Account</Typography>
      <Typography variant="body" color="muted" style={styles.subtitle}>
        Start your journey of daily reflection.
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
        placeholder="Create a password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      <View style={styles.spacer} />
      
      <Button title="Create Account" onPress={handleSignUp} style={styles.button} />
      
      <View style={styles.footer}>
        <Typography variant="caption" color="muted">Already have an account? </Typography>
        <Link href="/sign-in">
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
  footer: { flexDirection: 'row', justifyContent: 'center' },
});