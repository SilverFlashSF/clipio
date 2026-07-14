export const Colors = {
  bg: '#111111',
  surface: '#1C1C1E',
  surfaceHover: '#242426',
  border: '#2C2C2E',
  borderLight: '#3A3A3C',
  accent: '#FFFFFF',
  textPrimary: '#F5F5F5',
  textSecondary: '#8E8E93',
  textTertiary: '#555558',
  copied: '#30D158',
  copiedBg: 'rgba(48,209,88,0.12)',
  danger: '#FF453A',
  dangerBg: 'rgba(255,69,58,0.12)',
  pin: '#FFD60A',
  pinBg: 'rgba(255,214,10,0.12)',
  overlay: 'rgba(0,0,0,0.6)',
  searchBg: '#1C1C1E',
};

export const Typography = {
  // Helvetica-alike: System font with tight letter-spacing
  fontRegular: { fontFamily: 'System', fontWeight: '400' as const },
  fontMedium: { fontFamily: 'System', fontWeight: '500' as const },
  fontSemibold: { fontFamily: 'System', fontWeight: '600' as const },
  fontBold: { fontFamily: 'System', fontWeight: '700' as const },
  letterSpacingTight: -0.5,
  letterSpacingNormal: -0.2,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 100,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};
