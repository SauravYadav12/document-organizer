import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const palette = {
  primary: '#0F766E',
  primaryDark: '#134E4A',
  primaryContainer: '#CCFBF1',
  onPrimaryContainer: '#042F2E',
  accent: '#F59E0B',
  accentContainer: '#FEF3C7',
  error: '#DC2626',
  surface: '#F8FAFC',
  surfaceVariant: '#E2E8F0',
  surfaceDim: '#F1F5F9',
  onSurface: '#0F172A',
  onSurfaceVariant: '#475569',
  outline: '#CBD5E1',
  backdrop: 'rgba(15, 23, 42, 0.55)',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const elevation = {
  level0: 0,
  level1: 1,
  level2: 3,
  level3: 6,
};

const fontConfig = configureFonts({
  config: {
    fontFamily: 'Inter_500Medium',
  },
});

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    onPrimary: palette.white,
    primaryContainer: palette.primaryContainer,
    onPrimaryContainer: palette.onPrimaryContainer,
    secondary: palette.accent,
    onSecondary: palette.white,
    secondaryContainer: palette.accentContainer,
    background: palette.surface,
    surface: palette.white,
    surfaceVariant: palette.surfaceVariant,
    onSurface: palette.onSurface,
    onSurfaceVariant: palette.onSurfaceVariant,
    outline: palette.outline,
    error: palette.error,
    backdrop: palette.backdrop,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5EEAD4',
    onPrimary: '#0F172A',
    primaryContainer: '#134E4A',
    onPrimaryContainer: palette.primaryContainer,
    secondary: '#FBBF24',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    onSurface: palette.surface,
    onSurfaceVariant: '#CBD5E1',
    outline: '#475569',
    error: '#F87171',
  },
};
