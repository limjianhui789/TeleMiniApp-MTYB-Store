// ============================================================================
// MTYB Virtual Goods Platform - Theme System
// ============================================================================

import type { TelegramThemeParams } from '@/types';

// ============================================================================
// Color Tokens
// ============================================================================

export const colorTokens = {
  // Primary Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
} as const;

// ============================================================================
// Typography Scale
// ============================================================================

export const typography = {
  fontFamilies: {
    sans: [
      'Inter',
      'SF Pro Display',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ],
    mono: ['SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },

  fontSizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
} as const;

// ============================================================================
// Spacing Scale
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const;

// ============================================================================
// Border Radius
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================================================
// Shadows
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ============================================================================
// Animation & Transitions
// ============================================================================

export const animations = {
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },

  easings: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// Breakpoints
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Theme Variants
// ============================================================================

export interface ThemeVariant {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    shadow: string;
  };
}

export const lightTheme: ThemeVariant = {
  name: 'light',
  colors: {
    background: colorTokens.neutral[50],
    surface: '#ffffff',
    primary: colorTokens.primary[500],
    secondary: colorTokens.secondary[500],
    text: {
      primary: colorTokens.neutral[900],
      secondary: colorTokens.neutral[600],
      disabled: colorTokens.neutral[400],
    },
    border: colorTokens.neutral[200],
    shadow: 'rgb(0 0 0 / 0.1)',
  },
};

export const darkTheme: ThemeVariant = {
  name: 'dark',
  colors: {
    background: colorTokens.neutral[900],
    surface: colorTokens.neutral[800],
    primary: colorTokens.primary[400],
    secondary: colorTokens.secondary[400],
    text: {
      primary: colorTokens.neutral[100],
      secondary: colorTokens.neutral[300],
      disabled: colorTokens.neutral[500],
    },
    border: colorTokens.neutral[700],
    shadow: 'rgb(0 0 0 / 0.3)',
  },
};

// ============================================================================
// Telegram Theme Integration
// ============================================================================

export function createTelegramTheme(themeParams: TelegramThemeParams): ThemeVariant {
  return {
    name: 'telegram',
    colors: {
      background: themeParams.bg_color || lightTheme.colors.background,
      surface: themeParams.secondary_bg_color || lightTheme.colors.surface,
      primary: themeParams.button_color || lightTheme.colors.primary,
      secondary: themeParams.hint_color || lightTheme.colors.secondary,
      text: {
        primary: themeParams.text_color || lightTheme.colors.text.primary,
        secondary: themeParams.hint_color || lightTheme.colors.text.secondary,
        disabled: themeParams.hint_color || lightTheme.colors.text.disabled,
      },
      border: themeParams.hint_color || lightTheme.colors.border,
      shadow: lightTheme.colors.shadow,
    },
  };
}

// ============================================================================
// Theme Context
// ============================================================================

export interface Theme extends ThemeVariant {
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  animations: typeof animations;
  breakpoints: typeof breakpoints;
}

export function createTheme(variant: ThemeVariant): Theme {
  return {
    ...variant,
    spacing,
    typography,
    borderRadius,
    shadows,
    animations,
    breakpoints,
  };
}

// ============================================================================
// Default Themes
// ============================================================================

export const themes = {
  light: createTheme(lightTheme),
  dark: createTheme(darkTheme),
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeMode = 'light' | 'dark' | 'auto';
