import React from 'react';
import { TextInput as RNTextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { MAX_FONT_SIZE_MULTIPLIER, Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  style,
  accessibilityLabel: propAccessibilityLabel,
  accessibilityHint: propAccessibilityHint,
  accessibilityState: propAccessibilityState,
  ...props
}: InputProps) {
  const colors = useColors();
  const accessibilityLabel = propAccessibilityLabel ?? label ?? props.placeholder;
  const accessibilityHint = [
    propAccessibilityHint,
    error ? `Error: ${error}` : undefined,
  ].filter(Boolean).join(' ') || 'Enter text';
  
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
        allowFontScaling
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          ...propAccessibilityState,
          disabled: props.editable === false,
        }}
      />
      {error && (
        <Typography
          variant="caption"
          color="destructive"
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessible
        >
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
    minHeight: 44,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
  },
  error: {
    marginTop: 6,
  },
});