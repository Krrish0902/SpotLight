import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { colors } from '../../theme';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  default: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  secondary: { backgroundColor: colors['white/10'] },
  link: { backgroundColor: 'transparent' },
};

const sizeStyles: Record<ButtonSize, { padding: number; minHeight: number }> = {
  default: { padding: 16, minHeight: 36 },
  sm: { padding: 12, minHeight: 32 },
  lg: { padding: 20, minHeight: 40 },
  icon: { padding: 8, minHeight: 36 },
};

export function Button({
  variant = 'default',
  size = 'default',
  style,
  textStyle,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isIcon = size === 'icon';
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        {
          paddingHorizontal: sizeStyle.padding,
          minHeight: sizeStyle.minHeight,
          borderRadius: isIcon ? 18 : 8,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <View style={styles.content}>
        {typeof children === 'string' ? (
          <Text
            style={[
              styles.text,
              variant === 'default' || variant === 'secondary' ? styles.textWhite : styles.textForeground,
              textStyle,
            ]}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  textWhite: {
    color: '#fff',
  },
  textForeground: {
    color: colors.foreground,
  },
});
