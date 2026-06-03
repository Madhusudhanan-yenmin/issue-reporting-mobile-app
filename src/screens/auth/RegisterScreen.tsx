import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing } from '../../theme';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!name) {
      tempErrors.name = 'Full Name is required';
    }
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!mobile) {
      tempErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(mobile)) {
      tempErrors.mobile = 'Mobile number must be exactly 10 digits';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validate()) {
      const resultAction = await dispatch(
        registerUser({ name, email, mobile, password, role: 'USER' })
      );
      if (registerUser.fulfilled.match(resultAction)) {
        // Success! Direct to login or show modal. Here we navigate back to Login.
        navigation.navigate('Login');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to start reporting issues</Text>

            {error && <Text style={styles.globalError}>{error}</Text>}

            <CustomInput
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
            />

            <CustomInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Mobile Number"
              placeholder="10-digit mobile number"
              value={mobile}
              onChangeText={(text) => {
                setMobile(text);
                if (errors.mobile) setErrors({ ...errors, mobile: undefined });
              }}
              error={errors.mobile}
              keyboardType="phone-pad"
            />

            <CustomInput
              label="Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              isPassword
              autoCapitalize="none"
            />

            <CustomInput
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              isPassword
              autoCapitalize="none"
            />

            <CustomButton
              title="Register"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  dispatch(clearAuthError());
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    marginBottom: Spacing.xl,
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
  registerButton: {
    marginTop: Spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
});
