import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing } from '../../theme';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import api from '../../services/api';

type Props = StackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const emailParam = route.params?.email || '';
  const isDirectReset = !emailParam; // True if opened directly from Signin (no pre-filled email)

  const [emailInput, setEmailInput] = useState(emailParam);
  const [currentPassword, setCurrentPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{
    emailInput?: string;
    currentPassword?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    
    // 1. Email validation (only critical if direct reset is true)
    if (!emailInput.trim()) {
      tempErrors.emailInput = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailInput.trim())) {
      tempErrors.emailInput = 'Please enter a valid email address';
    }
    
    // 2. Current Password validation (only if direct reset)
    if (isDirectReset) {
      if (!currentPassword) {
        tempErrors.currentPassword = 'Current Password is required';
      } else if (currentPassword.length < 6) {
        tempErrors.currentPassword = 'Password must be at least 6 characters';
      }
    }
    
    // 3. OTP validation (only if NOT direct reset)
    if (!isDirectReset) {
      if (!otp) {
        tempErrors.otp = 'Reset Code (OTP) is required';
      } else if (otp.trim() !== '1234') {
        tempErrors.otp = 'Invalid Reset Code. Use mock code 1234';
      }
    }
    
    // 4. Password validation
    if (!newPassword) {
      tempErrors.newPassword = 'New Password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
    } else if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;
    Keyboard.dismiss();

    try {
      setLoading(true);
      setError(null);

      if (isDirectReset) {
        const payload = {
          email: emailInput.trim(),
          currentPassword,
          newPassword,
        };
        await api.post('/auth/change-password', payload);
      } else {
        const payload = {
          email: emailInput.trim(),
          otp: otp.trim(),
          newPassword,
        };
        await api.post('/auth/reset-password', payload);
      }

      Alert.alert(
        'Success',
        isDirectReset
          ? 'Your password has been changed successfully! You can now log in with your new password.'
          : 'Your password has been reset successfully! You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ]
      );
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {isDirectReset
                ? 'Enter your email address, current password, and choose your new password.'
                : 'Confirm the reset code and choose your new password.'}
            </Text>

            {error && <Text style={styles.globalError}>{error}</Text>}

            {/* Email Address - locked if came from ForgotPassword, editable if opened directly */}
            <CustomInput
              label="Email Address"
              placeholder="Enter your email"
              value={emailInput}
              onChangeText={(text) => {
                setEmailInput(text);
                if (errors.emailInput) setErrors({ ...errors, emailInput: undefined });
              }}
              error={errors.emailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isDirectReset}
              selectTextOnFocus={isDirectReset}
              containerStyle={!isDirectReset ? styles.disabledInput : null}
            />

            {/* Current Password - Hidden completely if NOT accessed directly from Signin */}
            {isDirectReset && (
              <CustomInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (errors.currentPassword) setErrors({ ...errors, currentPassword: undefined });
                }}
                error={errors.currentPassword}
                isPassword
                autoCapitalize="none"
              />
            )}

            {/* Reset Code (OTP) - Hidden completely if accessed directly from Signin */}
            {!isDirectReset && (
              <CustomInput
                label="Reset Code (OTP)"
                placeholder="Enter mock code 1234"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (errors.otp) setErrors({ ...errors, otp: undefined });
                }}
                error={errors.otp}
                keyboardType="number-pad"
              />
            )}

            <CustomInput
              label="New Password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
              }}
              error={errors.newPassword}
              isPassword
              autoCapitalize="none"
            />

            <CustomInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              isPassword
              autoCapitalize="none"
            />

            <CustomButton
              title="Reset Password"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.submitButton}
            />

            <CustomButton
              title="Cancel"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.normal * Typography.size.base,
  },
  globalError: {
    color: Colors.error,
    backgroundColor: Colors.errorBg,
    padding: Spacing.md,
    borderRadius: 8,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontWeight: Typography.weight.medium,
  },
  disabledInput: {
    opacity: 0.6,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  cancelButton: {
    marginTop: Spacing.md,
  },
});
