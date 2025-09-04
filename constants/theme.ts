import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  web: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'sans-serif-bold',
      fontWeight: '700' as const,
    },
  },
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB',
    secondary: '#059669',
    tertiary: '#EA580C',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    onSurface: '#0F172A',
    onSurfaceVariant: '#64748B',
    background: '#F8FAFC',
    error: '#DC2626',
    errorContainer: '#FEE2E2',
    onError: '#FFFFFF',
    onErrorContainer: '#991B1B',
    success: '#059669',
    successContainer: '#DCFCE7',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#166534',
    warning: '#D97706',
    warningContainer: '#FEF3C7',
    onWarning: '#FFFFFF',
    onWarningContainer: '#92400E',
  },
};

export const colors = theme.colors;