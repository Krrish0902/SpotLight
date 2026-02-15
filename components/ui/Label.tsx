import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from './Text';

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
