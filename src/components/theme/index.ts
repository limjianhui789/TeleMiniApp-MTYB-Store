// ============================================================================
// MTYB Virtual Goods Platform - Theme Components Exports
// ============================================================================

export { ThemeProvider } from './ThemeProvider';
export { ThemeToggle } from './ThemeToggle';
export { ThemePreview } from './ThemePreview';

// Re-export theme hook and utilities for convenience
export {
  useTheme,
  useThemeProvider,
  ThemeContext,
  getThemeValue,
  getThemeClass,
  createThemeStyles,
  themeUtils,
  type ThemeMode,
  type ThemeState,
  type ThemeContextValue,
} from '../../hooks/useTheme';

// Export theme constants
export const THEME_STORAGE_KEY = 'mtyb-theme-preference';

export const THEME_MODES = ['light', 'dark', 'auto'] as const;

export const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
} as const;

export const THEME_ICONS = {
  light: '☀️',
  dark: '🌙',
  auto: '🌓',
} as const;

// Utility functions for theme-aware styling
export const themeClasses = {
  surface: 'theme-surface',
  surfaceSecondary: 'theme-surface-secondary',
  surfaceElevated: 'theme-surface-elevated',
  card: 'theme-card',
  textPrimary: 'theme-text-primary',
  textSecondary: 'theme-text-secondary',
  textTertiary: 'theme-text-tertiary',
  border: 'theme-border',
  focus: 'theme-focus',
} as const;

// CSS variable helpers
export const cssVars = {
  // Colors
  background: 'var(--color-background)',
  backgroundSecondary: 'var(--color-background-secondary)',
  backgroundElevated: 'var(--color-background-elevated)',
  cardBackground: 'var(--color-card-background)',
  muted: 'var(--color-muted)',

  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textInverse: 'var(--color-text-inverse)',

  border: 'var(--color-border)',
  borderStrong: 'var(--color-border-strong)',
  borderLight: 'var(--color-border-light)',

  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',
  primaryContrast: 'var(--color-primary-contrast)',

  success: 'var(--color-success)',
  successLight: 'var(--color-success-light)',
  warning: 'var(--color-warning)',
  warningLight: 'var(--color-warning-light)',
  error: 'var(--color-error)',
  errorLight: 'var(--color-error-light)',
  info: 'var(--color-info)',
  infoLight: 'var(--color-info-light)',

  hover: 'var(--color-hover)',
  active: 'var(--color-active)',
  focus: 'var(--color-focus)',

  // Shadows
  shadowSm: 'var(--shadow-sm)',
  shadowBase: 'var(--shadow-base)',
  shadowMd: 'var(--shadow-md)',
  shadowLg: 'var(--shadow-lg)',
  shadowXl: 'var(--shadow-xl)',
} as const;
