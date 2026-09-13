import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.iconContainer} accessibilityElementsHidden importantForAccessibility="no">
          <Feather name="sun" size={64} color={(colors as any).accent} />
        </View>
        <Typography variant="h1" align="center" style={styles.title}>
          Grow365
        </Typography>
        <Typography variant="body" color="muted" align="center" style={styles.subtitle}>
          A quiet moment for reflection, prayer, and daily growth.
        </Typography>
        
        <View style={styles.spacer} />
        
        <View style={styles.actions}>
          <Button
            title="Create an Account" 
            onPress={() => router.push('/sign-up')} 
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
            accessibilityHint="Opens account creation"
          />
          <Button
            title="Sign In" 
            variant="secondary"
            onPress={() => router.push('/sign-in')} 
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityHint="Opens sign in"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
  subtitle: {
    paddingHorizontal: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 60,
  },
  actions: {
    gap: 16,
  },
  button: {
    width: '100%',
  }
});