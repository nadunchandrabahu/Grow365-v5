import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function Card({ style, children, ...props }: ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
});