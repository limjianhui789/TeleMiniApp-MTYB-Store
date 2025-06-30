import React from 'react';
import { ThemeProvider } from '../components/theme';
import { ToastProvider } from '../components/feedback/Toast';
import ThemeDemo from '../components/demo/ThemeDemo';

export const ThemeDemoPage: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="auto">
      <ToastProvider>
        <ThemeDemo />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default ThemeDemoPage;
