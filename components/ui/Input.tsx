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

export interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(function Input(
  { containerStyle, leftIcon, style, placeholderTextColor = colors['white/40'], ...props },
  ref
) {
  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
      <TextInput
        ref={ref}
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
});

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
    minHeight: 40,
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
