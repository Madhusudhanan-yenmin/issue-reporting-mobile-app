import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  fullScreen = false,
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Rotation animation
    const rotation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    rotation.start();

    // Pulsing glow animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      rotation.stop();
      pulse.stop();
    };
  }, []);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.spinnerContainer}>
        {/* Pulsing glow ring in the background */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: pulseValue.interpolate({ inputRange: [0.6, 1], outputRange: [1, 1.3] }) }],
              opacity: pulseValue.interpolate({
                inputRange: [0.6, 1],
                outputRange: [0.1, 0.35],
              }),
            },
          ]}
        />

        {/* Rotating arc spinner */}
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinnerArc} />
        </Animated.View>

        {/* Static decorative center core */}
        <View style={styles.centerCore} />
      </View>

      {message && (
        <Animated.Text style={[styles.message, { opacity: pulseValue }]}>
          {message}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    position: 'absolute',
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerArc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'transparent',
    borderBottomColor: Colors.primaryLight,
    opacity: 0.5,
  },
  centerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    position: 'absolute',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    marginTop: Spacing.xl,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
