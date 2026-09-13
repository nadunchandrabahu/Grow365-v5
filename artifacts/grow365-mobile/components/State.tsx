import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from './Typography';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={message}
      />
      <Typography variant="body" color="muted" style={{ marginTop: 16 }}>{message}</Typography>
    </View>
  );
}

export function EmptyState({ 
  title, 
  description, 
  icon = 'inbox',
  actionLabel,
  onAction
}: { 
  title: string;
  description: string;
  icon?: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Feather
        name={icon}
        size={48}
        color={colors.mutedForeground}
        style={{ marginBottom: 16 }}
        accessible={false}
      />
      <Typography variant="h3" align="center" style={{ marginBottom: 8 }}>{title}</Typography>
      <Typography variant="body" color="muted" align="center" style={{ marginBottom: 24, paddingHorizontal: 32 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" />
      )}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this content.',
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Feather
        name="alert-circle"
        size={48}
        color={colors.destructive}
        style={{ marginBottom: 16 }}
        accessible={false}
      />
      <Typography variant="h3" align="center" style={{ marginBottom: 8 }}>{title}</Typography>
      <Typography variant="body" color="muted" align="center" style={{ marginBottom: 24, paddingHorizontal: 32 }}>
        {description}
      </Typography>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} variant="outline" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});