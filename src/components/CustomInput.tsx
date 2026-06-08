import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CustomInput = React.forwardRef<TextInput, CustomInputProps>(({
  label,
  error,
  isPassword = false,
  containerStyle,
  style,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          props.multiline ? styles.inputContainerMultiline : styles.inputContainerSingleLine,
          isFocused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        <TextInput
          ref={ref}
          style={[
            styles.input,
            props.multiline ? styles.inputMultiline : styles.inputSingleLine,
            style,
          ]}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggleButton}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

CustomInput.displayName = 'CustomInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
    width: '100%',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
  },
  inputContainerSingleLine: {
    height: 48,
  },
  inputContainerMultiline: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  focused: {
    borderColor: Colors.inputBorderFocused,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    padding: 0, // Reset default padding in Android
  },
  inputSingleLine: {
    height: '100%',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  toggleButton: {
    paddingLeft: Spacing.sm,
    justifyContent: 'center',
  },
  toggleText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.xs + 1,
    marginTop: Spacing.xs,
  },
});
