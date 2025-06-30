import React, { useEffect } from 'react';
import { ThemeContext, useThemeProvider } from '../../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'auto';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'auto',
}) => {
  const themeContextValue = useThemeProvider();

  // Apply initial theme
  useEffect(() => {
    // Import theme styles
    import('../../styles/themes.css');
  }, []);

  return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
