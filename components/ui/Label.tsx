import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors } from '../../theme';

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
    color: colors.foreground,
    marginBottom: 8,
  },
});
