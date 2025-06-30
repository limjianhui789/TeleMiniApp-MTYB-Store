// ============================================================================
// MTYB Virtual Goods Platform - Enhanced Telegram Theme Hook
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useTheme } from './useTheme';

// ============================================================================
// Types
// ============================================================================

export interface TelegramThemeParams {
  // Primary theme colors
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  
  // Extended theme colors
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
  
  // Additional properties
  section_separator_color?: string;
  bottom_bar_bg_color?: string;
}

export interface TelegramColorScheme {
  name: string;
  isLight: boolean;
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  destructive: string;
}

export interface ThemeState {
  themeParams: TelegramThemeParams;
  colorScheme: TelegramColorScheme;
  isLoading: boolean;
  isDark: boolean;
}

// ============================================================================
// Default Theme Values
// ============================================================================

const DEFAULT_LIGHT_THEME: TelegramThemeParams = {
  bg_color: '#ffffff',
  text_color: '#000000',
  hint_color: '#999999',
  link_color: '#2481cc',
  button_color: '#2481cc',
  button_text_color: '#ffffff',
  secondary_bg_color: '#f1f1f1',
  header_bg_color: '#527da3',
  accent_text_color: '#1c93e3',
  section_bg_color: '#ffffff',
  section_header_text_color: '#6d6d71',
  subtitle_text_color: '#999999',
  destructive_text_color: '#cc2929',
};

const DEFAULT_DARK_THEME: TelegramThemeParams = {
  bg_color: '#212121',
  text_color: '#ffffff',
  hint_color: '#708499',
  link_color: '#6ab7ff',
  button_color: '#5288c1',
  button_text_color: '#ffffff',
  secondary_bg_color: '#181818',
  header_bg_color: '#242424',
  accent_text_color: '#6ab7ff',
  section_bg_color: '#181818',
  section_header_text_color: '#708499',
  subtitle_text_color: '#708499',
  destructive_text_color: '#ff595a',
};

// ============================================================================
// Color Utilities
// ============================================================================

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const isLightColor = (color: string): boolean => {
  const rgb = hexToRgb(color);
  if (!rgb) return true;
  
  // Calculate luminance using the relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6;
};

const adjustColorOpacity = (color: string, opacity: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

const darkenColor = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.max(0, rgb.r - amount);
  const g = Math.max(0, rgb.g - amount);
  const b = Math.max(0, rgb.b - amount);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const lightenColor = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// ============================================================================
// Theme Generation
// ============================================================================

const generateColorScheme = (themeParams: TelegramThemeParams): TelegramColorScheme => {
  const bgColor = themeParams.bg_color || DEFAULT_LIGHT_THEME.bg_color!;
  const textColor = themeParams.text_color || DEFAULT_LIGHT_THEME.text_color!;
  const isLight = isLightColor(bgColor);
  
  return {
    name: isLight ? 'light' : 'dark',
    isLight,
    primary: themeParams.button_color || (isLight ? DEFAULT_LIGHT_THEME.button_color! : DEFAULT_DARK_THEME.button_color!),
    background: bgColor,
    surface: themeParams.section_bg_color || themeParams.secondary_bg_color || bgColor,
    text: textColor,
    textSecondary: themeParams.hint_color || (isLight ? DEFAULT_LIGHT_THEME.hint_color! : DEFAULT_DARK_THEME.hint_color!),
    border: adjustColorOpacity(textColor, 0.15),
    accent: themeParams.accent_text_color || themeParams.link_color || (isLight ? DEFAULT_LIGHT_THEME.accent_text_color! : DEFAULT_DARK_THEME.accent_text_color!),
    destructive: themeParams.destructive_text_color || (isLight ? DEFAULT_LIGHT_THEME.destructive_text_color! : DEFAULT_DARK_THEME.destructive_text_color!),
  };
};

// ============================================================================
// CSS Variables Application
// ============================================================================

const applyCSSVariables = (themeParams: TelegramThemeParams, colorScheme: TelegramColorScheme) => {
  const root = document.documentElement;
  
  // Telegram theme variables
  Object.entries(themeParams).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
    }
  });
  
  // Enhanced design system variables
  root.style.setProperty('--color-primary', colorScheme.primary);
  root.style.setProperty('--color-background', colorScheme.background);
  root.style.setProperty('--color-surface', colorScheme.surface);
  root.style.setProperty('--color-surface-secondary', themeParams.secondary_bg_color || colorScheme.surface);
  root.style.setProperty('--color-surface-elevated', 
    colorScheme.isLight 
      ? lightenColor(colorScheme.surface, 10)
      : lightenColor(colorScheme.surface, 15)
  );
  
  root.style.setProperty('--color-text-primary', colorScheme.text);
  root.style.setProperty('--color-text-secondary', colorScheme.textSecondary);
  root.style.setProperty('--color-text-accent', colorScheme.accent);
  root.style.setProperty('--color-text-destructive', colorScheme.destructive);
  root.style.setProperty('--color-text-on-primary', themeParams.button_text_color || '#ffffff');
  
  root.style.setProperty('--color-border', colorScheme.border);
  root.style.setProperty('--color-border-light', adjustColorOpacity(colorScheme.text, 0.08));
  root.style.setProperty('--color-divider', adjustColorOpacity(colorScheme.text, 0.12));
  
  // Interactive states
  root.style.setProperty('--color-hover', 
    colorScheme.isLight 
      ? darkenColor(colorScheme.primary, 20)
      : lightenColor(colorScheme.primary, 20)
  );
  root.style.setProperty('--color-active', 
    colorScheme.isLight 
      ? darkenColor(colorScheme.primary, 40)
      : lightenColor(colorScheme.primary, 40)
  );
  
  // Focus ring
  root.style.setProperty('--focus-ring-color', colorScheme.accent);
  
  // Set color scheme for browser features
  root.style.setProperty('color-scheme', colorScheme.isLight ? 'light' : 'dark');
  
  // Update meta theme-color for browser chrome
  updateMetaThemeColor(colorScheme.background);
};

