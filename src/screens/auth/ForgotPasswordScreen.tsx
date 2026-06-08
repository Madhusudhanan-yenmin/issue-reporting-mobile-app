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
  TouchableOpacity,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import api from '../../services/api';
import { useAppDispatch } from '../../store';
import { showToast } from '../../store/slices/uiSlice';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  const validate = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleReset = async () => {
    if (!validate()) return;
    Keyboard.dismiss();

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      
      dispatch(showToast({ message: 'Reset code sent! Use mock code "1234".', type: 'info' }));
      navigation.navigate('ResetPassword', { email: email.trim(), isForgotPasswordFlow: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send reset link. Please try again.';
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
          <TouchableOpacity
            style={styles.topBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={styles.topBackText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address below, and we will send you instructions to reset your password.
            </Text>

            {error && <Text style={styles.globalError}>{error}</Text>}

            <CustomInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(undefined);
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomButton
              title="Send Instructions"
              onPress={handleReset}
              loading={loading}
              style={styles.submitButton}
            />

            <CustomButton
              title="Back to Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              style={styles.backButton}
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
  submitButton: {
    marginTop: Spacing.md,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  topBackText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginLeft: Spacing.xs,
  },
});
