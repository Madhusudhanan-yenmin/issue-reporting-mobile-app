import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = () => {
    const stylesList: ViewStyle[] = [styles.button];

    // Variant styles
    if (variant === 'primary') {
      stylesList.push(styles.primary);
    } else if (variant === 'secondary') {
      stylesList.push(styles.secondary);
    } else if (variant === 'danger') {
      stylesList.push(styles.danger);
    } else if (variant === 'success') {
      stylesList.push(styles.success);
    } else if (variant === 'outline') {
      stylesList.push(styles.outline);
    }

    // Size styles
    if (size === 'small') {
      stylesList.push(styles.small);
    } else if (size === 'medium') {
      stylesList.push(styles.medium);
    } else if (size === 'large') {
      stylesList.push(styles.large);
    }

    // Disabled state
    if (disabled || loading) {
      stylesList.push(styles.disabled);
    }

    return stylesList;
  };

  const getTextStyle = () => {
    const stylesList: TextStyle[] = [styles.text];

    if (variant === 'outline') {
      stylesList.push(styles.textOutline);
    } else {
      stylesList.push(styles.textWhite);
    }

    if (size === 'small') {
      stylesList.push(styles.textSmall);
    } else if (size === 'large') {
      stylesList.push(styles.textLarge);
    }

    return stylesList;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyles(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? Colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  danger: {
    backgroundColor: Colors.error,
    ...Shadows.sm,
  },
  success: {
    backgroundColor: Colors.success,
    ...Shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  small: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 48,
  },
  large: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xxl,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
  },
  textOutline: {
    color: Colors.primary,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textSmall: {
    fontSize: Typography.size.sm,
  },
  textLarge: {
    fontSize: Typography.size.md,
  },
});