const updateMetaThemeColor = (color: string) => {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', color);
};

// ============================================================================
// Main Hook
// ============================================================================

export const useTelegramTheme = (): ThemeState => {
  const [themeState, setThemeState] = useState<ThemeState>({
    themeParams: DEFAULT_LIGHT_THEME,
    colorScheme: generateColorScheme(DEFAULT_LIGHT_THEME),
    isLoading: true,
    isDark: false,
  });

  const updateTheme = useCallback((params: TelegramThemeParams) => {
    const colorScheme = generateColorScheme(params);
    
    setThemeState(prev => ({
      ...prev,
      themeParams: params,
      colorScheme,
      isDark: !colorScheme.isLight,
      isLoading: false,
    }));
    
    applyCSSVariables(params, colorScheme);
  }, []);

  const handleThemeChanged = useCallback(() => {
    try {
      const webApp = window.Telegram?.WebApp;
      if (webApp?.themeParams) {
        updateTheme(webApp.themeParams);
      } else {
        // Fallback to detecting system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        updateTheme(prefersDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME);
      }
    } catch (error) {
      console.warn('Failed to apply Telegram theme:', error);
      updateTheme(DEFAULT_LIGHT_THEME);
    }
  }, [updateTheme]);

  useEffect(() => {
    // Initial theme setup
    handleThemeChanged();

    // Listen for theme changes
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.onEvent('themeChanged', handleThemeChanged);
      
      // Cleanup
      return () => {
        webApp.offEvent('themeChanged', handleThemeChanged);
      };
    } else {
      // Listen for system theme changes as fallback
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        if (!window.Telegram?.WebApp?.themeParams) {
          handleThemeChanged();
        }
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [handleThemeChanged]);

  return themeState;
};

// ============================================================================
// Theme Provider Context
// ============================================================================

import { createContext, useContext, ReactNode } from 'react';

interface TelegramThemeContextValue extends ThemeState {
  updateTheme: (params: TelegramThemeParams) => void;
}

const TelegramThemeContext = createContext<TelegramThemeContextValue | null>(null);

export const useTelegramThemeContext = () => {
  const context = useContext(TelegramThemeContext);
  if (!context) {
    throw new Error('useTelegramThemeContext must be used within TelegramThemeProvider');
  }
  return context;
};

export interface TelegramThemeProviderProps {
  children: ReactNode;
}

export const TelegramThemeProvider = ({ children }: TelegramThemeProviderProps) => {
  const themeState = useTelegramTheme();
  
  const updateTheme = useCallback((params: TelegramThemeParams) => {
    const colorScheme = generateColorScheme(params);
    applyCSSVariables(params, colorScheme);
  }, []);

  const value: TelegramThemeContextValue = {
    ...themeState,
    updateTheme,
  };

  return (
    <TelegramThemeContext.Provider value={value}>
      {children}
    </TelegramThemeContext.Provider>
  );
};

// ============================================================================
// Utility Hooks
// ============================================================================

export const useIsDarkTheme = (): boolean => {
  const { isDark } = useTelegramTheme();
  return isDark;
};

export const useThemeColor = (colorKey: keyof TelegramColorScheme): string => {
  const { colorScheme } = useTelegramTheme();
  return colorScheme[colorKey];
};

export const useAdaptiveColor = (lightColor: string, darkColor: string): string => {
  const { colorScheme } = useTelegramTheme();
  return colorScheme.isLight ? lightColor : darkColor;
};

// ============================================================================
// Export Types
// ============================================================================

export type { TelegramThemeParams, TelegramColorScheme, ThemeState };