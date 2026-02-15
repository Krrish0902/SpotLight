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
  placeholderTextColor = colors['white/40'],
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
        includeFontPadding={Platform.OS === 'android' ? false : undefined}
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
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors['white/5'],
    borderWidth: 1,
    borderColor: colors['white/20'],
    color: '#fff',
    fontSize: 16,
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
});
