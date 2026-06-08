import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '../theme';
import { useAppDispatch, useAppSelector } from '../store';
import { dismissToast } from '../store/slices/uiSlice';

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ToastItem: React.FC<ToastItemProps> = ({ id, message, type }) => {
  const dispatch = useAppDispatch();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Fade in and slide down
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dispatch(dismissToast(id));
    });
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return Colors.success;
      case 'error':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      case 'info':
      default:
        return Colors.info;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return Colors.successBg || 'rgba(34, 197, 94, 0.1)';
      case 'error':
        return Colors.errorBg || 'rgba(239, 68, 68, 0.1)';
      case 'warning':
        return Colors.warningBg || 'rgba(245, 158, 11, 0.1)';
      case 'info':
      default:
        return Colors.infoBg || 'rgba(59, 130, 246, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.3)';
      case 'error':
        return 'rgba(239, 68, 68, 0.3)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.3)';
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.3)';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastItem,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: Colors.surfaceElevated,
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: getBgColor() }]}>
        <Ionicons name={getIconName()} size={20} color={getIconColor()} />
      </View>
      <Text style={styles.messageText}>{message}</Text>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((state) => state.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={styles.toastsWrapper} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastsWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  messageText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.size.sm + 1,
    fontWeight: Typography.weight.medium,
  },
  closeBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
});
