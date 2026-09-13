import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Typography } from './Typography';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
  size?: 'default' | 'small' | 'large';
  title: string;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'default',
  title,
  loading,
  style,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ...props
}: ButtonProps) {
  const colors = useColors();
  
  let backgroundColor = 'transparent';
  let borderColor = 'transparent';
  let textColor = colors.foreground;
  
  switch (variant) {
    case 'primary':
      backgroundColor = colors.primary;
      textColor = colors.primaryForeground;
      break;
    case 'secondary':
      backgroundColor = colors.secondary;
      textColor = colors.secondaryForeground;
      break;
    case 'success':
      backgroundColor = (colors as any).success;
      textColor = (colors as any).successForeground;
      break;
    case 'outline':
      borderColor = colors.border;
      break;
    case 'ghost':
      break;
  }
  
  let paddingVertical = 14;
  let paddingHorizontal = 24;
  if (size === 'small') {
    paddingVertical = 8;
    paddingHorizontal = 16;
  } else if (size === 'large') {
    paddingVertical = 18;
    paddingHorizontal = 32;
  }
  
  const opacity = disabled || loading ? 0.6 : 1;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: colors.radius,
          paddingVertical,
          paddingHorizontal,
          opacity,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={
        accessibilityHint ??
        (loading ? 'Please wait' : 'Activates this button')
      }
      accessibilityState={{
        ...accessibilityState,
        disabled: disabled || loading,
        busy: loading || undefined,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Typography 
          style={{ 
            fontFamily: 'Inter_600SemiBold', 
            fontSize: size === 'small' ? 15 : 17,
            color: textColor 
          }}
          align="center"
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
});