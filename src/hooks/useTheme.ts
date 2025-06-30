import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isSystemDark: boolean;
  isChanging: boolean;
}

export interface ThemeContextValue extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  resetToSystem: () => void;
}

// Theme context
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Local storage key for theme preference
const THEME_STORAGE_KEY = 'mtyb-theme-preference';

// Get system theme preference
const getSystemTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Get stored theme preference
const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'auto';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.warn('Failed to read theme preference from localStorage:', error);
  }
  return 'auto';
};

// Store theme preference
const storeTheme = (mode: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to store theme preference in localStorage:', error);
  }
};

// Apply theme to document
const applyTheme = (mode: ThemeMode, isDark: boolean): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Add changing class to prevent transition flash
  root.setAttribute('data-theme-changing', '');

  // Set theme attribute
  root.setAttribute('data-theme', mode === 'auto' ? (isDark ? 'dark' : 'light') : mode);

  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(isDark);

  // Remove changing class after a short delay
  setTimeout(() => {
    root.removeAttribute('data-theme-changing');
  }, 100);
};

// Update meta theme-color for mobile browsers
const updateMetaThemeColor = (isDark: boolean): void => {
  if (typeof document === 'undefined') return;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const color = isDark ? '#0c0c0d' : '#ffffff';
    metaThemeColor.setAttribute('content', color);
  }
};

// Check if Telegram theme is available
const getTelegramTheme = (): { isDark: boolean; colors?: any } | null => {
  if (typeof window === 'undefined') return null;

  try {
    // @ts-ignore - Telegram WebApp API
    const webApp = window.Telegram?.WebApp;
    if (webApp && webApp.themeParams) {
      return {
        isDark: webApp.colorScheme === 'dark',
        colors: webApp.themeParams,
      };
    }
  } catch (error) {
    console.warn('Failed to get Telegram theme:', error);
  }

  return null;
};

// Main theme hook
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider hook (for internal use in provider)
export const useThemeProvider = (): ThemeContextValue => {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Initialize theme
  useEffect(() => {
    const storedMode = getStoredTheme();
    const systemIsDark = getSystemTheme();
    const telegramTheme = getTelegramTheme();

    setModeState(storedMode);
    setIsSystemDark(systemIsDark);

    // If Telegram theme is available, apply it
    if (telegramTheme) {
      document.documentElement.setAttribute('data-telegram-theme', '');
      applyTheme(storedMode, telegramTheme.isDark);
    } else {
      const shouldBeDark = storedMode === 'dark' || (storedMode === 'auto' && systemIsDark);
      applyTheme(storedMode, shouldBeDark);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);

      // If current mode is auto, update theme
      if (mode === 'auto') {
        const telegramTheme = getTelegramTheme();
        const shouldBeDark = telegramTheme?.isDark ?? e.matches;
        applyTheme('auto', shouldBeDark);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [mode]);

  // Listen for Telegram theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTelegramThemeChange = () => {
      const telegramTheme = getTelegramTheme();
      if (telegramTheme) {
        const shouldBeDark = telegramTheme.isDark;
        applyTheme(mode, shouldBeDark);
      }
    };

    // Listen for Telegram theme changes
    try {
      // @ts-ignore - Telegram WebApp API
      const webApp = window.Telegram?.WebApp;
      if (webApp && webApp.onEvent) {
        webApp.onEvent('themeChanged', handleTelegramThemeChange);
        return () => {
          if (webApp.offEvent) {
            webApp.offEvent('themeChanged', handleTelegramThemeChange);
          }
        };
      }
    } catch (error) {
      console.warn('Failed to listen for Telegram theme changes:', error);
    }
  }, [mode]);

  // Calculate current dark state
  const isDark = (() => {
    const telegramTheme = getTelegramTheme();
    if (telegramTheme) {
      return telegramTheme.isDark;
    }

    switch (mode) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'auto':
        return isSystemDark;
      default:
        return false;
    }
  })();

  // Set theme function
  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      setIsChanging(true);
      setModeState(newMode);
      storeTheme(newMode);

      const telegramTheme = getTelegramTheme();
      const shouldBeDark =
        telegramTheme?.isDark ?? (newMode === 'dark' || (newMode === 'auto' && isSystemDark));

      applyTheme(newMode, shouldBeDark);

      // Reset changing state
      setTimeout(() => setIsChanging(false), 200);
    },
    [isSystemDark]
  );

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  }, [mode, setTheme]);

  // Reset to system function
  const resetToSystem = useCallback(() => {
    setTheme('auto');
  }, [setTheme]);

  return {
    mode,
    isDark,
    isSystemDark,
    isChanging,
    setTheme,
    toggleTheme,
    resetToSystem,
  };
};

// Utility functions for theme-aware components
export const getThemeValue = (lightValue: string, darkValue: string, isDark: boolean): string => {
  return isDark ? darkValue : lightValue;
};

export const getThemeClass = (baseClass: string, isDark: boolean): string => {
  return `${baseClass} ${isDark ? 'theme-dark' : 'theme-light'}`;
};

// CSS-in-JS helper for theme-aware styles
export const createThemeStyles = (isDark: boolean) => ({
  backgroundColor: `var(--color-background)`,
  color: `var(--color-text-primary)`,
  borderColor: `var(--color-border)`,
});

// Export theme detection utilities
export const themeUtils = {
  getSystemTheme,
  getStoredTheme,
  getTelegramTheme,
  applyTheme,
  updateMetaThemeColor,
};
