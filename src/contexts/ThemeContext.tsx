// ============================================================================
// MTYB Virtual Goods Platform - Theme Context
// ============================================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  themes,
  createTheme,
  createTelegramTheme,
  type Theme,
  type ThemeMode,
} from '@/styles/theme';
import { env } from '@/core/config/environment';

// ============================================================================
// Theme Context Interface
// ============================================================================

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  toggleMode: () => void;
}

// ============================================================================
// Theme Context
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================================================
// Theme Provider Props
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

// ============================================================================
// Theme Provider Component
// ============================================================================

export function ThemeProvider({ children, defaultMode = 'auto' }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.light);

  // Get Telegram theme params if available
  const getTelegramThemeParams = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.themeParams) {
      return window.Telegram.WebApp.themeParams;
    }
    return null;
  };

  // ============================================================================
  // Theme Detection Logic
  // ============================================================================

  const detectSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const resolveTheme = (themeMode: ThemeMode): Theme => {
    // Priority 1: Telegram theme if available
    const telegramThemeParams = getTelegramThemeParams();
    if (telegramThemeParams) {
      const telegramTheme = createTelegramTheme(telegramThemeParams);
      return createTheme(telegramTheme);
    }

    // Priority 2: User-selected theme
    if (themeMode === 'light') return themes.light;
    if (themeMode === 'dark') return themes.dark;

    // Priority 3: System theme
    const systemTheme = detectSystemTheme();
    return themes[systemTheme];
  };

  // ============================================================================
  // Effects
  // ============================================================================

  // Load saved theme preference
  useEffect(() => {
    const savedMode = localStorage.getItem(`${env.get('STORAGE_PREFIX')}theme-mode`) as ThemeMode;
    if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
      setMode(savedMode);
    }
  }, []);

  // Update theme when mode changes
  useEffect(() => {
    const newTheme = resolveTheme(mode);
    setCurrentTheme(newTheme);

    // Save preference
    localStorage.setItem(`${env.get('STORAGE_PREFIX')}theme-mode`, mode);
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setCurrentTheme(resolveTheme(mode));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentTheme;

    // Set CSS custom properties
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-text-disabled', colors.text.disabled);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-shadow', colors.shadow);

    // Set color scheme for browser UI
    root.style.setProperty('color-scheme', currentTheme.name === 'dark' ? 'dark' : 'light');
  }, [currentTheme]);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const toggleMode = () => {
    if (mode === 'auto') {
      const systemTheme = detectSystemTheme();
      setMode(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      setMode(mode === 'light' ? 'dark' : 'light');
    }
  };

  const isDark =
    currentTheme.name === 'dark' || (mode === 'auto' && detectSystemTheme() === 'dark');

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ThemeContextValue = {
    theme: currentTheme,
    mode,
    setMode: handleSetMode,
    isDark,
    toggleMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ============================================================================
// Theme Hook
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

export function useIsDark(): boolean {
  return useTheme().isDark;
}

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const { mode, setMode } = useTheme();
  return [mode, setMode];
}
