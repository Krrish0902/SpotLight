import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { colors } from '../../theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function Badge({ children, variant = 'default', style, icon }: BadgeProps) {
  const bgColor =
    variant === 'secondary' ? colors['white/20'] :
    variant === 'outline' ? 'transparent' : colors.primary;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        variant === 'outline' && { borderWidth: 1, borderColor: colors['white/20'] },
        style,
      ]}
    >
      <View style={styles.badgeContent}>
        {icon}
        <Text style={styles.text}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
