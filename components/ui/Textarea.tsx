import React from 'react';
import { TextInput, StyleSheet, TextInputProps, Platform } from 'react-native';
import { colors } from '../../theme';

export function Textarea(props: TextInputProps) {
  return (
    <TextInput
      style={[styles.textarea, Platform.OS === 'android' && { lineHeight: 22 }]}
      placeholderTextColor={colors['white/40']}
      multiline
      textAlignVertical="top"
      includeFontPadding={Platform.OS === 'android' ? false : undefined}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 96,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors['white/5'],
    borderWidth: 1,
    borderColor: colors['white/20'],
    color: '#fff',
    fontSize: 16,
  },
});
