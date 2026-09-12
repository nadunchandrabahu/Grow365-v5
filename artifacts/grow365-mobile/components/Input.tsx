import React from 'react';
import { TextInput as RNTextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const colors = useColors();
  
  return (
    <View style={styles.container}>
      {label && (
        <Typography variant="caption" color="muted" style={styles.label}>
          {label.toUpperCase()}
        </Typography>
      )}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
            borderRadius: colors.radius,
          },
          style,
        ]}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
      {error && (
        <Typography variant="caption" color="destructive" style={styles.error}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
  },
  error: {
    marginTop: 6,
  },
});