import React from 'react';
import { Text as RNText, Platform, StyleSheet, TextStyle } from 'react-native';

/**
 * Text component with Android fixes for font clipping (includeFontPadding + lineHeight).
 * Use this instead of react-native's Text for consistent rendering.
 */
export function Text({
  style,
  ...props
}: React.ComponentProps<typeof RNText>) {
  const flatStyle = style ? StyleSheet.flatten(style as TextStyle) : undefined;
  const fontSize = (flatStyle?.fontSize as number) ?? 16;
  const userLineHeight = flatStyle?.lineHeight as number | undefined;
  const lineHeight = userLineHeight ?? Math.ceil(fontSize * 1.35);

  return (
    <RNText
      {...props}
      includeFontPadding={Platform.OS === 'android' ? false : undefined}
      style={[Platform.OS === 'android' && { lineHeight }, style]}
    />
  );
}
