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
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 120,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: '#fff',
    fontSize: 16,
  },
});
