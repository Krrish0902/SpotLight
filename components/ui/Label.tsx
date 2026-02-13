import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface LabelProps {
  children: React.ReactNode;
  style?: object;
}

export function Label({ children, style }: LabelProps) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
});
