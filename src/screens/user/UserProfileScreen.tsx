import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { CustomButton } from '../../components/CustomButton';
import { Colors, Typography, Spacing, Radii } from '../../theme';

export const UserProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleResetPassword = () => {
    navigation.navigate('ResetPassword', { email: user?.email, isForgotPasswordFlow: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile Number</Text>
            <Text style={styles.detailValue}>{user?.mobile || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Reset Password"
            onPress={handleResetPassword}
            variant="outline"
            style={styles.resetButton}
          />
          <CustomButton
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    flex: 1,
    justifyContent: 'space-between',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  userRole: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    marginTop: Spacing.xs,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.lg,
    marginVertical: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  detailRow: {
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs + 1,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base + 1,
    fontWeight: Typography.weight.bold,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.sm,
  },
  buttonContainer: {
    marginBottom: Spacing.xl,
  },
  resetButton: {
    marginBottom: Spacing.md,
  },
  logoutButton: {},
});
