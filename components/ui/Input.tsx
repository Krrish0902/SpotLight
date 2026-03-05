import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { colors } from '../../theme';

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export function Input({
  containerStyle,
  leftIcon,
  style,
  placeholderTextColor = colors['black/40'],
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <TextInput
        style={[
          styles.input,
          leftIcon ? styles.inputWithIcon : undefined,
          Platform.OS === 'android' && { lineHeight: 22 },
          style,
        ]}
        placeholderTextColor={placeholderTextColor}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  icon: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },
});
