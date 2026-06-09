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
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors, Typography, Spacing } from '../../theme';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AdminTabParamList, RootStackParamList } from '../../navigation/types';
import api from '../../services/api';
import { useAppDispatch } from '../../store';
import { showToast } from '../../store/slices/uiSlice';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'CreateOfficer'>,
  StackScreenProps<RootStackParamList>
>;

const DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Villupuram',
  'Virudhunagar',
];
const OFFICER_ROLES = [
  'Municipality Officer',
  'Water Supply Officer',
  'Electrical Maintenance Officer',
  'Sanitation Inspector',
  'Road Maintenance Officer',
];

export const CreateOfficerScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [officerRole, setOfficerRole] = useState('');
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    confirmPassword?: string;
    district?: string;
    officerRole?: string;
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
    if (!district) {
      tempErrors.district = 'District is required';
    }
    if (!officerRole) {
      tempErrors.officerRole = 'Officer Role is required';
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
        district,
        officerRole,
      };

      await api.post('/auth/register', payload);

      dispatch(showToast({ message: 'Officer account created successfully!', type: 'success' }));
      setName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setConfirmPassword('');
      setDistrict('');
      setOfficerRole('');
      navigation.navigate('AdminDashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create officer account';
      dispatch(showToast({ message: Array.isArray(message) ? message[0] : message, type: 'error' }));
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

            {/* District Field */}
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>District</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  errors.district ? styles.selectBoxError : null,
                ]}
                onPress={() => setDistrictModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={district ? styles.selectValueText : styles.selectPlaceholderText}>
                  {district || 'Select district'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            {/* Officer Role Field */}
            <View style={styles.selectContainer}>
              <Text style={styles.selectLabel}>Officer Role</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  errors.officerRole ? styles.selectBoxError : null,
                ]}
                onPress={() => setRoleModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={officerRole ? styles.selectValueText : styles.selectPlaceholderText}>
                  {officerRole || 'Select officer role'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {errors.officerRole && <Text style={styles.errorText}>{errors.officerRole}</Text>}
            </View>

            <CustomButton
              title="Create Account"
              onPress={handleCreate}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* District Selection Modal */}
      <Modal visible={districtModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select District</Text>
            <ScrollView style={styles.modalScroll}>
              {DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.modalItem,
                    district === d && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setDistrict(d);
                    setDistrictModalVisible(false);
                    if (errors.district) setErrors({ ...errors, district: undefined });
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      district === d && styles.modalItemTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <CustomButton
              title="Cancel"
              onPress={() => setDistrictModalVisible(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>

      {/* Officer Role Selection Modal */}
      <Modal visible={roleModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Officer Role</Text>
            <ScrollView style={styles.modalScroll}>
              {OFFICER_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.modalItem,
                    officerRole === r && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setOfficerRole(r);
                    setRoleModalVisible(false);
                    if (errors.officerRole) setErrors({ ...errors, officerRole: undefined });
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      officerRole === r && styles.modalItemTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <CustomButton
              title="Cancel"
              onPress={() => setRoleModalVisible(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
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
    marginTop: Spacing.lg,
  },
  // Custom Select Input Styles
  selectContainer: {
    marginBottom: Spacing.base,
    width: '100%',
  },
  selectLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  selectBoxError: {
    borderColor: Colors.error,
  },
  selectValueText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
  },
  selectPlaceholderText: {
    color: Colors.placeholder,
    fontSize: Typography.size.base,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.size.xs + 1,
    marginTop: Spacing.xs,
  },
  // Modal Selector Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    maxHeight: '70%',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: Spacing.md,
  },
  modalItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.sm,
  },
  modalItemActive: {
    backgroundColor: Colors.primary + '15',
  },
  modalItemText: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
  },
  modalItemTextActive: {
    color: Colors.primaryLight,
    fontWeight: Typography.weight.bold,
  },
});
