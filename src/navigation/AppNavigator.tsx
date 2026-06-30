import React, { useEffect, useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppDispatch, useAppSelector } from '../store';
import { loadSession, logout } from '../store/slices/authSlice';
import { loadPersistedTheme, toggleTheme } from '../store/slices/uiSlice';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { useTheme } from '../theme';
import { setLogoutCallback } from '../services/api';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Navigation Param Lists
import {
  AuthStackParamList,
  UserTabParamList,
  AdminTabParamList,
  OfficerTabParamList,
  RootStackParamList,
} from './types';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { UserDashboardScreen } from '../screens/user/UserDashboardScreen';
import { CreateIssueScreen } from '../screens/user/CreateIssueScreen';
import { UserProfileScreen } from '../screens/user/UserProfileScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { CreateOfficerScreen } from '../screens/admin/CreateOfficerScreen';
import { AdminProfileScreen } from '../screens/admin/AdminProfileScreen';
import { OfficerDashboardScreen } from '../screens/officer/OfficerDashboardScreen';
import { OfficerProfileScreen } from '../screens/officer/OfficerProfileScreen';
import { IssueDetailsScreen } from '../screens/shared/IssueDetailsScreen';
import { FeedbackScreen } from '../screens/shared/FeedbackScreen';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const UserTab = createBottomTabNavigator<UserTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();
const OfficerTab = createBottomTabNavigator<OfficerTabParamList>();

// Auth Navigator
const AuthNavigator = () => {
  const { colors } = useTheme();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// User Bottom Tab Navigator
const UserTabNavigator = () => {
  const { colors } = useTheme();
  return (
    <UserTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.surfaceBorder,
        },
        headerStyle: {
          backgroundColor: colors.tabBar,
          shadowColor: 'transparent',
        },
        headerTintColor: colors.textPrimary,
        headerRight: () => <HeaderThemeToggle />,
      }}
    >
      <UserTab.Screen
        name="UserDashboard"
        component={UserDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <UserTab.Screen
        name="CreateIssue"
        component={CreateIssueScreen}
        options={{
          title: 'Report Issue',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      <UserTab.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </UserTab.Navigator>
  );
};

// Admin Bottom Tab Navigator
const AdminTabNavigator = () => {
  const { colors } = useTheme();
  return (
    <AdminTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.error, // Red accent for Admin
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.surfaceBorder,
        },
        headerStyle: {
          backgroundColor: colors.tabBar,
          shadowColor: 'transparent',
        },
        headerTintColor: colors.textPrimary,
        headerRight: () => <HeaderThemeToggle />,
      }}
    >
      <AdminTab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Grievances',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="CreateOfficer"
        component={CreateOfficerScreen}
        options={{
          title: 'Add Officer',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-add' : 'person-add-outline'} size={size} color={color} />
          ),
        }}
      />
      <AdminTab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
};

// Officer Bottom Tab Navigator
const OfficerTabNavigator = () => {
  const { colors } = useTheme();
  return (
    <OfficerTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.warning, // Yellow accent for Officer
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.surfaceBorder,
        },
        headerStyle: {
          backgroundColor: colors.tabBar,
          shadowColor: 'transparent',
        },
        headerTintColor: colors.textPrimary,
        headerRight: () => <HeaderThemeToggle />,
      }}
    >
      <OfficerTab.Screen
        name="OfficerDashboard"
        component={OfficerDashboardScreen}
        options={{
          title: 'My Work',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={size} color={color} />
          ),
        }}
      />
      <OfficerTab.Screen
        name="OfficerProfile"
        component={OfficerProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </OfficerTab.Navigator>
  );
};

const HeaderThemeToggle = () => {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => { dispatch(toggleTheme()); }}
      style={{ marginRight: 16, padding: 6 }}
      activeOpacity={0.7}
    >
      <Ionicons
        name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={theme === 'dark' ? '#FBBF24' : colors.primary}
      />
    </TouchableOpacity>
  );
};

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isSessionLoading } = useAppSelector((state) => state.auth);
  const { theme, colors } = useTheme();

  useEffect(() => {
    dispatch(loadSession());
    dispatch(loadPersistedTheme());
    // Attach API unauthorized auto-logout
    setLogoutCallback(() => {
      dispatch(logout());
    });
  }, [dispatch]);

  const navTheme = useMemo(() => ({
    ...DefaultTheme,
    dark: theme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.tabBar,
      text: colors.textPrimary,
      border: colors.surfaceBorder,
      notification: colors.accent,
    },
  }), [theme, colors]);

  const styles = useMemo(() => getStyles(colors), [colors]);

  if (isSessionLoading) {
    return <LoadingIndicator message="Authenticating session..." fullScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <RootStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.tabBar,
            shadowColor: 'transparent',
          },
          headerTintColor: colors.textPrimary,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={styles.headerBackButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            {user?.role === 'ADMIN' && (
              <RootStack.Screen
                name="AdminHome"
                component={AdminTabNavigator}
                options={{ headerShown: false }}
              />
            )}
            {user?.role === 'OFFICER' && (
              <RootStack.Screen
                name="OfficerHome"
                component={OfficerTabNavigator}
                options={{ headerShown: false }}
              />
            )}
            {user?.role === 'USER' && (
              <RootStack.Screen
                name="UserHome"
                component={UserTabNavigator}
                options={{ headerShown: false }}
              />
            )}

            {/* Shared Stack Screens */}
            <RootStack.Screen
              name="IssueDetails"
              component={IssueDetailsScreen}
              options={{ title: 'Issue Details' }}
            />
            <RootStack.Screen
              name="Feedback"
              component={FeedbackScreen}
              options={{ title: 'Resolution Feedback' }}
            />
            <RootStack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Reset Password' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  headerBackButton: {
    marginLeft: 16,
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 2,
  },
});

