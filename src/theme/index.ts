// Design tokens for the Issue Reporting app
export const Colors = {
  // Brand primaries
  primary: '#4F6EF7',
  primaryDark: '#3A54D4',
  primaryLight: '#7B95FF',

  // Accents
  accent: '#00D4AA',
  accentDark: '#00A880',

  // Backgrounds
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceElevated: '#23273A',
  surfaceBorder: '#2E3347',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8C0',
  textMuted: '#5C6480',
  textInverted: '#0F1117',

  // Status colors
  success: '#22C55E',
  successBg: '#14271D',
  warning: '#F59E0B',
  warningBg: '#2A2010',
  error: '#EF4444',
  errorBg: '#2A1414',
  info: '#3B82F6',
  infoBg: '#141A2A',

  // Issue Status palette
  statusOpen: '#4F6EF7',
  statusAssigned: '#A78BFA',
  statusInProgress: '#F59E0B',
  statusResolved: '#22C55E',
  statusReopened: '#F97316',
  statusClosed: '#6B7280',

  // Priority palette
  priorityLow: '#22C55E',
  priorityMedium: '#F59E0B',
  priorityHigh: '#F97316',
  priorityCritical: '#EF4444',

  // Category icon colors
  categoryRoad: '#60A5FA',
  categoryWater: '#34D399',
  categoryElectricity: '#FCD34D',
  categoryGarbage: '#A78BFA',
  categoryDrainage: '#F97316',
  categoryOther: '#94A3B8',

  // Navigation
  tabActive: '#4F6EF7',
  tabInactive: '#5C6480',
  tabBar: '#13161F',

  // Input
  inputBg: '#1A1D27',
  inputBorder: '#2E3347',
  inputBorderFocused: '#4F6EF7',
  placeholder: '#5C6480',
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
};
