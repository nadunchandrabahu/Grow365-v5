import React from 'react';
import { PixelRatio, Text, TextProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

/** Keep accessibility font scaling enabled without allowing text to overflow every layout. */
export const MAX_FONT_SIZE_MULTIPLIER = 2;

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'journal' | 'caption' | 'reference';
  color?: 'foreground' | 'muted' | 'accent' | 'success' | 'destructive';
  align?: 'left' | 'center' | 'right';
}

export function Typography({
  variant = 'body',
  color = 'foreground',
  align = 'left',
  style,
  ...props
}: TypographyProps) {
  const colors = useColors();
  const fontScale = Math.min(PixelRatio.getFontScale(), MAX_FONT_SIZE_MULTIPLIER);

  let fontFamily = 'Inter_400Regular';
  let fontSize = 17;
  let lineHeight = 26;
  
  switch (variant) {
    case 'h1':
      fontFamily = 'Fraunces_700Bold';
      fontSize = 32;
      lineHeight = 40;
      break;
    case 'h2':
      fontFamily = 'Fraunces_600SemiBold';
      fontSize = 24;
      lineHeight = 32;
      break;
    case 'h3':
      fontFamily = 'Fraunces_600SemiBold';
      fontSize = 20;
      lineHeight = 28;
      break;
    case 'journal':
      fontFamily = 'Lora_400Regular';
      fontSize = 19;
      lineHeight = 30;
      break;
    case 'caption':
      fontFamily = 'Inter_500Medium';
      fontSize = 15;
      lineHeight = 20;
      break;
    case 'reference':
      fontFamily = 'IBMPlexMono_500Medium';
      fontSize = 14;
      lineHeight = 20;
      break;
    case 'body':
    default:
      fontFamily = 'Inter_400Regular';
      fontSize = 17;
      lineHeight = 26;
      break;
  }
  
  let textColor = colors.foreground;
  if (color === 'muted') textColor = colors.mutedForeground;
  else if (color === 'accent') textColor = colors.accent;
  else if (color === 'success') textColor = (colors as any).success;
  else if (color === 'destructive') textColor = colors.destructive;
  
  return (
    <Text
      style={[
        {
          fontFamily,
          fontSize,
          lineHeight: lineHeight * fontScale,
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
      allowFontScaling
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
    />
  );
}