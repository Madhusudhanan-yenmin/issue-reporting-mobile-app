import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing } from '../../theme';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AdminTabParamList, RootStackParamList } from '../../navigation/types';
import api from '../../services/api';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'CreateOfficer'>,
  StackScreenProps<RootStackParamList>
>;

export const CreateOfficerScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!name.trim()) {
      tempErrors.name = 'Full Name is required';
    }
    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }
    if (!mobile.trim()) {
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

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        name,
        email,
        mobile,
        password,
        role: 'OFFICER',
      };

      await api.post('/auth/register', payload);

      Alert.alert('Success', 'Officer account created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setEmail('');
            setMobile('');
            setPassword('');
            setConfirmPassword('');
            navigation.navigate('AdminDashboard');
          },
        },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create officer account';
      Alert.alert('Error', Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.screenTitle}>Create Officer Account</Text>
            <Text style={styles.screenSubtitle}>
              Register a new sanitation/maintenance officer in the system
            </Text>

            <CustomInput
              label="Officer Name"
              placeholder="Enter full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
            />

            <CustomInput
              label="Email Address"
              placeholder="Enter official email"
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
              title="Create Account"
              onPress={handleCreate}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
